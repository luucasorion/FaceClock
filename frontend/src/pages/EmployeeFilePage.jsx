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
// FE-UI-2: migrated to MUI (header on Typography/Stack, body wrapped in a Card,
// errors via Alert, deactivate confirm via the MUI-backed ConfirmModal Dialog).
// The endpoint wiring, list+find load, ProfileForm consumption, and guard-error
// handling are UNCHANGED — presentation only.

import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import ProfileForm from '../components/ProfileForm.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { listar, atualizar, desativar } from '../api/colaborador.js';
import { isAtivo } from '../lib/status.js';

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

  const isActive = !!employee && isAtivo(employee.status);

  return (
    <Box component="main" sx={{ width: '100%', mt: 2 }}>
      <Stack
        component="header"
        direction={{ xs: 'column', sm: 'row' }}
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Ficha do colaborador
          </Typography>
          <Typography variant="body1" color="text.secondary">
            CPF {cpf}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => navigate('/gerente/colaboradores')}
        >
          Voltar
        </Button>
      </Stack>

      {loading && <Spinner label="Carregando colaborador…" />}

      {!loading && loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}

      {!loading && !loadError && employee && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <ProfileForm
                colaborador={employee}
                editableFields={EDITABLE_FIELDS}
                onSave={handleSave}
                saving={saving}
                error={saveError}
              />
            </CardContent>
          </Card>

          {actionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {actionError}
            </Alert>
          )}

          <Card variant="outlined" sx={{ borderColor: 'error.light' }}>
            <CardContent>
              <Stack spacing={1} alignItems="flex-start">
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setActionError('');
                    setConfirmOpen(true);
                  }}
                  disabled={!isActive}
                >
                  Desativar colaborador
                </Button>
                {!isActive && (
                  <Typography variant="body2" color="text.secondary">
                    Este colaborador já está inativo.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
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
    </Box>
  );
}
