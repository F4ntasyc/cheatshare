
import { useEffect, useState } from 'react'
import './App.css'
import UploadNote from './UploadNote'
import Auth from './Auth'

const API_URL = 'http://localhost:8000'

function App() {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [ratingSummary, setRatingSummary] = useState(null)
  const [score, setScore] = useState(5)
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [token, setToken] = useState(
    () => sessionStorage.getItem('cheatshare_token')
  )
  const [currentUser, setCurrentUser] = useState(null)


  async function request(path, options) {
    const response = await fetch(`${API_URL}${path}`, options)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        typeof data.detail === 'string'
          ? data.detail
          : 'Permintaan gagal'
      )
    }

    return data
  }

  useEffect(() => {
    async function loadCourses() {
      setLoading(true)

      try {
        setCourses(await request('/courses'))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  async function openCourse(course) {
    setSelectedCourse(course)
    setSelectedNote(null)
    setError('')
    setLoading(true)

    try {
      const data = await request(
        `/courses/${course.id}/notes`
      )
      setNotes(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function openNote(note) {
    setError('')
    setMessage('')
    setRatingSummary(null)
    setLoading(true)

    try {
      const [detail, summary] = await Promise.all([
        request(`/notes/${note.id}`),
        request(`/notes/${note.id}/rating-summary`)
      ])

      setSelectedNote(detail)
      setRatingSummary(summary)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function submitRating(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!Number.isInteger(Number(userId)) ||
        Number(userId) < 1) {
      setError('Masukkan ID pengguna yang valid')
      return
    }

    setLoading(true)

    try {
      await request('/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: Number(userId),
          note_id: selectedNote.id,
          score: Number(score)
        })
      })

      const [summary, updatedNotes] = await Promise.all([
        request(
          `/notes/${selectedNote.id}/rating-summary`
        ),
        request(
          `/courses/${selectedCourse.id}/notes`
        )
      ])

      setRatingSummary(summary)
      setNotes(updatedNotes)
      setMessage('Rating berhasil disimpan!')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function backToCourses() {
    setSelectedCourse(null)
    setSelectedNote(null)
    setError('')
    setMessage('')
  }

  function backToNotes() {
    setSelectedNote(null)
    setRatingSummary(null)
    setError('')
    setMessage('')
  }

  async function handleUploadSuccess(newNote) {
    setShowUpload(false)
    setSelectedNote(null)
    setError('')
    setMessage('Cheatsheet berhasil diunggah!')

    const course = courses.find(
      item => item.id === newNote.course_id
    )

    if (course) {
      await openCourse(course)
      setMessage('Cheatsheet berhasil diunggah!')
    }
  }

  function handleLogin(accessToken) {
    sessionStorage.setItem('cheatshare_token', accessToken)
    setToken(accessToken)
  }

  function handleLogout() {
    sessionStorage.removeItem('cheatshare_token')
    setToken(null)
    setSelectedCourse(null)
    setSelectedNote(null)
    setShowUpload(false)
  }


  useEffect(() => {
    if (!token) {
      setCurrentUser(null)
      return
    }

  async function loadCurrentUser() {
    try {
      const response = await fetch(
        `${API_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Gagal mengambil data pengguna')
      }

      const data = await response.json()
      setCurrentUser(data)
    } catch (err) {
      console.error(err)
      sessionStorage.removeItem('cheatshare_token')
      setToken(null)
      setCurrentUser(null)
    }
  }

  loadCurrentUser()
}, [token])


  if (!token) {
    return <Auth onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <header className="navbar">
        <h2>CheatShare</h2>

        <div className="nav-actions">
          <span>
            {currentUser
              ? `Halo, ${currentUser.name}`
              : 'Memuat pengguna...'}
          </span>
          

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="container">

        {!showUpload && (
          <button
            className="upload-button"
            onClick={() => {
              setShowUpload(true)
              setError('')
              setMessage('')
            }}
          >
            + Upload Cheatsheet
          </button>
        )}

        {showUpload ? (
          <UploadNote
            courses={courses}
            currentUser={currentUser}
            token={token}
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowUpload(false)}
          />
        ) : !selectedCourse ? (
          <>
            <section className="welcome">
              <h1>Selamat datang di CheatShare!</h1>
              <p>
                Temukan dan bagikan ringkasan materi kuliah.
              </p>
            </section>

            <h2>Daftar Mata Kuliah</h2>

            {loading && <p>Memuat...</p>}

            <div className="course-grid">
              {courses.map(course => (
                <button
                  type="button"
                  className="course-card"
                  key={course.id}
                  onClick={() => openCourse(course)}
                >
                  <h3>{course.name}</h3>
                  <p>Lihat cheatsheet →</p>
                </button>
              ))}
            </div>

            {!loading &&
              courses.length === 0 &&
              !error && (
                <p>Belum ada mata kuliah.</p>
              )}
          </>
        ) : !selectedNote ? (
          <>
            <button
              className="back-button"
              onClick={backToCourses}
            >
              ← Kembali
            </button>

            <h1>{selectedCourse.name}</h1>

            <p>
              Cheatsheet diurutkan berdasarkan rating tertinggi.
            </p>

            {loading && <p>Memuat...</p>}

            <div className="course-grid">
              {notes.map(note => (
                <button
                  type="button"
                  className="course-card"
                  key={note.id}
                  onClick={() => openNote(note)}
                >
                  <h3>{note.title}</h3>
                  <p>{note.description}</p>
                  <p>
                    ⭐ {note.average_rating ?? 0} / 5
                    {' '}
                    ({note.rating_count ?? 0} penilaian)
                  </p>
                  <strong>Lihat detail →</strong>
                </button>
              ))}
            </div>

            {!loading &&
              notes.length === 0 &&
              !error && (
                <p>Belum ada cheatsheet.</p>
              )}
          </>
        ) : (
          <>
            <button
              className="back-button"
              onClick={backToNotes}
            >
              ← Kembali ke Cheatsheet
            </button>

            <div className="detail-card">
              <h1>{selectedNote.title}</h1>

              <p>
                Diunggah oleh:{' '}
                {selectedNote.uploader_name ||
                  'Tidak diketahui'}
              </p>

              <p>{selectedNote.description}</p>

              {selectedNote.image_url && (
                <img
                  src={selectedNote.image_url}
                  alt={selectedNote.title}
                  className="note-image"
                />
              )}

              {ratingSummary && (
                <h3>
                  ⭐ {ratingSummary.average_rating} / 5
                  {' '}
                  ({ratingSummary.rating_count} penilaian)
                </h3>
              )}

              <hr />

              <h2>Beri Rating</h2>

              <p className="hint">
                Untuk sementara gunakan ID pengguna
                yang sudah ada, misalnya 1 atau 2.
              </p>

              <form
                onSubmit={submitRating}
                className="rating-form"
              >
                <label htmlFor="user-id">
                  ID Pengguna
                </label>

                <input
                  id="user-id"
                  type="number"
                  min="1"
                  required
                  value={userId}
                  onChange={e =>
                    setUserId(e.target.value)
                  }
                />

                <label htmlFor="score">
                  Rating
                </label>

                <select
                  id="score"
                  value={score}
                  onChange={e =>
                    setScore(Number(e.target.value))
                  }
                >
                  <option value="1">⭐ 1</option>
                  <option value="2">⭐⭐ 2</option>
                  <option value="3">⭐⭐⭐ 3</option>
                  <option value="4">⭐⭐⭐⭐ 4</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5</option>
                </select>

                <button
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? 'Menyimpan...'
                    : 'Kirim Rating'}
                </button>
              </form>
            </div>
          </>
        )}

        {error && (
          <p className="error">{error}</p>
        )}

        {message && (
          <p className="success">{message}</p>
        )}
      </main>
    </div>
  )
}

export default App
