# CheatShare — Komputasi Awan

React + Vite frontend, Python + FastAPI backend, in-memory storage, Docker Compose.

## Menjalankan

1. Pastikan Docker Desktop aktif.
2. Dari folder ini jalankan `docker compose up --build`.
3. Buka **http://localhost:5173**. Dokumentasi API: **http://localhost:8000/docs**. Health: **http://localhost:8000/health**.
4. Admin demo: `admin@cheatshare.example.com` / `ChangeMe123!` (ubah via environment variables `ADMIN_EMAIL` dan `ADMIN_PASSWORD` sebelum dibagikan/deploy).
5. Untuk berhenti: `Ctrl+C` lalu opsional `docker compose down`.

## Fitur

- Registrasi, login, profil dan penghapusan akun, token bertanda tangan HMAC.
- CRUD course khusus admin; enam mata kuliah contoh.
- CRUD cheatsheet oleh pemilik/admin; URL gambar (bukan upload file biner).
- Pencarian, filter mata kuliah, sortir berdasarkan rating, halaman detail.
- Rating 1–5, satu rating per pengguna per cheatsheet; ubah dan hapus rating sendiri.
- Rata-rata dan jumlah rating otomatis; daftar cheatsheet milik pengguna.
- Validasi input dan kontrol akses pada backend.

## Catatan arsitektur

- **Tanpa database:** semua data disimpan sebagai list of dictionary pada RAM backend. Semua perubahan, termasuk akun baru, hilang saat container backend direstart. Enam mata kuliah dan akun admin disiapkan kembali.
- Gunakan hanya satu worker backend. Data RAM tidak dibagi antarproses/container.
- Frontend Nginx mem-proxy `/api/` ke service backend; tidak perlu mengubah URL API untuk Docker.
- Ini demonstrasi akademik, bukan autentikasi produksi: ganti secret dan password admin, tambahkan HTTPS dan persistence jika akan dipublikasikan.

## Pemeriksaan manual

Daftar akun -> login -> admin membuat mata kuliah -> pengguna unggah note -> pengguna lain memberi rating -> ubah rating -> hapus rating -> edit/hapus note -> ubah profil -> hapus akun. Uji penolakan 401 tanpa token, 403 non-admin mengubah course, 403 pengguna lain mengedit note, 409 rating duplikat.

## Tes API lokal (opsional)

`cd backend && pip install -r requirements.txt pytest httpx && pytest -q`

## Status verifikasi saat ZIP dibuat

Backend telah diuji dengan FastAPI TestClient untuk login, registrasi, izin admin, CRUD note dan rating. **Docker tidak tersedia di lingkungan pembuatan**, sehingga `docker compose up --build` belum dapat diverifikasi langsung. `npm ci` tidak dapat menyelesaikan pengunduhan dependency karena keterbatasan akses npm registry; build React/Vite juga belum terverifikasi. Jalankan build pada komputer dengan Docker Desktop dan akses internet.
