# CheatShare

Web app berbagi dan menilai cheatsheet per mata kuliah.
Tugas 9 Komputasi Awan dan Sistem Terdistribusi.

## Stack

| Bagian | Teknologi |
|---|---|
| Frontend | React (Vite) |
| Backend | FastAPI (Python) |
| Penyimpanan | Tanpa database, data hardcoded (list/dict) di backend |
| Runtime | Docker + Docker Compose |

## Prasyarat

- [Git](https://git-scm.com)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows: pastikan WSL2 aktif)
- Akun GitHub yang sudah diundang sebagai collaborator

Cek instalasi:

```bash
git --version
docker --version
docker compose version
```

## Cara Menjalankan

1. Buka **Docker Desktop** dan tunggu status **Engine running**.
2. Clone repo:
   ```bash
   git clone https://github.com/USERNAME/cheatshare.git
   cd cheatshare
   ```
3. Jalankan semua service:
   ```bash
   docker compose up --build
   ```
4. Buka di browser:

   | Service | URL |
   |---|---|
   | Frontend | http://localhost:5173 |
   | Backend | http://localhost:8000 |
   | Dokumentasi API | http://localhost:8000/docs |

5. Hentikan dengan `Ctrl + C`, lalu bersihkan:
   ```bash
   docker compose down
   ```

## Perintah Sehari-hari

| Perintah | Fungsi |
|---|---|
| `docker compose up` | Jalankan semua service |
| `docker compose up --build` | Jalankan dan build ulang (setelah ubah kode atau dependensi) |
| `docker compose up -d` | Jalankan di latar belakang |
| `docker compose down` | Hentikan dan hapus container |
| `docker compose logs -f backend` | Lihat log backend |
| `docker compose logs -f frontend` | Lihat log frontend |

## Struktur Proyek

```
cheatshare/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── README.md
└── TODO.md
```

## Alur Kerja Git

Jangan commit langsung ke `main`. Gunakan branch dan pull request.

```bash
git checkout main
git pull
git checkout -b feat/nama-fitur
# ... kerjakan, lalu:
git add .
git commit -m "feat: deskripsi singkat"
git push -u origin feat/nama-fitur
```

Lalu buka **Pull Request** di GitHub dan minta review satu anggota tim.

Format pesan commit: `feat:` (fitur baru), `fix:` (perbaikan), `docs:` (dokumentasi), `chore:` (lain-lain).

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `failed to connect to the docker API` | Docker Desktop belum jalan. Buka dan tunggu *Engine running* |
| Docker Desktop terus *starting* | Jalankan `wsl --update` di PowerShell (Admin), lalu restart |
| `port is already allocated` | Port 8000 atau 5173 dipakai proses lain. Jalankan `docker compose down` atau tutup aplikasi yang memakainya |
| Perubahan kode tidak terlihat | Jalankan ulang dengan `docker compose up --build` |
| Frontend tidak bisa memanggil backend | Pastikan backend jalan dan CORS aktif di `main.py` |