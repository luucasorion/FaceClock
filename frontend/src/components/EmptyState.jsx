// FE-SHARED-7 — EmptyState: icon + message for an empty list/result.
//
// FE-UI-1: restyled on MUI (Box + Typography) for visual consistency with the
// themed screens. The prop API is unchanged so callers keep passing the same
// icon/message/children.
//
// Props:
//   icon     — small visual marker (emoji/text node); default a neutral glyph.
//   message  — the empty message (required for meaningful output).
//   children — optional extra content (e.g. a call-to-action) below the message.

import { Box, Typography } from '@mui/material';

export default function EmptyState({ icon = '📭', message, children }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1,
        py: 3,
        px: 2,
        color: 'text.secondary',
      }}
    >
      {icon && (
        <Box component="span" aria-hidden="true" sx={{ fontSize: '2rem', lineHeight: 1 }}>
          {icon}
        </Box>
      )}
      {message && (
        <Typography variant="body1" sx={{ m: 0 }}>
          {message}
        </Typography>
      )}
      {children}
    </Box>
  );
}
