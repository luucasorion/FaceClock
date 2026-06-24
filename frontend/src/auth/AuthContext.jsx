// Auth context for FaceClock (FE-SHARED-3).
//
// Stores the JWT (`token`) and the `colaborador` object returned by
// POST /auth/login and POST /colaborador/registro/ (both return
// `{ access_token, token_type, colaborador }`).
//
// `colaborador` shape (ColaboradorResponse, AUTHZ-1):
//   { cpf, nome, login, empresa_id, status, gerente }
//
// Persistence: token + colaborador are persisted to localStorage so a page
// refresh restores the session. `colaborador` holds no secrets (no senha, no
// facial embedding), so persisting it is fine. Captured images are NEVER
// persisted anywhere (NFR05) — that is the camera component's concern and no
// image ever reaches this context.

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { setTokenGetter } from '../api/client.js';

const STORAGE_KEY = 'faceclock.auth';

const AuthContext = createContext(null);

/** Read and validate the persisted session from localStorage. */
function readStoredSession() {
  if (typeof localStorage === 'undefined') return { token: null, colaborador: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, colaborador: null };
    const parsed = JSON.parse(raw);
    const token = typeof parsed?.token === 'string' ? parsed.token : null;
    const colaborador =
      parsed?.colaborador && typeof parsed.colaborador === 'object' ? parsed.colaborador : null;
    // A session is only meaningful with a token; drop a half-written record.
    if (!token) return { token: null, colaborador: null };
    return { token, colaborador };
  } catch {
    return { token: null, colaborador: null };
  }
}

export function AuthProvider({ children }) {
  // Hydrate synchronously from localStorage on first render so guards see the
  // restored session immediately (no flash of unauthenticated state).
  const [{ token, colaborador }, setSessionState] = useState(readStoredSession);

  const setSession = useCallback((nextToken, nextColaborador) => {
    setSessionState({ token: nextToken ?? null, colaborador: nextColaborador ?? null });
  }, []);

  const logout = useCallback(() => {
    setSessionState({ token: null, colaborador: null });
  }, []);

  // Persist (or clear) the session whenever it changes.
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, colaborador }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage may be unavailable (private mode / quota). The in-memory
      // session still works for this tab; just skip persistence.
    }
  }, [token, colaborador]);

  // Register a fallback token source on the api client for convenience.
  // Explicit `token` arguments to the api wrappers always take precedence;
  // this only fills in when a caller forgets to pass one.
  useEffect(() => {
    setTokenGetter(() => token);
    return () => setTokenGetter(null);
  }, [token]);

  const value = useMemo(() => {
    const cpf = colaborador?.cpf ?? null;
    const empresaId = colaborador?.empresa_id ?? null;
    const userLogin = colaborador?.login ?? null;
    const gerente = colaborador?.gerente === true;
    return {
      token,
      colaborador,
      cpf,
      empresaId,
      login: userLogin,
      gerente,
      isAuthenticated: Boolean(token),
      setSession,
      logout,
    };
  }, [token, colaborador, setSession, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the auth session. Must be used within an <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;
