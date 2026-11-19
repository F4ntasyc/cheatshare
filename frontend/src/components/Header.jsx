export default function Header({ user, search, setSearch }) {
  return (
    <header>
      <span className="mobilebrand">🎓 CheatShare</span>
      <input
        aria-label="Cari cheatsheet"
        placeholder="Cari cheatsheet..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <span>{user ? `Halo, ${user.name}` : 'Komunitas belajar'}</span>
    </header>
  );
}
