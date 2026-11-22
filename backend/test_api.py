import itertools
import pytest
from fastapi.testclient import TestClient
import main
from main import app

PNG = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) + b'png-body'
JPEG = bytes([0xFF, 0xD8, 0xFF, 0xE0]) + b'jpeg-body'
GIF = b'GIF89a' + b'gif-body'
SEED_URL = 'https://placehold.co/600x800/dbeafe/1e3a5f?text=Uji'
_n = itertools.count()


def new_user(c):
    i = next(_n)
    r = c.post('/auth/register', json={'name': 'Penguji Foto', 'email': f'foto{i}@example.com', 'password': 'password123'})
    assert r.status_code == 201
    return {'Authorization': 'Bearer ' + r.json()['access_token']}


def upload(c, h, data, ctype='image/jpeg'):
    return c.post('/uploads', content=data, headers={**h, 'Content-Type': ctype})


def test_core_flow():
    c = TestClient(app)
    assert c.get('/health').status_code == 200
    admin = c.post('/auth/login', json={'email': 'admin@cheatshare.example.com', 'password': 'ChangeMe123!'})
    assert admin.status_code == 200
    ah = {'Authorization': 'Bearer ' + admin.json()['access_token']}
    user = c.post('/auth/register', json={'name': 'Testing User', 'email': 'testing.user@example.com', 'password': 'password123'})
    assert user.status_code == 201
    uh = {'Authorization': 'Bearer ' + user.json()['access_token']}
    assert c.post('/courses', json={'code': 'XX', 'name': 'Test Course'}, headers=uh).status_code == 403
    note = c.post('/notes', json={'title': 'Test Note', 'description': 'Isi', 'course_id': 1, 'images': [SEED_URL]}, headers=uh)
    assert note.status_code == 201
    nid = note.json()['id']
    rating = c.post('/ratings', json={'note_id': nid, 'score': 5}, headers=ah)
    assert rating.status_code == 201
    assert c.post('/ratings', json={'note_id': nid, 'score': 5}, headers=ah).status_code == 409
    assert c.get(f'/notes/{nid}').json()['rating_average'] == 5
    assert c.patch(f"/ratings/{rating.json()['id']}", json={'score': 4}, headers=ah).status_code == 200
    assert c.delete(f"/ratings/{rating.json()['id']}", headers=ah).status_code == 204
    assert c.delete(f'/notes/{nid}', headers=uh).status_code == 204


def test_seed_notes_have_images_and_image_url():
    c = TestClient(app)
    for n in c.get('/notes').json():
        if n['id'] <= 12:
            assert n['images'] == [n['image_url']] and n['image_url'].startswith('https://placehold.co/')


def test_upload_valid_jpeg_and_png_served_safely():
    c = TestClient(app)
    h = new_user(c)
    for data, ctype in ((JPEG, 'image/jpeg'), (PNG, 'image/png')):
        r = upload(c, h, data, ctype)
        assert r.status_code == 201
        body = r.json()
        assert body['url'] == '/api/files/' + body['id']
        f = c.get('/files/' + body['id'])
        assert f.status_code == 200 and f.content == data
        assert f.headers['content-type'] == ctype
        assert f.headers['x-content-type-options'] == 'nosniff'
        assert f.headers['cache-control'] == 'public, max-age=31536000, immutable'


def test_upload_type_from_magic_bytes_not_header():
    c = TestClient(app)
    h = new_user(c)
    for bad in (GIF, b'ini teks biasa, bukan foto'):
        r = upload(c, h, bad, 'image/jpeg')
        assert r.status_code == 415
        assert r.json()['detail'] == 'Format foto harus JPG atau PNG'
    # PNG dikirim dengan header JPEG: disajikan sebagai PNG (hasil deteksi)
    r = upload(c, h, PNG, 'image/jpeg')
    assert c.get('/files/' + r.json()['id']).headers['content-type'] == 'image/png'


def test_upload_limits_and_auth():
    c = TestClient(app)
    h = new_user(c)
    assert upload(c, {}, JPEG).status_code == 401
    big = JPEG + b'0' * (10 * 1024 * 1024)
    r = upload(c, h, big)
    assert r.status_code == 413 and 'maks. 10 MB' in r.json()['detail']
    assert upload(c, h, b'').status_code == 400
    assert c.get('/files/tidak-ada').status_code == 404


def test_images_validation():
    c = TestClient(app)
    h = new_user(c)
    fid = upload(c, h, JPEG).json()['id']
    base = {'title': 'Catatan Foto', 'description': '', 'course_id': 1}
    bad = {
        'javascript': ['javascript:alert(1)'],
        'data': ['data:image/png;base64,AAAA'],
        'relatif': ['/etc/passwd'],
        'tanpa host': ['http://'],
        'spasi': ['https://contoh.com/a b.png'],
        'kosong': [],
        'lebih dari 5': [SEED_URL] * 6,
        'file tak dikenal': ['/api/files/tidak-dikenal'],
        'terlalu panjang': ['https://contoh.com/' + 'a' * 2000],
    }
    for name, images in bad.items():
        r = c.post('/notes', json={**base, 'images': images}, headers=h)
        assert r.status_code == 400, name
        assert isinstance(r.json()['detail'], str), name
    r = c.post('/notes', json=base, headers=h)
    assert r.status_code == 400 and r.json()['detail'] == 'Minimal 1 foto diperlukan'
    r = c.post('/notes', json={**base, 'images': ['/api/files/tidak-dikenal']}, headers=h)
    assert r.json()['detail'] == 'Foto tidak ditemukan atau kedaluwarsa, unggah ulang.'
    # Valid: foto unggahan + URL http(s)
    r = c.post('/notes', json={**base, 'images': ['/api/files/' + fid, SEED_URL]}, headers=h)
    assert r.status_code == 201
    view = r.json()
    assert view['images'] == ['/api/files/' + fid, SEED_URL]
    assert view['image_url'] == '/api/files/' + fid
    nid = view['id']
    # PATCH: images bila dikirim minimal 1; tanpa images tetap boleh
    assert c.patch(f'/notes/{nid}', json={'images': []}, headers=h).status_code == 400
    assert c.patch(f'/notes/{nid}', json={'images': None}, headers=h).status_code == 400
    assert c.patch(f'/notes/{nid}', json={'images': ['javascript:alert(1)']}, headers=h).status_code == 400
    r = c.patch(f'/notes/{nid}', json={'title': 'Judul Baru'}, headers=h)
    assert r.status_code == 200 and r.json()['images'] == ['/api/files/' + fid, SEED_URL]
    r = c.patch(f'/notes/{nid}', json={'images': [SEED_URL]}, headers=h)
    assert r.status_code == 200 and r.json()['image_url'] == SEED_URL
    assert c.delete(f'/notes/{nid}', headers=h).status_code == 204


def test_purge_orphans_and_release_on_delete(monkeypatch):
    c = TestClient(app)
    h = new_user(c)
    used = upload(c, h, JPEG).json()['id']
    orphan = upload(c, h, PNG).json()['id']
    r = c.post('/notes', json={'title': 'Dipakai', 'course_id': 1, 'images': ['/api/files/' + used]}, headers=h)
    nid = r.json()['id']
    monkeypatch.setattr(main, 'UPLOAD_TTL', -1)
    upload(c, h, JPEG)  # memicu purge
    assert orphan not in main.files
    assert used in main.files
    assert c.get('/files/' + used).status_code == 200
    # Note dihapus: file yang tak dipakai lagi langsung dibebaskan
    assert c.delete(f'/notes/{nid}', headers=h).status_code == 204
    assert used not in main.files
    assert c.get('/files/' + used).status_code == 404


def test_storage_quota(monkeypatch):
    c = TestClient(app)
    h = new_user(c)
    monkeypatch.setattr(main, 'MAX_STORAGE_BYTES', sum(len(f['data']) for f in main.files.values()) + len(JPEG))
    assert upload(c, h, JPEG).status_code == 201
    r = upload(c, h, JPEG)
    assert r.status_code == 507 and r.json()['detail'].startswith('Penyimpanan penuh')
