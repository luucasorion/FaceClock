// FE-PUNCH-3 — unified punch result banner.
//
// Shared by the kiosk (FE-PUNCH-1) and the authenticated punch home (FE-PUNCH-2)
// so both screens present a consistent, legible result taxonomy:
//
//   success       — recognized + punched.
//   not-recognized— 401: face not recognized.
//   too-soon      — 429 (BR02): punched again before the minimum interval.
//   not-enrolled  — 400 whose detail mentions "biometria": the collaborator has
//                   no stored embedding. Renders an enroll link to /enroll.
//   error         — generic / any other failure (incl. the 400 invalid-image case).
//
// The component is presentation-only. The `mapPunchError(err)` helper exported
// alongside it turns a thrown ApiError (status + detail/message) into a
// { kind, message } result so the two pages map backend responses identically.
//
// Props:
//   result   — { kind, message } (required to render anything).
//   onReset  — optional handler → renders a primary "reset" action (e.g. kiosk
//              "Próxima pessoa"). Use for the auto-reset flow's manual button.
//   onRetry  — optional handler → renders a secondary "retry" text action.
//   resetLabel / retryLabel — action labels (sensible Portuguese defaults).
//   enrollTo — route for the not-enrolled enroll link (default "/enroll").

import { Link } from 'react-router-dom';
import './PunchResult.css';

// Friendly default copy per kind. A caller-supplied result.message overrides it.
const DEFAULT_MESSAGE = {
  success: 'Ponto registrado!',
  'not-recognized': 'Face não reconhecida. Tente novamente.',
  'too-soon': 'Muito cedo — aguarde alguns minutos para bater novamente.',
  'not-enrolled':
    'Você ainda não cadastrou sua face. Cadastre sua biometria para bater o ponto.',
  error: 'Não foi possível registrar o ponto. Tente novamente.',
};

export default function PunchResult({
  result,
  onReset,
  onRetry,
  resetLabel = 'Próxima pessoa',
  retryLabel = 'Tentar novamente',
  enrollTo = '/enroll',
}) {
  if (!result) return null;
  const kind = result.kind || 'error';
  const message = result.message || DEFAULT_MESSAGE[kind] || DEFAULT_MESSAGE.error;

  return (
    <div className={`punch-result punch-result--${kind}`} role="status" aria-live="polite">
      <p className="punch-result__message">{message}</p>

      {kind === 'not-enrolled' && (
        <Link to={enrollTo} className="btn-primary punch-result__action">
          Cadastrar minha face
        </Link>
      )}

      {typeof onReset === 'function' && (
        <button type="button" className="btn-primary punch-result__action" onClick={onReset}>
          {resetLabel}
        </button>
      )}

      {typeof onRetry === 'function' && (
        <button type="button" className="punch-result__dismiss" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

// Map a thrown ApiError (or any error) to a { kind, message } punch result.
//
// Shared by both punch screens so the taxonomy is identical. The 400 case is
// disambiguated by detail text: a "biometria" mention means the token holder has
// no enrolled face (→ not-enrolled, with an enroll prompt); anything else 400 is
// treated as a bad/invalid image the user can simply retry. The kiosk endpoint
// never returns the not-enrolled 400 (it recognizes across all faces), so this
// disambiguation is harmless there.
export function mapPunchError(err) {
  const status = err && typeof err.status === 'number' ? err.status : null;

  if (status === 401) {
    return { kind: 'not-recognized', message: DEFAULT_MESSAGE['not-recognized'] };
  }
  if (status === 429) {
    return { kind: 'too-soon', message: DEFAULT_MESSAGE['too-soon'] };
  }
  if (status === 400) {
    const detailText = `${(err && err.detail) || ''} ${(err && err.message) || ''}`.toLowerCase();
    if (detailText.includes('biometria')) {
      return { kind: 'not-enrolled', message: DEFAULT_MESSAGE['not-enrolled'] };
    }
    return { kind: 'error', message: 'Imagem inválida, tente novamente.' };
  }
  return {
    kind: 'error',
    message: (err && err.message) || DEFAULT_MESSAGE.error,
  };
}
