// ConfirmModal — reusable confirmation dialog (FE-MANAGER-1).
//
// A controlled modal: the parent owns `open` and the confirm/cancel handlers.
// Used by the manager employee file to confirm a (destructive) deactivate, but
// kept generic so any flow can reuse it.
//
// FE-UI-2: restyled on MUI (`Dialog`/`DialogTitle`/`DialogContent`/
// `DialogActions`). The PROP API IS UNCHANGED so existing callers
// (EmployeeFilePage) keep working without edits: same
// open/title/message/confirmLabel/cancelLabel/onConfirm/onCancel/danger/busy.
// MUI's Dialog already provides the accessibility (role="dialog", aria-modal,
// focus trap), Esc-to-close, and backdrop-click-to-close that the hand-rolled
// version implemented manually; `onCancel` is wired through `onClose` and the
// cancel button, and is suppressed while `busy`.
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

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

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
  // MUI calls onClose for both backdrop click and Esc. Suppress while busy so an
  // in-flight action can't be interrupted (mirrors the old behavior).
  const handleClose = () => {
    if (!busy && typeof onCancel === 'function') onCancel();
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={handleClose}
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="confirm-modal-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-modal-message">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={danger ? 'error' : 'primary'}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Processando…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
