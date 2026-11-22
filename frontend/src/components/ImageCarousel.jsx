import { useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, FileIcon } from './icons.jsx';
import './ImageCarousel.css';

// Carousel foto berbasis CSS scroll-snap (tanpa library).
// 1 foto -> tanpa kontrol. Tiap slide punya tautan "buka gambar penuh".
export default function ImageCarousel({ images, title }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const total = images.length;
  const multi = total > 1;

  function goTo(i) {
    const next = Math.min(total - 1, Math.max(0, i));
    setIndex(next);
    const track = trackRef.current;
    if (!track) return;
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo?.({
      left: next * track.clientWidth,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }

  return (
    <div
      className="carousel"
      role={multi ? 'region' : undefined}
      aria-roledescription={multi ? 'carousel' : undefined}
      aria-label={multi ? `Foto ${title}` : undefined}
    >
      <div
        ref={trackRef}
        className="carousel-track"
        tabIndex={multi ? 0 : undefined}
        aria-label={multi ? 'Gunakan panah kiri/kanan untuk berpindah foto' : undefined}
        onScroll={
          multi
            ? (e) => {
                const t = e.currentTarget;
                if (!t.clientWidth) return;
                setIndex(Math.round(t.scrollLeft / t.clientWidth));
              }
            : undefined
        }
        onKeyDown={
          multi
            ? (e) => {
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  goTo(index + 1);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  goTo(index - 1);
                }
              }
            : undefined
        }
      >
        {images.map((url, i) => (
          <a
            key={url + i}
            className="carousel-slide"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              multi
                ? `Buka gambar ukuran penuh (foto ${i + 1} dari ${total})`
                : 'Buka gambar ukuran penuh'
            }
            aria-hidden={multi && i !== index ? 'true' : undefined}
            tabIndex={multi && i !== index ? -1 : undefined}
          >
            <FileIcon size={56} className="carousel-fallback" />
            <img
              src={url}
              alt={multi ? `${title} – foto ${i + 1} dari ${total}` : title}
              loading={i === 0 ? undefined : 'lazy'}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </a>
        ))}
      </div>

      {multi && (
        <>
          <button
            type="button"
            className="carousel-nav carousel-nav--prev"
            aria-label="Foto sebelumnya"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            <ChevronLeftIcon size={22} />
          </button>
          <button
            type="button"
            className="carousel-nav carousel-nav--next"
            aria-label="Foto berikutnya"
            disabled={index === total - 1}
            onClick={() => goTo(index + 1)}
          >
            <ChevronRightIcon size={22} />
          </button>
          <div className="carousel-foot">
            <div className="carousel-dots">
              {images.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  className={'carousel-dot' + (i === index ? ' is-active' : '')}
                  aria-label={`Foto ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
            <span className="carousel-count" aria-live="polite">
              {index + 1}/{total}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
