// CSV export helper (FE-SHARED-6).
//
// The employee self-history endpoint (`GET /relatorio/historico`) returns JSON
// only — there is no server-side CSV for it (unlike the manager company report,
// which supports `formato=csv`). So the employee history export builds the CSV
// client-side from the punch list and triggers a browser download.
//
// API:
//   punchesToCsv(items) -> string   builds a CSV string (with header row).
//   downloadCsv(filename, content)  triggers a browser file download.

// Columns emitted, in order. `data`/`hora` are derived from each punch's
// `batida` datetime; `tipo` (entrada/saida) and `geo` come straight off the item.
const COLUMNS = ['data', 'hora', 'tipo', 'geo'];

// Escape a single CSV field per RFC 4180: if it contains a comma, double-quote,
// CR or LF, wrap it in double-quotes and double any embedded quotes.
function escapeField(value) {
  // Normalize null/undefined to an empty cell.
  const str = value === undefined || value === null ? '' : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Split a `batida` datetime into { data, hora } without timezone surprises.
// Accepts ISO-ish strings ("2026-06-23T08:01:05", with optional "Z"/offset) and
// falls back to Date parsing for anything else. We deliberately preserve the
// wall-clock components from the string rather than converting timezones.
function splitBatida(batida) {
  if (batida === undefined || batida === null || batida === '') {
    return { data: '', hora: '' };
  }
  const str = String(batida);

  // Fast path: "<date>T<time>" or "<date> <time>" — take the literal parts.
  const isoMatch = str.match(
    /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)/,
  );
  if (isoMatch) {
    return { data: isoMatch[1], hora: isoMatch[2] };
  }

  // Date-only string.
  const dateOnly = str.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dateOnly) {
    return { data: dateOnly[1], hora: '' };
  }

  // Fallback: let the engine parse it, then format from local components.
  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) {
    const pad = (n) => String(n).padStart(2, '0');
    const data = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return { data, hora };
  }

  // Unparseable — emit the raw value in `data` so nothing is silently lost.
  return { data: str, hora: '' };
}

// Build a CSV string from a punch list (array of BatidaItemResponse-like items:
// { batida, tipo, geo, ... }). Always includes the header row. A null/empty
// list yields a header-only document.
export function punchesToCsv(items) {
  const rows = [COLUMNS.join(',')];

  if (Array.isArray(items)) {
    for (const item of items) {
      const punch = item || {};
      const { data, hora } = splitBatida(punch.batida);
      const cells = [data, hora, punch.tipo, punch.geo];
      rows.push(cells.map(escapeField).join(','));
    }
  }

  // CRLF line endings per RFC 4180 (also the most spreadsheet-friendly).
  return rows.join('\r\n');
}

// Trigger a browser download of `content` as a .csv file. Creates a Blob with a
// text/csv MIME type, an object URL, a temporary <a download> click, then
// revokes the URL so nothing lingers.
export function downloadCsv(filename, content) {
  const name =
    filename && /\.csv$/i.test(filename) ? filename : `${filename || 'export'}.csv`;

  // BOM so Excel detects UTF-8 (accented names/addresses render correctly).
  const blob = new Blob(['﻿', content], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Revoke on the next tick so the click has a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
