import { Link } from 'react-router-dom';
import { Container, Stack, Button, Typography, Box } from '@mui/material';

// FE-MENU-1: single app entry point. Four large, stacked entry points,
// mobile-first with primary actions within thumb reach (NFR01).
// FE-SHARED-8: migrated to MUI components to prove the ThemeProvider is wired.
const ENTRY_POINTS = [
  { to: '/kiosk', label: 'Bater ponto (totem)' },
  { to: '/login', label: 'Entrar' },
  { to: '/registro/colaborador', label: 'Cadastrar colaborador' },
  { to: '/registro/empresa', label: 'Cadastrar empresa' },
];

export default function MenuPage() {
  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', py: 3 }}
    >
      <Box component="header" sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          FaceClock
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Controle de ponto por reconhecimento facial
        </Typography>
      </Box>

      <Stack
        component="nav"
        aria-label="Ações principais"
        spacing={2}
        sx={{ mt: 'auto' }}
      >
        {ENTRY_POINTS.map(({ to, label }) => (
          <Button
            key={to}
            component={Link}
            to={to}
            variant="contained"
            size="large"
            fullWidth
          >
            {label}
          </Button>
        ))}
      </Stack>
    </Container>
  );
}
