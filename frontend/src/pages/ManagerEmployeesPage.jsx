// FE-MANAGER-1 — Manager "My Employees" list.
//
// Behind RequireManager (gated on the AUTHZ-1 `gerente` claim). RF10: a manager
// lists their company's collaborators via GET /colaborador/ (colaborador.listar)
// — the backend scopes the list to the token holder's company, so no empresa_id
// filter is needed here.
//
// Each row shows nome / login / cpf / status. Clicking a row navigates to the
// employee file at /gerente/colaboradores/{cpf}.
//
// States: loading, error (ApiError.message), empty, and the populated list.
//
// Responsive: desktop-oriented table-like rows that collapse to stacked cards on
// narrow screens (no horizontal scroll at mobile widths).

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { listar } from '../api/colaborador.js';
import '../styles/forms.css';
import './ManagerEmployeesPage.css';

export default function ManagerEmployeesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState(null); // null = loading not finished
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listar(token);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setRows(null);
      setError(
        (err && err.message) || 'Não foi possível carregar os colaboradores.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const openFile = (cpf) => {
    navigate(`/gerente/colaboradores/${encodeURIComponent(cpf)}`);
  };

  const hasRows = Array.isArray(rows) && rows.length > 0;

  return (
    <main className="auth-page manager-employees">
      <header className="auth-header manager-employees__header">
        <div>
          <h1 className="auth-title">Meus colaboradores</h1>
          <p className="auth-subtitle">
            Colaboradores da sua empresa. Toque em um para abrir a ficha.
          </p>
        </div>
        <Link to="/gerente/relatorio" className="btn-secondary manager-employees__nav">
          Relatório
        </Link>
      </header>

      {loading && <p className="auth-subtitle">Carregando colaboradores…</p>}

      {!loading && error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && !hasRows && (
        <p className="auth-subtitle">Nenhum colaborador encontrado.</p>
      )}

      {!loading && !error && hasRows && (
        <ul className="manager-employees__list">
          {/* Column headers (visible on wider screens via CSS). */}
          <li className="manager-employees__row manager-employees__row--head" aria-hidden="true">
            <span className="manager-employees__cell">Nome</span>
            <span className="manager-employees__cell">Login</span>
            <span className="manager-employees__cell">CPF</span>
            <span className="manager-employees__cell">Status</span>
          </li>

          {rows.map((c) => (
            <li key={c.cpf} className="manager-employees__row">
              <button
                type="button"
                className="manager-employees__rowbtn"
                onClick={() => openFile(c.cpf)}
              >
                <span className="manager-employees__cell" data-label="Nome">
                  {c.nome || '—'}
                </span>
                <span className="manager-employees__cell" data-label="Login">
                  {c.login || '—'}
                </span>
                <span className="manager-employees__cell" data-label="CPF">
                  {c.cpf || '—'}
                </span>
                <span
                  className={`manager-employees__cell manager-employees__status manager-employees__status--${c.status || 'unknown'}`}
                  data-label="Status"
                >
                  {c.status || '—'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
