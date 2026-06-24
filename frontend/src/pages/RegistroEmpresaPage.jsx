// FE-AUTH-3 — Company registration screen (route /registro/empresa).
//
// Public endpoint (no auth). Form: cnpj, razao_social, endereco, limite_hora
// (number). Submits to api/empresa.cadastrar. On success we show a confirmation
// that includes the cnpj (the value the user types as `empresa_id` when
// registering employees) plus links back to the menu and to employee
// registration.
//
// FE-UI-1: migrated to MUI (Card/TextField/Button/Alert/Stack). The fields
// (limite_hora still numeric/coerced via Number), the empresa.cadastrar
// endpoint, and the confirmation panel (showing the cnpj + the two links) are
// all unchanged — presentation only.

import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import * as empresaApi from '../api/empresa.js';
import { ApiError } from '../api/client.js';

export default function RegistroEmpresaPage() {
  const [form, setForm] = useState({
    cnpj: '',
    razao_social: '',
    endereco: '',
    limite_hora: '',
  });
  const [created, setCreated] = useState(null); // EmpresaResponse on success
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
      const res = await empresaApi.cadastrar({
        cnpj: form.cnpj,
        razao_social: form.razao_social,
        endereco: form.endereco,
        // limite_hora is a number field — coerce the text input to Number.
        limite_hora: Number(form.limite_hora),
      });
      setCreated(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Não foi possível cadastrar a empresa.');
      } else {
        setError('Não foi possível cadastrar a empresa. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmation view — surfaces the cnpj so the user knows the value to use
  // as `empresa_id` when registering employees.
  if (created) {
    const cnpj = created.cnpj ?? form.cnpj;
    return (
      <Box component="main" sx={{ width: '100%', mt: 2 }}>
        <Box component="header" sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Empresa cadastrada
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Alert severity="success" role="status">
                <Typography sx={{ mt: 0 }}>
                  Empresa cadastrada com sucesso.
                </Typography>
                <Typography sx={{ mb: 0 }}>
                  Use o CNPJ <strong>{cnpj}</strong> como identificador da
                  empresa ao cadastrar colaboradores.
                </Typography>
              </Alert>

              <Button
                component={Link}
                to="/registro/colaborador"
                variant="contained"
                size="large"
                fullWidth
              >
                Cadastrar colaborador
              </Button>
              <Button component={Link} to="/" variant="text" fullWidth>
                Voltar ao menu
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ width: '100%', mt: 2 }}>
      <Box component="header" sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Cadastrar empresa
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Cadastre a empresa antes dos colaboradores
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                id="cnpj"
                name="cnpj"
                label="CNPJ"
                type="text"
                inputProps={{ inputMode: 'numeric' }}
                autoComplete="off"
                value={form.cnpj}
                onChange={onChange}
                required
                fullWidth
              />

              <TextField
                id="razao_social"
                name="razao_social"
                label="Razão social"
                type="text"
                autoComplete="organization"
                value={form.razao_social}
                onChange={onChange}
                required
                fullWidth
              />

              <TextField
                id="endereco"
                name="endereco"
                label="Endereço"
                type="text"
                autoComplete="street-address"
                value={form.endereco}
                onChange={onChange}
                required
                fullWidth
              />

              <TextField
                id="limite_hora"
                name="limite_hora"
                label="Limite de horas"
                type="number"
                inputProps={{ inputMode: 'numeric', min: 0 }}
                value={form.limite_hora}
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
                {submitting ? 'Cadastrando…' : 'Cadastrar empresa'}
              </Button>

              <Button component={Link} to="/" variant="text" fullWidth>
                Voltar ao menu
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
