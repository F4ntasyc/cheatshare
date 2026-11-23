"""Pastikan entry point Vercel (api/index.py) melayani backend di bawah /api."""
import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api.index import app  # noqa: E402

client = TestClient(app)


def test_api_prefix_routes_to_backend():
    assert client.get('/api/health').json() == {'status': 'ok'}
    assert len(client.get('/api/courses').json()) >= 6
    login = client.post('/api/auth/login', json={'email': 'admin@cheatshare.example.com', 'password': 'ChangeMe123!'})
    assert login.status_code == 200
    token = login.json()['access_token']
    assert client.get('/api/auth/me', headers={'Authorization': 'Bearer ' + token}).json()['role'] == 'admin'


def test_no_prefix_is_not_exposed():
    assert client.get('/health').status_code == 404
