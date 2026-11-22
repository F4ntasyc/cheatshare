import { useEffect, useState } from 'react';
import { request } from './lib/api.js';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import MessageAlert from './components/MessageAlert.jsx';
import AuthPage from './pages/auth/AuthPage.jsx';
import HomePage from './pages/home/HomePage.jsx';
import CoursePage from './pages/course/CoursePage.jsx';
import NoteDetail from './pages/notes/NoteDetail.jsx';
import NoteEditor from './pages/notes/NoteEditor.jsx';
import ProfilePage from './pages/profile/ProfilePage.jsx';
import AdminPage from './pages/admin/AdminPage.jsx';

export default function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem('cs_token') || '',
  );
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [page, setPage] = useState('home');
  // Halaman daftar terakhir ('home' | 'course') untuk "kembali ke daftar".
  const [listPage, setListPage] = useState('home');
  const [selected, setSelected] = useState(null);
  const [course, setCourse] = useState('');
  const [sort, setSort] = useState('rating');
  const [search, setSearch] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState({ name: '', email: '', password: '' });
  const [noteForm, setNoteForm] = useState({
    title: '',
    description: '',
    image_url: '',
    course_id: '',
  });
  const [editId, setEditId] = useState(null);
  const [courseForm, setCourseForm] = useState({ code: '', name: '' });
  const [courseEdit, setCourseEdit] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const showError = (e) => setMessage(e.message || String(e));
  const load = async () => {
    try {
      const [c, n] = await Promise.all([
        request('/courses'),
        request('/notes?sort=' + sort),
      ]);
      setCourses(c);
      setNotes(n);
      if (token) setRatings(await request('/ratings', 'GET', null, token));
    } catch (e) {
      showError(e);
    }
  };
  useEffect(() => {
    load();
  }, [sort, token]);
  useEffect(() => {
    if (token) {
      request('/auth/me', 'GET', null, token)
        .then((u) => {
          setUser(u);
          setProfile({ name: u.name, email: u.email });
        })
        .catch(() => logout());
    } else setUser(null);
  }, [token]);
  function logout() {
    sessionStorage.removeItem('cs_token');
    setToken('');
    setUser(null);
    setPage('home');
  }
  async function run(fn) {
    setBusy(true);
    setMessage('');
    try {
      await fn();
      await load();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }
  async function authenticate(e) {
    e.preventDefault();
    await run(async () => {
      const data = await request(
        authMode === 'login' ? '/auth/login' : '/auth/register',
        'POST',
        auth,
      );
      sessionStorage.setItem('cs_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setProfile({ name: data.user.name, email: data.user.email });
      setPage('home');
      setAuth({ name: '', email: '', password: '' });
    });
  }
  function go(p) {
    setPage(p);
    setMessage('');
    setSelected(null);
    if (p === 'home' || p === 'course') setListPage(p);
  }
  // Untuk NoteDetail/NoteEditor: go('home') berarti kembali ke daftar terakhir.
  const goList = (p) => go(p === 'home' ? listPage : p);
  function startNote(n) {
    setEditId(n?.id || null);
    setNoteForm(
      n
        ? {
            title: n.title,
            description: n.description,
            image_url: n.image_url,
            course_id: String(n.course_id),
          }
        : {
            title: '',
            description: '',
            image_url: '',
            course_id: String(course || courses[0]?.id || ''),
          },
    );
    go('editor');
  }
  async function saveNote(e) {
    e.preventDefault();
    await run(async () => {
      await request(
        editId ? '/notes/' + editId : '/notes',
        editId ? 'PATCH' : 'POST',
        { ...noteForm, course_id: Number(noteForm.course_id) },
        token,
      );
      go(listPage);
    });
  }
  async function removeNote(id) {
    if (!confirm('Hapus cheatsheet ini?')) return;
    await run(async () => {
      await request('/notes/' + id, 'DELETE', null, token);
      go(listPage);
    });
  }
  async function saveRating(score) {
    if (!user) {
      go('auth');
      return;
    }
    const existing = ratings.find(
      (r) => r.note_id === selected.id && r.user_id === user.id,
    );
    await run(async () => {
      if (existing)
        await request('/ratings/' + existing.id, 'PATCH', { score }, token);
      else
        await request(
          '/ratings',
          'POST',
          { note_id: selected.id, score },
          token,
        );
      setSelected(await request('/notes/' + selected.id));
    });
  }
  async function removeRating() {
    const r = ratings.find(
      (r) => r.note_id === selected.id && r.user_id === user.id,
    );
    if (!r) return;
    await run(async () => {
      await request('/ratings/' + r.id, 'DELETE', null, token);
      setSelected(await request('/notes/' + selected.id));
    });
  }
  async function saveCourse(e) {
    e.preventDefault();
    await run(async () => {
      await request(
        courseEdit ? '/courses/' + courseEdit : '/courses',
        courseEdit ? 'PATCH' : 'POST',
        courseForm,
        token,
      );
      setCourseEdit(null);
      setCourseForm({ code: '', name: '' });
    });
  }
  async function removeCourse(id) {
    if (!confirm('Hapus mata kuliah ini?')) return;
    await run(async () => {
      await request('/courses/' + id, 'DELETE', null, token);
    });
  }
  async function saveProfile(e) {
    e.preventDefault();
    await run(async () => {
      const u = await request('/users/' + user.id, 'PATCH', profile, token);
      setUser(u);
      setMessage('Profil berhasil diperbarui');
    });
  }
  async function removeAccount() {
    if (!confirm('Hapus akun Anda beserta semua cheatsheet dan rating?'))
      return;
    await run(async () => {
      await request('/users/' + user.id, 'DELETE', null, token);
      logout();
    });
  }
  const visible = notes.filter(
    (n) =>
      (!course || String(n.course_id) === String(course)) &&
      (!search ||
        [n.title, n.description, n.course_name]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (page !== 'profile' || n.user_id === user?.id),
  );
  const myRating =
    selected &&
    ratings.find((r) => r.note_id === selected.id && r.user_id === user?.id);
  if (!token || page === 'auth')
    return (
      <AuthPage
        authMode={authMode}
        setAuthMode={setAuthMode}
        auth={auth}
        setAuth={setAuth}
        busy={busy}
        authenticate={authenticate}
        message={message}
      />
    );
  return (
    <div className="layout">
      <Sidebar
        page={page}
        user={user}
        setCourse={setCourse}
        go={go}
        logout={logout}
      />
      <main>
        <Header user={user} search={search} setSearch={setSearch} go={go} />
        {message && <MessageAlert message={message} setMessage={setMessage} />}
        {page === 'home' && (
          <HomePage
            user={user}
            courses={courses}
            notes={notes}
            course={course}
            setCourse={setCourse}
            sort={sort}
            setSort={setSort}
            visible={visible}
            startNote={startNote}
            go={go}
            setSelected={setSelected}
            setPage={setPage}
          />
        )}
        {page === 'course' && (
          <CoursePage
            user={user}
            courses={courses}
            notes={notes}
            course={course}
            setCourse={setCourse}
            sort={sort}
            setSort={setSort}
            visible={visible}
            startNote={startNote}
            go={go}
            setSelected={setSelected}
            setPage={setPage}
          />
        )}
        {page === 'detail' && selected && (
          <NoteDetail
            selected={selected}
            user={user}
            busy={busy}
            myRating={myRating}
            saveRating={saveRating}
            removeRating={removeRating}
            startNote={startNote}
            removeNote={removeNote}
            go={goList}
          />
        )}
        {page === 'editor' && (
          <NoteEditor
            editId={editId}
            noteForm={noteForm}
            setNoteForm={setNoteForm}
            courses={courses}
            busy={busy}
            saveNote={saveNote}
            go={goList}
          />
        )}
        {page === 'profile' && user && (
          <ProfilePage
            user={user}
            profile={profile}
            setProfile={setProfile}
            busy={busy}
            saveProfile={saveProfile}
            removeAccount={removeAccount}
            startNote={startNote}
            courses={courses}
            visible={visible}
            setSelected={setSelected}
            setPage={setPage}
          />
        )}
        {page === 'admin' && user?.role === 'admin' && (
          <AdminPage
            courseEdit={courseEdit}
            setCourseEdit={setCourseEdit}
            courseForm={courseForm}
            setCourseForm={setCourseForm}
            courses={courses}
            notes={notes}
            busy={busy}
            saveCourse={saveCourse}
            removeCourse={removeCourse}
          />
        )}
      </main>
    </div>
  );
}
