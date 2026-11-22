import NoteGrid from '../../components/NoteGrid.jsx';

export default function ProfilePage({
  user,
  profile,
  setProfile,
  busy,
  saveProfile,
  removeAccount,
  startNote,
  courses,
  visible,
  setSelected,
  setPage,
}) {
  return (
    <>
      <h1>Profil Saya</h1>
      <section className="panel formpanel">
        <h2>{user.name}</h2>
        <p>
          {user.email} · {user.role}
        </p>
        <form onSubmit={saveProfile}>
          <label>
            Nama
            <input
              minLength="2"
              required
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              required
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
            />
          </label>
          <button className="primary" disabled={busy}>
            Simpan Profil
          </button>
        </form>
        <button className="danger" onClick={removeAccount}>
          Hapus Akun
        </button>
      </section>
      <div className="sectionhead">
        <h2>Cheatsheet Saya</h2>
        <button className="primary" onClick={() => startNote()}>
          + Unggah Baru
        </button>
      </div>
      <NoteGrid
        notes={visible}
        courses={courses}
        onSelect={(n) => {
          setSelected(n);
          setPage('detail');
        }}
      />
    </>
  );
}
