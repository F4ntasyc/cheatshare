import { SearchIcon } from './icons.jsx';
import '../styles/shell.css';

function initialOf(name) {
  const first = Array.from(String(name ?? '').trim())[0];
  return first ? first.toUpperCase() : '?';
}

export default function Header({ user, search, setSearch, go }) {
  return (
    <header className="shell-topbar">
      <div className="shell-mobilebrand">
        <img src="/logo.png" alt="" width="192" height="109" />
        <span>CheatShare</span>
      </div>
      <div className="shell-search">
        <SearchIcon size={20} className="shell-search-icon" />
        <input
          aria-label="Cari cheatsheet"
          placeholder="Cari cheatsheet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="shell-avatar"
        aria-label="Profil saya"
        title={user?.name}
        onClick={() => go('profile')}
      >
        {initialOf(user?.name)}
      </button>
    </header>
  );
}
