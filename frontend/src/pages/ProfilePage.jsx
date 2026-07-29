// FE-PROFILE-1 — Employee profile + own punch history/export.
//
// Behind RequireAuth. RF09: collaborators view/edit their own profile and
// consult their punch history. Two sections:
//
//   1. Profile — loads GET /colaborador/me into the shared ProfileForm with
//      editableFields={['login','senha']} (employee self-edit; NOT
//      nome/gerente/empresa_id/status). COLAB-3 is done, so Save wires for real
//      to PUT /colaborador/me via colaborador.editarPerfil(token, patch). The
//      manager PUT /{cpf} endpoint is NEVER called from here. On save success we
//      refresh the displayed profile and update the auth context's colaborador
//      via setSession (keeping the same token) so the rest of the app reflects
//      the change.
//
//   2. Punch history — data_inicio + data_fim date inputs + Search →
//      relatorio.historico(token, { dataInicio, dataFim }). The response is
//      HistoricoPontoResponse, grouped by day (~{ dias: [{ data, batidas[] }] }).
//      We FLATTEN the days' batidas into a single ordered list (handling both the
//      grouped shape and a possible already-flat shape defensively), then render
//      it client-side paginated (the endpoint is not server-paginated; REPORT-5
//      would add that later). Export (enabled once results load) builds a CSV via
//      punchesToCsv + downloadCsv (FE-SHARED-6).
//
// FE-UI-1: migrated to MUI (Card/TextField type="date"/Button/Table/Stack +
// MUI-backed Spinner/EmptyState/ErrorBanner/ProfileForm). The FE-PROFILE-2
// behavior is UNCHANGED — editableFields=['login','senha'], a login-change Save
// logs out + redirects to /login with the re-login notice, senha-only stays
// in-place, history search/export/pagination wiring is identical.
//
// Mobile-first: primary actions in thumb reach, no horizontal scroll.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import LabeledField from '../components/LabeledField.jsx';
import ProfileForm from '../components/ProfileForm.jsx';
import { valtech } from '../theme.js';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { me, editarPerfil } from '../api/colaborador.js';
import { historico } from '../api/relatorio.js';
import { punchesToCsv, downloadCsv } from '../lib/csv.js';

const PAGE_SIZE = 20;

// The employee may self-edit only these fields (no nome/gerente/empresa_id/status).
// `nome` is read-only on self-edit; the editable set is login + senha.
const EDITABLE_FIELDS = ['login', 'senha'];

export default function ProfilePage() {
  const { token, colaborador, setSession, logout } = useAuth();
  const navigate = useNavigate();

  // ----- Profile section -----------------------------------------------------
  const [profile, setProfile] = useState(colaborador ?? null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    setProfileError('');
    try {
      const data = await me(token);
      setProfile(data);
      // Keep the app-wide session in sync with the freshly-loaded profile.
      setSession(token, data);
    } catch (err) {
      setProfileError(
        (err && err.message) || 'Não foi possível carregar seu perfil.',
      );
    } finally {
      setLoadingProfile(false);
    }
  }, [token, setSession]);

  useEffect(() => {
    loadProfile();
    // loadProfile is stable for a given token; run on mount / token change.
  }, [loadProfile]);

  const handleSave = useCallback(
    async (patch) => {
      // Nothing changed → no network call; ProfileForm still leaves edit mode.
      if (!patch || Object.keys(patch).length === 0) return;
      setSaving(true);
      setSaveError('');
      try {
        const updated = await editarPerfil(token, patch); // PUT /colaborador/me

        // The PUT targets the collaborator by cpf and succeeds even when `login`
        // changed, but the stored JWT keeps its OLD `sub` (= the old login).
        // GET /colaborador/me resolves identity via por_login(sub), so any
        // refresh/remount after a login change would call por_login(old_login)
        // → 404 and strand the session. When the login changed we therefore
        // discard the stale token and force a clean re-login instead of trying
        // to keep using it.
        if ('login' in patch) {
          logout();
          navigate('/login', {
            state: { message: 'Login alterado. Faça login novamente.' },
          });
          return;
        }

        // Senha-only (or otherwise login-unchanged) save: keep the in-place
        // behavior. Reflect the change across the app (same token, updated
        // colaborador).
        setProfile(updated);
        setSession(token, updated);
      } catch (err) {
        setSaveError(
          (err && err.message) || 'Não foi possível salvar as alterações.',
        );
        // On failure do NOT logout/redirect — the existing session is intact
        // and the error stays visible. ProfileForm awaits and leaves edit mode
        // regardless, but the error banner remains.
      } finally {
        setSaving(false);
      }
    },
    [token, setSession, logout, navigate],
  );

  // ----- History section -----------------------------------------------------
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [searching, setSearching] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [items, setItems] = useState(null); // null = not searched yet; [] = empty result
  const [page, setPage] = useState(1);

  const handleSearch = useCallback(
    async (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      setSearching(true);
      setHistoryError('');
      try {
        const resp = await historico(token, { dataInicio, dataFim });
        const flat = flattenHistorico(resp);
        setItems(flat);
        setPage(1);
      } catch (err) {
        setItems(null);
        setHistoryError(
          (err && err.message) || 'Não foi possível buscar o histórico.',
        );
      } finally {
        setSearching(false);
      }
    },
    [token, dataInicio, dataFim],
  );

  const totalPages = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return 1;
    return Math.ceil(items.length / PAGE_SIZE);
  }, [items]);

  const pageItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  const handleExport = useCallback(() => {
    if (!Array.isArray(items)) return;
    const csv = punchesToCsv(items);
    downloadCsv('historico.csv', csv);
  }, [items]);

  const hasResults = Array.isArray(items) && items.length > 0;
  const searched = Array.isArray(items);

  return (
    <Box component="main" sx={{ width: '100%', mt: 2 }}>
      <Stack
        component="header"
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h1" component="h1">
            Meu perfil
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Seus dados e histórico de pontos.
          </Typography>
        </Box>
        <Button component={Link} to="/home" variant="outlined">
          Voltar
        </Button>
      </Stack>

      {/* Profile section */}
      <Box component="section" aria-label="Dados do perfil" sx={{ mb: 4 }}>
        <Card>
          <CardContent>
            {loadingProfile && <Spinner label="Carregando perfil…" />}

            {!loadingProfile && profileError && (
              <ErrorBanner message={profileError} onRetry={loadProfile} />
            )}

            {!loadingProfile && !profileError && profile && (
              // Self-edit deactivated (user request 2026-06-24): render the
              // profile read-only. Re-enable by removing `readOnly` (and the
              // self-edit wiring below stays intact for that).
              <ProfileForm
                colaborador={profile}
                editableFields={EDITABLE_FIELDS}
                onSave={handleSave}
                saving={saving}
                error={saveError}
                readOnly
              />
            )}
          </CardContent>
        </Card>
      </Box>

      {/* History section */}
      <Box component="section" aria-label="Histórico de pontos">
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          Histórico de pontos
        </Typography>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box component="form" onSubmit={handleSearch}>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <LabeledField
                    id="data_inicio"
                    label="Data início"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <LabeledField
                    id="data_fim"
                    label="Data fim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={searching || !dataInicio || !dataFim}
                  >
                    {searching ? 'Buscando…' : 'Buscar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleExport}
                    disabled={!hasResults}
                  >
                    Exportar CSV
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {searching && <Spinner label="Buscando histórico…" />}

        {!searching && historyError && (
          <ErrorBanner message={historyError} onRetry={handleSearch} />
        )}

        {!searching && searched && !hasResults && !historyError && (
          <EmptyState
            icon="🗓️"
            message="Nenhum ponto encontrado para o período selecionado."
          />
        )}

        {hasResults && (
          <>
            <TableContainer component={Card} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: valtech.black }}>
                    <TableCell sx={{ color: valtech.white, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11, fontWeight: 500, borderBottom: 'none' }}>
                      Tipo
                    </TableCell>
                    <TableCell align="right" sx={{ color: valtech.white, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11, fontWeight: 500, borderBottom: 'none' }}>
                      Data / hora
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageItems.map((b, i) => {
                    const { data, hora } = splitDateTime(b.batida);
                    return (
                      <TableRow key={b.id ?? `${b.batida}-${i}`}>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {b.tipo === 'entrada'
                            ? 'Entrada'
                            : b.tipo === 'saida'
                              ? 'Saída'
                              : b.tipo || '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {data} {hora}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
              sx={{ mt: 2 }}
            >
              <Button
                type="button"
                variant="outlined"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <Typography variant="body2" color="text.secondary">
                Página {page} de {totalPages} · {items.length} registros
              </Typography>
              <Button
                type="button"
                variant="outlined"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Próxima
              </Button>
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}

// Flatten a HistoricoPontoResponse into a single ordered list of batidas.
//
// Defensive about the response shape: the grouping array is expected at `dias`
// (each `{ data, batidas: [...] }`), but we also accept a couple of likely
// alternate key names and an already-flat shape so a backend rename doesn't
// silently produce an empty list.
function flattenHistorico(resp) {
  if (!resp) return [];

  // Already a flat array of batidas.
  if (Array.isArray(resp)) return resp;

  // A flat `batidas` array directly on the response.
  if (Array.isArray(resp.batidas)) return resp.batidas;

  // Grouped-by-day shape. Accept `dias` (the documented key) or a few aliases.
  const groups =
    (Array.isArray(resp.dias) && resp.dias) ||
    (Array.isArray(resp.days) && resp.days) ||
    (Array.isArray(resp.historico) && resp.historico) ||
    null;

  if (groups) {
    const flat = [];
    for (const day of groups) {
      if (!day) continue;
      const batidas = Array.isArray(day.batidas)
        ? day.batidas
        : Array.isArray(day.punches)
          ? day.punches
          : [];
      for (const b of batidas) flat.push(b);
    }
    return flat;
  }

  return [];
}

// Split a backend datetime into wall-clock date/time parts for display, mirroring
// the CSV helper's approach (preserve the literal components, no tz conversion).
function splitDateTime(value) {
  if (value === undefined || value === null || value === '') {
    return { data: '', hora: '' };
  }
  const str = String(value);
  const m = str.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (m) return { data: m[1], hora: m[2] };
  const dateOnly = str.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dateOnly) return { data: dateOnly[1], hora: '' };
  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) {
    const pad = (n) => String(n).padStart(2, '0');
    return {
      data: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      hora: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  }
  return { data: str, hora: '' };
}
