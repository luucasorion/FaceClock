import { request } from './client.js';

// POST /ponto/ (bearer) — punch as the token holder.
// Multipart fields: `imagem` + `geo`.
export function baterPonto(token, { blob, geo }) {
  const form = new FormData();
  form.append('imagem', blob);
  form.append('geo', geo ?? '');
  return request('/ponto/', {
    method: 'POST',
    token,
    body: form,
  });
}

// POST /ponto/embarcado (public) — blind kiosk punch, recognized across all
// enrolled faces. No token. Multipart fields: `imagem` + `geo`.
export function baterPontoEmbarcado({ blob, geo }) {
  const form = new FormData();
  form.append('imagem', blob);
  form.append('geo', geo ?? '');
  return request('/ponto/embarcado', {
    method: 'POST',
    body: form,
  });
}
