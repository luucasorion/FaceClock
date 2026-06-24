// FE-SHARED-7 — Spinner: a small, accessible loading indicator.
//
// Renders an animated circle plus an optional label. Exposes role="status" so
// screen readers announce the loading state. Reused across pages that previously
// inlined ad-hoc "Carregando…" text.
//
// Props:
//   label — visible text under the spinner (default "Carregando…").

import './ui.css';

export default function Spinner({ label = 'Carregando…' }) {
  return (
    <div className="ui-spinner" role="status" aria-live="polite">
      <span className="ui-spinner__circle" aria-hidden="true" />
      {label && <p className="ui-spinner__label">{label}</p>}
    </div>
  );
}
