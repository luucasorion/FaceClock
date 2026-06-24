// FE-PROFILE-1 — Employee profile + own punch history/export.
//
// Behind RequireAuth. RF09: collaborators view/edit their own profile and
// consult their punch history. Two sections:
//
//   1. Profile — loads GET /colaborador/me into the shared ProfileForm with
//      editableFields={['nome','login','senha']} (employee self-edit; NOT
//      gerente/empresa_id/status). COLAB-3 is done, so Save wires for real to
//      PUT /colaborador/me via colaborador.editarPerfil(token, patch). The
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
// Mobile-first: primary actions in thumb reach, no horizontal scroll.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { me, editarPerfil } from '../api/colaborador.js';
import { historico } from '../api/relatorio.js';
import { punchesToCsv, downloadCsv } from '../lib/csv.js';
import '../styles/forms.css';
import './ProfilePage.css';

const PAGE_SIZE = 20;

// The employee may self-edit only these fields (no gerente/empresa_id/status).
const EDITABLE_FIELDS = ['nome', 'login', 'senha'];

export default function ProfilePage() {
  const { token, colaborador, setSession } = useAuth();

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
        setProfile(updated);
        // Reflect the change across the app (same token, updated colaborador).
        setSession(token, updated);
      } catch (err) {
        setSaveError(
          (err && err.message) || 'Não foi possível salvar as alterações.',
        );
        // Re-throw so ProfileForm callers could react; ProfileForm itself awaits
        // and then leaves edit mode regardless, but the error stays visible.
      } finally {
        setSaving(false);
      }
    },
    [token, setSession],
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
    <main className="auth-page profile-page">
      <header className="auth-header profile-page__header">
        <div>
          <h1 className="auth-title">Meu perfil</h1>
          <p className="auth-subtitle">Seus dados e histórico de pontos.</p>
        </div>
        <Link to="/home" className="btn-secondary profile-page__back">
          Voltar
        </Link>
      </header>

      {/* Profile section */}
      <section className="profile-page__section" aria-label="Dados do perfil">
        {loadingProfile && <Spinner label="Carregando perfil…" />}

        {!loadingProfile && profileError && (
          <ErrorBanner message={profileError} onRetry={loadProfile} />
        )}

        {!loadingProfile && !profileError && profile && (
          <ProfileForm
            colaborador={profile}
            editableFields={EDITABLE_FIELDS}
            onSave={handleSave}
            saving={saving}
            error={saveError}
          />
        )}
      </section>

      {/* History section */}
      <section className="profile-page__section" aria-label="Histórico de pontos">
        <h2 className="profile-page__section-title">Histórico de pontos</h2>

        <form className="profile-history__filters" onSubmit={handleSearch}>
          <div className="form-field">
            <label className="form-label" htmlFor="data_inicio">
              Data início
            </label>
            <input
              id="data_inicio"
              type="date"
              className="form-input"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="data_fim">
              Data fim
            </label>
            <input
              id="data_fim"
              type="date"
              className="form-input"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>

          <div className="profile-history__actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={searching || !dataInicio || !dataFim}
            >
              {searching ? 'Buscando…' : 'Buscar'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExport}
              disabled={!hasResults}
            >
              Exportar CSV
            </button>
          </div>
        </form>

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
            <ul className="profile-history__list">
              {pageItems.map((b, i) => {
                const { data, hora } = splitDateTime(b.batida);
                return (
                  <li
                    key={b.id ?? `${b.batida}-${i}`}
                    className={`profile-history__item profile-history__item--${b.tipo}`}
                  >
                    <span className="profile-history__tipo">
                      {b.tipo === 'entrada'
                        ? 'Entrada'
                        : b.tipo === 'saida'
                          ? 'Saída'
                          : b.tipo || '—'}
                    </span>
                    <span className="profile-history__when">
                      {data} {hora}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="profile-history__pager">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <span className="profile-history__page-info">
                Página {page} de {totalPages} · {items.length} registros
              </span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Próxima
              </button>
            </div>
          </>
        )}
      </section>
    </main>
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
