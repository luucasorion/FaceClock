// FE-PUNCH-4 — Kiosk / totem clock-in (embedded) screen, redesigned.
//
// Public, single-purpose punch totem. Identity is established purely by the
// backend's facial recognition over all enrolled faces (POST /ponto/embarcado,
// no token). The screen is full-bleed (rendered outside AppLayout per
// FE-SHARED-9) and landscape-friendly, but also works on a tablet in portrait.
//
// Flow: idle → capturing → recognizing → result → (auto) idle
//   idle        — FaceClock branding + a live clock (time/date) + ONE large CTA.
//   capturing   — CameraCapture with autoCaptureCountdown={3}: a 3-2-1 countdown
//                 over the video then auto-capture (one deliberate action; no
//                 separate "start" then "capture" double-tap).
//   recognizing — large centered spinner + "Reconhecendo…".
//   result      — LARGE, color-coded result (success / não reconhecido (401) /
//                 muito cedo (429) / erro) readable from a distance, with a
//                 visible auto-reset countdown back to idle plus a manual
//                 "Próxima pessoa" button.
//
// Result taxonomy is shared with the authenticated punch home via mapPunchError
// (FE-PUNCH-3) so backend responses map identically across both screens. The
// kiosk renders its own enlarged result inline (rather than the small
// PunchResult banner) but reuses mapPunchError for the status→kind/message map.
// not-enrolled (400 "biometria") cannot occur here — the kiosk recognizes across
// all faces — so mapPunchError's 400 path yields a generic invalid-image message.
//
// NFR05: CameraCapture stops the MediaStream and drops the blob right after
// handoff; nothing is persisted here either.

import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';

import CameraCapture from '../components/CameraCapture.jsx';
import { mapPunchError } from '../components/PunchResult.jsx';
import { baterPontoEmbarcado } from '../api/ponto.js';
import { acquireGeo } from '../lib/geo.js';
import './KioskPage.css';

// phase: idle → capturing → recognizing → result
const AUTO_RESET_SECONDS = 6; // visible countdown back to idle (not jarringly fast)
const CAPTURE_COUNTDOWN = 3; // 3-2-1 over the video before auto-capture

// Per-kind presentation for the enlarged kiosk result. Messages come from
// mapPunchError so the taxonomy stays consistent with the authenticated screen.
const RESULT_VISUALS = {
  success: { color: 'success.main', Icon: CheckCircleRoundedIcon, headline: 'Ponto registrado!' },
  'not-recognized': { color: 'warning.main', Icon: CancelRoundedIcon, headline: 'Não reconhecido' },
  'not-enrolled': { color: 'warning.main', Icon: CancelRoundedIcon, headline: 'Não reconhecido' },
  'too-soon': { color: 'info.main', Icon: HourglassBottomRoundedIcon, headline: 'Muito cedo' },
  error: { color: 'error.main', Icon: ErrorOutlineRoundedIcon, headline: 'Algo deu errado' },
};

function formatTime(d) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function formatDate(d) {
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function KioskPage() {
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null); // { kind, message }
  const [now, setNow] = useState(() => new Date());
  const [resetIn, setResetIn] = useState(AUTO_RESET_SECONDS);

  const clockTimer = useRef(null);
  const resetTimer = useRef(null);

  // Live clock — ticks every second; cleared on unmount.
  useEffect(() => {
    clockTimer.current = setInterval(() => setNow(new Date()), 1000);
    return () => {
      if (clockTimer.current) clearInterval(clockTimer.current);
    };
  }, []);

  const clearResetTimer = useCallback(() => {
    if (resetTimer.current) {
      clearInterval(resetTimer.current);
      resetTimer.current = null;
    }
  }, []);

  const goIdle = useCallback(() => {
    clearResetTimer();
    setResult(null);
    setPhase('idle');
  }, [clearResetTimer]);

  // Release the auto-reset timer on unmount.
  useEffect(() => clearResetTimer, [clearResetTimer]);

  const showResult = useCallback(
    (next) => {
      setResult(next);
      setPhase('result');
      setResetIn(AUTO_RESET_SECONDS);
      clearResetTimer();
      resetTimer.current = setInterval(() => {
        setResetIn((prev) => {
          if (prev <= 1) {
            clearResetTimer();
            goIdle();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearResetTimer, goIdle],
  );

  const handleCapture = useCallback(
    async (blob) => {
      // CameraCapture has already released the camera (NFR05) by now.
      setPhase('recognizing');
      const geo = await acquireGeo();
      try {
        await baterPontoEmbarcado({ blob, geo });
        showResult({ kind: 'success', message: 'Ponto registrado! Bem-vindo(a).' });
      } catch (err) {
        showResult(mapPunchError(err));
      }
    },
    [showResult],
  );

  const handleCameraError = useCallback(() => {
    // CameraCapture renders its own message; bring the user back to idle so they
    // can retry once permissions are granted.
    setPhase('idle');
  }, []);

  return (
    <Box
      className="kiosk-stage"
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="md" sx={{ width: '100%' }}>
        {phase === 'idle' && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h2"
              sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'primary.main' }}
            >
              FaceClock
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', mt: 1 }}>
              Totem de ponto
            </Typography>

            <Typography
              component="div"
              sx={{
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                fontSize: { xs: '3.5rem', sm: '5.5rem' },
                lineHeight: 1.1,
                mt: { xs: 4, sm: 6 },
              }}
            >
              {formatTime(now)}
            </Typography>
            <Typography
              sx={{
                color: 'text.secondary',
                textTransform: 'capitalize',
                fontSize: { xs: '1rem', sm: '1.25rem' },
                mb: { xs: 4, sm: 6 },
              }}
            >
              {formatDate(now)}
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<AccessTimeRoundedIcon />}
              onClick={() => setPhase('capturing')}
              sx={{ px: 6, py: 2, fontSize: '1.5rem', borderRadius: 999 }}
            >
              Bater ponto
            </Button>
          </Box>
        )}

        {phase === 'capturing' && (
          <Card
            elevation={6}
            sx={{
              maxWidth: 520,
              mx: 'auto',
              p: 2,
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
              Posicione seu rosto
            </Typography>
            <CameraCapture
              onCapture={handleCapture}
              onError={handleCameraError}
              autoCaptureCountdown={CAPTURE_COUNTDOWN}
            />
            <Button onClick={goIdle} sx={{ mt: 1 }} color="inherit">
              Cancelar
            </Button>
          </Card>
        )}

        {phase === 'recognizing' && (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={96} thickness={4} />
            <Typography variant="h4" sx={{ mt: 4, fontWeight: 600 }}>
              Reconhecendo…
            </Typography>
          </Box>
        )}

        {phase === 'result' && result && (() => {
          const visual = RESULT_VISUALS[result.kind] || RESULT_VISUALS.error;
          const { Icon } = visual;
          return (
            <Box sx={{ textAlign: 'center' }} role="status" aria-live="polite">
              <Icon sx={{ fontSize: { xs: 120, sm: 180 }, color: visual.color }} />
              <Typography
                variant="h3"
                sx={{ fontWeight: 800, color: visual.color, mt: 1 }}
              >
                {visual.headline}
              </Typography>
              <Typography
                sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' }, color: 'text.secondary', mt: 2 }}
              >
                {result.message}
              </Typography>

              <Typography sx={{ color: 'text.secondary', mt: 4 }}>
                Voltando em {resetIn}…
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={goIdle}
                sx={{ mt: 2, px: 5, py: 1.5, fontSize: '1.25rem', borderRadius: 999 }}
              >
                Próxima pessoa
              </Button>
            </Box>
          );
        })()}
      </Container>
    </Box>
  );
}
