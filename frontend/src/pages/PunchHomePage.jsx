// FE-PUNCH-2 — Employee punch home (post-login / post-registration).
//
// Behind RequireAuth. The authenticated collaborator can:
//   - Clock in as themselves via POST /ponto/ (token identity) — the same
//     CameraCapture flow as the kiosk, but the /ponto/ endpoint, NOT the kiosk
//     /ponto/embarcado endpoint.
//   - See today's punches loaded from GET /relatorio/dia (each batida rendered
//     as a list item with time + derived tipo entrada/saida; plus the total count).
//     The list refreshes after a successful punch.
//   - Reach their profile via a button in the top corner (→ /perfil). The AppBar
//     (FE-SHARED-9) also exposes Perfil, but the page keeps its own quick action.
//
// Result-state taxonomy is shared with the kiosk via the PunchResult component +
// mapPunchError helper (FE-PUNCH-3): success / not-recognized (401) /
// too-soon (429, BR02) / not-enrolled (400 w/ "biometria" → enroll link) /
// error (incl. the 400 invalid-image case).
//
// The camera flow is toggleable: CameraCapture mounts only while clocking in
// and is unmounted (releasing the camera) once a result is shown.
//
// FE-UI-1: migrated the page chrome to MUI (Card/List/Button/Typography/Box +
// the MUI-backed Spinner/EmptyState/ErrorBanner/PunchResult). The punch flow,
// the /ponto/ + /relatorio/dia endpoints, and the 400 not-enrolled-vs-invalid
// disambiguation (via mapPunchError) are all unchanged — presentation only.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CameraCapture from '../components/CameraCapture.jsx';
import PunchResult, { mapPunchError } from '../components/PunchResult.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { baterPonto } from '../api/ponto.js';
import { dia } from '../api/relatorio.js';
import { acquireGeo } from '../lib/geo.js';

// phase: idle → capturing → submitting → result
export default function PunchHomePage() {
  const { token } = useAuth();

  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null); // { kind, message }

  const [resumo, setResumo] = useState(null); // { total, batidas[] }
  const [loadingResumo, setLoadingResumo] = useState(true);
  const [resumoError, setResumoError] = useState('');

  const loadResumo = useCallback(async () => {
    setLoadingResumo(true);
    setResumoError('');
    try {
      const data = await dia(token);
      setResumo(data);
    } catch (err) {
      setResumoError((err && err.message) || 'Não foi possível carregar os registros de hoje.');
    } finally {
      setLoadingResumo(false);
    }
  }, [token]);

  useEffect(() => {
    loadResumo();
  }, [loadResumo]);

  const startCapture = useCallback(() => {
    setResult(null);
    setPhase('capturing');
  }, []);

  const handleCapture = useCallback(
    async (blob) => {
      // CameraCapture has already stopped the camera by the time onCapture fires.
      setPhase('submitting');
      const geo = await acquireGeo();
      try {
        await baterPonto(token, { blob, geo });
        setResult({ kind: 'success', message: 'Ponto registrado!' });
        setPhase('result');
        loadResumo(); // refresh today's punches after a successful punch.
      } catch (err) {
        setResult(mapPunchError(err));
        setPhase('result');
      }
    },
    [token, loadResumo],
  );

  const handleCameraError = useCallback(() => {
    // CameraCapture shows its own message; return to idle so the cards are
    // visible again and the user can retry.
    setPhase('idle');
  }, []);

  const dismissResult = useCallback(() => {
    setResult(null);
    setPhase('idle');
  }, []);

  return (
    <Box component="main" sx={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}>
      <Stack
        component="header"
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
        sx={{ mt: 1 }}
      >
        <Box>
          <Typography variant="h5" component="h1" fontWeight={700}>
            Olá!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bater ponto
          </Typography>
        </Box>
        <IconButton
          component={Link}
          to="/perfil"
          aria-label="Abrir perfil"
          sx={{ border: 1, borderColor: 'divider' }}
        >
          <PersonOutlineIcon />
        </IconButton>
      </Stack>

      {/* Clock In — above the cards, in thumb reach. Hidden while the camera or
          a result is showing so the screen has a single clear action. */}
      {phase === 'idle' && (
        <Button
          type="button"
          variant="contained"
          size="large"
          fullWidth
          onClick={startCapture}
          sx={{ mt: 3 }}
        >
          Bater ponto
        </Button>
      )}

      {phase === 'capturing' && (
        <Box sx={{ mt: 3 }}>
          <CameraCapture
            onCapture={handleCapture}
            onError={handleCameraError}
            captureLabel="Capturar e bater ponto"
          />
        </Box>
      )}

      {phase === 'submitting' && (
        <Box sx={{ my: 3, textAlign: 'center' }}>
          <Spinner label="Registrando…" />
        </Box>
      )}

      {phase === 'result' && result && (
        <Box sx={{ mt: 3 }}>
          <PunchResult result={result} onRetry={dismissResult} retryLabel="Fechar" />
        </Box>
      )}

      {/* Today's punches. */}
      <Box component="section" aria-label="Registros de hoje" sx={{ mt: 4 }}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between">
          <Typography variant="h6" component="h2">
            Hoje
          </Typography>
          {resumo && (
            <Typography variant="body2" color="text.secondary">
              {resumo.total} {resumo.total === 1 ? 'registro' : 'registros'}
            </Typography>
          )}
        </Stack>

        {loadingResumo && <Spinner label="Carregando…" />}

        {!loadingResumo && resumoError && (
          <ErrorBanner message={resumoError} onRetry={loadResumo} />
        )}

        {!loadingResumo && !resumoError && resumo && resumo.batidas?.length === 0 && (
          <EmptyState icon="🕒" message="Nenhum ponto registrado hoje ainda." />
        )}

        {!loadingResumo && !resumoError && resumo && resumo.batidas?.length > 0 && (
          <List disablePadding sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {resumo.batidas.map((b) => (
              <Card
                key={b.id}
                variant="outlined"
                sx={{
                  borderLeft: 4,
                  borderLeftColor: b.tipo === 'entrada' ? '#16a34a' : '#dc2626',
                }}
              >
                <ListItem>
                  <ListItemText
                    primary={b.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatTime(b.batida)}
                  </Typography>
                </ListItem>
              </Card>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}

// Format a backend datetime string to a local HH:MM. Falls back to the raw
// value if it cannot be parsed.
function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
