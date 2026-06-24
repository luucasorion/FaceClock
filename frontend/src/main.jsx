import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App.jsx';
import theme from './theme.js';
// Imported AFTER CssBaseline so the existing layout tokens/classes
// (.app-shell / .thumb-zone / CSS vars) still apply until FE-SHARED-9 / FE-UI migrate them.
import './styles/base.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
