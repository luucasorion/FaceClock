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

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { cadastrarBiometria } from '../api/colaborador.js';
import '../styles/forms.css';

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
    <main className="auth-page">
      <header className="auth-header">
        <h1 className="auth-title">Cadastrar biometria facial</h1>
        <p className="auth-subtitle">
          Para bater o ponto identificando seu rosto, cadastre sua face uma única
          vez. Centralize o rosto na marca oval, com boa iluminação, e capture.
        </p>
      </header>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {phase === 'capturing' && (
        <CameraCapture
          onCapture={handleCapture}
          onError={handleCameraError}
          captureLabel="Capturar e cadastrar"
        />
      )}

      {phase === 'submitting' && (
        <p className="auth-subtitle" role="status">
          Enviando sua biometria…
        </p>
      )}

      {(phase === 'intro' || phase === 'submitting') && (
        <div className="auth-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={startCapture}
            disabled={phase === 'submitting'}
          >
            {error ? 'Tentar novamente' : 'Cadastrar minha face'}
          </button>
        </div>
      )}
    </main>
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
