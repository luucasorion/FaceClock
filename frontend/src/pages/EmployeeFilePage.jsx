// FE-MANAGER-1 — Manager employee file (single collaborator).
//
// Route: /gerente/colaboradores/:cpf (behind RequireManager).
//
// Loading by cpf: there is NO get-by-cpf endpoint. The backend only exposes
// GET /colaborador/ (the whole company list, manager-scoped). So we fetch that
// list via colaborador.listar(token) and FIND the row whose cpf matches the
// route param. If no row matches, we show a "not found" message (e.g. a cpf from
// another company, or a stale link).
//
// Edit→Save: the matched collaborator is rendered in the shared ProfileForm with
// manager-editable fields ['nome','login','gerente','senha']. Save issues
// colaborador.atualizar(token, cpf, patch) → PUT /colaborador/{cpf}, then
// refreshes the displayed record from the response.
//
// Deactivate: a button opens the reusable ConfirmModal; confirming calls
// colaborador.desativar(token, cpf) → DELETE /colaborador/{cpf} (soft-delete).
// Backend guard errors (self-deactivate, last-active-manager, cross-company
// BR06) arrive as ApiError.message and are surfaced verbatim. On success we
// navigate back to the list.
//
// Responsive: reuses ProfileForm (already mobile-friendly); no horizontal scroll.

import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { listar, atualizar, desativar } from '../api/colaborador.js';
import '../styles/forms.css';
import './EmployeeFilePage.css';

// Manager may edit these fields (includes `gerente`, unlike employee self-edit).
const EDITABLE_FIELDS = ['nome', 'login', 'gerente', 'senha'];

export default function EmployeeFilePage() {
  const { cpf } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [actionError, setActionError] = useState('');

  // Load by cpf via list+find (no get-by-cpf endpoint exists).
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const list = await listar(token);
      const found = Array.isArray(list)
        ? list.find((c) => String(c.cpf) === String(cpf))
        : null;
      if (!found) {
        setEmployee(null);
        setLoadError('Colaborador não encontrado nesta empresa.');
      } else {
        setEmployee(found);
      }
    } catch (err) {
      setEmployee(null);
      setLoadError(
        (err && err.message) || 'Não foi possível carregar o colaborador.',
      );
    } finally {
      setLoading(false);
    }
  }, [token, cpf]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = useCallback(
    async (patch) => {
      if (!patch || Object.keys(patch).length === 0) return;
      setSaving(true);
      setSaveError('');
      try {
        const updated = await atualizar(token, cpf, patch); // PUT /colaborador/{cpf}
        setEmployee(updated);
      } catch (err) {
        setSaveError(
          (err && err.message) || 'Não foi possível salvar as alterações.',
        );
      } finally {
        setSaving(false);
      }
    },
    [token, cpf],
  );

  const confirmDeactivate = useCallback(async () => {
    setDeactivating(true);
    setActionError('');
    try {
      await desativar(token, cpf); // DELETE /colaborador/{cpf}
      setConfirmOpen(false);
      navigate('/gerente/colaboradores');
    } catch (err) {
      // Surface backend guard errors (self-deactivate, last-active-manager,
      // cross-company BR06) clearly. Close the modal so the message is visible.
      setConfirmOpen(false);
      setActionError(
        (err && err.message) ||
          'Não foi possível desativar este colaborador.',
      );
    } finally {
      setDeactivating(false);
    }
  }, [token, cpf, navigate]);

  const isActive =
    employee && String(employee.status || '').toLowerCase() === 'ativo';

  return (
    <main className="auth-page employee-file">
      <header className="auth-header employee-file__header">
        <div>
          <h1 className="auth-title">Ficha do colaborador</h1>
          <p className="auth-subtitle">CPF {cpf}</p>
        </div>
        <Link to="/gerente/colaboradores" className="btn-secondary employee-file__back">
          Voltar
        </Link>
      </header>

      {loading && <p className="auth-subtitle">Carregando colaborador…</p>}

      {!loading && loadError && (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      )}

      {!loading && !loadError && employee && (
        <>
          <ProfileForm
            colaborador={employee}
            editableFields={EDITABLE_FIELDS}
            onSave={handleSave}
            saving={saving}
            error={saveError}
          />

          {actionError && (
            <p className="form-error" role="alert">
              {actionError}
            </p>
          )}

          <div className="employee-file__danger">
            <button
              type="button"
              className="btn-secondary employee-file__deactivate"
              onClick={() => {
                setActionError('');
                setConfirmOpen(true);
              }}
              disabled={!isActive}
            >
              Desativar colaborador
            </button>
            {!isActive && (
              <p className="form-hint">
                Este colaborador já está inativo.
              </p>
            )}
          </div>
        </>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Desativar colaborador"
        message={`Tem certeza que deseja desativar ${employee?.nome || 'este colaborador'}? Esta ação pode ser revertida apenas pela equipe.`}
        confirmLabel="Desativar"
        danger
        busy={deactivating}
        onConfirm={confirmDeactivate}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  );
}
