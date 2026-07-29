import { Link } from 'react-router-dom';
import { Container, Stack, Button, Typography, Box } from '@mui/material';
import BrandMark from '../components/BrandMark.jsx';
import { valtech } from '../theme.js';

// FE-MENU-1: single app entry point. Four large, stacked entry points,
// mobile-first with primary actions within thumb reach (NFR01).
// FE-REBRAND-6 (#22): Valtech restyle — brand lockup + tiered button hierarchy
// (primary black / secondary black-outline / two stone-outline). Flow unchanged.
const ENTRY_POINTS = [
  { to: '/kiosk', label: 'Bater ponto (totem)', tier: 'primary' },
  { to: '/login', label: 'Entrar', tier: 'secondary' },
  { to: '/registro/colaborador', label: 'Cadastrar colaborador', tier: 'stone' },
  { to: '/registro/empresa', label: 'Cadastrar empresa', tier: 'stone' },
];

// A "stone" tertiary button: white fill, subtle stone hairline (not the bolder
// black outline of the secondary), inverting to black on hover.
const stoneSx = {
  borderColor: valtech.stone,
  color: valtech.black,
  '&:hover': { borderColor: valtech.black, bgcolor: valtech.black, color: valtech.white },
};

export default function MenuPage() {
  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', py: 3 }}
    >
      <Box
        component="header"
        sx={{
          textAlign: 'center',
          mt: 6,
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <BrandMark markSize={60} wordSize={34} gap={14} strokeWidth={2} />
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
        {ENTRY_POINTS.map(({ to, label, tier }) => (
          <Button
            key={to}
            component={Link}
            to={to}
            variant={tier === 'primary' ? 'contained' : 'outlined'}
            size="large"
            fullWidth
            sx={tier === 'stone' ? stoneSx : undefined}
          >
            {label}
          </Button>
        ))}
      </Stack>
    </Container>
  );
}
