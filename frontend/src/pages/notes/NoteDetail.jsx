import { useState } from 'react';
import {
  ArrowLeftIcon,
  EditIcon,
  TrashIcon,
} from '../../components/icons.jsx';
import ImageCarousel from '../../components/ImageCarousel.jsx';
import { AuthorAvatar, Star } from '../../components/StarRating.jsx';
import './NoteDetail.css';

const decimal = new Intl.NumberFormat('id', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat('id');

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
  courses,
}) {
  // Pilihan bintang lokal; baru dikirim lewat tombol (dua langkah).
  const [picked, setPicked] = useState(null);
  const shown = picked ?? myRating?.score ?? 0;

  const code = courses?.find(
    (c) => String(c.id) === String(selected.course_id),
  )?.code;
  const canManage =
    user && (user.id === selected.user_id || user.role === 'admin');

  // Foto: images (fallback image_url lama).
  const photos = selected.images?.length
    ? selected.images
    : selected.image_url
      ? [selected.image_url]
      : [];

  return (
    <div className="detail-page">
      <button
        type="button"
        className="detail-back"
        onClick={() => go('home')}
      >
        <ArrowLeftIcon size={20} />
        Kembali ke daftar
      </button>
      <h1 className="detail-title">Detail Cheatsheet</h1>
      <p className="detail-chip">
        {code
          ? `${code} · ${selected.course_name}`
          : selected.course_name}
      </p>

      <div className="detail-layout">
        {photos.length > 0 && (
          <div className="detail-frame">
            <ImageCarousel images={photos} title={selected.title} />
          </div>
        )}

        <section className="detail-panel">
          <h2>{selected.title}</h2>
          <p className="detail-author">
            <AuthorAvatar size={18} className="detail-avatar" />
            <span>Diunggah oleh {selected.author_name}</span>
          </p>
          {selected.rating_count === 0 ? (
            <p className="detail-score detail-score--none">Belum ada rating</p>
          ) : (
            <p className="detail-score">
              <span className="detail-score-star">
                <Star />
              </span>
              <b>{decimal.format(selected.rating_average)}</b>
              <span>({integer.format(selected.rating_count)} penilaian)</span>
            </p>
          )}
          <p className="detail-desc">
            {selected.description || 'Tidak ada deskripsi.'}
          </p>

          <hr className="detail-sep" />

          <h3 className="detail-rate-title">Beri Rating</h3>
          <p className="detail-rate-sub">Bagaimana kualitas cheatsheet ini?</p>
          <div
            className="detail-stars"
            role="radiogroup"
            aria-label="Rating Anda"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={shown === i}
                aria-label={`${i} bintang`}
                className={'detail-star' + (i <= shown ? ' is-on' : '')}
                disabled={busy || !user}
                onClick={() => setPicked(i)}
              >
                <Star />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="detail-submit"
            disabled={
              busy || !user || picked === null || picked === myRating?.score
            }
            onClick={async () => {
              await saveRating(picked);
            }}
          >
            {myRating ? 'Perbarui Rating' : 'Kirim Rating'}
          </button>
          {!user && (
            <button
              type="button"
              className="detail-link"
              onClick={() => go('auth')}
            >
              Masuk untuk memberi rating
            </button>
          )}
          {myRating && (
            <button
              type="button"
              className="detail-link detail-link--danger"
              onClick={async () => {
                await removeRating();
                setPicked(null);
              }}
            >
              Hapus rating saya
            </button>
          )}

          {canManage && (
            <>
              <hr className="detail-sep" />
              <div className="detail-actions">
                <button
                  type="button"
                  className="detail-btn detail-btn--edit"
                  onClick={() => startNote(selected)}
                >
                  <EditIcon size={20} />
                  Edit
                </button>
                <button
                  type="button"
                  className="detail-btn detail-btn--delete"
                  onClick={() => removeNote(selected.id)}
                >
                  <TrashIcon size={20} />
                  Hapus
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
