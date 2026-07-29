// FE-MANAGER-1 — Manager "My Employees" list.
//
// Behind RequireManager (gated on the AUTHZ-1 `gerente` claim). RF10: a manager
// lists their company's collaborators via GET /colaborador/ (colaborador.listar)
// — the backend scopes the list to the token holder's company, so no empresa_id
// filter is needed here.
//
// Each row shows nome / login / cpf / status / gerente. Clicking a row navigates
// to the employee file at /gerente/colaboradores/{cpf}.
//
// States: loading, error (ApiError.message), empty, and the populated list.
//
// FE-UI-2: migrated to MUI. The list renders as an `@mui/x-data-grid` DataGrid
// (sortable/filterable columns; row click → employee file). Loading/empty/error
// stay on the shared MUI primitives. Wide layout comes from AppLayout
// (FE-SHARED-9 gives `/gerente/*` a wide Container). Endpoint + navigation
// wiring are UNCHANGED — presentation only.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useAuth } from '../auth/AuthContext.jsx';
import { listar } from '../api/colaborador.js';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { isAtivo, statusLabel } from '../lib/status.js';
import { valtech } from '../theme.js';

// Status chip: Ativo = lime fill / black text; Inativo = white / stone border /
// graphite text. Both square (chip radius is 0 from the theme).
const chipSx = (active) =>
  active
    ? { bgcolor: valtech.lime, color: valtech.black, border: 'none' }
    : { bgcolor: valtech.white, color: valtech.graphite, border: `1px solid ${valtech.stone}` };

// A black line check for the gerente boolean column (or an em dash when false).
const CheckMark = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Sim">
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

// Column model for the DataGrid. Sortable by default; the grid handles sort/
// filter client-side. `gerente` (boolean) and `status` render as readable text.
const COLUMNS = [
  { field: 'nome', headerName: 'Nome', flex: 1.4, minWidth: 160 },
  { field: 'login', headerName: 'Login', flex: 1, minWidth: 120 },
  { field: 'cpf', headerName: 'CPF', flex: 1, minWidth: 130 },
  {
    field: 'status',
    headerName: 'Status',
    flex: 0.8,
    minWidth: 110,
    renderCell: (params) => {
      const active = isAtivo(params.value);
      return (
        <Chip
          size="small"
          label={statusLabel(params.value)}
          sx={chipSx(active)}
        />
      );
    },
  },
  {
    field: 'gerente',
    headerName: 'Gerente',
    flex: 0.7,
    minWidth: 100,
    type: 'boolean',
    valueGetter: (value) => Boolean(value),
    renderCell: (params) =>
      params.value ? (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', color: valtech.black }}>
          <CheckMark />
        </Box>
      ) : (
        <Box sx={{ color: valtech.graphite }}>—</Box>
      ),
  },
];

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
    <Box component="main" sx={{ width: '100%', mt: 2 }}>
      <Stack
        component="header"
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h1" component="h1">
            Meus colaboradores
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Colaboradores da sua empresa. Toque em um para abrir a ficha.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => navigate('/gerente/relatorio')}
        >
          Relatório
        </Button>
      </Stack>

      {loading && <Spinner label="Carregando colaboradores…" />}

      {!loading && error && <ErrorBanner message={error} onRetry={load} />}

      {!loading && !error && !hasRows && (
        <EmptyState icon="👥" message="Nenhum colaborador encontrado." />
      )}

      {!loading && !error && hasRows && (
        <DataGrid
          rows={rows}
          columns={COLUMNS}
          getRowId={(row) => row.cpf}
          onRowClick={(params) => openFile(params.row.cpf)}
          disableRowSelectionOnClick
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
          }}
          sx={{
            // Keep the grid from forcing horizontal scroll on the page shell;
            // the grid scrolls internally if columns overflow.
            width: '100%',
            bgcolor: 'background.paper',
            border: `1px solid ${valtech.stone}`,
            borderRadius: 0,
            // Black header row with white eyebrow labels.
            '& .MuiDataGrid-columnHeaders': { borderRadius: 0 },
            '& .MuiDataGrid-columnHeader': { bgcolor: valtech.black },
            '& .MuiDataGrid-columnHeaderTitle': {
              color: valtech.white,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: 11,
              fontWeight: 500,
            },
            '& .MuiDataGrid-columnSeparator': { display: 'none' },
            '& .MuiDataGrid-iconButtonContainer .MuiSvgIcon-root, & .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton .MuiSvgIcon-root':
              { color: valtech.white },
            // Hairline-separated body rows.
            '& .MuiDataGrid-cell': { borderColor: valtech.innerDivider },
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-row:hover': { bgcolor: valtech.bone },
          }}
          aria-label="Colaboradores da empresa"
        />
      )}
    </Box>
  );
}
