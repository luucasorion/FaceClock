import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Placeholder pages for FE-SHARED-1. Real screens land in their own tasks.
function Placeholder({ name }) {
  return <h1>{name}</h1>;
}

const MenuPage = () => <Placeholder name="MenuPage" />;
const LoginPage = () => <Placeholder name="LoginPage" />;
const RegistroColaboradorPage = () => <Placeholder name="RegistroColaboradorPage" />;
const RegistroEmpresaPage = () => <Placeholder name="RegistroEmpresaPage" />;
const EnrollPage = () => <Placeholder name="EnrollPage" />;
const KioskPage = () => <Placeholder name="KioskPage" />;
const PunchHomePage = () => <Placeholder name="PunchHomePage" />;
const ProfilePage = () => <Placeholder name="ProfilePage" />;
const ManagerEmployeesPage = () => <Placeholder name="ManagerEmployeesPage" />;
const EmployeeFilePage = () => <Placeholder name="EmployeeFilePage" />;
const ManagerReportPage = () => <Placeholder name="ManagerReportPage" />;
const NotFound = () => <Placeholder name="NotFound" />;

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro/colaborador" element={<RegistroColaboradorPage />} />
          <Route path="/registro/empresa" element={<RegistroEmpresaPage />} />
          <Route path="/enroll" element={<EnrollPage />} />
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="/home" element={<PunchHomePage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/gerente/colaboradores" element={<ManagerEmployeesPage />} />
          <Route path="/gerente/colaboradores/:cpf" element={<EmployeeFilePage />} />
          <Route path="/gerente/relatorio" element={<ManagerReportPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
