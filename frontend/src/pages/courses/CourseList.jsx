import './Courses.css'

function CourseList({ courses, loading, error, onOpenCourse }) {
  return (
    <>
      <section className="welcome">
        <h1>Selamat datang di CheatShare!</h1>
        <p>
          Temukan dan bagikan ringkasan materi kuliah.
        </p>
      </section>

      <h2>Daftar Mata Kuliah</h2>

      {loading && <p>Memuat...</p>}

      <div className="course-grid">
        {courses.map(course => (
          <button
            type="button"
            className="course-card"
            key={course.id}
            onClick={() => onOpenCourse(course)}
          >
            <h3>{course.name}</h3>
            <p>Lihat cheatsheet →</p>
          </button>
        ))}
      </div>

      {!loading &&
        courses.length === 0 &&
        !error && (
          <p>Belum ada mata kuliah.</p>
        )}
    </>
  )
}

export default CourseList
