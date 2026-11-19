from fastapi.testclient import TestClient
from main import app

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
    note = c.post('/notes', json={'title': 'Test Note', 'description': 'Isi', 'course_id': 1}, headers=uh)
    assert note.status_code == 201
    nid = note.json()['id']
    rating = c.post('/ratings', json={'note_id': nid, 'score': 5}, headers=ah)
    assert rating.status_code == 201
    assert c.post('/ratings', json={'note_id': nid, 'score': 5}, headers=ah).status_code == 409
    assert c.get(f'/notes/{nid}').json()['rating_average'] == 5
    assert c.patch(f"/ratings/{rating.json()['id']}", json={'score': 4}, headers=ah).status_code == 200
    assert c.delete(f"/ratings/{rating.json()['id']}", headers=ah).status_code == 204
    assert c.delete(f'/notes/{nid}', headers=uh).status_code == 204
