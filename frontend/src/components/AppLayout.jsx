// FE-SHARED-9 — Responsive desktop + mobile app shell.
//
// Replaces the old fixed `.app-shell { max-width: 480px }` lock (base.css) with
// an MUI layout: a responsive AppBar (brand + context-aware actions) and a
// content Container whose maxWidth adapts to the screen kind:
//   - "narrow" (sm) for collaborator / auth / punch screens — a comfortable
//     centered reading column on desktop, full-bleed mobile.
//   - "wide" (lg) for manager screens (employees list, report) so the tables
//     have room.
//
// Width is route-derived by default (`/gerente/*` → wide) with an explicit
// `width` prop override. Rendered as a react-router v6 layout route: pages are
// painted via <Outlet/>.
//
// Manager nav entry points (Funcionários, Relatório) are gated on `gerente` and
// complete FE-AUTH-1's deferred "surface manager entry points" note. On mobile
// the whole nav collapses into a hamburger Menu so it stays one-handed (NFR01).
//
// Note: the kiosk (/kiosk) is a public full-bleed totem and is rendered OUTSIDE
// this layout (see App.jsx) — it has no AppBar.

import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import GroupsIcon from '@mui/icons-material/Groups';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAuth } from '../auth/AuthContext.jsx';

const MAX_WIDTH = { narrow: 'sm', wide: 'lg' };

export default function AppLayout({ width }) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, gerente, logout } = useAuth();

  // Mobile = below the `sm` breakpoint → collapse nav into a hamburger Menu.
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [menuAnchor, setMenuAnchor] = useState(null);
  const closeMenu = () => setMenuAnchor(null);

  // Route-derived width with explicit prop override.
  const resolvedWidth =
    width ?? (location.pathname.startsWith('/gerente') ? 'wide' : 'narrow');
  const maxWidth = MAX_WIDTH[resolvedWidth] ?? 'sm';

  // Brand links to the punch home when authed, else the public menu.
  const brandTo = isAuthenticated ? '/home' : '/';

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/login');
  };

  const go = (to) => {
    closeMenu();
    navigate(to);
  };

  // Nav entries surfaced to the current session, in display order.
  const managerEntries = [
    { to: '/gerente/colaboradores', label: 'Funcionários', icon: <GroupsIcon fontSize="small" /> },
    { to: '/gerente/relatorio', label: 'Relatório', icon: <AssessmentIcon fontSize="small" /> },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to={brandTo}
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            FaceClock
          </Typography>

          {isAuthenticated && (
            <>
              {isMobile ? (
                <>
                  <IconButton
                    color="inherit"
                    edge="end"
                    aria-label="Abrir menu de navegação"
                    aria-haspopup="true"
                    aria-controls={menuAnchor ? 'app-nav-menu' : undefined}
                    aria-expanded={menuAnchor ? 'true' : undefined}
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Menu
                    id="app-nav-menu"
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={closeMenu}
                    keepMounted
                  >
                    {gerente &&
                      managerEntries.map((e) => (
                        <MenuItem key={e.to} onClick={() => go(e.to)}>
                          <Box component="span" sx={{ mr: 1, display: 'inline-flex' }}>
                            {e.icon}
                          </Box>
                          {e.label}
                        </MenuItem>
                      ))}
                    {gerente && <Divider />}
                    <MenuItem onClick={() => go('/perfil')}>
                      <Box component="span" sx={{ mr: 1, display: 'inline-flex' }}>
                        <PersonOutlineIcon fontSize="small" />
                      </Box>
                      Perfil
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <Box component="span" sx={{ mr: 1, display: 'inline-flex' }}>
                        <LogoutIcon fontSize="small" />
                      </Box>
                      Sair
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {gerente &&
                    managerEntries.map((e) => (
                      <Button
                        key={e.to}
                        color="inherit"
                        component={Link}
                        to={e.to}
                        startIcon={e.icon}
                      >
                        {e.label}
                      </Button>
                    ))}
                  <Button
                    color="inherit"
                    component={Link}
                    to="/perfil"
                    startIcon={<PersonOutlineIcon />}
                  >
                    Perfil
                  </Button>
                  <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
                    Sair
                  </Button>
                </Box>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        maxWidth={maxWidth}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          py: 2,
          // Keep thumb-zone content clear of the home indicator on mobile.
          pb: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Outlet />
      </Container>
    </Box>
  );
}
