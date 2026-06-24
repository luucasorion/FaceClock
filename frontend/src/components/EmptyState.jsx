// FE-SHARED-7 — EmptyState: icon + message for an empty list/result.
//
// Used where a page previously inlined a "Nenhum … encontrado" line, so empty
// states look consistent across screens.
//
// Props:
//   icon     — small visual marker (emoji/text node); default a neutral glyph.
//   message  — the empty message (required for meaningful output).
//   children — optional extra content (e.g. a call-to-action) below the message.

import './ui.css';

export default function EmptyState({ icon = '📭', message, children }) {
  return (
    <div className="ui-empty">
      {icon && (
        <span className="ui-empty__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {message && <p className="ui-empty__message">{message}</p>}
      {children}
    </div>
  );
}
