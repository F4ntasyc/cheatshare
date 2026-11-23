import { useCallback, useEffect, useRef, useState } from 'react';
import { request, setUnauthorizedHandler } from './lib/api.js';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import MessageAlert from './components/MessageAlert.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import AuthPage from './pages/auth/AuthPage.jsx';
import HomePage from './pages/home/HomePage.jsx';
import CoursePage from './pages/course/CoursePage.jsx';
import NoteDetail from './pages/notes/NoteDetail.jsx';
import NoteEditor from './pages/notes/NoteEditor.jsx';
import ProfilePage from './pages/profile/ProfilePage.jsx';
import AdminPage from './pages/admin/AdminPage.jsx';

const EMPTY_AUTH = { name: '', email: '', password: '' };
const EMPTY_NOTE = { title: '', description: '', images: [], course_id: '' };
const EMPTY_COURSE = { code: '', name: '' };
const EMPTY_PROFILE = { name: '', email: '' };
const SESSION_EXPIRED = 'Sesi berakhir, silakan masuk lagi.';
// Halaman yang menampilkan pesan form secara inline (bukan di slot global).
const INLINE_MESSAGE_PAGES = ['profile', 'admin'];

// URL <-> halaman. Contoh: /course/2, /note/5, /note/5/edit, /note/new.
function parsePath(p) {
  const [a, b, c] = p.split('/').filter(Boolean);
  if (a === 'course' && b) return { page: 'course', course: b };
  if (a === 'note' && b === 'new') return { page: 'editor' };
  if (a === 'note' && b && c === 'edit') return { page: 'editor', noteId: b };
  if (a === 'note' && b) return { page: 'detail', noteId: b };
  if (a === 'profile') return { page: 'profile' };
  if (a === 'admin') return { page: 'admin' };
  return { page: 'home' };
}
function pathFor(page, { course, selected, editId }) {
  if (page === 'home') return '/';
  if (page === 'course') return course ? '/course/' + course : '/';
  if (page === 'detail') return selected ? '/note/' + selected.id : null;
  if (page === 'editor') return editId ? `/note/${editId}/edit` : '/note/new';
  if (page === 'profile') return '/profile';
  if (page === 'admin') return '/admin';
  return null;
}

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
  // Area sidebar yang aktif ('courses' | 'profile' | 'admin').
  const [area, setArea] = useState('courses');
  const [selected, setSelected] = useState(null);
  const [course, setCourse] = useState('');
  const [sort, setSort] = useState('rating');
  const [search, setSearch] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState(EMPTY_AUTH);
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE);
  const [editId, setEditId] = useState(null);
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [courseEdit, setCourseEdit] = useState(null);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('error');
  const [busy, setBusy] = useState(false);
  // true setelah load() pertama sesi ini selesai.
  const [ready, setReady] = useState(false);
  // true setelah URL awal diterapkan (deep link/refresh); sebelum itu URL tidak diubah.
  const [routed, setRouted] = useState(false);
  const [meError, setMeError] = useState('');
  const [meAttempt, setMeAttempt] = useState(0);
  // Naik setiap sesi direset; hasil request dari sesi lama diabaikan.
  const sessionRef = useRef(0);

  const notify = (text, tone = 'error') => {
    setMessage(text);
    setMessageTone(tone);
  };
  const showError = (e) => notify(e.message || String(e));

  // Bersihkan seluruh data/form/filter sesi (logout normal & sesi berakhir).
  const resetSession = useCallback((text = '') => {
    sessionRef.current += 1;
    sessionStorage.removeItem('cs_token');
    setToken('');
    setUser(null);
    setCourses([]);
    setNotes([]);
    setRatings([]);
    setSelected(null);
    setEditId(null);
    setNoteForm(EMPTY_NOTE);
    setProfile(EMPTY_PROFILE);
    setCourseForm(EMPTY_COURSE);
    setCourseEdit(null);
    setSearch('');
    setPage('home');
    setListPage('home');
    setCourse('');
    setArea('courses');
    setReady(false);
    setRouted(false);
    history.replaceState(null, '', '/');
    setMeError('');
    setMessage(text);
    setMessageTone('error');
  }, []);

  const load = async () => {
    const sid = sessionRef.current;
    try {
      const [c, n, r] = await Promise.all([
        request('/courses'),
        request('/notes?sort=' + sort),
        request('/ratings', 'GET', null, token),
      ]);
      if (sid !== sessionRef.current) return;
      setCourses(c);
      setNotes(n);
      setRatings(r);
    } catch (e) {
      if (sid === sessionRef.current && e.status !== 401) showError(e);
    } finally {
      if (sid === sessionRef.current) setReady(true);
    }
  };
  // Muat data saat token/urutan berubah. load() memperbarui state hanya
  // setelah request selesai (async), jadi aturan set-state-in-effect dan
  // exhaustive-deps dinonaktifkan secara sengaja untuk satu baris ini.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, token]);

  // ---- Sinkronisasi URL (History API): tombol Back/Forward dan refresh ----
  const applyRef = useRef(null);
  useEffect(() => {
    // Selalu pakai closure terbaru (user, courses, dst).
    applyRef.current = async (path) => {
      const r = parsePath(path);
      setMessage('');
      try {
        if (r.noteId) {
          const n = await request('/notes/' + r.noteId);
          if (r.page === 'editor') {
            startNote(n);
          } else {
            setSelected(n);
            setPage('detail');
            setArea('courses');
          }
          return;
        }
      } catch {
        // Cheatsheet tidak ada lagi: kembali ke beranda.
        history.replaceState(null, '', '/');
        setSelected(null);
        setPage('home');
        setArea('courses');
        return;
      }
      if (r.page === 'editor') return startNote();
      if (r.page === 'admin' && user?.role !== 'admin') {
        history.replaceState(null, '', '/');
        return go('home');
      }
      setSelected(null);
      if (r.page === 'course') {
        setCourse(r.course);
        setListPage('course');
        setArea('courses');
        setPage('course');
      } else if (r.page === 'home') {
        setCourse('');
        setListPage('home');
        setArea('courses');
        setPage('home');
      } else {
        setArea(r.page);
        setPage(r.page);
      }
    };
  });
  // Terapkan URL saat ini sekali setelah login/reload dan data siap.
  useEffect(() => {
    if (!user || !ready || routed) return;
    let active = true;
    applyRef.current(window.location.pathname).finally(() => {
      if (active) setRouted(true);
    });
    return () => {
      active = false;
    };
  }, [user, ready, routed]);
  // Back/Forward: ubah state sesuai URL.
  useEffect(() => {
    if (!routed) return;
    const onPop = () => applyRef.current(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [routed]);
  // State -> URL: dorong riwayat baru hanya saat path berubah.
  useEffect(() => {
    if (!routed) return;
    const p = pathFor(page, { course, selected, editId });
    if (p && p !== window.location.pathname) history.pushState(null, '', p);
  }, [routed, page, course, selected, editId]);
  // /auth/me hanya bila token ada tetapi user belum diketahui (mis. reload).
  useEffect(() => {
    if (!token || user) return;
    let active = true;
    request('/auth/me', 'GET', null, token)
      .then((u) => {
        if (!active) return;
        setUser(u);
        setProfile({ name: u.name, email: u.email });
      })
      .catch((e) => {
        // 401 ditangani handler sesi berakhir.
        if (active && e.status !== 401)
          setMeError(e.message || 'Gagal memuat akun');
      });
    return () => {
      active = false;
    };
  }, [token, user, meAttempt]);
  // 401 pada request bertoken = sesi berakhir. Abaikan token basi dan
  // panggilan ganda (beberapa request 401 bersamaan).
  useEffect(() => {
    if (!token) return;
    let done = false;
    return setUnauthorizedHandler((used) => {
      if (done || used !== token) return;
      done = true;
      resetSession(SESSION_EXPIRED);
    });
  }, [token, resetSession]);

  function logout() {
    resetSession('');
  }
  async function run(fn, { reload = true } = {}) {
    const sid = sessionRef.current;
    setBusy(true);
    setMessage('');
    try {
      await fn();
      if (reload && sid === sessionRef.current) await load();
      return true;
    } catch (e) {
      // Sesi sudah direset oleh handler 401: biarkan pesan sesi berakhir.
      if (sid === sessionRef.current) showError(e);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function authenticate(e) {
    e.preventDefault();
    // Tanpa reload di sini: efek [token] memuat data tepat sekali.
    await run(
      async () => {
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
        setListPage('home');
        setCourse('');
        setArea('courses');
        setAuth(EMPTY_AUTH);
      },
      { reload: false },
    );
  }
  function go(p) {
    setPage(p);
    setMessage('');
    setSelected(null);
    if (p === 'home' || p === 'course') {
      setListPage(p);
      setArea('courses');
    } else if (p === 'profile' || p === 'admin') setArea(p);
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
            images: n.images?.length
              ? [...n.images]
              : n.image_url
                ? [n.image_url]
                : [],
            course_id: String(n.course_id),
          }
        : {
            title: '',
            description: '',
            images: [],
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
    return run(async () => {
      await request(
        courseEdit ? '/courses/' + courseEdit : '/courses',
        courseEdit ? 'PATCH' : 'POST',
        courseForm,
        token,
      );
      setCourseEdit(null);
      setCourseForm(EMPTY_COURSE);
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
    return run(async () => {
      const u = await request('/users/' + user.id, 'PATCH', profile, token);
      setUser(u);
      notify('Profil berhasil diperbarui', 'success');
    });
  }
  async function removeAccount() {
    if (!confirm('Hapus akun Anda beserta semua cheatsheet dan rating?'))
      return;
    // Tanpa reload: sesi sudah selesai setelah akun dihapus.
    await run(
      async () => {
        await request('/users/' + user.id, 'DELETE', null, token);
        logout();
      },
      { reload: false },
    );
  }
  const visible = notes.filter(
    (n) =>
      (page === 'profile' ||
        !course ||
        String(n.course_id) === String(course)) &&
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
        setAuthMode={(m) => {
          setMessage('');
          setAuthMode(m);
        }}
        auth={auth}
        setAuth={(v) => {
          setMessage('');
          setAuth(v);
        }}
        busy={busy}
        authenticate={authenticate}
        message={message}
      />
    );
  // Layar memuat netral: jangan render shell dengan data kosong.
  if (!user || !ready)
    return (
      <LoadingScreen
        error={meError}
        onRetry={() => {
          setMeError('');
          setMeAttempt((n) => n + 1);
        }}
        onLogout={logout}
      />
    );
  const inlineMessage = INLINE_MESSAGE_PAGES.includes(page);
  return (
    <div className="layout">
      <Sidebar
        area={area}
        user={user}
        setCourse={setCourse}
        go={go}
        logout={logout}
      />
      <main>
        <Header user={user} search={search} setSearch={setSearch} go={go} />
        {message && !inlineMessage && (
          <MessageAlert
            message={message}
            setMessage={setMessage}
            tone={messageTone}
          />
        )}
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
            courses={courses}
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
            token={token}
          />
        )}
        {page === 'profile' && (
          <ProfilePage
            user={user}
            profile={profile}
            setProfile={setProfile}
            busy={busy}
            saveProfile={saveProfile}
            removeAccount={removeAccount}
            startNote={startNote}
            courses={courses}
            notes={notes}
            visible={visible}
            setSelected={setSelected}
            setPage={setPage}
            message={message}
            messageTone={messageTone}
            setMessage={setMessage}
          />
        )}
        {page === 'admin' && user.role === 'admin' && (
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
            message={message}
            messageTone={messageTone}
            setMessage={setMessage}
          />
        )}
      </main>
    </div>
  );
}
