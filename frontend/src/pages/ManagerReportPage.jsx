// FE-MANAGER-2 — Manager company report.
//
// Route: /gerente/relatorio (behind RequireManager). RF12: a manager requests
// the whole company's punches for a period via
// GET /relatorio/empresa/{empresa_id}?data_inicio&data_fim&formato=json|csv.
// `empresa_id` comes from the auth context (`empresaId`, the AUTHZ-1 claim).
//
// JSON shape (confirmed by reading presentation/schema/responses/
// relatorio_empresa_response.py and its nested schemas):
//
//   RelatorioEmpresaResponse {
//     empresa_id: str,
//     periodo: { data_inicio: date, data_fim: date },
//     colaboradores: [
//       {
//         colaborador_id: str,
//         nome: str,
//         horas: HorasTrabalhadasResponse {
//           limite_hora: int,
//           dias: [ DiaHorasResponse {
//             data, total_trabalhado_minutos: int, overtime_minutos: int,
//             excedeu_limite: bool, anomalias: [...] } ]
//         },
//         historico: HistoricoPontoResponse { dias: [...] }
//       }
//     ]
//   }
//
// We render one table row per collaborator, aggregating across `horas.dias`:
//   - worked  = sum(total_trabalhado_minutos)
//   - overtime = sum(overtime_minutos)
//   - overtime flag (BR05) = any day with excedeu_limite === true
// Minutes are formatted as Hh MMm for readability.
//
// Export CSV: relatorio.empresa(token, empresaId, { ..., formato: 'csv' }) — the
// server generates the CSV and the api client surfaces it as raw text. We hand
// that text straight to downloadCsv (FE-SHARED-6); no client-side CSV building.
//
// Responsive: desktop-oriented table that degrades to stacked cards on narrow
// screens (no horizontal scroll at mobile widths).

import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { empresa as relatorioEmpresa } from '../api/relatorio.js';
import { downloadCsv } from '../lib/csv.js';
import '../styles/forms.css';
import './ManagerReportPage.css';

// Sum a numeric field across a list of day objects, tolerating missing values.
function sumDays(dias, field) {
  if (!Array.isArray(dias)) return 0;
  return dias.reduce((acc, d) => acc + (Number(d?.[field]) || 0), 0);
}

// Format a minute count as "8h 05m" (or "0h 00m").
function formatMinutes(total) {
  const mins = Math.max(0, Math.round(Number(total) || 0));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

// Reduce a collaborator's `horas` into the summary the table renders.
function summarize(colaborador) {
  const dias = colaborador?.horas?.dias;
  const worked = sumDays(dias, 'total_trabalhado_minutos');
  const overtime = sumDays(dias, 'overtime_minutos');
  const exceeded = Array.isArray(dias)
    ? dias.some((d) => d?.excedeu_limite === true)
    : false;
  return { worked, overtime, exceeded };
}

export default function ManagerReportPage() {
  const { token, empresaId } = useAuth();

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const [report, setReport] = useState(null); // RelatorioEmpresaResponse | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const canSubmit = Boolean(empresaId && dataInicio && dataFim);

  const handleSearch = useCallback(
    async (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      if (!canSubmit) return;
      setLoading(true);
      setError('');
      try {
        const data = await relatorioEmpresa(token, empresaId, {
          dataInicio,
          dataFim,
          formato: 'json',
        });
        setReport(data || null);
      } catch (err) {
        setReport(null);
        setError(
          (err && err.message) || 'Não foi possível gerar o relatório.',
        );
      } finally {
        setLoading(false);
      }
    },
    [token, empresaId, dataInicio, dataFim, canSubmit],
  );

  const handleExport = useCallback(async () => {
    if (!canSubmit) return;
    setExporting(true);
    setError('');
    try {
      // The server returns raw CSV text for formato=csv.
      const csv = await relatorioEmpresa(token, empresaId, {
        dataInicio,
        dataFim,
        formato: 'csv',
      });
      downloadCsv(
        `relatorio-${empresaId}-${dataInicio}-a-${dataFim}.csv`,
        typeof csv === 'string' ? csv : String(csv ?? ''),
      );
    } catch (err) {
      setError(
        (err && err.message) || 'Não foi possível exportar o CSV.',
      );
    } finally {
      setExporting(false);
    }
  }, [token, empresaId, dataInicio, dataFim, canSubmit]);

  const colaboradores = Array.isArray(report?.colaboradores)
    ? report.colaboradores
    : [];
  const hasReport = report != null;
  const hasRows = colaboradores.length > 0;

  return (
    <main className="auth-page manager-report">
      <header className="auth-header manager-report__header">
        <div>
          <h1 className="auth-title">Relatório da empresa</h1>
          <p className="auth-subtitle">
            Horas trabalhadas por colaborador no período.
          </p>
        </div>
        <Link to="/gerente/colaboradores" className="btn-secondary manager-report__nav">
          Colaboradores
        </Link>
      </header>

      <form className="manager-report__filters" onSubmit={handleSearch}>
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

        <div className="manager-report__actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !canSubmit}
          >
            {loading ? 'Gerando…' : 'Gerar relatório'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExport}
            disabled={exporting || !canSubmit}
          >
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>
      </form>

      {!empresaId && (
        <p className="form-hint">
          Empresa não identificada na sessão; refaça o login.
        </p>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {hasReport && !hasRows && !error && (
        <p className="auth-subtitle">
          Nenhum colaborador com registros no período selecionado.
        </p>
      )}

      {hasRows && (
        <div className="manager-report__table" role="table" aria-label="Horas por colaborador">
          <div className="manager-report__row manager-report__row--head" role="row">
            <span className="manager-report__cell" role="columnheader">Colaborador</span>
            <span className="manager-report__cell" role="columnheader">Horas trabalhadas</span>
            <span className="manager-report__cell" role="columnheader">Hora extra</span>
            <span className="manager-report__cell" role="columnheader">Excedeu limite</span>
          </div>

          {colaboradores.map((c) => {
            const { worked, overtime, exceeded } = summarize(c);
            return (
              <div
                key={c.colaborador_id}
                className={`manager-report__row${exceeded ? ' manager-report__row--flag' : ''}`}
                role="row"
              >
                <span className="manager-report__cell" data-label="Colaborador" role="cell">
                  {c.nome || c.colaborador_id || '—'}
                </span>
                <span className="manager-report__cell" data-label="Horas trabalhadas" role="cell">
                  {formatMinutes(worked)}
                </span>
                <span className="manager-report__cell" data-label="Hora extra" role="cell">
                  {formatMinutes(overtime)}
                </span>
                <span className="manager-report__cell" data-label="Excedeu limite" role="cell">
                  {exceeded ? (
                    <span className="manager-report__badge manager-report__badge--over">
                      Sim
                    </span>
                  ) : (
                    'Não'
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
