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
// FE-UI-2: migrated to MUI. Date inputs are `TextField type="date"`, the period
// filters/actions live in a Card, and results render as an MUI Table with the
// BR05 overtime flag emphasized via a `Chip` (color="warning"). The
// relatorio.empresa fetch (json) and the Export CSV action (formato:'csv' →
// downloadCsv) are UNCHANGED — presentation only.

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../auth/AuthContext.jsx';
import { empresa as relatorioEmpresa } from '../api/relatorio.js';
import { downloadCsv } from '../lib/csv.js';

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
  const navigate = useNavigate();

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
            Relatório da empresa
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Horas trabalhadas por colaborador no período.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => navigate('/gerente/colaboradores')}
        >
          Colaboradores
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSearch}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  id="data_inicio"
                  label="Data início"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  id="data_fim"
                  label="Data fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !canSubmit}
                >
                  {loading ? 'Gerando…' : 'Gerar relatório'}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleExport}
                  disabled={exporting || !canSubmit}
                >
                  {exporting ? 'Exportando…' : 'Exportar CSV'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {!empresaId && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Empresa não identificada na sessão; refaça o login.
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {hasReport && !hasRows && !error && (
        <Typography variant="body1" color="text.secondary">
          Nenhum colaborador com registros no período selecionado.
        </Typography>
      )}

      {hasRows && (
        <TableContainer component={Card} variant="outlined">
          <Table aria-label="Horas por colaborador">
            <TableHead>
              <TableRow>
                <TableCell>Colaborador</TableCell>
                <TableCell align="right">Horas trabalhadas</TableCell>
                <TableCell align="right">Hora extra</TableCell>
                <TableCell align="center">Excedeu limite</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {colaboradores.map((c) => {
                const { worked, overtime, exceeded } = summarize(c);
                return (
                  <TableRow key={c.colaborador_id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {c.nome || c.colaborador_id || '—'}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatMinutes(worked)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatMinutes(overtime)}
                    </TableCell>
                    <TableCell align="center">
                      {exceeded ? (
                        <Chip size="small" color="warning" label="Sim" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Não
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
