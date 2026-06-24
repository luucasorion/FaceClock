// FE-AUTH-3 — Company registration screen (route /registro/empresa).
//
// Public endpoint (no auth). Form: cnpj, razao_social, endereco, limite_hora
// (number). Submits to api/empresa.cadastrar. On success we show a confirmation
// that includes the cnpj (the value the user types as `empresa_id` when
// registering employees) plus links back to the menu and to employee
// registration.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as empresaApi from '../api/empresa.js';
import { ApiError } from '../api/client.js';
import '../styles/forms.css';

export default function RegistroEmpresaPage() {
  const [form, setForm] = useState({
    cnpj: '',
    razao_social: '',
    endereco: '',
    limite_hora: '',
  });
  const [created, setCreated] = useState(null); // EmpresaResponse on success
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
      const res = await empresaApi.cadastrar({
        cnpj: form.cnpj,
        razao_social: form.razao_social,
        endereco: form.endereco,
        // limite_hora is a number field — coerce the text input to Number.
        limite_hora: Number(form.limite_hora),
      });
      setCreated(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Não foi possível cadastrar a empresa.');
      } else {
        setError('Não foi possível cadastrar a empresa. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmation view — surfaces the cnpj so the user knows the value to use
  // as `empresa_id` when registering employees.
  if (created) {
    const cnpj = created.cnpj ?? form.cnpj;
    return (
      <main className="auth-page">
        <header className="auth-header">
          <h1 className="auth-title">Empresa cadastrada</h1>
        </header>

        <div className="form-success" role="status">
          <p style={{ marginTop: 0 }}>
            Empresa cadastrada com sucesso.
          </p>
          <p style={{ marginBottom: 0 }}>
            Use o CNPJ <strong>{cnpj}</strong> como identificador da empresa
            ao cadastrar colaboradores.
          </p>
        </div>

        <div className="auth-actions">
          <Link className="btn-primary" to="/registro/colaborador">
            Cadastrar colaborador
          </Link>
          <Link className="btn-secondary" to="/">
            Voltar ao menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <h1 className="auth-title">Cadastrar empresa</h1>
        <p className="auth-subtitle">Cadastre a empresa antes dos colaboradores</p>
      </header>

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-field">
          <label className="form-label" htmlFor="cnpj">
            CNPJ
          </label>
          <input
            className="form-input"
            id="cnpj"
            name="cnpj"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={form.cnpj}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="razao_social">
            Razão social
          </label>
          <input
            className="form-input"
            id="razao_social"
            name="razao_social"
            type="text"
            autoComplete="organization"
            value={form.razao_social}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="endereco">
            Endereço
          </label>
          <input
            className="form-input"
            id="endereco"
            name="endereco"
            type="text"
            autoComplete="street-address"
            value={form.endereco}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="limite_hora">
            Limite de horas
          </label>
          <input
            className="form-input"
            id="limite_hora"
            name="limite_hora"
            type="number"
            inputMode="numeric"
            min="0"
            value={form.limite_hora}
            onChange={onChange}
            required
          />
        </div>

        <div className="auth-actions">
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Cadastrando…' : 'Cadastrar empresa'}
          </button>
          <Link className="btn-secondary" to="/">
            Voltar ao menu
          </Link>
        </div>
      </form>
    </main>
  );
}
