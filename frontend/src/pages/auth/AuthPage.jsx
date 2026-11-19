import { useState } from 'react'
import { API_URL } from '../../config'
import {
  EyeIcon,
  EyeOffIcon,
  GraduationCapIcon,
  LockIcon,
  MailIcon,
  UserIcon
} from '../../components/icons'
import './Auth.css'

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  // State khusus tampilan: tampil/sembunyikan password.
  const [showPassword, setShowPassword] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]: value
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const path = mode === 'login'
        ? '/auth/login'
        : '/auth/register'

      const payload = mode === 'login'
        ? {
            email: form.email,
            password: form.password
          }
        : form

      const response = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : JSON.stringify(data.detail || 'Proses gagal')
        )
      }

      if (mode === 'register') {
        setMessage('Registrasi berhasil. Silakan masuk.')
        setMode('login')
        setForm(previous => ({
          ...previous,
          password: ''
        }))
      } else {
        if (!data.access_token) {
          throw new Error('Token login tidak ditemukan')
        }

        onLogin(data.access_token)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Dipakai oleh tab dan tautan bawah. Efek sama seperti sebelumnya
  // (setMode, setError(''), setMessage('')); tab aktif = tidak ada aksi.
  function switchMode(target) {
    if (target === mode) return

    setMode(target)
    setError('')
    setMessage('')
  }

  const isLogin = mode === 'login'

  const brand = (
    <>
      <GraduationCapIcon size={40} className="auth-brand-icon" />
      <span>CheatShare</span>
    </>
  )

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-hero">
          <div className="auth-brand">{brand}</div>

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
              onError={event => {
                // Gambar gagal dimuat: sembunyikan, panel tetap rapi.
                event.currentTarget.hidden = true
              }}
            />
          </div>
        </aside>

        <main className="auth-main">
          <div className="auth-brand auth-brand--mobile">{brand}</div>

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
              onClick={() => switchMode('login')}
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
              onClick={() => switchMode('register')}
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

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="auth-field">
                  <label htmlFor="auth-name" className="auth-sr-only">
                    Nama lengkap
                  </label>
                  <UserIcon size={22} className="auth-field-icon" />
                  <input
                    id="auth-name"
                    className="auth-input"
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="Nama lengkap"
                    required
                    value={form.name}
                    onChange={handleChange}
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
                  name="email"
                  autoComplete="email"
                  placeholder="Email"
                  required
                  value={form.email}
                  onChange={handleChange}
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
                    name="password"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    placeholder="Password"
                    aria-describedby={isLogin ? undefined : 'auth-password-hint'}
                    required
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    aria-label={
                      showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(value => !value)}
                  >
                    {showPassword
                      ? <EyeIcon size={22} />
                      : <EyeOffIcon size={22} />}
                  </button>
                </div>

                {!isLogin && (
                  <p id="auth-password-hint" className="auth-hint">
                    Minimal 8 karakter
                  </p>
                )}
              </div>

              {error && (
                <p className="auth-alert auth-alert--error" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="auth-alert auth-alert--success" role="status">
                  {message}
                </p>
              )}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading
                  ? 'Memproses...'
                  : isLogin
                    ? 'Masuk'
                    : 'Daftar'}
              </button>
            </form>

            <p className="auth-footer">
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
              {' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => switchMode(isLogin ? 'register' : 'login')}
              >
                {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
              </button>
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}

export default AuthPage
