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
  // FE-REBRAND-2 (#18): override MUI component defaults so the stock look
  // (blue, rounded, elevated) never shows through. Presentation only — no
  // behavioural changes.
  components: {
    // Motion tokens per the handoff (150–240ms, cubic-bezier(.2,0,0,1)).
    MuiCssBaseline: {
      styleOverrides: {
        ':focus-visible': { outlineColor: valtech.black },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: false },
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 600,
          textTransform: 'none',
          padding: '14px 22px',
          minHeight: 48,
          boxShadow: 'none',
          transition: 'background 180ms cubic-bezier(0.2,0,0,1), color 180ms cubic-bezier(0.2,0,0,1), border-color 180ms cubic-bezier(0.2,0,0,1)',
          '&:active': { transform: 'scale(0.98)' },
        },
        // Primary — solid black, inverts to signal-red on hover.
        contained: {
          backgroundColor: valtech.black,
          color: valtech.white,
          boxShadow: 'none',
          '&:hover': { backgroundColor: valtech.signalRed, boxShadow: 'none' },
        },
        // Secondary — white fill, 1px black border, inverts to black on hover.
        outlined: {
          backgroundColor: valtech.white,
          color: valtech.black,
          borderColor: valtech.black,
          '&:hover': {
            backgroundColor: valtech.black,
            color: valtech.white,
            borderColor: valtech.black,
          },
        },
        // Tertiary — underlined text link, signal-red on hover.
        text: {
          color: valtech.black,
          textDecoration: 'underline',
          textUnderlineOffset: '3px',
          '&:hover': {
            backgroundColor: 'transparent',
            color: valtech.signalRed,
            textDecorationThickness: '2px',
          },
        },
      },
    },
    // Flat surfaces: hairline border, no elevation/shadow, sharp corners.
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none', boxShadow: 'none' },
        outlined: { borderColor: valtech.stone },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined', elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `1px solid ${valtech.stone}`,
          boxShadow: 'none',
          backgroundColor: valtech.white,
        },
      },
    },
    // Text inputs: 2px radius, stone hairline, black focus (never blue).
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          backgroundColor: valtech.white,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: valtech.stone },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: valtech.graphite },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: valtech.black,
            borderWidth: 1,
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: valtech.signalRed },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { '&.Mui-focused': { color: valtech.black } },
      },
    },
    // Chips: square (radius 0), Sons, tight padding.
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontFamily: fontBody,
          fontWeight: 600,
          fontSize: 12,
          height: 'auto',
          padding: '3px 3px',
        },
        label: { padding: '0 9px' },
        outlined: { borderColor: valtech.stone },
      },
    },
    // Alerts: flat, square, no coloured fills bleeding through.
    MuiAlert: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { borderRadius: 0 },
        standardError: { color: valtech.black },
        outlinedError: { borderColor: valtech.signalRed, color: valtech.black },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 0, border: `1px solid ${valtech.stone}`, boxShadow: 'none' },
      },
    },
    MuiLink: {
      defaultProps: { underline: 'always' },
      styleOverrides: {
        root: {
          color: valtech.black,
          textUnderlineOffset: '3px',
          '&:hover': { color: valtech.signalRed },
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: valtech.innerDivider } },
    },
  },
});

export default theme;
