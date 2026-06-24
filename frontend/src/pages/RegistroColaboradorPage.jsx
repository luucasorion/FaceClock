// FE-AUTH-2 — Employee registration screen (route /registro/colaborador).
//
// Collects cpf, nome, login, senha, empresa_id (typed in — companies are NOT
// listed/suggested). Submits to api/colaborador.registrar, which auto-logs-in
// (returns { access_token, token_type, colaborador }). On success we store the
// session and route to /enroll, because punching requires a stored embedding
// and the enroll page then routes onward to /home.
//
// FE-UI-1: migrated to MUI (Card/TextField/Button/Alert/Stack). The fields,
// `facial: []` payload, no-`gerente` rule, endpoint, and the
// registrar→setSession→/enroll flow are all unchanged — presentation only.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import * as colaboradorApi from '../api/colaborador.js';
import { ApiError } from '../api/client.js';

export default function RegistroColaboradorPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    cpf: '',
    nome: '',
    login: '',
    senha: '',
    empresa_id: '',
  });
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
      const res = await colaboradorApi.registrar({
        cpf: form.cpf,
        nome: form.nome,
        login: form.login,
        senha: form.senha,
        empresa_id: form.empresa_id,
        // RegistroColaboradorRequest.facial is still required by the backend,
        // so send an empty list; embeddings are enrolled separately at /enroll.
        // This clears once BIO-1 removes the in-body `facial` field.
        facial: [],
        // No `gerente` field — the backend removed it from the request and
        // forces false, so we never send it.
      });
      setSession(res.access_token, res.colaborador);
      // Biometric enrollment is required before punching; /enroll then routes
      // to /home once the face is enrolled.
      navigate('/enroll');
    } catch (err) {
      // Company-not-found: RECOG-2 is NOT done yet, so a bad empresa_id may
      // fail at the DB/FK level with an unclear error — surface whatever the
      // ApiError carries for now. A clean "company not found/inactive" message
      // lands with RECOG-2.
      if (err instanceof ApiError) {
        setError(err.message || 'Não foi possível concluir o cadastro.');
      } else {
        setError('Não foi possível concluir o cadastro. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="main" sx={{ width: '100%', mt: 2 }}>
      <Box component="header" sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Cadastrar colaborador
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Crie sua conta para bater ponto
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                id="cpf"
                name="cpf"
                label="CPF"
                type="text"
                inputProps={{ inputMode: 'numeric' }}
                autoComplete="off"
                value={form.cpf}
                onChange={onChange}
                required
                fullWidth
              />

              <TextField
                id="nome"
                name="nome"
                label="Nome"
                type="text"
                autoComplete="name"
                value={form.nome}
                onChange={onChange}
                required
                fullWidth
              />

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
                autoComplete="new-password"
                value={form.senha}
                onChange={onChange}
                required
                fullWidth
              />

              <TextField
                id="empresa_id"
                name="empresa_id"
                label="Identificador da empresa (CNPJ)"
                type="text"
                autoComplete="off"
                value={form.empresa_id}
                onChange={onChange}
                required
                fullWidth
                helperText="Informe o CNPJ da empresa cadastrada."
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
              >
                {submitting ? 'Cadastrando…' : 'Cadastrar'}
              </Button>

              <Button component={Link} to="/login" variant="text" fullWidth>
                Já tenho conta
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
