// ProfileForm — read-only collaborador view with an Edit→Save toggle (FE-SHARED-5).
//
// Reused by the employee self-profile (FE-PROFILE-1, Save → PUT /colaborador/me)
// and the manager employee file (FE-MANAGER-1, Save → PUT /colaborador/{cpf}).
// The component is endpoint-agnostic: the parent injects `onSave(patch)` so the
// same UI serves both flows. The editable field set is caller-configurable via
// `editableFields`, so the employee form can allow fewer fields than the manager
// form (e.g. only the manager set includes `gerente`).
//
// Behavior:
//   - Renders ColaboradorResponse fields read-only by default.
//   - `cpf` is ALWAYS read-only, regardless of `editableFields`.
//   - Edit toggles edit mode; only fields listed in `editableFields` become
//     editable — everything else stays read-only even in edit mode.
//   - Save builds a patch of ONLY the changed editable fields and calls
//     `onSave(patch)` (async). Cancel reverts edits and leaves edit mode.
//   - `senha` is special: only shown/editable when included in `editableFields`,
//     never pre-filled (it is a new-password input, never an existing value),
//     and only included in the patch when the user typed something.
//
// Props:
//   colaborador     object — the data ({ cpf, nome, login, empresa_id, status, gerente }).
//   editableFields  string[] — which fields the caller allows editing (e.g.
//                   ['nome','login','senha'] for self-edit; may include 'gerente').
//   onSave(patch)   async — receives only the changed editable fields.
//   saving          bool — parent-controlled; disables inputs/Save while saving.
//   error           string — parent-supplied error (e.g. from a rejected onSave).
//   disabled        bool — disables Edit/Save entirely (e.g. endpoint unavailable).

import { useMemo, useState } from 'react';
import './ProfileForm.css';

// Field metadata. `senha` is rendered only when editable and never reflects an
// existing value. `gerente` is a boolean (checkbox); the rest are text.
const FIELD_DEFS = [
  { name: 'cpf', label: 'CPF', type: 'text' },
  { name: 'nome', label: 'Nome', type: 'text' },
  { name: 'login', label: 'Login', type: 'text' },
  { name: 'empresa_id', label: 'Empresa', type: 'text' },
  { name: 'status', label: 'Status', type: 'text' },
  { name: 'gerente', label: 'Gerente', type: 'boolean' },
  { name: 'senha', label: 'Nova senha', type: 'password' },
];

// Build the initial editable-draft from the source object. `senha` always starts
// empty (never reflect an existing password).
function initialDraft(colaborador) {
  const c = colaborador || {};
  return {
    nome: c.nome ?? '',
    login: c.login ?? '',
    empresa_id: c.empresa_id ?? '',
    status: c.status ?? '',
    gerente: Boolean(c.gerente),
    senha: '',
  };
}

export default function ProfileForm({
  colaborador,
  editableFields = [],
  onSave,
  saving = false,
  error = '',
  disabled = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => initialDraft(colaborador));

  const editable = useMemo(
    () => new Set(editableFields || []),
    [editableFields],
  );

  // cpf is never editable. senha is only ever rendered when caller-editable.
  const isEditable = (name) => name !== 'cpf' && editable.has(name);

  const startEdit = () => {
    setDraft(initialDraft(colaborador));
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(initialDraft(colaborador));
    setEditing(false);
  };

  const setField = (name, value) => {
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  // Build a patch containing only the changed editable fields.
  const buildPatch = () => {
    const patch = {};
    const c = colaborador || {};
    for (const def of FIELD_DEFS) {
      const { name } = def;
      if (!isEditable(name)) continue;

      if (name === 'senha') {
        // New-password field: include only when the user actually typed one.
        if (draft.senha !== '') patch.senha = draft.senha;
        continue;
      }

      if (def.type === 'boolean') {
        const next = Boolean(draft[name]);
        if (next !== Boolean(c[name])) patch[name] = next;
        continue;
      }

      const next = draft[name];
      const current = c[name] ?? '';
      if (next !== current) patch[name] = next;
    }
    return patch;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || saving) return;
    const patch = buildPatch();
    if (typeof onSave === 'function') {
      await onSave(patch);
    }
    // Leave edit mode and reset the (transient) password field. The parent is
    // expected to refresh `colaborador` from the onSave response.
    setEditing(false);
    setDraft((prev) => ({ ...prev, senha: '' }));
  };

  // Which fields to render: skip `senha` entirely unless it is caller-editable.
  const visibleFields = FIELD_DEFS.filter(
    (def) => def.name !== 'senha' || editable.has('senha'),
  );

  const renderValue = (def) => {
    const c = colaborador || {};
    if (def.type === 'boolean') return c[def.name] ? 'Sim' : 'Não';
    const v = c[def.name];
    return v === undefined || v === null || v === '' ? '—' : String(v);
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="profile-fields">
        {visibleFields.map((def) => {
          const editableNow = editing && isEditable(def.name);
          const fieldId = `profile-${def.name}`;

          return (
            <div className="form-field" key={def.name}>
              <label className="form-label" htmlFor={fieldId}>
                {def.label}
              </label>

              {def.type === 'boolean' ? (
                editableNow ? (
                  <input
                    id={fieldId}
                    type="checkbox"
                    className="profile-checkbox"
                    checked={Boolean(draft.gerente)}
                    disabled={saving}
                    onChange={(e) => setField('gerente', e.target.checked)}
                  />
                ) : (
                  <p className="profile-readonly">{renderValue(def)}</p>
                )
              ) : editableNow ? (
                <input
                  id={fieldId}
                  type={def.type === 'password' ? 'password' : 'text'}
                  className="form-input"
                  value={draft[def.name] ?? ''}
                  disabled={saving}
                  autoComplete={
                    def.type === 'password' ? 'new-password' : 'off'
                  }
                  placeholder={
                    def.type === 'password'
                      ? 'Deixe em branco para manter a atual'
                      : undefined
                  }
                  onChange={(e) => setField(def.name, e.target.value)}
                />
              ) : def.name === 'senha' ? (
                // Editable-but-not-in-edit-mode password: never show a value.
                <p className="profile-readonly">••••••••</p>
              ) : (
                <p className="profile-readonly">{renderValue(def)}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="profile-actions">
        {editing ? (
          <>
            <button
              type="submit"
              className="btn-primary"
              disabled={disabled || saving}
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={startEdit}
            disabled={disabled}
          >
            Editar
          </button>
        )}
      </div>
    </form>
  );
}
