// FE-SHARED-8: MUI theme — single source of truth for the FaceClock brand,
// mirroring the tokens in src/styles/base.css so MUI components match the
// existing hand-rolled UI during the (later) screen migration.
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // --color-primary
      dark: '#1d4ed8', // --color-primary-active
      contrastText: '#ffffff', // --color-primary-text
    },
    background: {
      default: '#f4f5f7', // --color-bg
      paper: '#ffffff', // --color-surface
    },
    text: {
      primary: '#1a1d21', // --color-text
      secondary: '#5b6471', // --color-text-muted
    },
    divider: '#d8dce2', // --color-border
  },
  shape: {
    borderRadius: 12, // --radius
  },
  typography: {
    // Matches --font-stack in base.css.
    fontFamily:
      "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
});

export default theme;
