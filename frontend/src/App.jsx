import React, { useEffect, useState } from 'react';
const API = '/api';
async function request(path, method = 'GET', body, token) { const res = await fetch(API + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }); if (res.status === 204)
    return null; const data = await res.json(); if (!res.ok)
    throw Error(typeof data.detail === 'string' ? data.detail : 'Permintaan gagal'); return data; }
export default function App() {
    const [token, setToken] = useState(() => sessionStorage.getItem('cs_token') || '');
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [notes, setNotes] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [page, setPage] = useState('home');
    const [selected, setSelected] = useState(null);
    const [course, setCourse] = useState('');
    const [sort, setSort] = useState('rating');
    const [search, setSearch] = useState('');
    const [authMode, setAuthMode] = useState('login');
    const [auth, setAuth] = useState({ name: '', email: '', password: '' });
    const [noteForm, setNoteForm] = useState({ title: '', description: '', image_url: '', course_id: '' });
    const [editId, setEditId] = useState(null);
    const [courseForm, setCourseForm] = useState({ code: '', name: '' });
    const [courseEdit, setCourseEdit] = useState(null);
    const [profile, setProfile] = useState({ name: '', email: '' });
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const showError = e => setMessage(e.message || String(e));
    const load = async () => { try {
        const [c, n] = await Promise.all([request('/courses'), request('/notes?sort=' + sort)]);
        setCourses(c);
        setNotes(n);
        if (token)
            setRatings(await request('/ratings', 'GET', null, token));
    }
    catch (e) {
        showError(e);
    } };
    useEffect(() => { load(); }, [sort, token]);
    useEffect(() => { if (token) {
        request('/auth/me', 'GET', null, token).then(u => { setUser(u); setProfile({ name: u.name, email: u.email }); }).catch(() => logout());
    }
    else
        setUser(null); }, [token]);
    function logout() { sessionStorage.removeItem('cs_token'); setToken(''); setUser(null); setPage('home'); }
    async function run(fn) { setBusy(true); setMessage(''); try {
        await fn();
        await load();
    }
    catch (e) {
        showError(e);
    }
    finally {
        setBusy(false);
    } }
    async function authenticate(e) { e.preventDefault(); await run(async () => { const data = await request(authMode === 'login' ? '/auth/login' : '/auth/register', 'POST', auth); sessionStorage.setItem('cs_token', data.access_token); setToken(data.access_token); setUser(data.user); setProfile({ name: data.user.name, email: data.user.email }); setPage('home'); setAuth({ name: '', email: '', password: '' }); }); }
    function go(p) { setPage(p); setMessage(''); setSelected(null); }
    function startNote(n) { setEditId(n?.id || null); setNoteForm(n ? { title: n.title, description: n.description, image_url: n.image_url, course_id: String(n.course_id) } : { title: '', description: '', image_url: '', course_id: String(course || courses[0]?.id || '') }); go('editor'); }
    async function saveNote(e) { e.preventDefault(); await run(async () => { await request(editId ? '/notes/' + editId : '/notes', editId ? 'PATCH' : 'POST', { ...noteForm, course_id: Number(noteForm.course_id) }, token); go('home'); }); }
    async function removeNote(id) { if (!confirm('Hapus cheatsheet ini?'))
        return; await run(async () => { await request('/notes/' + id, 'DELETE', null, token); go('home'); }); }
    async function saveRating(score) { if (!user) {
        go('auth');
        return;
    } const existing = ratings.find(r => r.note_id === selected.id && r.user_id === user.id); await run(async () => { if (existing)
        await request('/ratings/' + existing.id, 'PATCH', { score }, token);
    else
        await request('/ratings', 'POST', { note_id: selected.id, score }, token); setSelected(await request('/notes/' + selected.id)); }); }
    async function removeRating() { const r = ratings.find(r => r.note_id === selected.id && r.user_id === user.id); if (!r)
        return; await run(async () => { await request('/ratings/' + r.id, 'DELETE', null, token); setSelected(await request('/notes/' + selected.id)); }); }
    async function saveCourse(e) { e.preventDefault(); await run(async () => { await request(courseEdit ? '/courses/' + courseEdit : '/courses', courseEdit ? 'PATCH' : 'POST', courseForm, token); setCourseEdit(null); setCourseForm({ code: '', name: '' }); }); }
    async function removeCourse(id) { if (!confirm('Hapus mata kuliah ini?'))
        return; await run(async () => { await request('/courses/' + id, 'DELETE', null, token); }); }
    async function saveProfile(e) { e.preventDefault(); await run(async () => { const u = await request('/users/' + user.id, 'PATCH', profile, token); setUser(u); setMessage('Profil berhasil diperbarui'); }); }
    async function removeAccount() { if (!confirm('Hapus akun Anda beserta semua cheatsheet dan rating?'))
        return; await run(async () => { await request('/users/' + user.id, 'DELETE', null, token); logout(); }); }
    const visible = notes.filter(n => (!course || String(n.course_id) === String(course)) && (!search || [n.title, n.description, n.course_name].join(' ').toLowerCase().includes(search.toLowerCase())) && (page !== 'profile' || n.user_id === user?.id));
    const myRating = selected && ratings.find(r => r.note_id === selected.id && r.user_id === user?.id);
    return <div className="layout">
<aside>
<div className="brand">🎓 CheatShare</div>
<button className={page === 'home' ? 'active' : ''} onClick={() => { setCourse(''); go('home'); }}>⌂ Beranda</button>
<button onClick={() => user ? go('profile') : go('auth')}>♙ Profil Saya</button>{user?.role === 'admin' && <button onClick={() => go('admin')}>⚙ Kelola Mata Kuliah</button>}<div className="sidebar-bottom">{user ? <>
<small>{user.name} · {user.role}
</small>
<button onClick={logout}>Keluar</button>
</> : <button onClick={() => go('auth')}>Masuk / Daftar</button>}
</div>
</aside>
<main>
<header>
<span className="mobilebrand">🎓 CheatShare</span>
<input aria-label="Cari cheatsheet" placeholder="Cari cheatsheet..." value={search} onChange={e => setSearch(e.target.value)}/>
<span>{user ? `Halo, ${user.name}` : 'Komunitas belajar'}
</span>
</header>{message && <div role="alert" className="alert">{message} <button onClick={() => setMessage('')}>×</button>
</div>}
 {page === 'auth' && <section className="auth panel">
<h1>{authMode === 'login' ? 'Selamat Datang Kembali!' : 'Buat Akun CheatShare'}
</h1>
<p>Berbagi • Rating • Belajar Lebih Mudah</p>
<form onSubmit={authenticate}>{authMode === 'register' && <label>Nama<input required minLength="2" value={auth.name} onChange={e => setAuth({ ...auth, name: e.target.value })}/>
</label>}<label>Email<input type="email" required value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })}/>
</label>
<label>Password<input type="password" minLength="8" required value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })}/>
</label>
<button className="primary" disabled={busy}>{authMode === 'login' ? 'Masuk' : 'Daftar'}
</button>
</form>
<p>
<button className="link" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>{authMode === 'login' ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk'}
</button>
</p>
</section>}
 {page === 'home' && <>
<section className="hero">
<div>
<h1>Temukan Cheatsheet Terbaik di Sini!</h1>
<p>Berbagi · Rating · Belajar Lebih Mudah</p>
<button className="primary" onClick={() => user ? startNote() : go('auth')}>+ Unggah Cheatsheet</button>
</div>
<div className="heroart">📚 ✨ 🎓</div>
</section>
<div className="sectionhead">
<h2>Daftar Mata Kuliah</h2>
<button className="link" onClick={() => setCourse('')}>Semua mata kuliah</button>
</div>
<div className="courses">{courses.map((c, i) => <button className={'course ' + (String(course) === String(c.id) ? 'chosen' : '')} key={c.id} onClick={() => setCourse(String(c.id))}>
<span className="courseicon">{['📘', '🗃️', '🕸️', '💻', '🔐', '📊'][i % 6]}
</span>
<span>
<b>{c.name}
</b>
<small>{c.code} · {notes.filter(n => n.course_id === c.id).length} cheatsheet</small>
</span>
</button>)}
</div>
<div className="sectionhead">
<h2>Cheatsheet {course ? courses.find(c => String(c.id) === String(course))?.name : 'Populer'}
</h2>
<select value={sort} onChange={e => setSort(e.target.value)}>
<option value="rating">Rating tertinggi</option>
<option value="newest">Terbaru</option>
</select>
</div>
<NoteGrid notes={visible} onSelect={n => { setSelected(n); setPage('detail'); }}/>
</>}
 {page === 'detail' && selected && <>
<button className="link" onClick={() => go('home')}>← Kembali</button>
<h1>Detail Cheatsheet</h1>
<div className="detail">
<div className="preview">{selected.image_url ? <img src={selected.image_url} alt={selected.title} onError={e => { e.currentTarget.style.display = 'none'; }}/> : <span>📖</span>}
</div>
<section className="panel">
<h2>{selected.title}
</h2>
<p className="muted">{selected.course_name} · Oleh {selected.author_name}
</p>
<p>{selected.description || 'Tidak ada deskripsi.'}
</p>
<h3>⭐ {selected.rating_average.toFixed(1)} <small>({selected.rating_count} penilai)</small>
</h3>
<h3>Beri Rating</h3>
<div className="stars">{[1, 2, 3, 4, 5].map(i => <button disabled={busy || !user} className={i <= (myRating?.score || 0) ? 'starred' : ''} onClick={() => saveRating(i)} key={i}>★</button>)}
</div>{!user && <button className="link" onClick={() => go('auth')}>Masuk untuk memberi rating</button>}{myRating && <button className="link danger" onClick={removeRating}>Hapus rating saya</button>}{user && (user.id === selected.user_id || user.role === 'admin') && <div className="actions">
<button onClick={() => startNote(selected)}>Edit</button>
<button className="danger" onClick={() => removeNote(selected.id)}>Hapus</button>
</div>}
</section>
</div>
</>}
 {page === 'editor' && <section className="panel formpanel">
<h1>{editId ? 'Edit Cheatsheet' : 'Unggah Cheatsheet'}
</h1>
<form onSubmit={saveNote}>
<label>Judul<input required minLength="2" value={noteForm.title} onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}/>
</label>
<label>Mata Kuliah<select required value={noteForm.course_id} onChange={e => setNoteForm({ ...noteForm, course_id: e.target.value })}>
<option value="">Pilih mata kuliah</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}
</option>)}
</select>
</label>
<label>Deskripsi<textarea rows="5" value={noteForm.description} onChange={e => setNoteForm({ ...noteForm, description: e.target.value })}/>
</label>
<label>URL Gambar<input type="url" placeholder="https://..." value={noteForm.image_url} onChange={e => setNoteForm({ ...noteForm, image_url: e.target.value })}/>
</label>
<div className="actions">
<button type="button" onClick={() => go('home')}>Batal</button>
<button className="primary" disabled={busy}>Simpan Cheatsheet</button>
</div>
</form>
</section>}
 {page === 'profile' && user && <>
<h1>Profil Saya</h1>
<section className="panel formpanel">
<h2>{user.name}
</h2>
<p>{user.email} · {user.role}
</p>
<form onSubmit={saveProfile}>
<label>Nama<input minLength="2" required value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}/>
</label>
<label>Email<input type="email" required value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}/>
</label>
<button className="primary" disabled={busy}>Simpan Profil</button>
</form>
<button className="danger" onClick={removeAccount}>Hapus Akun</button>
</section>
<div className="sectionhead">
<h2>Cheatsheet Saya</h2>
<button className="primary" onClick={() => startNote()}>+ Unggah Baru</button>
</div>
<NoteGrid notes={visible} onSelect={n => { setSelected(n); setPage('detail'); }}/>
</>}
 {page === 'admin' && user?.role === 'admin' && <>
<h1>Kelola Mata Kuliah</h1>
<section className="panel formpanel">
<h2>{courseEdit ? 'Edit' : 'Tambah'} Mata Kuliah</h2>
<form onSubmit={saveCourse}>
<label>Kode<input required value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}/>
</label>
<label>Nama<input required value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })}/>
</label>
<div className="actions">{courseEdit && <button type="button" onClick={() => { setCourseEdit(null); setCourseForm({ code: '', name: '' }); }}>Batal</button>}<button className="primary" disabled={busy}>Simpan</button>
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
<tbody>{courses.map(c => <tr key={c.id}>
<td>{c.code}
</td>
<td>{c.name}
</td>
<td>{notes.filter(n => n.course_id === c.id).length}
</td>
<td>
<button onClick={() => { setCourseEdit(c.id); setCourseForm({ code: c.code, name: c.name }); }}>Edit</button> <button className="danger" onClick={() => removeCourse(c.id)}>Hapus</button>
</td>
</tr>)}
</tbody>
</table>
</div>
</section>
</>}
 </main>
</div>;
}
function NoteGrid({ notes, onSelect }) { return <div className="notegrid">{notes.length === 0 && <p className="muted">Belum ada cheatsheet. Jadilah yang pertama mengunggah!</p>}{notes.map(n => <button className="notecard" key={n.id} onClick={() => onSelect(n)}>
<div className="thumb">{n.image_url ? <img src={n.image_url} alt="" onError={e => { e.currentTarget.style.display = 'none'; }}/> : <span>📄</span>}
</div>
<b>{n.title}
</b>
<small>{n.course_name} · {n.author_name}
</small>
<p>⭐ {n.rating_average.toFixed(1)} ({n.rating_count})</p>
</button>)}
</div>; }
