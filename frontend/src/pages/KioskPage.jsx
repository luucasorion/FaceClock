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
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import CameraCapture from '../components/CameraCapture.jsx';
import { mapPunchError } from '../components/PunchResult.jsx';
import BrandMark from '../components/BrandMark.jsx';
import { baterPontoEmbarcado } from '../api/ponto.js';
import { acquireGeo } from '../lib/geo.js';
import { valtech } from '../theme.js';
import './KioskPage.css';

// phase: idle → capturing → recognizing → result
const AUTO_RESET_SECONDS = 6; // visible countdown back to idle (not jarringly fast)
const CAPTURE_COUNTDOWN = 3; // 3-2-1 over the video before auto-capture

// Per-kind headline + accent for the enlarged kiosk result (monochrome stage;
// only the accent colour signals outcome). Messages come from mapPunchError so
// the taxonomy stays consistent with the authenticated screen. `success` is
// rendered separately with the spectrum ring.
const RESULT_VISUALS = {
  'not-recognized': { color: valtech.orange, headline: 'Não reconhecido' },
  'not-enrolled': { color: valtech.orange, headline: 'Não reconhecido' },
  'too-soon': { color: valtech.orange, headline: 'Muito cedo' },
  error: { color: valtech.signalRed, headline: 'Algo deu errado' },
};

// A line clock icon for the pill CTA (prototype §1e).
const ClockIcon = ({ size = 22 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// The kiosk success ring: 132px spectrum circle, inset 108px black circle, white
// line check (prototype §1e kiosk success).
const KioskSuccessRing = () => (
  <span
    aria-hidden="true"
    style={{
      width: 132,
      height: 132,
      borderRadius: '50%',
      background: valtech.spectrum,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <span
      style={{
        width: 108,
        height: 108,
        borderRadius: '50%',
        background: valtech.black,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg viewBox="0 0 24 24" width={58} height={58} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12.5l5 5L20 6.5" />
      </svg>
    </span>
  </span>
);

function formatTime(d) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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

  // White pill CTA (white fill / black text, 999px), reused idle + result.
  const pillSx = {
    px: 5,
    py: 1.75,
    borderRadius: 999,
    bgcolor: valtech.white,
    color: valtech.black,
    fontSize: '1.25rem',
    fontWeight: 600,
    '&:hover': { bgcolor: valtech.white, color: valtech.black },
  };

  return (
    <Box
      className="kiosk-stage"
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: valtech.black,
        color: valtech.white,
        overflow: 'hidden',
        p: { xs: 2, sm: 4 },
      }}
    >
      {/* 5px spectrum band along the top edge. */}
      <Box
        aria-hidden
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: valtech.spectrum }}
      />
      {/* Faint prismatic photo background. */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/brand/prism3.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.16,
          pointerEvents: 'none',
        }}
      />
      {/* Valtech asterisk, bottom-right. */}
      <Box
        component="img"
        src="/brand/asterisk-white.png"
        alt=""
        aria-hidden
        sx={{ position: 'absolute', right: 20, bottom: 16, width: 34, opacity: 0.85, pointerEvents: 'none' }}
      />

      <Container maxWidth="md" sx={{ width: '100%', position: 'relative', zIndex: 1 }}>
        {phase === 'idle' && (
          <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <BrandMark markSize={34} wordSize={26} strokeWidth={2.4} />

            <Typography
              component="div"
              sx={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                letterSpacing: '-0.015em',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 'clamp(56px, 9vw, 104px)',
                lineHeight: 1,
                mt: { xs: 4, sm: 6 },
              }}
            >
              {formatTime(now)}
            </Typography>
            <Typography
              sx={{
                color: valtech.mutedOnDark,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                mb: { xs: 4, sm: 6 },
              }}
            >
              {formatDate(now)}
            </Typography>

            <Button size="large" onClick={() => setPhase('capturing')} startIcon={<ClockIcon />} sx={pillSx}>
              Bater ponto
            </Button>
          </Box>
        )}

        {phase === 'capturing' && (
          <Box
            sx={{
              maxWidth: 520,
              mx: 'auto',
              p: 2,
              border: `1px solid ${valtech.graphite}`,
              bgcolor: valtech.black,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h4" sx={{ textAlign: 'center', mb: 1, color: valtech.white }}>
              Posicione seu rosto
            </Typography>
            <CameraCapture
              onCapture={handleCapture}
              onError={handleCameraError}
              autoCaptureCountdown={CAPTURE_COUNTDOWN}
            />
            <Button
              onClick={goIdle}
              sx={{ mt: 1, color: valtech.mutedOnDark, '&:hover': { color: valtech.white, bgcolor: 'transparent' } }}
            >
              Cancelar
            </Button>
          </Box>
        )}

        {phase === 'recognizing' && (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={96} thickness={4} sx={{ color: valtech.white }} />
            <Typography variant="h3" sx={{ mt: 4 }}>
              Reconhecendo…
            </Typography>
          </Box>
        )}

        {phase === 'result' && result && (() => {
          const isSuccess = result.kind === 'success';
          const visual = RESULT_VISUALS[result.kind] || RESULT_VISUALS.error;
          return (
            <Box
              sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              role="status"
              aria-live="polite"
            >
              {isSuccess ? (
                <KioskSuccessRing />
              ) : null}
              <Typography
                sx={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 300,
                  letterSpacing: '-0.015em',
                  lineHeight: 1.05,
                  fontSize: 'clamp(36px, 6vw, 60px)',
                  color: isSuccess ? valtech.white : visual.color,
                  mt: isSuccess ? 3 : 0,
                }}
              >
                {isSuccess ? 'Ponto registrado!' : visual.headline}
              </Typography>
              <Typography
                sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' }, color: valtech.mutedOnDark, mt: 2 }}
              >
                {result.message}
              </Typography>

              <Typography sx={{ color: valtech.subtle, mt: 4 }}>
                Voltando em {resetIn}…
              </Typography>
              <Button size="large" onClick={goIdle} sx={{ ...pillSx, mt: 2 }}>
                Próxima pessoa
              </Button>
            </Box>
          );
        })()}
      </Container>
    </Box>
  );
}
