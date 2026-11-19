import os, hmac, hashlib, secrets, base64, json, time
from threading import RLock
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Header, Query
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
    image_url: str = Field(default='', max_length=2000)
    course_id: int

class NotePatch(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=150)
    description: Optional[str] = Field(default=None, max_length=5000)
    image_url: Optional[str] = Field(default=None, max_length=2000)
    course_id: Optional[int] = None

class RatingInput(BaseModel):
    note_id: int
    score: int = Field(ge=1, le=5)

class RatingPatch(BaseModel):
    score: int = Field(ge=1, le=5)

def note_view(n):
    scores = [r['score'] for r in ratings if r['note_id'] == n['id']]
    author = next((u for u in users if u['id'] == n['user_id']), None)
    course = next((c for c in courses if c['id'] == n['course_id']), None)
    return {**n, 'author_name': author['name'] if author else 'Unknown', 'course_name': course['name'] if course else 'Unknown', 'rating_average': round(sum(scores) / len(scores), 2) if scores else 0, 'rating_count': len(scores)}

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
        find(users, id, 'User')
        own(user, id)
        owned_ids = {n['id'] for n in notes if n['user_id'] == id}
        notes[:] = [n for n in notes if n['user_id'] != id]
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
        n.update(changes)
        return note_view(n)

@app.delete('/notes/{id}', status_code=204)
def delete_note(id: int, user=Depends(current_user)):
    with lock:
        n = find(notes, id, 'Note')
        own(user, n['user_id'])
        notes[:] = [x for x in notes if x['id'] != id]
        ratings[:] = [r for r in ratings if r['note_id'] != id]

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
