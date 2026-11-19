import NoteGrid from '../../components/NoteGrid.jsx';

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
  return (
    <>
      <section className="hero">
        <div>
          <h1>Temukan Cheatsheet Terbaik di Sini!</h1>
          <p>Berbagi · Rating · Belajar Lebih Mudah</p>
          <button
            className="primary"
            onClick={() => (user ? startNote() : go('auth'))}
          >
            + Unggah Cheatsheet
          </button>
        </div>
        <div className="heroart">📚 ✨ 🎓</div>
      </section>
      <div className="sectionhead">
        <h2>Daftar Mata Kuliah</h2>
        <button className="link" onClick={() => setCourse('')}>
          Semua mata kuliah
        </button>
      </div>
      <div className="courses">
        {courses.map((c, i) => (
          <button
            className={
              'course ' + (String(course) === String(c.id) ? 'chosen' : '')
            }
            key={c.id}
            onClick={() => setCourse(String(c.id))}
          >
            <span className="courseicon">
              {['📘', '🗃️', '🕸️', '💻', '🔐', '📊'][i % 6]}
            </span>
            <span>
              <b>{c.name}</b>
              <small>
                {c.code} · {notes.filter((n) => n.course_id === c.id).length}{' '}
                cheatsheet
              </small>
            </span>
          </button>
        ))}
      </div>
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
        onSelect={(n) => {
          setSelected(n);
          setPage('detail');
        }}
      />
    </>
  );
}
