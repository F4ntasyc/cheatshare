# CheatShare

Platform berbagi dan menilai cheatsheet per mata kuliah.
Tugas 9 Komputasi Awan dan Sistem Terdistribusi (Kelompok CloudBread).

| Bagian | Teknologi |
|---|---|
| Frontend | React 19 + Vite |
| Backend | FastAPI (Python 3.12) |
| Penyimpanan | Tanpa database: list/dict di RAM backend |
| Lokal | Docker Compose (nginx untuk frontend) |
| Hosting | Vercel (static + Python Function) |

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
├── api/index.py          # entry point Vercel (mount backend di /api)
├── backend/              # FastAPI: main.py, tes, Dockerfile
├── frontend/             # React + Vite, nginx.conf, Dockerfile
├── vercel.json           # build + rewrites Vercel
├── requirements.txt      # dependensi Python untuk Vercel
├── docker-compose.yml
├── .env.example
└── TODO.md
```

## Deploy ke Vercel

Satu project Vercel melayani frontend (static, `frontend/dist`) dan backend (Python Function `api/index.py`). `vercel.json` mengarahkan `/api/*` ke fungsi dan semua path lain ke `index.html` (SPA).

1. Push branch ke GitHub, lalu di Vercel: **Add New > Project** dan pilih repo ini. **Root Directory = root repo** (bukan `frontend`). Framework Preset: *Other* (sudah diatur di `vercel.json`).
2. Isi **Environment Variables** (Production dan Preview):
   - `SECRET_KEY`: string acak panjang, **wajib tetap** (jika tidak, token tidak valid antar instance).
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`: ganti dari nilai bawaan.
   - `SEED_DEMO=true` (agar ada data saat demo), `DEMO_PASSWORD`.
3. Deploy. Uji `https://<domain>/api/health` dan buka halaman utama.

CLI (opsional): `npm i -g vercel`, `vercel login`, `vercel` (preview), `vercel --prod`.

### Batasan pada Vercel (penting untuk presentasi)

- **Data di RAM, bukan persisten.** Setiap cold start atau instance baru mereset data ke seed. Akun/cheatsheet/rating baru dapat hilang atau tidak terlihat di instance lain. Ini konsekuensi aturan "tanpa database" pada arsitektur serverless dan menjadi bahan bahasan skalabilitas (state tidak dibagi antar server).
- **Foto yang diunggah** disimpan di RAM instance (`/api/files/...`) dan dapat hilang; body request dibatasi sekitar 4,5 MB oleh Vercel (klien sudah mengompres). Cheatsheet seed memakai URL gambar eksternal sehingga tetap tampil.
- Untuk data yang stabil, jalankan backend di platform kontainer yang selalu hidup (Render/Railway) dengan `--workers 1`, atau tambahkan penyimpanan eksternal (di luar ketentuan tugas).
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
