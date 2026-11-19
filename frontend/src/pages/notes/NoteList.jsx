function NoteList({
  course,
  notes,
  loading,
  error,
  onBack,
  onOpenNote
}) {
  return (
    <>
      <button
        className="back-button"
        onClick={onBack}
      >
        ← Kembali
      </button>

      <h1>{course.name}</h1>

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
            onClick={() => onOpenNote(note)}
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
  )
}

export default NoteList
