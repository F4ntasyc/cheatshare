function NoteDetail({
  note,
  ratingSummary,
  userId,
  setUserId,
  score,
  setScore,
  loading,
  onBack,
  onSubmitRating
}) {
  return (
    <>
      <button
        className="back-button"
        onClick={onBack}
      >
        ← Kembali ke Cheatsheet
      </button>

      <div className="detail-card">
        <h1>{note.title}</h1>

        <p>
          Diunggah oleh:{' '}
          {note.uploader_name ||
            'Tidak diketahui'}
        </p>

        <p>{note.description}</p>

        {note.image_url && (
          <img
            src={note.image_url}
            alt={note.title}
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
          onSubmit={onSubmitRating}
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
  )
}

export default NoteDetail
