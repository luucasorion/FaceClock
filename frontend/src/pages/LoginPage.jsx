// FE-AUTH-1 — Login screen (route /login).
//
// Form: `login` + `senha` → api/auth.login → setSession → navigate('/home').
// Invalid credentials (401/403) surface as a clear inline message; no token
// is stored on failure (setSession only runs on success).

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import * as authApi from '../api/auth.js';
import { ApiError } from '../api/client.js';
import '../styles/forms.css';

export default function LoginPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ login: '', senha: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await authApi.login({ login: form.login, senha: form.senha });
      // Only persist the session on success — a failed login throws before here,
      // so no token is ever stored on failure.
      setSession(res.access_token, res.colaborador);
      // NOTE: AUTHZ-1 is done (token/colaborador carry `gerente`), but the
      // manager screens aren't built yet, so route EVERYONE to /home for now.
      // Managers currently also land on /home; the punch home will surface
      // manager entry points once those screens exist.
      navigate('/home');
    } catch (err) {
      if (err instanceof ApiError) {
        // Bad credentials come back as 401/403 — show the backend message,
        // falling back to friendly copy.
        setError(
          err.status === 401 || err.status === 403
            ? err.message || 'Login ou senha inválidos.'
            : err.message || 'Não foi possível entrar. Tente novamente.',
        );
      } else {
        setError('Não foi possível entrar. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <header className="auth-header">
        <h1 className="auth-title">Entrar</h1>
        <p className="auth-subtitle">Acesse sua conta FaceClock</p>
      </header>

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-field">
          <label className="form-label" htmlFor="login">
            Login
          </label>
          <input
            className="form-input"
            id="login"
            name="login"
            type="text"
            autoComplete="username"
            value={form.login}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="senha">
            Senha
          </label>
          <input
            className="form-input"
            id="senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            value={form.senha}
            onChange={onChange}
            required
          />
        </div>

        <div className="auth-actions">
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
          <Link className="btn-secondary" to="/registro/colaborador">
            Criar conta de colaborador
          </Link>
        </div>
      </form>
    </main>
  );
}
