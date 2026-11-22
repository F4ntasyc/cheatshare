import NoteGrid from '../../components/NoteGrid.jsx';
import '../home/Home.css';
import './Course.css';

export default function CoursePage({
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
  const current = courses.find((c) => String(c.id) === String(course));

  if (!current)
    return (
      <section className="course-missing">
        <p>Mata kuliah tidak ditemukan.</p>
        <button
          type="button"
          className="home-btn home-btn--primary"
          onClick={() => {
            setCourse('');
            go('home');
          }}
        >
          Kembali ke beranda
        </button>
      </section>
    );

  const upload = () => (user ? startNote() : go('auth'));
  const total = notes.filter(
    (n) => String(n.course_id) === String(current.id),
  ).length;

  return (
    <>
      <section className="course-hero">
        <div className="course-hero-text">
          <h1>{current.name}</h1>
          <p>{current.code} · Cheatsheet yang dibagikan komunitas</p>
        </div>
        <img
          className="course-hero-mascot"
          src="/mascot/think.png"
          alt=""
          width="560"
          height="680"
          decoding="async"
          onError={(e) => {
            // Gagal dimuat: sembunyikan, hero tetap rapi.
            e.currentTarget.hidden = true;
          }}
        />
        <button
          type="button"
          className="home-btn home-btn--primary course-upload"
          onClick={upload}
        >
          + Unggah Cheatsheet
        </button>
      </section>

      <section className="course-notes">
        <div className="course-notes-head">
          <h2>
            {sort === 'newest' ? 'Cheatsheet Terbaru' : 'Cheatsheet Populer'}
          </h2>
          <select
            className="home-select"
            aria-label="Urutkan cheatsheet"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="rating">Rating tertinggi</option>
            <option value="newest">Terbaru</option>
          </select>
        </div>

        {total === 0 ? (
          <div className="course-empty">
            <p>
              Belum ada cheatsheet untuk mata kuliah ini. Jadilah yang pertama
              mengunggah!
            </p>
            <button
              type="button"
              className="home-btn home-btn--secondary"
              onClick={upload}
            >
              + Unggah Cheatsheet
            </button>
          </div>
        ) : visible.length === 0 ? (
          <p className="course-empty">Tidak ada cheatsheet yang cocok.</p>
        ) : (
          <NoteGrid
            notes={visible}
            courses={courses}
            onSelect={(n) => {
              setSelected(n);
              setPage('detail');
            }}
          />
        )}
      </section>
    </>
  );
}
