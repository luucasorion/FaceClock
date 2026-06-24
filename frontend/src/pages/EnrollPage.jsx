// FE-ENROLL-1 — Biometric enrollment flow.
//
// Behind RequireAuth. Punching as the token holder (POST /ponto/) requires a
// stored facial embedding; RF13 (enroll on the first punch) is out of MVP scope,
// so enrollment is an explicit self-service step here. The client only captures
// bytes and uploads them — the server extracts the embedding (NFR05).
//
// Flow:
//   intro → capturing → submitting → (navigate /home | error)
//   - A brief explanation, then a "Cadastrar minha face" button mounts
//     CameraCapture (oval guide).
//   - On capture the Blob is POSTed to colaborador.cadastrarBiometria(token, blob)
//     (multipart `imagem`). CameraCapture has already stopped the stream and drops
//     the Blob after handoff — nothing is persisted here.
//   - Success → navigate to /home.
//   - Capture/upload error (no-face, bad image, network) → clear message + retry.
//
// Reachable from post-registration onboarding (FE-AUTH-2 routes here) and from
// the punch-home not-enrolled prompt (FE-PUNCH-2 links here).
//
// FE-UI-1: migrated the surrounding layout to MUI (Card/Typography/Button/Alert
// + Spinner). CameraCapture itself is NOT changed. The phase machine, endpoint,
// error mapping, and success→/home navigation are all unchanged — presentation only.

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Typography } from '@mui/material';
import CameraCapture from '../components/CameraCapture.jsx';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { cadastrarBiometria } from '../api/colaborador.js';

// phase: intro → capturing → submitting (errors return to intro with a message)
export default function EnrollPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('intro');
  const [error, setError] = useState('');

  const startCapture = useCallback(() => {
    setError('');
    setPhase('capturing');
  }, []);

  const handleCapture = useCallback(
    async (blob) => {
      // CameraCapture has already stopped the camera by the time onCapture fires;
      // the Blob is handed to us and otherwise discarded (NFR05).
      setPhase('submitting');
      setError('');
      try {
        await cadastrarBiometria(token, blob);
        navigate('/home');
      } catch (err) {
        // No-face / invalid-image (400), upload, or network failure: surface a
        // clear message and let the user retry from the intro state.
        setError(mapEnrollError(err));
        setPhase('intro');
      }
    },
    [token, navigate],
  );

  const handleCameraError = useCallback(() => {
    // CameraCapture renders its own permission/no-camera message in place. Drop
    // back to intro so the explanation + retry button are visible again.
    setPhase('intro');
  }, []);

  return (
    <Box component="main" sx={{ width: '100%', mt: 2 }}>
      <Box component="header" sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Cadastrar biometria facial
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Para bater o ponto identificando seu rosto, cadastre sua face uma única
          vez. Centralize o rosto na marca oval, com boa iluminação, e capture.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          {phase === 'capturing' && (
            <CameraCapture
              onCapture={handleCapture}
              onError={handleCameraError}
              captureLabel="Capturar e cadastrar"
            />
          )}

          {phase === 'submitting' && <Spinner label="Enviando sua biometria…" />}

          {(phase === 'intro' || phase === 'submitting') && (
            <Button
              type="button"
              variant="contained"
              size="large"
              fullWidth
              onClick={startCapture}
              disabled={phase === 'submitting'}
            >
              {error ? 'Tentar novamente' : 'Cadastrar minha face'}
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// Map an ApiError (or any thrown error) to a clear enrollment message.
function mapEnrollError(err) {
  const status = err && typeof err.status === 'number' ? err.status : null;
  if (status === 400) {
    // Backend rejects images with no detectable face / invalid image.
    return 'Não foi possível detectar um rosto na imagem. Centralize seu rosto, melhore a iluminação e tente novamente.';
  }
  return (
    (err && err.message) ||
    'Não foi possível cadastrar sua biometria. Tente novamente.'
  );
}
