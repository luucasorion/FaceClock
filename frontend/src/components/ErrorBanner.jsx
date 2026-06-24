// FE-SHARED-7 — ErrorBanner: an error message with an optional Retry action.
//
// FE-UI-1: migrated to MUI Alert (severity="error"). The prop API is unchanged
// so every caller (punch home, profile, manager pages) keeps working as-is. When
// onRetry is supplied, the Alert renders an inline Retry action button.
//
// Props:
//   message    — the error text (required for meaningful output).
//   onRetry    — optional handler; renders a Retry button when present.
//   retryLabel — Retry button text (default "Tentar novamente").

import { Alert, Button } from '@mui/material';

export default function ErrorBanner({ message, onRetry, retryLabel = 'Tentar novamente' }) {
  if (!message) return null;
  return (
    <Alert
      severity="error"
      sx={{ mb: 2 }}
      action={
        typeof onRetry === 'function' ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  );
}
