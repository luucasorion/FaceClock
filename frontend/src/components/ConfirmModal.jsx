// ConfirmModal — reusable confirmation dialog (FE-MANAGER-1).
//
// A controlled modal: the parent owns `open` and the confirm/cancel handlers.
// Used by the manager employee file to confirm a (destructive) deactivate, but
// kept generic so any flow can reuse it.
//
// Accessibility:
//   - role="dialog" + aria-modal, labelled by the title and described by the
//     message.
//   - Esc cancels; clicking the backdrop (outside the panel) cancels.
//   - Focus moves to the panel on open so keyboard users land inside the dialog.
//
// Props:
//   open          bool — whether the modal is rendered.
//   title         string — dialog heading.
//   message       string — body text.
//   confirmLabel  string — confirm button label (default "Confirmar").
//   cancelLabel   string — cancel button label (default "Cancelar").
//   onConfirm()   called when the confirm button is pressed.
//   onCancel()    called on Esc, backdrop click, or the cancel button.
//   danger        bool — applies destructive styling to the confirm button.
//   busy          bool — disables actions while the parent's action is in flight.

import { useEffect, useRef } from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  danger = false,
  busy = false,
}) {
  const panelRef = useRef(null);

  // Esc closes the dialog while it is open.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) {
        e.stopPropagation();
        if (typeof onCancel === 'function') onCancel();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onCancel]);

  // Move focus into the dialog when it opens.
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const handleBackdrop = () => {
    if (!busy && typeof onCancel === 'function') onCancel();
  };

  return (
    <div className="confirm-modal__backdrop" onClick={handleBackdrop}>
      <div
        className="confirm-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        tabIndex={-1}
        ref={panelRef}
        // Stop clicks inside the panel from bubbling to the backdrop.
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="confirm-modal__title">
          {title}
        </h2>
        <p id="confirm-modal-message" className="confirm-modal__message">
          {message}
        </p>

        <div className="confirm-modal__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              danger
                ? 'btn-primary confirm-modal__confirm--danger'
                : 'btn-primary'
            }
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Processando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
