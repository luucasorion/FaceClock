// FE-SHARED-7 — ErrorBanner: an error message with an optional Retry action.
//
// Replaces ad-hoc inline error <p> elements. role="alert" so the message is
// announced. When onRetry is supplied a Retry button is shown in-line.
//
// Props:
//   message    — the error text (required for meaningful output).
//   onRetry    — optional handler; renders a Retry button when present.
//   retryLabel — Retry button text (default "Tentar novamente").

import './ui.css';

export default function ErrorBanner({ message, onRetry, retryLabel = 'Tentar novamente' }) {
  if (!message) return null;
  return (
    <div className="ui-error" role="alert">
      <p className="ui-error__message">{message}</p>
      {typeof onRetry === 'function' && (
        <button type="button" className="ui-error__retry" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
