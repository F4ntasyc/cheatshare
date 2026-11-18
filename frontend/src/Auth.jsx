
import { useState } from 'react'

const API_URL = 'http://localhost:8000'

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

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
        setMessage('Registrasi berhasil. Silakan login.')
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>CheatShare</h1>

        <h2>
          {mode === 'login' ? 'Login' : 'Registrasi'}
        </h2>

        <form onSubmit={handleSubmit} className="rating-form">
          {mode === 'register' && (
            <>
              <label>Nama</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
              />
            </>
          )}

          <label>Email</label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
          />

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}

          <button type="submit" disabled={loading}>
            {loading
              ? 'Memproses...'
              : mode === 'login'
                ? 'Login'
                : 'Daftar'}
          </button>
        </form>

        <p>
          {mode === 'login'
            ? 'Belum punya akun?'
            : 'Sudah punya akun?'}
          {' '}
          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
              setMessage('')
            }}
          >
            {mode === 'login' ? 'Daftar' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default Auth
