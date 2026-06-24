import { Link } from 'react-router-dom';
import './MenuPage.css';

// FE-MENU-1: single app entry point. Four large, stacked entry points,
// mobile-first with primary actions within thumb reach (NFR01).
const ENTRY_POINTS = [
  { to: '/kiosk', label: 'Bater ponto (totem)' },
  { to: '/login', label: 'Entrar' },
  { to: '/registro/colaborador', label: 'Cadastrar colaborador' },
  { to: '/registro/empresa', label: 'Cadastrar empresa' },
];

export default function MenuPage() {
  return (
    <main className="menu-page">
      <header className="menu-header">
        <h1 className="menu-title">FaceClock</h1>
        <p className="menu-subtitle">Controle de ponto por reconhecimento facial</p>
      </header>

      <nav className="menu-actions" aria-label="Ações principais">
        {ENTRY_POINTS.map(({ to, label }) => (
          <Link key={to} to={to} className="btn-primary menu-action">
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
