export default function Sidebar({ page, user, setCourse, go, logout }) {
  return (
    <aside>
      <div className="brand">🎓 CheatShare</div>
      <button
        className={page === 'home' ? 'active' : ''}
        onClick={() => {
          setCourse('');
          go('home');
        }}
      >
        ⌂ Beranda
      </button>
      <button onClick={() => (user ? go('profile') : go('auth'))}>
        ♙ Profil Saya
      </button>
      {user?.role === 'admin' && (
        <button onClick={() => go('admin')}>⚙ Kelola Mata Kuliah</button>
      )}
      <div className="sidebar-bottom">
        {user ? (
          <>
            <small>
              {user.name} · {user.role}
            </small>
            <button onClick={logout}>Keluar</button>
          </>
        ) : (
          <button onClick={() => go('auth')}>Masuk / Daftar</button>
        )}
      </div>
    </aside>
  );
}
