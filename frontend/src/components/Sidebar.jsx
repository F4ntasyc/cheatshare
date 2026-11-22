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

// Login wajib: shell hanya dirender saat user sudah dimuat.
export default function Sidebar({ area, user, setCourse, go, logout }) {
  return (
    <aside className="shell-sidebar" aria-label="Navigasi utama">
      <div className="shell-brand">
        <img src="/logo.png" alt="" width="192" height="109" />
        <span>CheatShare</span>
      </div>
      <nav className="shell-nav">
        <NavItem
          active={area === 'courses'}
          icon={<HomeIcon size={24} />}
          label="Mata Kuliah"
          onClick={() => {
            setCourse('');
            go('home');
          }}
        />
        <NavItem
          active={area === 'profile'}
          icon={<UserIcon size={24} />}
          label="Profil Saya"
          onClick={() => go('profile')}
        />
        {user.role === 'admin' && (
          <NavItem
            active={area === 'admin'}
            icon={<SettingsIcon size={24} />}
            label="Admin"
            onClick={() => go('admin')}
          />
        )}
      </nav>
      <div className="shell-bottom">
        <NavItem
          icon={<LogoutIcon size={24} />}
          label="Keluar"
          onClick={logout}
        />
      </div>
    </aside>
  );
}
