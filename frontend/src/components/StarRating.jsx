// Bintang rating + avatar penulis; dipakai bersama kartu (NoteGrid) dan detail.
// Gaya ada di NoteGrid.css.
import { UserIcon } from './icons.jsx';
import './NoteGrid.css';

const STAR_PATH =
  'M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z';

export function Star() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={STAR_PATH} />
    </svg>
  );
}

// 5 bintang: penuh/setengah/kosong, dibulatkan ke 0,5 terdekat.
export default function StarRating({ value }) {
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

export function AuthorAvatar({ size = 14, className = 'note-avatar' }) {
  return (
    <span className={className}>
      <UserIcon size={size} />
    </span>
  );
}
