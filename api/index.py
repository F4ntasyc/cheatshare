"""Entry point Vercel (Python Function).

Vercel mengarahkan /api/* ke fungsi ini (lihat vercel.json) dan aplikasi
melihat path asli, mis. /api/courses. Backend FastAPI mendefinisikan rute
tanpa awalan /api (/courses), seperti saat dipakai lewat proxy nginx/Vite.
Karena itu backend di-mount pada /api.

Catatan: data tersimpan di RAM instance serverless, jadi dapat ter-reset
saat cold start. Lihat README bagian "Deploy ke Vercel".
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from fastapi import FastAPI  # noqa: E402
from main import app as backend  # noqa: E402

app = FastAPI(title="CheatShare (Vercel)")
app.mount("/api", backend)
