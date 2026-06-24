// FE-PUNCH-2 — Employee punch home (post-login / post-registration).
//
// Behind RequireAuth. The authenticated collaborator can:
//   - Clock in as themselves via POST /ponto/ (token identity) — the same
//     CameraCapture flow as the kiosk, but the /ponto/ endpoint, NOT the kiosk
//     /ponto/embarcado endpoint.
//   - See today's punches loaded from GET /relatorio/dia (each batida rendered
//     as a card with time + derived tipo entrada/saida; plus the total count).
//     The list refreshes after a successful punch.
//   - Reach their profile via a circular button in the top corner (→ /perfil).
//
// Result-state taxonomy (mapped from response / ApiError.status):
//   success (2xx) → punched
//   401           → "face não reconhecida"
//   429           → "muito cedo" (BR02)
//   400           → "not enrolled" (collaborator has no stored embedding —
//                   backend returns 400 "não possui biometria"); show a prompt
//                   to enroll first, linking to /enroll.
//   other         → generic message from ApiError
//
// The camera flow is toggleable: CameraCapture mounts only while clocking in
// and is unmounted (releasing the camera) once a result is shown.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { baterPonto } from '../api/ponto.js';
import { dia } from '../api/relatorio.js';
import { acquireGeo } from '../lib/geo.js';
import './PunchHomePage.css';

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
    <main className="punch-home">
      <header className="punch-home__header">
        <div>
          <h1 className="punch-home__title">Olá!</h1>
          <p className="punch-home__subtitle">Bater ponto</p>
        </div>
        <Link
          to="/perfil"
          className="punch-home__profile-btn"
          aria-label="Abrir perfil"
        >
          <span aria-hidden="true">👤</span>
        </Link>
      </header>

      {/* Clock In — above the cards, in thumb reach. Hidden while the camera or
          a result is showing so the screen has a single clear action. */}
      {phase === 'idle' && (
        <button type="button" className="btn-primary punch-home__clock-in" onClick={startCapture}>
          Bater ponto
        </button>
      )}

      {phase === 'capturing' && (
        <CameraCapture
          onCapture={handleCapture}
          onError={handleCameraError}
          captureLabel="Capturar e bater ponto"
        />
      )}

      {phase === 'submitting' && (
        <p className="punch-home__status" role="status">
          Registrando…
        </p>
      )}

      {phase === 'result' && result && (
        <div className={`punch-result punch-result--${result.kind}`} role="status">
          <p className="punch-result__message">{result.message}</p>
          {result.kind === 'not-enrolled' && (
            <Link to="/enroll" className="btn-primary punch-result__action">
              Cadastrar minha face
            </Link>
          )}
          <button type="button" className="punch-result__dismiss" onClick={dismissResult}>
            Fechar
          </button>
        </div>
      )}

      {/* Today's punches. */}
      <section className="punch-home__today" aria-label="Registros de hoje">
        <div className="punch-home__today-head">
          <h2 className="punch-home__today-title">Hoje</h2>
          {resumo && (
            <span className="punch-home__count">
              {resumo.total} {resumo.total === 1 ? 'registro' : 'registros'}
            </span>
          )}
        </div>

        {loadingResumo && <p className="punch-home__muted">Carregando…</p>}

        {!loadingResumo && resumoError && (
          <p className="punch-home__error" role="alert">
            {resumoError}
          </p>
        )}

        {!loadingResumo && !resumoError && resumo && resumo.batidas?.length === 0 && (
          <p className="punch-home__muted">Nenhum ponto registrado hoje ainda.</p>
        )}

        {!loadingResumo && !resumoError && resumo && resumo.batidas?.length > 0 && (
          <ul className="punch-card-list">
            {resumo.batidas.map((b) => (
              <li key={b.id} className={`punch-card punch-card--${b.tipo}`}>
                <span className="punch-card__tipo">
                  {b.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                </span>
                <span className="punch-card__time">{formatTime(b.batida)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
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

// Map an ApiError (or any thrown error) to a punch-home result state.
function mapPunchError(err) {
  const status = err && typeof err.status === 'number' ? err.status : null;
  if (status === 401) {
    return { kind: 'denied', message: 'Face não reconhecida. Tente novamente.' };
  }
  if (status === 429) {
    return { kind: 'denied', message: 'Muito cedo — aguarde alguns minutos para bater novamente.' };
  }
  if (status === 400) {
    // The backend returns 400 in two distinct cases. Disambiguate by the
    // detail/message text rather than treating every 400 as "not enrolled":
    //   - "...não possui biometria facial cadastrada" → collaborator has no
    //     stored embedding → prompt enrollment.
    //   - "Imagem inválida ou nenhum rosto detectado" → bad capture → let the
    //     (possibly already-enrolled) user simply retry, no enroll prompt.
    const detailText = `${(err && err.detail) || ''} ${(err && err.message) || ''}`.toLowerCase();
    if (detailText.includes('biometria')) {
      return {
        kind: 'not-enrolled',
        message: 'Você ainda não cadastrou sua face. Cadastre sua biometria para bater o ponto.',
      };
    }
    return {
      kind: 'error',
      message: 'Imagem inválida, tente novamente.',
    };
  }
  return {
    kind: 'error',
    message: (err && err.message) || 'Não foi possível registrar o ponto. Tente novamente.',
  };
}
