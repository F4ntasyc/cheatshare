export default function NoteGrid({ notes, onSelect }) {
  return (
    <div className="notegrid">
      {notes.length === 0 && (
        <p className="muted">
          Belum ada cheatsheet. Jadilah yang pertama mengunggah!
        </p>
      )}
      {notes.map((n) => (
        <button className="notecard" key={n.id} onClick={() => onSelect(n)}>
          <div className="thumb">
            {n.image_url ? (
              <img
                src={n.image_url}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span>📄</span>
            )}
          </div>
          <b>{n.title}</b>
          <small>
            {n.course_name} · {n.author_name}
          </small>
          <p>
            ⭐ {n.rating_average.toFixed(1)} ({n.rating_count})
          </p>
        </button>
      ))}
    </div>
  );
}
