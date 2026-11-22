import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { EditIcon, PlusIcon, TrashIcon } from '../../components/icons.jsx';
import MessageAlert from '../../components/MessageAlert.jsx';
import './Admin.css';

const integer = new Intl.NumberFormat('id-ID');
const EMPTY = { code: '', name: '' };

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
  message,
  messageTone,
  setMessage,
}) {
  // Panel form tertutup secara default (tampilan awal = hero + tabel).
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const codeRef = useRef(null);

  function openPanel(scroll) {
    flushSync(() => setOpen(true));
    if (scroll) {
      const reduce =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      panelRef.current?.scrollIntoView?.({
        behavior: reduce ? 'auto' : 'smooth',
        block: 'start',
      });
    }
    codeRef.current?.focus({ preventScroll: scroll });
  }
  function closePanel() {
    setOpen(false);
    setCourseEdit(null);
    setCourseForm(EMPTY);
  }

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero-text">
          <h1>Kelola Mata Kuliah</h1>
          <p>Tambah, ubah, dan hapus data mata kuliah.</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => {
            setCourseEdit(null);
            setCourseForm(EMPTY);
            openPanel(false);
          }}
        >
          <PlusIcon size={20} />
          Tambah Mata Kuliah
        </button>
      </section>

      {message && (
        <div className="admin-message">
          <MessageAlert
            message={message}
            setMessage={setMessage}
            tone={messageTone}
          />
        </div>
      )}

      {open && (
        <section
          ref={panelRef}
          className="admin-card admin-form-card"
          aria-labelledby="admin-form-title"
        >
          <h2 id="admin-form-title">
            {courseEdit ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}
          </h2>
          <form
            className="admin-form"
            onSubmit={async (e) => {
              if (await saveCourse(e)) setOpen(false);
            }}
          >
            <label className="admin-field">
              <span>Kode</span>
              <input
                ref={codeRef}
                required
                placeholder="Contoh: IF107"
                value={courseForm.code}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, code: e.target.value })
                }
              />
            </label>
            <label className="admin-field admin-field--wide">
              <span>Nama</span>
              <input
                required
                placeholder="Contoh: Kecerdasan Buatan"
                value={courseForm.name}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, name: e.target.value })
                }
              />
            </label>
            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={closePanel}
              >
                Batal
              </button>
              <button className="admin-btn admin-btn--primary" disabled={busy}>
                Simpan
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-card" aria-labelledby="admin-list-title">
        <h2 id="admin-list-title">Daftar Mata Kuliah</h2>
        <span className="admin-count">
          {integer.format(courses.length)} Mata Kuliah
        </span>

        {courses.length === 0 ? (
          <p className="admin-empty">Belum ada mata kuliah.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Kode</th>
                <th scope="col">Nama Mata Kuliah</th>
                <th scope="col">Cheatsheet</th>
                <th scope="col" className="admin-col-actions">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td data-label="Kode">
                    <span className="admin-code">{c.code}</span>
                  </td>
                  <td data-label="Nama Mata Kuliah" className="admin-name">
                    {c.name}
                  </td>
                  <td data-label="Cheatsheet">
                    {integer.format(
                      notes.filter((n) => n.course_id === c.id).length,
                    )}
                  </td>
                  <td data-label="Aksi" className="admin-col-actions">
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn--edit"
                        aria-label={`Edit ${c.name}`}
                        onClick={() => {
                          setCourseEdit(c.id);
                          setCourseForm({ code: c.code, name: c.name });
                          openPanel(true);
                        }}
                      >
                        <EditIcon size={18} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--delete"
                        aria-label={`Hapus ${c.name}`}
                        onClick={() => removeCourse(c.id)}
                      >
                        <TrashIcon size={18} />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
