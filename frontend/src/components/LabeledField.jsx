// FE-REBRAND-6 (#22): a text field with a Valtech "eyebrow" label above it
// (Sons 11px uppercase) instead of MUI's floating label — matching the design
// prototype's field pattern. Forwards every other prop straight to MUI
// TextField, so validation/type/autoComplete/helperText behave identically.
//
// Reused across the auth/registration, profile and report screens.

import { Box, TextField, Typography } from '@mui/material';
import { valtech } from '../theme.js';

export default function LabeledField({ label, id, required = false, inputProps, sx, ...rest }) {
  return (
    <Box sx={sx}>
      {label ? (
        <Typography
          component="label"
          htmlFor={id}
          variant="overline"
          sx={{ display: 'block', mb: 0.75, lineHeight: 1.2 }}
        >
          {label}
          {required ? <Box component="span" sx={{ color: valtech.signalRed }}> *</Box> : null}
        </Typography>
      ) : null}
      <TextField
        id={id}
        required={required}
        fullWidth
        inputProps={{ 'aria-label': label, ...inputProps }}
        {...rest}
      />
    </Box>
  );
}
