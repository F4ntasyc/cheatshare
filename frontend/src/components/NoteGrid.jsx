import { FileIcon, UserIcon } from './icons.jsx';
import './NoteGrid.css';

const decimal = new Intl.NumberFormat('id', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat('id');

const STAR_PATH =
  'M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z';

function Star() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={STAR_PATH} />
    </svg>
  );
}

// 5 bintang: penuh/setengah/kosong, dibulatkan ke 0,5 terdekat.
function Stars({ value }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="note-stars" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill =
          rounded >= i + 1 ? 'full' : rounded >= i + 0.5 ? 'half' : 'empty';
        return (
          <span
            key={i}
            className={'note-star note-star--' + fill}
            data-fill={fill}
          >
            <Star />
            <span className="note-star-fill">
              <Star />
            </span>
          </span>
        );
      })}
    </span>
  );
}

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
      <Stars value={average} />
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
              <span className="note-avatar">
                <UserIcon size={14} />
              </span>
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
