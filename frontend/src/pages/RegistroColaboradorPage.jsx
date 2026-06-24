// FE-AUTH-2 — Employee registration screen (route /registro/colaborador).
//
// Collects cpf, nome, login, senha, empresa_id (typed in — companies are NOT
// listed/suggested). Submits to api/colaborador.registrar, which auto-logs-in
// (returns { access_token, token_type, colaborador }). On success we store the
// session and route to /enroll, because punching requires a stored embedding
// and the enroll page then routes onward to /home.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import * as colaboradorApi from '../api/colaborador.js';
import { ApiError } from '../api/client.js';
import '../styles/forms.css';

export default function RegistroColaboradorPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    cpf: '',
    nome: '',
    login: '',
    senha: '',
    empresa_id: '',
  });
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
      const res = await colaboradorApi.registrar({
        cpf: form.cpf,
        nome: form.nome,
        login: form.login,
        senha: form.senha,
        empresa_id: form.empresa_id,
        // RegistroColaboradorRequest.facial is still required by the backend,
        // so send an empty list; embeddings are enrolled separately at /enroll.
        // This clears once BIO-1 removes the in-body `facial` field.
        facial: [],
        // No `gerente` field — the backend removed it from the request and
        // forces false, so we never send it.
      });
      setSession(res.access_token, res.colaborador);
      // Biometric enrollment is required before punching; /enroll then routes
      // to /home once the face is enrolled.
      navigate('/enroll');
    } catch (err) {
      // Company-not-found: RECOG-2 is NOT done yet, so a bad empresa_id may
      // fail at the DB/FK level with an unclear error — surface whatever the
      // ApiError carries for now. A clean "company not found/inactive" message
      // lands with RECOG-2.
      if (err instanceof ApiError) {
        setError(err.message || 'Não foi possível concluir o cadastro.');
      } else {
        setError('Não foi possível concluir o cadastro. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <header className="auth-header">
        <h1 className="auth-title">Cadastrar colaborador</h1>
        <p className="auth-subtitle">Crie sua conta para bater ponto</p>
      </header>

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-field">
          <label className="form-label" htmlFor="cpf">
            CPF
          </label>
          <input
            className="form-input"
            id="cpf"
            name="cpf"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={form.cpf}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="nome">
            Nome
          </label>
          <input
            className="form-input"
            id="nome"
            name="nome"
            type="text"
            autoComplete="name"
            value={form.nome}
            onChange={onChange}
            required
          />
        </div>

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
            autoComplete="new-password"
            value={form.senha}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="empresa_id">
            Identificador da empresa (CNPJ)
          </label>
          <input
            className="form-input"
            id="empresa_id"
            name="empresa_id"
            type="text"
            autoComplete="off"
            value={form.empresa_id}
            onChange={onChange}
            required
          />
          <p className="form-hint">
            Informe o CNPJ da empresa cadastrada.
          </p>
        </div>

        <div className="auth-actions">
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Cadastrando…' : 'Cadastrar'}
          </button>
          <Link className="btn-secondary" to="/login">
            Já tenho conta
          </Link>
        </div>
      </form>
    </main>
  );
}
