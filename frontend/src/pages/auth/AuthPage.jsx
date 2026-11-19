import { useState } from 'react';
import {
  EyeIcon,
  EyeOffIcon,
  GraduationCapIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from '../../components/icons.jsx';
import './Auth.css';

export default function AuthPage({
  authMode,
  setAuthMode,
  auth,
  setAuth,
  busy,
  authenticate,
  message,
  onHome,
}) {
  // State khusus tampilan (lokal, bukan state App).
  const [showPassword, setShowPassword] = useState(false);
  const isLogin = authMode === 'login';

  const brand = (className) => (
    <button
      type="button"
      className={className}
      onClick={onHome}
      aria-label="CheatShare, kembali ke beranda"
    >
      <GraduationCapIcon size={40} className="auth-brand-icon" />
      <span>CheatShare</span>
    </button>
  );

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-hero">
          {brand('auth-brand')}
          <p className="auth-hero-title">
            Temukan Cheatsheet Terbaik untuk Matkulmu!
          </p>
          <p className="auth-hero-sub">
            Berbagi • Rating • Belajar Lebih Mudah
          </p>
          <div className="auth-hero-art">
            <img
              className="auth-mascot"
              src="/mascot/read.png"
              alt=""
              width="573"
              height="640"
              decoding="async"
              onError={(e) => {
                // Gagal dimuat: sembunyikan, panel kiri tetap rapi.
                e.currentTarget.hidden = true;
              }}
            />
          </div>
        </div>

        <div className="auth-main">
          {brand('auth-brand auth-brand--mobile')}

          <div
            className="auth-tabs"
            role="tablist"
            aria-label="Pilih Masuk atau Daftar"
          >
            <button
              type="button"
              role="tab"
              id="auth-tab-login"
              aria-selected={isLogin}
              aria-controls="auth-panel"
              className="auth-tab"
              onClick={() => !isLogin && setAuthMode('login')}
            >
              Masuk
            </button>
            <button
              type="button"
              role="tab"
              id="auth-tab-register"
              aria-selected={!isLogin}
              aria-controls="auth-panel"
              className="auth-tab"
              onClick={() => isLogin && setAuthMode('register')}
            >
              Daftar
            </button>
          </div>

          <section
            className="auth-card"
            id="auth-panel"
            role="tabpanel"
            aria-labelledby={isLogin ? 'auth-tab-login' : 'auth-tab-register'}
          >
            <h1 className="auth-title">
              {isLogin ? 'Selamat Datang Kembali!' : 'Buat Akun Baru'}
            </h1>
            <p className="auth-subtitle">
              {isLogin
                ? 'Masuk untuk melanjutkan perjalananmu'
                : 'Daftar untuk mulai berbagi cheatsheet'}
            </p>

            <form onSubmit={authenticate} className="auth-form">
              {authMode === 'register' && (
                <div className="auth-field">
                  <label htmlFor="auth-name" className="auth-sr-only">
                    Nama lengkap
                  </label>
                  <UserIcon size={22} className="auth-field-icon" />
                  <input
                    id="auth-name"
                    className="auth-input"
                    autoComplete="name"
                    placeholder="Nama lengkap"
                    required
                    minLength="2"
                    value={auth.name}
                    onChange={(e) => setAuth({ ...auth, name: e.target.value })}
                  />
                </div>
              )}

              <div className="auth-field">
                <label htmlFor="auth-email" className="auth-sr-only">
                  Email
                </label>
                <MailIcon size={22} className="auth-field-icon" />
                <input
                  id="auth-email"
                  className="auth-input"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  required
                  value={auth.email}
                  onChange={(e) => setAuth({ ...auth, email: e.target.value })}
                />
              </div>

              <div>
                <div className="auth-field">
                  <label htmlFor="auth-password" className="auth-sr-only">
                    Password
                  </label>
                  <LockIcon size={22} className="auth-field-icon" />
                  <input
                    id="auth-password"
                    className="auth-input auth-input--with-toggle"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    placeholder="Password"
                    aria-describedby={
                      isLogin ? undefined : 'auth-password-hint'
                    }
                    minLength="8"
                    required
                    value={auth.password}
                    onChange={(e) =>
                      setAuth({ ...auth, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    aria-label={
                      showPassword
                        ? 'Sembunyikan password'
                        : 'Tampilkan password'
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeIcon size={22} />
                    ) : (
                      <EyeOffIcon size={22} />
                    )}
                  </button>
                </div>
                {!isLogin && (
                  <p id="auth-password-hint" className="auth-hint">
                    Minimal 8 karakter
                  </p>
                )}
              </div>

              {message && (
                <p className="auth-alert" role="alert">
                  {message}
                </p>
              )}

              <button className="auth-submit" disabled={busy}>
                {isLogin ? 'Masuk' : 'Daftar'}
              </button>
            </form>

            <p className="auth-footer">
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => setAuthMode(isLogin ? 'register' : 'login')}
              >
                {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
              </button>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
