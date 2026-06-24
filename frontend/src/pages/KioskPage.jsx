// FE-PUNCH-1 — Kiosk clock-in (embedded) screen.
//
// Public, single-purpose punch screen. Identity is established purely by the
// backend's facial recognition over all enrolled faces (POST /ponto/embarcado,
// no token). A prominent "Bater ponto" button opens CameraCapture; on capture
// the Blob is submitted to ponto.baterPontoEmbarcado({ blob, geo }).
//
// Result-state taxonomy is shared with the authenticated punch home via the
// PunchResult component + mapPunchError helper (FE-PUNCH-3):
//   success / not-recognized (401) / too-soon (429, BR02) / error.
// (not-enrolled cannot occur here: the kiosk recognizes across all faces.)
//
// After a result the screen auto-resets to the ready state for the next person
// (short timeout) so the whole interaction stays near the ~3s target. A manual
// "Próxima pessoa" button is also offered for immediate reset.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture.jsx';
import PunchResult, { mapPunchError } from '../components/PunchResult.jsx';
import Spinner from '../components/Spinner.jsx';
import { baterPontoEmbarcado } from '../api/ponto.js';
import { acquireGeo } from '../lib/geo.js';
import './KioskPage.css';

// phase: ready → capturing → submitting → result
const AUTO_RESET_MS = 4000;

export default function KioskPage() {
  const [phase, setPhase] = useState('ready');
  const [result, setResult] = useState(null); // { kind, message }
  const resetTimer = useRef(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }
  }, []);

  const goReady = useCallback(() => {
    clearResetTimer();
    setResult(null);
    setPhase('ready');
  }, [clearResetTimer]);

  // Release the auto-reset timer on unmount.
  useEffect(() => clearResetTimer, [clearResetTimer]);

  const showResult = useCallback(
    (next) => {
      setResult(next);
      setPhase('result');
      clearResetTimer();
      resetTimer.current = setTimeout(goReady, AUTO_RESET_MS);
    },
    [clearResetTimer, goReady],
  );

  const handleCapture = useCallback(
    async (blob) => {
      // CameraCapture has already released the camera by now.
      setPhase('submitting');
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
    // CameraCapture renders its own message; bring the user back to ready so
    // they can retry once permissions are granted.
    setPhase('ready');
  }, []);

  return (
    <main className="kiosk-page">
      <header className="kiosk-header">
        <h1 className="kiosk-title">FaceClock</h1>
        <p className="kiosk-subtitle">Totem de ponto</p>
      </header>

      {phase === 'ready' && (
        <div className="kiosk-ready">
          <p className="kiosk-instruction">
            Posicione seu rosto e toque para bater o ponto.
          </p>
          <div className="thumb-zone">
            <button
              type="button"
              className="btn-primary"
              onClick={() => setPhase('capturing')}
            >
              Bater ponto
            </button>
            <Link to="/" className="kiosk-link">
              Voltar ao menu
            </Link>
          </div>
        </div>
      )}

      {phase === 'capturing' && (
        <CameraCapture
          onCapture={handleCapture}
          onError={handleCameraError}
          captureLabel="Capturar e bater ponto"
        />
      )}

      {phase === 'submitting' && (
        <div className="kiosk-status">
          <Spinner label="Reconhecendo…" />
        </div>
      )}

      {phase === 'result' && result && (
        <div className="kiosk-result">
          <PunchResult result={result} onReset={goReady} resetLabel="Próxima pessoa" />
        </div>
      )}
    </main>
  );
}
