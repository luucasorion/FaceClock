// FE-AUTH-1 — Login screen (route /login).
//
// Form: `login` + `senha` → api/auth.login → setSession → navigate('/home').
// Invalid credentials (401/403) surface as a clear inline message; no token
// is stored on failure (setSession only runs on success).
//
// FE-UI-1: migrated to MUI (Card/TextField/Button/Alert/Stack). The flow,
// endpoint, navigation target, and the location.state.message notice are all
// unchanged — presentation only.

import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../auth/AuthContext.jsx';
import * as authApi from '../api/auth.js';
import { ApiError } from '../api/client.js';

export default function LoginPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // A redirect (e.g. after a self-service login change) may pass an info message
  // to surface above the form, prompting the user to sign in again.
  const notice = location.state?.message;

  const [form, setForm] = useState({ login: '', senha: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await authApi.login({ login: form.login, senha: form.senha });
      // Only persist the session on success — a failed login throws before here,
      // so no token is ever stored on failure.
      setSession(res.access_token, res.colaborador);
      // NOTE: AUTHZ-1 is done (token/colaborador carry `gerente`), but the
      // manager screens aren't built yet, so route EVERYONE to /home for now.
      // Managers currently also land on /home; the punch home will surface
      // manager entry points once those screens exist.
      navigate('/home');
    } catch (err) {
      if (err instanceof ApiError) {
        // Bad credentials come back as 401/403 — show the backend message,
        // falling back to friendly copy.
        setError(
          err.status === 401 || err.status === 403
            ? err.message || 'Login ou senha inválidos.'
            : err.message || 'Não foi possível entrar. Tente novamente.',
        );
      } else {
        setError('Não foi possível entrar. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="main" sx={{ width: '100%', mt: 2 }}>
      <Box component="header" sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Entrar
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Acesse sua conta FaceClock
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              {notice && (
                <Alert severity="info" role="status">
                  {notice}
                </Alert>
              )}

              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                id="login"
                name="login"
                label="Login"
                type="text"
                autoComplete="username"
                value={form.login}
                onChange={onChange}
                required
                fullWidth
              />

              <TextField
                id="senha"
                name="senha"
                label="Senha"
                type="password"
                autoComplete="current-password"
                value={form.senha}
                onChange={onChange}
                required
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
              >
                {submitting ? 'Entrando…' : 'Entrar'}
              </Button>

              <Button
                component={Link}
                to="/registro/colaborador"
                variant="text"
                fullWidth
              >
                Criar conta de colaborador
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
