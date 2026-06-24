import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import { RequireAuth, RequireManager } from './auth/guards.jsx';
import AppLayout from './components/AppLayout.jsx';
import MenuPage from './pages/MenuPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegistroColaboradorPage from './pages/RegistroColaboradorPage.jsx';
import RegistroEmpresaPage from './pages/RegistroEmpresaPage.jsx';
import KioskPage from './pages/KioskPage.jsx';
import PunchHomePage from './pages/PunchHomePage.jsx';
import EnrollPage from './pages/EnrollPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ManagerEmployeesPage from './pages/ManagerEmployeesPage.jsx';
import EmployeeFilePage from './pages/EmployeeFilePage.jsx';
import ManagerReportPage from './pages/ManagerReportPage.jsx';

// Placeholder pages for FE-SHARED-1. Real screens land in their own tasks.
function Placeholder({ name }) {
  return <h1>{name}</h1>;
}

const NotFound = () => <Placeholder name="NotFound" />;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Kiosk is a public full-bleed totem — rendered OUTSIDE AppLayout
              so it has NO app bar / content column (FE-PUNCH-4 redesigns it). */}
          <Route path="/kiosk" element={<KioskPage />} />

          {/* Everything else lives inside the responsive AppLayout shell
              (AppBar + width-adaptive Container). FE-SHARED-9. Guards still
              wrap the protected branches, composed inside the layout. */}
          <Route element={<AppLayout />}>
            {/* Public routes */}
            <Route path="/" element={<MenuPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro/colaborador" element={<RegistroColaboradorPage />} />
            <Route path="/registro/empresa" element={<RegistroEmpresaPage />} />

            {/* Authenticated routes (any logged-in collaborator) */}
            <Route element={<RequireAuth />}>
              <Route path="/enroll" element={<EnrollPage />} />
              <Route path="/home" element={<PunchHomePage />} />
              <Route path="/perfil" element={<ProfilePage />} />
            </Route>

            {/* Manager-only routes (gated on the AUTHZ-1 `gerente` claim) */}
            <Route element={<RequireManager />}>
              <Route path="/gerente/colaboradores" element={<ManagerEmployeesPage />} />
              <Route path="/gerente/colaboradores/:cpf" element={<EmployeeFilePage />} />
              <Route path="/gerente/relatorio" element={<ManagerReportPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
