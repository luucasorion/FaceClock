// FE-SHARED-7 — Toast: a transient, self-dismissing notification.
//
// A fixed banner anchored above the thumb zone. Auto-dismisses after `duration`
// ms (calling onClose), or stays until dismissed if duration <= 0. role="status"
// for polite announcement.
//
// Props:
//   message  — text to show (no render when empty).
//   kind     — 'info' | 'success' | 'error' (visual variant; default 'info').
//   duration — ms before auto-dismiss (default 3000; <=0 disables auto-dismiss).
//   onClose  — called when the auto-dismiss timer fires.

import { useEffect } from 'react';
import './ui.css';

export default function Toast({ message, kind = 'info', duration = 3000, onClose }) {
  useEffect(() => {
    if (!message || duration <= 0) return undefined;
    const t = setTimeout(() => {
      if (typeof onClose === 'function') onClose();
    }, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;
  return (
    <div className={`ui-toast ui-toast--${kind}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
