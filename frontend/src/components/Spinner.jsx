// FE-SHARED-7 — Spinner: a small, accessible loading indicator.
//
// FE-UI-1: migrated to MUI CircularProgress. The prop API is unchanged so every
// caller (punch home, profile, manager pages) keeps working without edits.
//
// Renders a spinner plus an optional label, exposing role="status" so screen
// readers announce the loading state.
//
// Props:
//   label — visible text under the spinner (default "Carregando…").

import { Box, CircularProgress, Typography } from '@mui/material';

export default function Spinner({ label = 'Carregando…' }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        py: 3,
        color: 'text.secondary',
      }}
    >
      <CircularProgress size={28} aria-hidden="true" />
      {label && (
        <Typography variant="body2" sx={{ m: 0 }}>
          {label}
        </Typography>
      )}
    </Box>
  );
}
