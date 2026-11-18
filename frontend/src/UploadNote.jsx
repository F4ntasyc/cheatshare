
import { useState } from 'react'

const API_URL = 'http://localhost:8000'

function UploadNote({
  courses,
  currentUser,
  token,
  onSuccess,
  onCancel
}) {


const [form, setForm] = useState({
  user_id: '',
  course_id: '',
  title: '',
  description: '',
  image_url: ''
})

const [loading, setLoading] = useState(false)
const [error, setError] = useState('')

function handleChange(event) {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]: value
    }))
}

  async function handleSubmit(event) {
    event.preventDefault()
    if (!currentUser?.id) {
        setError('Data pengguna belum tersedia. Silakan coba lagi.')
        return
    }
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
             Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            user_id: currentUser.id,
            course_id: Number(form.course_id),
            title: form.title,
            description: form.description,
            image_url: form.image_url
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const detail = data.detail
        throw new Error(
          typeof detail === 'string'
            ? detail
            : JSON.stringify(detail || 'Upload gagal')
        )
      }

      onSuccess(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="detail-card">
        <h1>Upload Cheatsheet</h1>
        <p>Bagikan ringkasan materi kuliah.</p>
        <p>
            Diunggah oleh: <strong>{currentUser?.name}</strong>
        </p>
        <form className="rating-form" onSubmit={handleSubmit}>

        <label>Mata Kuliah</label>
        <select
          name="course_id"
          required
          value={form.course_id}
          onChange={handleChange}
        >
          <option value="">Pilih mata kuliah</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>

        <label>Judul Cheatsheet</label>
        <input
          type="text"
          name="title"
          required
          value={form.title}
          onChange={handleChange}
        />

        <label>Deskripsi</label>
        <textarea
          name="description"
          rows="5"
          required
          value={form.description}
          onChange={handleChange}
        />

        <label>URL Gambar</label>
        <input
          type="url"
          name="image_url"
          placeholder="https://example.com/gambar.png"
          required
          value={form.image_url}
          onChange={handleChange}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Mengunggah...' : 'Upload Cheatsheet'}
        </button>

        <button
          type="button"
          className="back-button"
          onClick={onCancel}
        >
          Batal
        </button>
      </form>
    </div>
  )
}

export default UploadNote
