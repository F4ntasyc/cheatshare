import { useState } from 'react';
import NoteGrid from '../../components/NoteGrid.jsx';
import MessageAlert from '../../components/MessageAlert.jsx';
import {
  ChartIcon,
  EditIcon,
  FileIcon,
  MailIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
} from '../../components/icons.jsx';
import './Profile.css';

const integer = new Intl.NumberFormat('id-ID');
const decimal = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function initialOf(name) {
  const first = Array.from(String(name ?? '').trim())[0];
  return first ? first.toUpperCase() : '?';
}

export default function ProfilePage({
  user,
  profile,
  setProfile,
  busy,
  saveProfile,
  removeAccount,
  startNote,
  courses,
  notes,
  visible,
  setSelected,
  setPage,
  message,
  messageTone,
  setMessage,
}) {
  const [editing, setEditing] = useState(false);

  // Statistik dari semua cheatsheet milik user (bukan hasil pencarian).
  const mine = notes.filter((n) => n.user_id === user.id);
  const received = mine.reduce((s, n) => s + n.rating_count, 0);
  const weighted = mine.reduce((s, n) => s + n.rating_average * n.rating_count, 0);
  const average = received ? decimal.format(weighted / received) : '–';

  const resetForm = () => setProfile({ name: user.name, email: user.email });
  const isAdmin = user.role === 'admin';

  const stats = [
    { key: 'notes', tone: 'blue', icon: <FileIcon size={30} />, label: 'Cheatsheet diunggah', value: integer.format(mine.length), sub: 'Kontribusi kamu' },
    { key: 'ratings', tone: 'purple', icon: <StarIcon size={30} />, label: 'Rating diterima', value: integer.format(received), sub: 'Apresiasi komunitas' },
    { key: 'avg', tone: 'green', icon: <ChartIcon size={30} />, label: 'Rating rata-rata', value: average, sub: 'Kualitas kontribusi' },
  ];

  return (
    <div className="profile-page">
      <header className="profile-head">
        <h1>Profil Saya</h1>
        <p>Kelola akun dan kontribusimu di CheatShare.</p>
      </header>

      {message && (
        <div className="profile-message">
          <MessageAlert
            message={message}
            setMessage={setMessage}
            tone={messageTone}
          />
        </div>
      )}

      <section className="profile-hero" aria-label="Informasi akun">
        <span className="profile-hero-deco" aria-hidden="true" />
        <span className="profile-avatar" aria-hidden="true">
          {initialOf(user.name)}
        </span>

        {editing ? (
          <form
            className="profile-form"
            onSubmit={async (e) => {
              if (await saveProfile(e)) setEditing(false);
            }}
          >
            <div className="profile-form-fields">
              <label className="profile-field">
                <span>Nama</span>
                <input
                  autoFocus
                  minLength="2"
                  required
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />
              </label>
              <label className="profile-field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-btn profile-btn--ghost"
                onClick={() => {
                  resetForm();
                  setEditing(false);
                }}
              >
                Batal
              </button>
              <button className="profile-btn profile-btn--primary" disabled={busy}>
                Simpan
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="profile-info">
              <h2>{user.name}</h2>
              <p className="profile-email">
                <MailIcon size={20} />
                <span>{user.email}</span>
              </p>
              <span className="profile-role">
                <StarIcon size={16} />
                {isAdmin ? 'Admin' : 'Student'}
              </span>
            </div>
            <button
              type="button"
              className="profile-edit"
              onClick={() => {
                resetForm();
                setEditing(true);
              }}
            >
              <EditIcon size={20} />
              Edit Profil
            </button>
          </>
        )}
      </section>

      <section className="profile-stats" aria-label="Statistik kontribusi">
        {stats.map((s) => (
          <div key={s.key} className={'profile-stat profile-stat--' + s.tone}>
            <span className="profile-stat-icon" aria-hidden="true">
              {s.icon}
            </span>
            <div className="profile-stat-body">
              <span className="profile-stat-label">{s.label}</span>
              <strong className="profile-stat-value" data-stat={s.key}>
                {s.value}
              </strong>
              <span className="profile-stat-sub">{s.sub}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="profile-notes" aria-labelledby="profile-notes-title">
        <div className="profile-notes-head">
          <h2 id="profile-notes-title">Cheatsheet Saya</h2>
          <button
            type="button"
            className="profile-btn profile-btn--primary"
            onClick={() => startNote()}
          >
            <PlusIcon size={20} />
            Unggah Baru
          </button>
        </div>

        {mine.length === 0 ? (
          <div className="profile-empty">
            <img
              src="/mascot/write.png"
              alt=""
              width="560"
              height="480"
              decoding="async"
              onError={(e) => {
                e.currentTarget.hidden = true;
              }}
            />
            <p>
              Kamu belum mengunggah cheatsheet. Bagikan catatan pertamamu dan
              bantu teman-teman belajar!
            </p>
            <button
              type="button"
              className="profile-btn profile-btn--primary"
              onClick={() => startNote()}
            >
              <PlusIcon size={20} />
              Unggah Cheatsheet Pertama
            </button>
          </div>
        ) : visible.length === 0 ? (
          <p className="profile-nomatch" role="status">
            Tidak ada cheatsheet yang cocok.
          </p>
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

      {!isAdmin && (
        <button type="button" className="profile-delete" onClick={removeAccount}>
          <TrashIcon size={20} />
          Hapus Akun
        </button>
      )}
    </div>
  );
}
