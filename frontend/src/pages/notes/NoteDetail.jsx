export default function NoteDetail({
  selected,
  user,
  busy,
  myRating,
  saveRating,
  removeRating,
  startNote,
  removeNote,
  go,
}) {
  return (
    <>
      <button className="link" onClick={() => go('home')}>
        ← Kembali
      </button>
      <h1>Detail Cheatsheet</h1>
      <div className="detail">
        <div className="preview">
          {selected.image_url ? (
            <img
              src={selected.image_url}
              alt={selected.title}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span>📖</span>
          )}
        </div>
        <section className="panel">
          <h2>{selected.title}</h2>
          <p className="muted">
            {selected.course_name} · Oleh {selected.author_name}
          </p>
          <p>{selected.description || 'Tidak ada deskripsi.'}</p>
          <h3>
            ⭐ {selected.rating_average.toFixed(1)}{' '}
            <small>({selected.rating_count} penilai)</small>
          </h3>
          <h3>Beri Rating</h3>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                disabled={busy || !user}
                className={i <= (myRating?.score || 0) ? 'starred' : ''}
                onClick={() => saveRating(i)}
                key={i}
              >
                ★
              </button>
            ))}
          </div>
          {!user && (
            <button className="link" onClick={() => go('auth')}>
              Masuk untuk memberi rating
            </button>
          )}
          {myRating && (
            <button className="link danger" onClick={removeRating}>
              Hapus rating saya
            </button>
          )}
          {user && (user.id === selected.user_id || user.role === 'admin') && (
            <div className="actions">
              <button onClick={() => startNote(selected)}>Edit</button>
              <button
                className="danger"
                onClick={() => removeNote(selected.id)}
              >
                Hapus
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
