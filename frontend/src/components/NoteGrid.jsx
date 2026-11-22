import { FileIcon } from './icons.jsx';
import StarRating, { AuthorAvatar } from './StarRating.jsx';
import './NoteGrid.css';

const decimal = new Intl.NumberFormat('id', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat('id');

function Rating({ average, count }) {
  if (!count)
    return (
      <span className="note-rating note-rating--none">Belum ada rating</span>
    );
  const avg = decimal.format(average);
  const total = integer.format(count);
  return (
    <span
      className="note-rating"
      role="img"
      aria-label={`Rating ${avg} dari 5, ${total} penilai`}
    >
      <StarRating value={average} />
      <span className="note-rating-text" aria-hidden="true">
        <b>{avg}</b> ({total})
      </span>
    </span>
  );
}

export default function NoteGrid({ notes, onSelect, courses }) {
  return (
    <div className="note-grid">
      {notes.length === 0 && (
        <p className="muted">
          Belum ada cheatsheet. Jadilah yang pertama mengunggah!
        </p>
      )}
      {notes.map((n) => {
        const code = courses?.find(
          (c) => String(c.id) === String(n.course_id),
        )?.code;
        return (
          <button className="note-card" key={n.id} onClick={() => onSelect(n)}>
            <span className="note-thumb">
              <FileIcon size={40} className="note-thumb-fallback" />
              {n.image_url && (
                <img
                  src={n.image_url}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </span>
            <span className="note-title">{n.title}</span>
            <span className="note-author">
              <AuthorAvatar />
              <span className="note-author-name">{n.author_name}</span>
            </span>
            <span className="note-foot">
              <Rating average={n.rating_average} count={n.rating_count} />
              {code && <span className="note-code">{code}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
