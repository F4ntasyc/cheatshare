export default function AuthPage({
  authMode,
  setAuthMode,
  auth,
  setAuth,
  busy,
  authenticate,
}) {
  return (
    <section className="auth panel">
      <h1>
        {authMode === 'login'
          ? 'Selamat Datang Kembali!'
          : 'Buat Akun CheatShare'}
      </h1>
      <p>Berbagi • Rating • Belajar Lebih Mudah</p>
      <form onSubmit={authenticate}>
        {authMode === 'register' && (
          <label>
            Nama
            <input
              required
              minLength="2"
              value={auth.name}
              onChange={(e) => setAuth({ ...auth, name: e.target.value })}
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            required
            value={auth.email}
            onChange={(e) => setAuth({ ...auth, email: e.target.value })}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            minLength="8"
            required
            value={auth.password}
            onChange={(e) => setAuth({ ...auth, password: e.target.value })}
          />
        </label>
        <button className="primary" disabled={busy}>
          {authMode === 'login' ? 'Masuk' : 'Daftar'}
        </button>
      </form>
      <p>
        <button
          className="link"
          onClick={() =>
            setAuthMode(authMode === 'login' ? 'register' : 'login')
          }
        >
          {authMode === 'login'
            ? 'Belum punya akun? Daftar di sini'
            : 'Sudah punya akun? Masuk'}
        </button>
      </p>
    </section>
  );
}
