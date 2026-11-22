import { useEffect, useRef, useState } from 'react';
import {
  FileIcon,
  ImageIcon,
  TrashIcon,
  UploadCloudIcon,
} from '../../components/icons.jsx';
import { uploadImage } from '../../lib/api.js';
import { prepareImage } from '../../lib/imageCompress.js';
import './NoteEditor.css';

const MAX_PHOTOS = 5;
let keySeq = 0;
const nextKey = () => 'foto-' + ++keySeq;

export default function NoteEditor({
  editId,
  noteForm,
  setNoteForm,
  courses,
  busy,
  saveNote,
  go,
  token,
}) {
  // Daftar foto lokal: {key, url?, previewUrl, status, error?}.
  // Hanya item 'done' yang disinkronkan (berurutan) ke noteForm.images.
  const [items, setItems] = useState(() =>
    (noteForm.images || []).map((url) => ({
      key: nextKey(),
      url,
      previewUrl: url,
      status: 'done',
    })),
  );
  const itemsRef = useRef(items);
  const objectUrls = useRef(new Set());
  const inputRef = useRef(null);
  const [notice, setNotice] = useState('');
  const [dragging, setDragging] = useState(false);

  // Bebaskan object URL saat halaman ditinggalkan.
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function commit(next) {
    itemsRef.current = next;
    setItems(next);
    const images = next.filter((i) => i.status === 'done').map((i) => i.url);
    setNoteForm((f) => ({ ...f, images }));
  }
  function patchItem(key, changes) {
    if (!itemsRef.current.some((i) => i.key === key)) return; // sudah dihapus
    commit(
      itemsRef.current.map((i) => (i.key === key ? { ...i, ...changes } : i)),
    );
  }
  function removeItem(key) {
    const item = itemsRef.current.find((i) => i.key === key);
    if (item && objectUrls.current.has(item.previewUrl)) {
      URL.revokeObjectURL(item.previewUrl);
      objectUrls.current.delete(item.previewUrl);
    }
    commit(itemsRef.current.filter((i) => i.key !== key));
  }

  async function processOne(key, file) {
    try {
      const blob = await prepareImage(file);
      const { url } = await uploadImage(blob, token);
      patchItem(key, { status: 'done', url });
    } catch (e) {
      patchItem(key, { status: 'error', error: e.message || String(e) });
    }
  }

  function addFiles(fileList) {
    const files = [...fileList];
    if (!files.length) return;
    const room = MAX_PHOTOS - itemsRef.current.length;
    const accepted = files.slice(0, Math.max(0, room));
    setNotice(files.length > accepted.length ? 'Maksimal 5 foto' : '');
    if (!accepted.length) return;
    // Slot dipesan sesuai urutan pilih agar urutan stabil.
    const fresh = accepted.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrls.current.add(previewUrl);
      return { key: nextKey(), previewUrl, status: 'uploading' };
    });
    commit([...itemsRef.current, ...fresh]);
    fresh.forEach((item, i) => processOne(item.key, accepted[i]));
  }

  const uploading = items.some((i) => i.status === 'uploading');
  const doneCount = items.filter((i) => i.status === 'done').length;
  const coverKey = items.find((i) => i.status === 'done')?.key;

  return (
    <div className="editor-page">
      <section className="editor-hero">
        <div className="editor-hero-text">
          <h1>{editId ? 'Edit Cheatsheet' : 'Unggah Cheatsheet'}</h1>
          <p>Bagikan catatan terbaikmu dan bantu teman-teman belajar bersama.</p>
        </div>
        <img
          className="editor-hero-mascot"
          src="/mascot/study.png"
          alt=""
          width="560"
          height="458"
          decoding="async"
          onError={(e) => {
            e.currentTarget.hidden = true;
          }}
        />
      </section>

      <form className="editor-card" onSubmit={saveNote}>
        <div className="editor-fields">
          <label className="editor-field">
            <span>Judul Cheatsheet</span>
            <input
              required
              minLength="2"
              placeholder="Contoh: Algoritma Greedy dan Dynamic Programming"
              value={noteForm.title}
              onChange={(e) =>
                setNoteForm({ ...noteForm, title: e.target.value })
              }
            />
          </label>
          <label className="editor-field">
            <span>Mata Kuliah</span>
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
                  {c.code ? `${c.name} (${c.code})` : c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="editor-field">
            <span>Deskripsi</span>
            <textarea
              rows="4"
              placeholder="Jelaskan secara singkat isi cheatsheet yang kamu bagikan..."
              value={noteForm.description}
              onChange={(e) =>
                setNoteForm({ ...noteForm, description: e.target.value })
              }
            />
          </label>

          <div className="editor-field">
            <span id="editor-photo-label">Foto Cheatsheet</span>
            <div
              className={'editor-drop' + (dragging ? ' is-dragging' : '')}
              role="button"
              tabIndex={0}
              aria-labelledby="editor-photo-label editor-drop-text"
              aria-describedby="editor-drop-hint"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
            >
              <UploadCloudIcon size={40} />
              <strong id="editor-drop-text">
                Seret &amp; lepas foto di sini, atau klik untuk memilih
              </strong>
              <small id="editor-drop-hint">
                JPG atau PNG, maks. 10 MB per foto, hingga 5 foto
              </small>
              <span className="editor-drop-btn" aria-hidden="true">
                <ImageIcon size={18} />
                Pilih Foto
              </span>
            </div>
            <input
              ref={inputRef}
              className="editor-file"
              type="file"
              multiple
              accept="image/jpeg,image/png"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <p className="editor-notice" aria-live="polite">
              {notice}
            </p>
          </div>
        </div>

        <div className="editor-preview">
          <h2>Pratinjau Foto</h2>
          {items.length === 0 ? (
            <div className="editor-preview-empty">
              <ImageIcon size={44} />
              <p>Belum ada foto. Foto pertama akan menjadi sampul.</p>
            </div>
          ) : (
            <ul className="editor-thumbs" aria-live="polite">
              {items.map((item, idx) => (
                <li
                  key={item.key}
                  className={'editor-thumb is-' + item.status}
                >
                  {item.status === 'error' ? (
                    <div className="editor-thumb-error">
                      <FileIcon size={28} />
                      <span>{item.error}</span>
                    </div>
                  ) : (
                    <img src={item.previewUrl} alt={`Foto ${idx + 1}`} />
                  )}
                  {item.key === coverKey && (
                    <span className="editor-badge">Sampul</span>
                  )}
                  {item.status === 'uploading' && (
                    <span className="editor-thumb-overlay">Mengunggah…</span>
                  )}
                  <button
                    type="button"
                    className="editor-thumb-remove"
                    aria-label={`Hapus foto ${idx + 1}`}
                    onClick={() => removeItem(item.key)}
                  >
                    <TrashIcon size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="editor-actions">
            <button
              type="button"
              className="editor-btn editor-btn--ghost"
              onClick={() => go('home')}
            >
              Batal
            </button>
            <button
              className="editor-btn editor-btn--primary"
              disabled={busy || uploading || doneCount === 0}
            >
              {editId ? 'Simpan Perubahan' : 'Publikasikan Cheatsheet'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
