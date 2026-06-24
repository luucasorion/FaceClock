import { request } from './client.js';

// Build a query string from defined values only (skips undefined/null/'').
function qs(params) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      sp.append(key, value);
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// GET /relatorio/dia?data= (bearer). `data` optional (defaults to today, UTC).
// Returns ResumoDiarioResponse { colaborador_id, data, total, batidas[] }.
export function dia(token, data) {
  return request(`/relatorio/dia${qs({ data })}`, { token });
}

// GET /relatorio/historico?data_inicio=&data_fim= (bearer). Both required.
// Returns HistoricoPontoResponse (grouped by day; JSON only, not paginated).
export function historico(token, { dataInicio, dataFim }) {
  return request(
    `/relatorio/historico${qs({ data_inicio: dataInicio, data_fim: dataFim })}`,
    { token },
  );
}

// GET /relatorio/empresa/{empresa_id}?data_inicio=&data_fim=&formato= (manager).
// formato: 'json' (default) | 'csv'. For 'csv' the backend returns a file
// download, so client.js surfaces it as raw text (not parsed JSON).
export function empresa(token, empresaId, { dataInicio, dataFim, formato } = {}) {
  const query = qs({
    data_inicio: dataInicio,
    data_fim: dataFim,
    formato,
  });
  return request(`/relatorio/empresa/${encodeURIComponent(empresaId)}${query}`, {
    token,
  });
}
