import os, hmac, hashlib, secrets, base64, json, time
from threading import RLock
from typing import Optional
from urllib.parse import urlsplit
from fastapi import FastAPI, HTTPException, Depends, Header, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr, ConfigDict
app = FastAPI(title='CheatShare API', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'], allow_credentials=False, allow_methods=['*'], allow_headers=['*'])
lock = RLock()
SECRET = os.getenv('SECRET_KEY', secrets.token_hex(32)).encode()
users = []
courses = []
notes = []
ratings = []
ids = {'users': 0, 'courses': 0, 'notes': 0, 'ratings': 0}
# Foto unggahan disimpan di memori (hilang saat restart, sama seperti data lain).
files = {}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_STORAGE_BYTES = 200 * 1024 * 1024
MAX_IMAGES = 5
MAX_IMAGE_URL = 2000
UPLOAD_TTL = 3600  # detik; file yatim (tak dipakai note) lebih tua dari ini dihapus
FILE_PREFIX = '/api/files/'
PNG_MAGIC = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
JPEG_MAGIC = bytes([0xFF, 0xD8, 0xFF])

def next_id(table):
    ids[table] += 1
    return ids[table]

def password_hash(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 200000)
    return salt.hex() + ':' + hashed.hex()

def check_password(password, stored):
    try:
        salt, hashed = stored.split(':')
        return hmac.compare_digest(password_hash(password, bytes.fromhex(salt)).split(':')[1], hashed)
    except (ValueError, AttributeError):
        return False

def public_user(u):
    return {k: u[k] for k in ('id', 'name', 'email', 'role')}

def token_for(u):
    payload = base64.urlsafe_b64encode(json.dumps({'id': u['id'], 'exp': int(time.time()) + 86400}, separators=(',', ':')).encode()).decode().rstrip('=')
    sig = hmac.new(SECRET, payload.encode(), hashlib.sha256).hexdigest()
    return payload + '.' + sig

def current_user(authorization: Optional[str]=Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(401, 'Login diperlukan')
    try:
        payload, sig = authorization[7:].split('.')
        if not hmac.compare_digest(hmac.new(SECRET, payload.encode(), hashlib.sha256).hexdigest(), sig):
            raise ValueError()
        data = json.loads(base64.urlsafe_b64decode(payload + '=' * (-len(payload) % 4)))
        if data['exp'] < time.time():
            raise ValueError()
        user = next((u for u in users if u['id'] == data['id']), None)
        if user:
            return user
    except (ValueError, KeyError, TypeError, UnicodeError):
        pass
    raise HTTPException(401, 'Token tidak valid atau kedaluwarsa')

def admin(user=Depends(current_user)):
    if user['role'] != 'admin':
        raise HTTPException(403, 'Hanya admin')
    return user

def find(items, id, label):
    obj = next((x for x in items if x['id'] == id), None)
    if obj is None:
        raise HTTPException(404, f'{label} tidak ditemukan')
    return obj

def own(user, owner):
    if user['id'] != owner and user['role'] != 'admin':
        raise HTTPException(403, 'Tidak memiliki izin')

class Register(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class Login(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None

class CourseInput(BaseModel):
    code: str = Field(min_length=2, max_length=20)
    name: str = Field(min_length=2, max_length=120)

class CoursePatch(BaseModel):
    code: Optional[str] = Field(default=None, min_length=2, max_length=20)
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)

class NoteInput(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    description: str = Field(default='', max_length=5000)
    images: list[str] = []
    course_id: int

class NotePatch(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=150)
    description: Optional[str] = Field(default=None, max_length=5000)
    images: Optional[list[str]] = None
    course_id: Optional[int] = None

class RatingInput(BaseModel):
    note_id: int
    score: int = Field(ge=1, le=5)

class RatingPatch(BaseModel):
    score: int = Field(ge=1, le=5)

def sniff_image(data):
    if data.startswith(PNG_MAGIC):
        return 'image/png'
    if data.startswith(JPEG_MAGIC):
        return 'image/jpeg'
    return None

def referenced_files():
    return {url[len(FILE_PREFIX):] for n in notes for url in n.get('images', []) if url.startswith(FILE_PREFIX)}

def purge_files():
    # Hapus file yang tidak dipakai note mana pun dan umurnya > UPLOAD_TTL.
    refs = referenced_files()
    now = time.time()
    for fid in [f for f, meta in files.items() if f not in refs and now - meta['created_at'] > UPLOAD_TTL]:
        del files[fid]

def release_files(urls):
    # Bebaskan langsung file milik note yang dihapus bila tak dipakai note lain.
    refs = referenced_files()
    for url in urls:
        fid = url[len(FILE_PREFIX):] if url.startswith(FILE_PREFIX) else None
        if fid and fid not in refs:
            files.pop(fid, None)

def check_images(images):
    if images is None or len(images) == 0:
        raise HTTPException(400, 'Minimal 1 foto diperlukan')
    if len(images) > MAX_IMAGES:
        raise HTTPException(400, f'Maksimal {MAX_IMAGES} foto per cheatsheet')
    for url in images:
        if not url or len(url) > MAX_IMAGE_URL or any(ch.isspace() or ord(ch) < 32 or ord(ch) == 127 for ch in url):
            raise HTTPException(400, 'Alamat foto tidak valid')
        if url.startswith(FILE_PREFIX):
            if url[len(FILE_PREFIX):] not in files:
                raise HTTPException(400, 'Foto tidak ditemukan atau kedaluwarsa, unggah ulang.')
            continue
        parts = urlsplit(url)
        if parts.scheme not in ('http', 'https') or not parts.netloc:
            raise HTTPException(400, 'Alamat foto tidak valid')

def note_view(n):
    scores = [r['score'] for r in ratings if r['note_id'] == n['id']]
    author = next((u for u in users if u['id'] == n['user_id']), None)
    course = next((c for c in courses if c['id'] == n['course_id']), None)
    return {**n, 'image_url': n['images'][0] if n['images'] else '', 'author_name': author['name'] if author else 'Unknown', 'course_name': course['name'] if course else 'Unknown', 'rating_average': round(sum(scores) / len(scores), 2) if scores else 0, 'rating_count': len(scores)}

@app.get('/health')
def health():
    return {'status': 'ok'}

@app.post('/auth/register', status_code=201)
def register(data: Register):
    with lock:
        if any((u['email'] == data.email.lower() for u in users)):
            raise HTTPException(409, 'Email sudah terdaftar')
        u = {'id': next_id('users'), 'name': data.name.strip(), 'email': data.email.lower(), 'password_hash': password_hash(data.password), 'role': 'student'}
        users.append(u)
        return {'user': public_user(u), 'access_token': token_for(u), 'token_type': 'bearer'}

@app.post('/auth/login')
def login(data: Login):
    u = next((u for u in users if u['email'] == data.email.lower()), None)
    if not u or not check_password(data.password, u['password_hash']):
        raise HTTPException(401, 'Email atau password salah')
    return {'user': public_user(u), 'access_token': token_for(u), 'token_type': 'bearer'}

@app.get('/auth/me')
def me(user=Depends(current_user)):
    return public_user(user)

@app.get('/users')
def list_users(user=Depends(current_user)):
    return [public_user(u) for u in users]

@app.get('/users/{id}')
def get_user(id: int, user=Depends(current_user)):
    return public_user(find(users, id, 'User'))

@app.patch('/users/{id}')
def update_user(id: int, data: UserUpdate, user=Depends(current_user)):
    with lock:
        u = find(users, id, 'User')
        own(user, id)
        changes = data.model_dump(exclude_unset=True)
        if 'email' in changes:
            email = str(changes['email']).lower()
            if any((x['email'] == email and x['id'] != id for x in users)):
                raise HTTPException(409, 'Email sudah terdaftar')
            changes['email'] = email
        u.update(changes)
        return public_user(u)

@app.delete('/users/{id}', status_code=204)
def delete_user(id: int, user=Depends(current_user)):
    with lock:
        target = find(users, id, 'User')
        own(user, id)
        if target['role'] == 'admin':
            raise HTTPException(400, 'Akun admin tidak dapat dihapus')
        owned_ids = {n['id'] for n in notes if n['user_id'] == id}
        owned_images = [url for n in notes if n['user_id'] == id for url in n['images']]
        notes[:] = [n for n in notes if n['user_id'] != id]
        release_files(owned_images)
        ratings[:] = [r for r in ratings if r['user_id'] != id and r['note_id'] not in owned_ids]
        users[:] = [u for u in users if u['id'] != id]

@app.get('/courses')
def list_courses():
    return list(courses)

@app.get('/courses/{id}')
def get_course(id: int):
    return find(courses, id, 'Course')

@app.post('/courses', status_code=201)
def create_course(data: CourseInput, user=Depends(admin)):
    with lock:
        if any((c['code'].lower() == data.code.lower() for c in courses)):
            raise HTTPException(409, 'Kode mata kuliah sudah ada')
        c = {'id': next_id('courses'), **data.model_dump()}
        courses.append(c)
        return c

@app.patch('/courses/{id}')
def update_course(id: int, data: CoursePatch, user=Depends(admin)):
    with lock:
        c = find(courses, id, 'Course')
        changes = data.model_dump(exclude_unset=True)
        if 'code' in changes and any((x['code'].lower() == changes['code'].lower() and x['id'] != id for x in courses)):
            raise HTTPException(409, 'Kode mata kuliah sudah ada')
        c.update(changes)
        return c

@app.delete('/courses/{id}', status_code=204)
def delete_course(id: int, user=Depends(admin)):
    with lock:
        find(courses, id, 'Course')
        if any((n['course_id'] == id for n in notes)):
            raise HTTPException(409, 'Hapus cheatsheet pada mata kuliah ini terlebih dahulu')
        courses[:] = [c for c in courses if c['id'] != id]

@app.get('/notes')
def list_notes(course_id: Optional[int]=None, user_id: Optional[int]=None, sort: str='newest', q: str=''):
    result = [note_view(n) for n in notes if (course_id is None or n['course_id'] == course_id) and (user_id is None or n['user_id'] == user_id) and (not q or q.lower() in (n['title'] + ' ' + n['description']).lower())]
    if sort == 'rating':
        result.sort(key=lambda n: (n['rating_average'], n['rating_count'], n['id']), reverse=True)
    else:
        result.sort(key=lambda n: n['id'], reverse=True)
    return result

@app.get('/notes/{id}')
def get_note(id: int):
    return note_view(find(notes, id, 'Note'))

@app.post('/notes', status_code=201)
def create_note(data: NoteInput, user=Depends(current_user)):
    with lock:
        find(courses, data.course_id, 'Course')
        check_images(data.images)
        n = {'id': next_id('notes'), **data.model_dump(), 'user_id': user['id']}
        notes.append(n)
        return note_view(n)

@app.patch('/notes/{id}')
def update_note(id: int, data: NotePatch, user=Depends(current_user)):
    with lock:
        n = find(notes, id, 'Note')
        own(user, n['user_id'])
        changes = data.model_dump(exclude_unset=True)
        if 'course_id' in changes:
            find(courses, changes['course_id'], 'Course')
        if 'images' in changes:
            check_images(changes['images'])
        n.update(changes)
        return note_view(n)

@app.delete('/notes/{id}', status_code=204)
def delete_note(id: int, user=Depends(current_user)):
    with lock:
        n = find(notes, id, 'Note')
        own(user, n['user_id'])
        notes[:] = [x for x in notes if x['id'] != id]
        ratings[:] = [r for r in ratings if r['note_id'] != id]
        release_files(n['images'])

@app.post('/uploads', status_code=201)
async def upload_file(request: Request, user=Depends(current_user)):
    # Body mentah (bukan multipart): tanpa dependensi python-multipart.
    length = request.headers.get('content-length')
    if length is not None:
        try:
            declared = int(length)
        except ValueError:
            raise HTTPException(400, 'Content-Length tidak valid')
        if declared > MAX_UPLOAD_BYTES:
            raise HTTPException(413, 'Foto terlalu besar (maks. 10 MB)')
    buf = bytearray()
    async for chunk in request.stream():
        buf.extend(chunk)
        if len(buf) > MAX_UPLOAD_BYTES:
            raise HTTPException(413, 'Foto terlalu besar (maks. 10 MB)')
    data = bytes(buf)
    if not data:
        raise HTTPException(400, 'File kosong')
    content_type = sniff_image(data)
    if content_type is None:
        raise HTTPException(415, 'Format foto harus JPG atau PNG')
    with lock:
        purge_files()
        used = sum(len(f['data']) for f in files.values())
        if used + len(data) > MAX_STORAGE_BYTES:
            raise HTTPException(507, 'Penyimpanan penuh, coba lagi nanti')
        fid = secrets.token_urlsafe(16)
        files[fid] = {'data': data, 'content_type': content_type, 'owner': user['id'], 'created_at': time.time()}
    return {'id': fid, 'url': FILE_PREFIX + fid}

@app.get('/files/{id}')
def get_file(id: str):
    f = files.get(id)
    if f is None:
        raise HTTPException(404, 'File tidak ditemukan')
    return Response(content=f['data'], media_type=f['content_type'], headers={'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=31536000, immutable'})

@app.get('/ratings')
def list_ratings(note_id: Optional[int]=None, user_id: Optional[int]=None):
    return [r.copy() for r in ratings if (note_id is None or r['note_id'] == note_id) and (user_id is None or r['user_id'] == user_id)]

@app.post('/ratings', status_code=201)
def create_rating(data: RatingInput, user=Depends(current_user)):
    with lock:
        find(notes, data.note_id, 'Note')
        if any((r['user_id'] == user['id'] and r['note_id'] == data.note_id for r in ratings)):
            raise HTTPException(409, 'Rating sudah ada; gunakan ubah rating')
        r = {'id': next_id('ratings'), 'user_id': user['id'], **data.model_dump()}
        ratings.append(r)
        return r

@app.patch('/ratings/{id}')
def update_rating(id: int, data: RatingPatch, user=Depends(current_user)):
    with lock:
        r = find(ratings, id, 'Rating')
        own(user, r['user_id'])
        r['score'] = data.score
        return r

@app.delete('/ratings/{id}', status_code=204)
def delete_rating(id: int, user=Depends(current_user)):
    with lock:
        r = find(ratings, id, 'Rating')
        own(user, r['user_id'])
        ratings[:] = [x for x in ratings if x['id'] != id]
admin_email = os.getenv('ADMIN_EMAIL', 'admin@cheatshare.example.com').lower()
admin_password = os.getenv('ADMIN_PASSWORD', 'ChangeMe123!')
users.append({'id': next_id('users'), 'name': 'Administrator', 'email': admin_email, 'password_hash': password_hash(admin_password), 'role': 'admin'})
for code, name in [('IF101', 'Algoritma'), ('IF102', 'Basis Data'), ('IF103', 'Jaringan Komputer'), ('IF104', 'Sistem Operasi'), ('IF105', 'Keamanan Siber'), ('IF106', 'Pemrograman Web')]:
    courses.append({'id': next_id('courses'), 'code': code, 'name': name})

if os.getenv('SEED_DEMO', 'true').lower() in ('1', 'true', 'yes'):
    demo_password = os.getenv('DEMO_PASSWORD', 'Demo12345!')
    for name, email in [('Budi Santoso', 'budi@example.com'), ('Siti Rahma', 'siti@example.com'), ('Andi Pratama', 'andi@example.com'), ('Fathan Akbar', 'fathan@example.com')]:
        users.append({'id': next_id('users'), 'name': name, 'email': email, 'password_hash': password_hash(demo_password), 'role': 'student'})
    course_id = {c['code']: c['id'] for c in courses}
    def demo_img(label, color):
        return 'https://placehold.co/600x800/' + color + '/1e3a5f?text=' + label.replace(' ', '+')
    demo_notes = [
        (1, 'IF101', 'Algoritma Greedy', 'Prinsip, langkah, dan contoh Activity Selection dengan kompleksitas O(n log n).', 'dbeafe'),
        (1, 'IF101', 'Kompleksitas Algoritma', 'Ringkasan Big-O, Omega, Theta, beserta contoh perhitungannya.', 'e0e7ff'),
        (2, 'IF101', 'Sorting Algorithm', 'Perbandingan bubble, selection, insertion, merge, dan quick sort.', 'cffafe'),
        (2, 'IF102', 'Query SQL Dasar', 'SELECT, INSERT, UPDATE, DELETE, dan klausa WHERE.', 'dcfce7'),
        (3, 'IF102', 'JOIN dan Normalisasi', 'INNER, LEFT, RIGHT JOIN serta bentuk normal 1NF sampai BCNF.', 'fce7f3'),
        (3, 'IF103', 'Model OSI dan TCP/IP', 'Tujuh lapisan OSI dibandingkan dengan empat lapisan TCP/IP.', 'fef9c3'),
        (4, 'IF103', 'Subnetting Cepat', 'Trik menghitung subnet mask, network, dan broadcast address.', 'ffedd5'),
        (1, 'IF104', 'Penjadwalan CPU', 'FCFS, SJF, Round Robin, dan perhitungan waiting time.', 'dbeafe'),
        (2, 'IF104', 'Deadlock', 'Empat kondisi Coffman, pencegahan, dan algoritma Banker.', 'e0e7ff'),
        (4, 'IF105', 'Kriptografi Dasar', 'Simetris vs asimetris, hash, dan tanda tangan digital.', 'cffafe'),
        (3, 'IF106', 'REST API dan HTTP', 'Method HTTP, status code, dan prinsip desain REST.', 'dcfce7'),
        (4, 'IF106', 'React Hooks', 'useState, useEffect, dan aturan pemakaian hooks.', 'fce7f3'),
    ]
    for owner, code, title, desc, color in demo_notes:
        notes.append({'id': next_id('notes'), 'user_id': owner + 1, 'course_id': course_id[code], 'title': title, 'description': desc, 'images': [demo_img(title, color)]})
    demo_scores = {1: [5, 5, 4, 5], 2: [4, 4, 5], 3: [5, 4], 4: [3, 4, 4], 5: [4, 5], 6: [5, 3], 7: [4], 8: [5, 4, 4], 9: [3], 10: [5, 5], 11: [4, 4, 3], 12: [5]}
    for note in notes:
        raters = [u for u in users if u['role'] == 'student' and u['id'] != note['user_id']]
        for rater, score in zip(raters, demo_scores.get(note['id'], [])):
            ratings.append({'id': next_id('ratings'), 'user_id': rater['id'], 'note_id': note['id'], 'score': score})
