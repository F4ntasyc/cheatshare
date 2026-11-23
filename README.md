# CheatShare

Platform berbagi dan menilai cheatsheet per mata kuliah.
Tugas 9 Komputasi Awan dan Sistem Terdistribusi (Kelompok CloudBread).

| Bagian | Teknologi |
|---|---|
| Frontend | React 19 + Vite |
| Backend | FastAPI (Python 3.12) |
| Penyimpanan | Tanpa database: list/dict di RAM backend |
| Lokal | Docker Compose (nginx untuk frontend) |
| Hosting | Vercel (frontend static) + Render (backend Docker) |

## Menjalankan lokal (Docker)

1. Buka Docker Desktop, tunggu *Engine running*.
2. `docker compose up --build`
3. Buka:

| Service | URL |
|---|---|
| Aplikasi | http://localhost:5173 |
| API (docs) | http://localhost:8000/docs |
| Health | http://localhost:8000/health |

4. Hentikan dengan `Ctrl+C`, lalu `docker compose down`.

Konfigurasi lewat environment variable (lihat `.env.example`; salin ke `.env` bila perlu):
`SECRET_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SEED_DEMO`, `DEMO_PASSWORD`. Semuanya punya nilai bawaan untuk development.

### Akun demo

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@cheatshare.example.com` | `ChangeMe123!` |
| Student | `budi@example.com`, `siti@example.com`, `andi@example.com`, `fathan@example.com` | `Demo12345!` |

Data demo (12 cheatsheet, rating) dibuat setiap backend start. Matikan dengan `SEED_DEMO=false`.

## Fitur

- Daftar, masuk, kelola profil, hapus akun (admin tidak bisa dihapus).
- CRUD mata kuliah khusus admin.
- CRUD cheatsheet oleh pemilik atau admin; 1-5 foto per cheatsheet (unggah JPG/PNG, dikompresi di klien).
- Cari, filter per mata kuliah, urut berdasarkan rating, halaman detail dengan carousel.
- Rating 1-5, satu rating per user per cheatsheet; ubah dan hapus rating sendiri.
- Rata-rata dan jumlah rating, daftar cheatsheet milik user.
- URL ikut berubah (`/course/2`, `/note/5`, `/note/5/edit`, `/profile`, `/admin`), sehingga tombol Back/Forward dan refresh browser berfungsi.

## Struktur

```
cheatshare/
├── backend/              # FastAPI: main.py, tes, Dockerfile (untuk lokal & Render)
├── frontend/             # React + Vite, nginx.conf, Dockerfile
├── vercel.json           # build frontend + rewrite /api ke backend Render
├── docker-compose.yml
├── .env.example
└── TODO.md
```

## Deploy (Vercel + Render)

Frontend (React/Vite) di-host sebagai static site di **Vercel**, sedangkan backend (FastAPI) dijalankan dalam **1 container Docker (`--workers 1`) di Render** agar data di RAM tetap konsisten dan tidak terpecah antar instance serverless. `vercel.json` meneruskan semua request `/api/*` ke `https://cheatshare.onrender.com/*` dan path lainnya ke `index.html` (SPA).

### 1. Backend di Render

1. Di Render, buat **New > Web Service**, hubungkan repo ini, lalu atur:
   - **Root Directory:** `backend`
   - **Runtime:** `Docker` (memakai `backend/Dockerfile`)
   - **Health Check Path:** `/health`
2. Isi **Environment Variables**:
   - `PORT=8000` (wajib, sesuai `backend/Dockerfile`)
   - `SECRET_KEY`: string acak panjang (**wajib tetap** agar token tetap valid)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`: ganti dari nilai bawaan
   - `SEED_DEMO=true`, `DEMO_PASSWORD`
3. Deploy hingga status **Live**, lalu cek `https://cheatshare.onrender.com/health` mengembalikan `{"status":"ok"}`.

### 2. Frontend di Vercel

1. Push branch ke GitHub, lalu di Vercel: **Add New > Project** dan pilih repo ini. **Root Directory = root repo** (bukan `frontend`). Framework Preset: *Other* (sudah diatur di `vercel.json`).
2. Jika URL backend Render berubah, perbarui tujuan `/api/:path*` di `vercel.json` lalu push ulang agar Vercel redeploy.
3. Uji `https://<domain-vercel>/api/health` dan buka halaman utama.

CLI (opsional): `npm i -g vercel`, `vercel login`, `vercel` (preview), `vercel --prod`.

### Batasan pada hosting gratis (penting untuk presentasi)

- **Data di RAM, bukan persisten.** Semua data tetap disimpan di memori backend (`--workers 1`), sesuai ketentuan "tanpa database". Pada Render Free tier, service akan *sleep* setelah ~15 menit tanpa trafik; saat bangun kembali butuh ~30–50 detik dan seluruh data akan ter-reset ke data seed (termasuk foto yang diunggah ke `/api/files/...`).
- **Tips presentasi:** buka `https://<domain-vercel>/api/health` 1–2 menit sebelum demo dimulai agar container Render sudah aktif.
- Sebelum dipublikasikan: ganti `SECRET_KEY` dan password admin. Autentikasi ini untuk demonstrasi akademik.

## Perintah harian

| Perintah | Fungsi |
|---|---|
| `docker compose up --build` | Jalankan dan build ulang |
| `docker compose up -d` | Di latar belakang |
| `docker compose down` | Hentikan dan hapus container |
| `docker compose logs -f backend` | Log backend |

## Tes dan lint

```bash
cd backend && pip install -r requirements-dev.txt && pytest -q
cd frontend && npm ci && npm run lint && npm run build
```

## Alur Git

Jangan commit langsung ke `main`; pakai branch dan Pull Request.

```bash
git checkout main && git pull
git checkout -b feat/nama-fitur
git add . && git commit -m "feat: deskripsi singkat"
git push -u origin feat/nama-fitur
```

Format commit: `feat:`, `fix:`, `docs:`, `chore:`.

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `failed to connect to the docker API` | Docker Desktop belum jalan |
| Docker terus *starting* | `wsl --update` (PowerShell Admin), restart |
| `port is already allocated` | Port 8000/5173 terpakai; `docker compose down` |
| Data hilang | Normal: RAM direset saat backend restart |
| 401 setelah restart backend | Atur `SECRET_KEY` tetap |
| Vercel: 404 pada `/api/...` | Pastikan Root Directory root repo dan `vercel.json` ikut ter-deploy |
