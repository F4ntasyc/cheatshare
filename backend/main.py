import os
import jwt

from datetime import datetime, timedelta, timezone
from jwt.exceptions import InvalidTokenError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends
from pwdlib import PasswordHash
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CheatShare API")

# Konfigurasi password hashing
password_hash = PasswordHash.recommended()
JWT_SECRET = os.environ.get("JWT_SECRET")

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET belum dikonfigurasi")

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60

# Konfigurasi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
def root():
    return {"message": "CheatShare API berjalan"}

users = [
    {
        "id": 1,
        "name": "Andi",
        "email": "andi@example.com"
    },
    {
        "id": 2,
        "name": "Budi",
        "email": "budi@example.com"
    }
]

courses = [
    {
        "id": 1,
        "code": "IF101",
        "name": "Algoritma dan Pemrograman"
    },
    {
        "id": 2,
        "code": "IF102",
        "name": "Basis Data"
    }
]

notes = [
    {
        "id": 1,
        "user_id": 1,
        "course_id": 1,
        "title": "Ringkasan Sorting",
        "description": "Penjelasan Bubble Sort, Selection Sort, dan Insertion Sort",
        "image_url": "https://example.com/sorting.png"
    },
    {
        "id": 2,
        "user_id": 2,
        "course_id": 2,
        "title": "Ringkasan SQL",
        "description": "Materi SELECT, INSERT, UPDATE, dan DELETE",
        "image_url": "https://example.com/sql.png"
    }
]

ratings = [
    {
        "id": 1,
        "user_id": 2,
        "note_id": 1,
        "score": 5
    },
    {
        "id": 2,
        "user_id": 1,
        "note_id": 2,
        "score": 4
    }
]


def public_user(user):
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "user")
    }


@app.get("/users")
def get_users():
    return [public_user(user) for user in users]

@app.get("/courses")
def get_courses():
    return courses

@app.get("/notes")
def get_notes():
    return notes

@app.get("/ratings")
def get_ratings():
    return ratings

class UserCreate(BaseModel):
    name: str
    email: str


class UserRegister(BaseModel):
    name: str = Field(min_length=1)
    email: str
    password: str = Field(min_length=8)

class CourseCreate(BaseModel):
    name: str = Field(min_length=1)
    code: str | None = None

class NoteCreate(BaseModel):
    user_id: int
    course_id: int
    title: str
    description: str
    image_url: str


class RatingCreate(BaseModel):
    user_id: int
    note_id: int
    score: int = Field(ge=1, le=5)


@app.post("/users", status_code=201)
def create_user(user: UserCreate):
    email = user.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="Format email tidak valid")
    if any(u["email"].lower() == email for u in users):
        raise HTTPException(status_code=409, detail="Email sudah terdaftar")
    new_user = {
        "id": max((u["id"] for u in users), default=0) + 1,
        "name": user.name,
        "email": email
    }

    users.append(new_user)

    return public_user(new_user)

@app.get("/users/{user_id}")
def get_user_by_id(user_id: int):
    for user in users:
        if user["id"] == user_id:
            return public_user(user)

    raise HTTPException(
        status_code=404,
        detail="User tidak ditemukan"
    )

@app.put("/users/{user_id}")
def update_user(user_id: int, updated_user: UserCreate):
    for user in users:
        if user["id"] == user_id:
            email = updated_user.email.strip().lower()
            if not email or "@" not in email:
                raise HTTPException(status_code=422, detail="Format email tidak valid")
            if any(u["id"] != user_id and u["email"].lower() == email for u in users):
                raise HTTPException(status_code=409, detail="Email sudah terdaftar")
            user["name"] = updated_user.name
            user["email"] = email
            return public_user(user)

    raise HTTPException(
        status_code=404,
        detail="User tidak ditemukan"
    )

@app.delete("/users/{user_id}")
def delete_user(user_id: int):

    user = next(
        (u for u in users if u["id"] == user_id),
        None
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    # Cari semua Note milik user
    owned_note_ids = [
        note["id"]
        for note in notes
        if note["user_id"] == user_id
    ]

    # Hapus rating yang dibuat user,
    # serta rating pada Note milik user
    ratings[:] = [
        rating
        for rating in ratings
        if rating["user_id"] != user_id
        and rating["note_id"] not in owned_note_ids
    ]

    # Hapus seluruh Note milik user
    notes[:] = [
        note
        for note in notes
        if note["user_id"] != user_id
    ]

    # Hapus user
    users.remove(user)

    return {
        "message": "User dan data terkait berhasil dihapus"
    }

@app.post("/courses", status_code=201)
def create_course(course: CourseCreate):
    new_course = {
        "id": max((c["id"] for c in courses), default=0) + 1,
        "name": course.name,
        "code": course.code
    }

    courses.append(new_course)

    return new_course

@app.get("/courses/{course_id}")
def get_course_by_id(course_id: int):
    for course in courses:
        if course["id"] == course_id:
            return course

    raise HTTPException(
        status_code=404,
        detail="Course tidak ditemukan"
    )

@app.put("/courses/{course_id}")
def update_course(course_id: int, updated_course: CourseCreate):
    for course in courses:
        if course["id"] == course_id:
            course["name"] = updated_course.name
            course["code"] = updated_course.code
            return course

    raise HTTPException(
        status_code=404,
        detail="Course tidak ditemukan"
    )

@app.delete("/courses/{course_id}")
def delete_course(course_id: int):
    for course in courses:
        if course["id"] == course_id:

            note_ids = [
                note["id"]
                for note in notes
                if note["course_id"] == course_id
            ]

            ratings[:] = [
                rating
                for rating in ratings
                if rating["note_id"] not in note_ids
            ]

            notes[:] = [
                note
                for note in notes
                if note["course_id"] != course_id
            ]

            courses.remove(course)

            return {
                "message": "Course dan data terkait berhasil dihapus"
            }

    raise HTTPException(
        status_code=404,
        detail="Course tidak ditemukan"
    )

@app.post("/notes", status_code=201)
def create_note(note: NoteCreate):

    user_exists = any(
        user["id"] == note.user_id
        for user in users
    )

    if not user_exists:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    course_exists = any(
        course["id"] == note.course_id
        for course in courses
    )

    if not course_exists:
        raise HTTPException(
            status_code=404,
            detail="Course tidak ditemukan"
        )

    new_note = {
        "id": max((n["id"] for n in notes), default=0) + 1,
        "user_id": note.user_id,
        "course_id": note.course_id,
        "title": note.title,
        "description": note.description,
        "image_url": note.image_url
    }

    notes.append(new_note)

    return new_note

@app.get("/notes/{note_id}")
def get_note_by_id(note_id: int):
    for note in notes:
        if note["id"] == note_id:

            uploader = next(
                (
                    user for user in users
                    if user["id"] == note["user_id"]
                ),
                None
            )

            return {
                **note,
                "uploader_name": uploader["name"] if uploader else None
            }

    raise HTTPException(
        status_code=404,
        detail="Note tidak ditemukan"
    )

@app.put("/notes/{note_id}")
def update_note(note_id: int, updated_note: NoteCreate):

    user_exists = any(
        user["id"] == updated_note.user_id
        for user in users
    )

    if not user_exists:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    course_exists = any(
        course["id"] == updated_note.course_id
        for course in courses
    )

    if not course_exists:
        raise HTTPException(
            status_code=404,
            detail="Course tidak ditemukan"
        )

    for note in notes:
        if note["id"] == note_id:
            note["user_id"] = updated_note.user_id
            note["course_id"] = updated_note.course_id
            note["title"] = updated_note.title
            note["description"] = updated_note.description
            note["image_url"] = updated_note.image_url

            return note

    raise HTTPException(
        status_code=404,
        detail="Note tidak ditemukan"
    )

@app.delete("/notes/{note_id}")
def delete_note(note_id: int):

    for note in notes:
        if note["id"] == note_id:

            ratings[:] = [
                rating
                for rating in ratings
                if rating["note_id"] != note_id
            ]

            notes.remove(note)

            return {
                "message": "Note dan rating terkait berhasil dihapus"
            }

    raise HTTPException(
        status_code=404,
        detail="Note tidak ditemukan"
    )

@app.post("/ratings")
def create_rating(rating: RatingCreate):

    user_exists = any(
        user["id"] == rating.user_id
        for user in users
    )

    if not user_exists:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    note_exists = any(
        note["id"] == rating.note_id
        for note in notes
    )

    if not note_exists:
        raise HTTPException(
            status_code=404,
            detail="Note tidak ditemukan"
        )

    # Jika user sudah memberikan rating,
    # perbarui nilai rating sebelumnya.
    for existing_rating in ratings:
        if (
            existing_rating["user_id"] == rating.user_id
            and existing_rating["note_id"] == rating.note_id
        ):
            existing_rating["score"] = rating.score
            return existing_rating

    # Jika belum ada, buat rating baru.
    new_rating = {
        "id": max((r["id"] for r in ratings), default=0) + 1,
        "user_id": rating.user_id,
        "note_id": rating.note_id,
        "score": rating.score
    }

    ratings.append(new_rating)

    return new_rating

@app.get("/ratings/{rating_id}")
def get_rating_by_id(rating_id: int):

    for rating in ratings:
        if rating["id"] == rating_id:
            return rating

    raise HTTPException(
        status_code=404,
        detail="Rating tidak ditemukan"
    )

@app.put("/ratings/{rating_id}")
def update_rating(rating_id: int, updated_rating: RatingCreate):

    for rating in ratings:
        if rating["id"] == rating_id:

            user_exists = any(
                user["id"] == updated_rating.user_id
                for user in users
            )

            note_exists = any(
                note["id"] == updated_rating.note_id
                for note in notes
            )

            if not user_exists or not note_exists:
                raise HTTPException(
                    status_code=404,
                    detail="User atau Note tidak ditemukan"
                )

            # Cegah rating duplikat jika user/note diganti.
            for other_rating in ratings:
                if (
                    other_rating["id"] != rating_id
                    and other_rating["user_id"] == updated_rating.user_id
                    and other_rating["note_id"] == updated_rating.note_id
                ):
                    raise HTTPException(
                        status_code=409,
                        detail="User sudah memberi rating pada Note ini"
                    )

            rating["user_id"] = updated_rating.user_id
            rating["note_id"] = updated_rating.note_id
            rating["score"] = updated_rating.score

            return rating

    raise HTTPException(
        status_code=404,
        detail="Rating tidak ditemukan"
    )

@app.delete("/ratings/{rating_id}")
def delete_rating(rating_id: int):

    for rating in ratings:
        if rating["id"] == rating_id:
            ratings.remove(rating)

            return {
                "message": "Rating berhasil dihapus"
            }

    raise HTTPException(
        status_code=404,
        detail="Rating tidak ditemukan"
    )

@app.get("/notes/{note_id}/rating-summary")
def get_note_rating_summary(note_id: int):

    note_exists = any(
        note["id"] == note_id
        for note in notes
    )

    if not note_exists:
        raise HTTPException(
            status_code=404,
            detail="Note tidak ditemukan"
        )

    note_ratings = [
        rating["score"]
        for rating in ratings
        if rating["note_id"] == note_id
    ]

    rating_count = len(note_ratings)

    average_rating = (
        sum(note_ratings) / rating_count
        if rating_count > 0
        else 0.0
    )

    return {
        "note_id": note_id,
        "average_rating": round(average_rating, 2),
        "rating_count": rating_count
    }

@app.get("/courses/{course_id}/notes")
def get_notes_by_course(course_id: int):

    course_exists = any(
        course["id"] == course_id
        for course in courses
    )

    if not course_exists:
        raise HTTPException(
            status_code=404,
            detail="Course tidak ditemukan"
        )

    course_notes = []

    for note in notes:
        if note["course_id"] == course_id:

            note_ratings = [
                rating["score"]
                for rating in ratings
                if rating["note_id"] == note["id"]
            ]

            rating_count = len(note_ratings)

            average_rating = (
                sum(note_ratings) / rating_count
                if rating_count > 0
                else 0.0
            )

            course_notes.append({
                **note,
                "average_rating": round(average_rating, 2),
                "rating_count": rating_count
            })

    course_notes.sort(
        key=lambda note: (
            -note["average_rating"],
            -note["rating_count"]
        )
    )

    return course_notes

@app.get("/users/{user_id}/notes")
def get_notes_by_user(user_id: int):

    user_exists = any(
        user["id"] == user_id
        for user in users
    )

    if not user_exists:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    user_notes = []

    for note in notes:
        if note["user_id"] == user_id:

            course = next(
                (
                    course for course in courses
                    if course["id"] == note["course_id"]
                ),
                None
            )

            user_notes.append({
                **note,
                "course_name": course["name"] if course else None
            })

    return user_notes

@app.post("/auth/register", status_code=201)
def register_user(data: UserRegister):

    email = data.email.strip().lower()

    if not email or "@" not in email:
        raise HTTPException(
            status_code=422,
            detail="Format email tidak valid"
        )

    for user in users:
        if user["email"].lower() == email:
            raise HTTPException(
                status_code=409,
                detail="Email sudah terdaftar"
            )

    new_user = {
        "id": max((u["id"] for u in users), default=0) + 1,
        "name": data.name,
        "email": email,
        "password_hash": password_hash.hash(data.password),
        "role": "user"
    }

    users.append(new_user)

    return {
        "id": new_user["id"],
        "name": new_user["name"],
        "email": new_user["email"],
        "role": new_user["role"]
    }


class UserLogin(BaseModel):
    email: str
    password: str


@app.post("/auth/login")
def login_user(data: UserLogin):

    email = data.email.strip().lower()

    user = next(
        (
            u for u in users
            if u["email"].lower() == email
        ),
        None
    )

    # Gunakan pesan sama untuk email atau password salah
    if (
        user is None
        or not user.get("password_hash")
        or not password_hash.verify(
            data.password,
            user["password_hash"]
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Email atau password salah"
        )

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user["id"]),
        "exp": expire
    }

    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# Endpoint untuk frontend mengambil profil berdasarkan token login.
_bearer = HTTPBearer(auto_error=False)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Silakan login terlebih dahulu")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Token tidak valid atau kedaluwarsa")
    user = next((u for u in users if u["id"] == user_id), None)
    if user is None:
        raise HTTPException(status_code=401, detail="Pengguna token tidak ditemukan")
    return user


@app.get("/auth/me")
def auth_me(user: dict = Depends(current_user)):
    return public_user(user)
