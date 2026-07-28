// FE-REBRAND-1 (#17): MUI theme — single source of truth for the Valtech
// Design System, mirroring the tokens in src/styles/base.css. Only palette,
// shape and typography live here; MUI component default overrides
// (buttons/cards/inputs/chips) land in FE-REBRAND-2 (#18).
import { createTheme } from '@mui/material/styles';

// Raw Valtech palette (kept in one place; mirrors base.css --val-* tokens).
export const valtech = {
  black: '#000000',
  white: '#ffffff',
  bone: '#f3f2ef',
  stone: '#d1d3ca',
  graphite: '#4c4c49',
  signalRed: '#ff5959',
  teal: '#36a7a0',
  lime: '#b3ff60',
  orange: '#ff9e46',
  mutedOnDark: '#cfd1c8',
  subtle: '#7a7a78',
  innerDivider: '#eae9e5',
  spectrum:
    'linear-gradient(90deg,#002fa7 0%,#0554a8 15%,#36a7a0 32%,#b2ff60 50%,#def25f 62%,#ff9e46 78%,#ff5959 90%,#d84265 100%)',
};

const fontDisplay = "'Valtech Neue', 'Helvetica Neue', Arial, sans-serif";
const fontBody = "'Sons', 'Helvetica Neue', Arial, sans-serif";

// Headings share the display face at Valtech's light weight.
const heading = (fontSize) => ({
  fontFamily: fontDisplay,
  fontWeight: 300,
  letterSpacing: '-0.015em',
  lineHeight: 1.05,
  fontSize,
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: valtech.black, // solid black primary buttons / ink
      dark: valtech.signalRed, // hover/press inverts to signal-red
      contrastText: valtech.white,
    },
    error: {
      main: valtech.signalRed,
      contrastText: valtech.white,
    },
    background: {
      default: valtech.bone,
      paper: valtech.white,
    },
    text: {
      primary: valtech.black,
      secondary: valtech.graphite,
    },
    divider: valtech.stone,
  },
  shape: {
    borderRadius: 0, // sharp corners; inputs/pills opt in via component overrides
  },
  typography: {
    fontFamily: fontBody,
    fontSize: 14,
    h1: heading('clamp(24px, 6vw, 34px)'),
    h2: heading('19px'),
    h3: heading('18px'),
    h4: heading('16px'),
    h5: heading('15px'),
    h6: heading('14px'),
    button: {
      fontFamily: fontBody,
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: 0,
    },
    // Eyebrow / label — Sons 11px uppercase.
    overline: {
      fontFamily: fontBody,
      fontSize: 11,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: valtech.graphite,
      lineHeight: 1.4,
    },
  },
});

export default theme;
