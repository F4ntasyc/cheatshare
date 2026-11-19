export default function AdminPage({
  courseEdit,
  setCourseEdit,
  courseForm,
  setCourseForm,
  courses,
  notes,
  busy,
  saveCourse,
  removeCourse,
}) {
  return (
    <>
      <h1>Kelola Mata Kuliah</h1>
      <section className="panel formpanel">
        <h2>{courseEdit ? 'Edit' : 'Tambah'} Mata Kuliah</h2>
        <form onSubmit={saveCourse}>
          <label>
            Kode
            <input
              required
              value={courseForm.code}
              onChange={(e) =>
                setCourseForm({ ...courseForm, code: e.target.value })
              }
            />
          </label>
          <label>
            Nama
            <input
              required
              value={courseForm.name}
              onChange={(e) =>
                setCourseForm({ ...courseForm, name: e.target.value })
              }
            />
          </label>
          <div className="actions">
            {courseEdit && (
              <button
                type="button"
                onClick={() => {
                  setCourseEdit(null);
                  setCourseForm({ code: '', name: '' });
                }}
              >
                Batal
              </button>
            )}
            <button className="primary" disabled={busy}>
              Simpan
            </button>
          </div>
        </form>
      </section>
      <section className="panel">
        <h2>Daftar Mata Kuliah</h2>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th>Cheatsheet</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td>{c.name}</td>
                  <td>{notes.filter((n) => n.course_id === c.id).length}</td>
                  <td>
                    <button
                      onClick={() => {
                        setCourseEdit(c.id);
                        setCourseForm({ code: c.code, name: c.name });
                      }}
                    >
                      Edit
                    </button>{' '}
                    <button
                      className="danger"
                      onClick={() => removeCourse(c.id)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
