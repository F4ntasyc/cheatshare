import { HomeIcon, LogoutIcon, SettingsIcon, UserIcon } from './icons.jsx';
import '../styles/shell.css';

function NavItem({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      className={'shell-nav-item' + (active ? ' active' : '')}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function Sidebar({ page, user, setCourse, go, logout }) {
  return (
    <aside className="shell-sidebar" aria-label="Navigasi utama">
      <div className="shell-brand">
        <img src="/logo.png" alt="" width="192" height="109" />
        <span>CheatShare</span>
      </div>
      <nav className="shell-nav">
        <NavItem
          active={page === 'home'}
          icon={<HomeIcon size={24} />}
          label="Mata Kuliah"
          onClick={() => {
            setCourse('');
            go('home');
          }}
        />
        <NavItem
          active={page === 'profile'}
          icon={<UserIcon size={24} />}
          label="Profil Saya"
          onClick={() => (user ? go('profile') : go('auth'))}
        />
        {user?.role === 'admin' && (
          <NavItem
            active={page === 'admin'}
            icon={<SettingsIcon size={24} />}
            label="Admin"
            onClick={() => go('admin')}
          />
        )}
      </nav>
      <div className="shell-bottom">
        {user ? (
          <NavItem
            icon={<LogoutIcon size={24} />}
            label="Keluar"
            onClick={logout}
          />
        ) : (
          <NavItem
            icon={<UserIcon size={24} />}
            label="Masuk / Daftar"
            onClick={() => go('auth')}
          />
        )}
      </div>
    </aside>
  );
}
