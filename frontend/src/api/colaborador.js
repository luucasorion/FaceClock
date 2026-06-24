import { request } from './client.js';

// POST /colaborador/registro/ (public, JSON). Auto-login.
// body: { cpf, nome, login, senha, empresa_id, facial } — `facial` required
// (send []); `gerente` is ignored server-side, so do not send it.
// Returns { access_token, token_type, colaborador }.
export function registrar(body) {
  return request('/colaborador/registro/', {
    method: 'POST',
    body,
  });
}

// GET /colaborador/me (bearer) → ColaboradorResponse (own profile).
export function me(token) {
  return request('/colaborador/me', { token });
}

// PUT /colaborador/me (bearer) — self-scoped edit.
// body: { nome, login, senha } (no `gerente`). Returns ColaboradorResponse.
export function editarPerfil(token, body) {
  return request('/colaborador/me', {
    method: 'PUT',
    token,
    body,
  });
}

// GET /colaborador/ (manager) → list[ColaboradorResponse] (own company).
export function listar(token) {
  return request('/colaborador/', { token });
}

// PUT /colaborador/{cpf} (manager).
// body: { nome, login, gerente, senha }. Returns ColaboradorResponse.
export function atualizar(token, cpf, body) {
  return request(`/colaborador/${encodeURIComponent(cpf)}`, {
    method: 'PUT',
    token,
    body,
  });
}

// DELETE /colaborador/{cpf} (manager) → soft-deactivate. Returns ColaboradorResponse.
export function desativar(token, cpf) {
  return request(`/colaborador/${encodeURIComponent(cpf)}`, {
    method: 'DELETE',
    token,
  });
}

// POST /colaborador/registro/cadastrar-biometria (bearer) — enroll token holder's face.
// Multipart field `imagem`.
export function cadastrarBiometria(token, blob) {
  const form = new FormData();
  form.append('imagem', blob);
  return request('/colaborador/registro/cadastrar-biometria', {
    method: 'POST',
    token,
    body: form,
  });
}
