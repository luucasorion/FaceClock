// Central fetch wrapper for the FaceClock REST API.
//
// Paths are passed through unprefixed (e.g. "/auth/login"). The Vite dev proxy
// (vite.config.js) forwards /auth, /colaborador, /ponto, /empresa, /relatorio to
// the FastAPI backend, so the SPA and API share an origin in dev.
//
// Token handling: pass `token` explicitly per call. The auth context
// (FE-SHARED-3) owns token storage and supplies it here. An optional
// module-level getter hook is provided for convenience — when set, it is used
// as a fallback only when no explicit `token` argument is given. Explicit
// arguments always win.

let tokenGetter = null;

/**
 * Optional hook so the auth context can register a fallback token source.
 * Explicit `token` arguments to request() always take precedence over this.
 * @param {() => (string|null|undefined)} getter
 */
export function setTokenGetter(getter) {
  tokenGetter = typeof getter === 'function' ? getter : null;
}

/**
 * A normalized API error. Carries the HTTP status and the backend `detail`.
 */
export class ApiError extends Error {
  constructor(message, { status, detail } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * FastAPI returns errors as `{ detail: ... }`. `detail` may be:
 *  - a string (HTTPException) → use it directly
 *  - an array of validation errors (422) → each `{ loc, msg, type }` → join msgs
 *  - an object → stringify
 * Returns a readable, human-facing message.
 */
function readableDetail(detail, fallback) {
  if (detail == null) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => {
        if (d == null) return null;
        if (typeof d === 'string') return d;
        // Validation error item: prefer `msg`, optionally prefix with the field.
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : undefined;
        const msg = d.msg || d.message;
        if (msg && field != null && field !== 'body') return `${field}: ${msg}`;
        return msg || null;
      })
      .filter(Boolean);
    if (msgs.length) return msgs.join('; ');
    return fallback;
  }
  if (typeof detail === 'object') {
    if (typeof detail.msg === 'string') return detail.msg;
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }
  return String(detail);
}

/**
 * Core request wrapper.
 *
 * @param {string} path - API path, e.g. "/auth/login" (no host prefix).
 * @param {object} [opts]
 * @param {string} [opts.method="GET"]
 * @param {*} [opts.body] - JSON-serializable object, or a FormData instance.
 * @param {string|null} [opts.token] - bearer token; injected as Authorization.
 * @param {boolean} [opts.isForm] - force FormData handling. Auto-detected when
 *        `body instanceof FormData`, so this is usually unnecessary.
 * @param {object} [opts.headers] - extra headers (merged last, can override).
 * @returns {Promise<*>} parsed JSON, raw text (non-JSON), or null (204/empty).
 * @throws {ApiError} on non-2xx responses.
 */
export async function request(path, opts = {}) {
  const { method = 'GET', body, token, isForm, headers: extraHeaders } = opts;

  const headers = {};

  // Token: explicit argument wins; otherwise fall back to the registered getter.
  const effectiveToken = token != null ? token : tokenGetter ? tokenGetter() : null;
  if (effectiveToken) {
    headers.Authorization = `Bearer ${effectiveToken}`;
  }

  const isFormData = isForm || (typeof FormData !== 'undefined' && body instanceof FormData);

  let payload;
  if (body == null) {
    payload = undefined;
  } else if (isFormData) {
    // Pass FormData through untouched. Do NOT set Content-Type — the browser
    // sets it with the correct multipart boundary.
    payload = body;
  } else {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  if (extraHeaders) Object.assign(headers, extraHeaders);

  let response;
  try {
    response = await fetch(path, { method, headers, body: payload });
  } catch (networkErr) {
    // fetch rejects only on network failure (offline, CORS, DNS, etc.).
    throw new ApiError(networkErr.message || 'Network request failed', {
      status: 0,
      detail: networkErr.message,
    });
  }

  return handleResponse(response);
}

/** Parse a response body as JSON when possible, else text, else null. */
async function parseBody(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (text === '') return null;

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text; // malformed JSON — surface the raw text rather than throwing.
    }
  }
  return text; // non-JSON (e.g. CSV downloads, plain text).
}

async function handleResponse(response) {
  const parsed = await parseBody(response);

  if (response.ok) {
    return parsed;
  }

  // Non-2xx → normalize into an ApiError carrying status + detail.
  const detail = parsed && typeof parsed === 'object' ? parsed.detail : parsed;
  const message = readableDetail(detail, `Request failed (${response.status})`);
  throw new ApiError(message, { status: response.status, detail });
}
