import { request } from './client.js';

// POST /empresa (public, JSON) → EmpresaResponse (201).
// body: { cnpj, razao_social, endereco, limite_hora }.
export function cadastrar(body) {
  return request('/empresa', {
    method: 'POST',
    body,
  });
}

// GET /empresa (bearer) → EmpresaResponse list.
export function listar(token) {
  return request('/empresa', { token });
}

// GET /empresa/{cnpj} (bearer) → EmpresaResponse.
export function buscar(token, cnpj) {
  return request(`/empresa/${encodeURIComponent(cnpj)}`, { token });
}

// PUT /empresa/{cnpj} (manager, JSON) → EmpresaResponse.
export function atualizar(token, cnpj, body) {
  return request(`/empresa/${encodeURIComponent(cnpj)}`, {
    method: 'PUT',
    token,
    body,
  });
}

// DELETE /empresa/{cnpj} (manager) → EmpresaResponse.
export function desativar(token, cnpj) {
  return request(`/empresa/${encodeURIComponent(cnpj)}`, {
    method: 'DELETE',
    token,
  });
}
