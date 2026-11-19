import { useEffect, useState } from 'react'
import './styles/common.css'
import { API_URL } from './config'
import { request } from './lib/api'
import Navbar from './components/Navbar'
import AuthPage from './pages/auth/AuthPage'
import CourseList from './pages/courses/CourseList'
import NoteList from './pages/notes/NoteList'
import NoteDetail from './pages/notes/NoteDetail'
import UploadNote from './pages/notes/UploadNote'

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
    return <AuthPage onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
      />

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
          <CourseList
            courses={courses}
            loading={loading}
            error={error}
            onOpenCourse={openCourse}
          />
        ) : !selectedNote ? (
          <NoteList
            course={selectedCourse}
            notes={notes}
            loading={loading}
            error={error}
            onBack={backToCourses}
            onOpenNote={openNote}
          />
        ) : (
          <NoteDetail
            note={selectedNote}
            ratingSummary={ratingSummary}
            userId={userId}
            setUserId={setUserId}
            score={score}
            setScore={setScore}
            loading={loading}
            onBack={backToNotes}
            onSubmitRating={submitRating}
          />
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
