import { useRef, useState } from 'react';
import NoteGrid from '../../components/NoteGrid.jsx';
import CourseIcon from '../../components/CourseIcon.jsx';
import {
  ChevronRightIcon,
  FileIcon,
  SearchIcon,
} from '../../components/icons.jsx';
import { courseVisual, normalizeText } from '../../lib/courseVisual.js';
import './Home.css';

const compactNumber = new Intl.NumberFormat('id', { notation: 'compact' });
const formatCount = (n) => (n >= 1000 ? compactNumber.format(n) : String(n));

export default function HomePage({
  user,
  courses,
  notes,
  course,
  setCourse,
  sort,
  setSort,
  visible,
  startNote,
  go,
  setSelected,
  setPage,
}) {
  // State lokal tampilan: pencarian daftar mata kuliah.
  const [courseQuery, setCourseQuery] = useState('');
  const notesRef = useRef(null);

  // Gulir halus ke grid cheatsheet; tidak mengubah state/page.
  function scrollToNotes() {
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    notesRef.current?.scrollIntoView?.({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  const query = normalizeText(courseQuery.trim());
  const shownCourses = query
    ? courses.filter(
        (c) =>
          normalizeText(c.name).includes(query) ||
          normalizeText(c.code).includes(query),
      )
    : courses;

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-text">
          <h1>Temukan Cheatsheet Terbaik di Sini!</h1>
          <p>Berbagi • Rating • Belajar Lebih Mudah</p>
          <div className="home-hero-actions">
            <button
              type="button"
              className="home-btn home-btn--primary"
              onClick={scrollToNotes}
            >
              Jelajahi Sekarang
              <ChevronRightIcon size={20} />
            </button>
            <button
              type="button"
              className="home-btn home-btn--secondary"
              onClick={() => (user ? startNote() : go('auth'))}
            >
              + Unggah Cheatsheet
            </button>
          </div>
        </div>
        <img
          className="home-hero-mascot"
          src="/mascot/teach.png"
          alt=""
          width="640"
          height="534"
          decoding="async"
          onError={(e) => {
            // Gagal dimuat: sembunyikan, hero tetap rapi.
            e.currentTarget.hidden = true;
          }}
        />
      </section>

      <section className="home-courses" aria-labelledby="home-courses-title">
        <div className="home-courses-head">
          <h2 id="home-courses-title">Daftar Mata Kuliah</h2>
          <div className="home-courses-controls">
            <div className="home-search">
              <SearchIcon size={18} className="home-search-icon" />
              <input
                aria-label="Cari mata kuliah"
                placeholder="Cari mata kuliah..."
                value={courseQuery}
                onChange={(e) => setCourseQuery(e.target.value)}
              />
            </div>
            <select
              className="home-select"
              aria-label="Filter mata kuliah"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            >
              <option value="">Semua</option>
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {courses.length === 0 ? (
          <p className="home-empty">Belum ada mata kuliah.</p>
        ) : shownCourses.length === 0 ? (
          <p className="home-empty">Tidak ada mata kuliah yang cocok.</p>
        ) : (
          <div className="home-course-grid">
            {shownCourses.map((c) => {
              const count = notes.filter((n) => n.course_id === c.id).length;
              const chosen = String(course) === String(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  className={'home-course' + (chosen ? ' is-selected' : '')}
                  aria-pressed={chosen}
                  onClick={() => {
                    setCourse(String(c.id));
                    go('course');
                  }}
                >
                  <CourseIcon
                    icon={courseVisual(c)}
                    size={72}
                    className="home-course-icon"
                  />
                  <span className="home-course-body">
                    <span className="home-course-name">{c.name}</span>
                    <span className="home-course-count">
                      {formatCount(count)} cheatsheet
                    </span>
                    <span className="home-course-code">
                      <FileIcon size={16} />
                      {c.code}
                    </span>
                  </span>
                  <span className="home-course-chevron" aria-hidden="true">
                    <ChevronRightIcon size={18} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="home-notes" id="daftar-cheatsheet" ref={notesRef}>
        <div className="sectionhead">
          <h2>
            Cheatsheet{' '}
            {course
              ? courses.find((c) => String(c.id) === String(course))?.name
              : 'Populer'}
          </h2>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="rating">Rating tertinggi</option>
            <option value="newest">Terbaru</option>
          </select>
        </div>
        <NoteGrid
          notes={visible}
          courses={courses}
          onSelect={(n) => {
            setSelected(n);
            setPage('detail');
          }}
        />
      </section>
    </>
  );
}
