import { request } from './client.js';

// POST /auth/login (public, JSON).
// Returns { access_token, token_type: "bearer", colaborador }.
export function login({ login, senha }) {
  return request('/auth/login', {
    method: 'POST',
    body: { login, senha },
  });
}
