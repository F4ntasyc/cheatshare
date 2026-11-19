export default function NoteEditor({
  editId,
  noteForm,
  setNoteForm,
  courses,
  busy,
  saveNote,
  go,
}) {
  return (
    <section className="panel formpanel">
      <h1>{editId ? 'Edit Cheatsheet' : 'Unggah Cheatsheet'}</h1>
      <form onSubmit={saveNote}>
        <label>
          Judul
          <input
            required
            minLength="2"
            value={noteForm.title}
            onChange={(e) =>
              setNoteForm({ ...noteForm, title: e.target.value })
            }
          />
        </label>
        <label>
          Mata Kuliah
          <select
            required
            value={noteForm.course_id}
            onChange={(e) =>
              setNoteForm({ ...noteForm, course_id: e.target.value })
            }
          >
            <option value="">Pilih mata kuliah</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Deskripsi
          <textarea
            rows="5"
            value={noteForm.description}
            onChange={(e) =>
              setNoteForm({ ...noteForm, description: e.target.value })
            }
          />
        </label>
        <label>
          URL Gambar
          <input
            type="url"
            placeholder="https://..."
            value={noteForm.image_url}
            onChange={(e) =>
              setNoteForm({ ...noteForm, image_url: e.target.value })
            }
          />
        </label>
        <div className="actions">
          <button type="button" onClick={() => go('home')}>
            Batal
          </button>
          <button className="primary" disabled={busy}>
            Simpan Cheatsheet
          </button>
        </div>
      </form>
    </section>
  );
}
