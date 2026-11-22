export const API = '/api';

export async function request(path, method = 'GET', body, token) {
  const res = await fetch(API + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok)
    throw Error(
      typeof data.detail === 'string' ? data.detail : 'Permintaan gagal',
    );
  return data;
}

// Unggah satu foto sebagai body mentah (bukan multipart). Balasan: {id, url}.
export async function uploadImage(blob, token) {
  const res = await fetch(API + '/uploads', {
    method: 'POST',
    headers: {
      'Content-Type': blob.type || 'application/octet-stream',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: blob,
  });
  // Penolakan dari nginx (mis. 413) berupa HTML, bukan JSON.
  const data = await res.json().catch(() => null);
  if (!res.ok)
    throw Error(
      typeof data?.detail === 'string'
        ? data.detail
        : res.status === 413
          ? 'Foto terlalu besar (maks. 10 MB)'
          : 'Permintaan gagal',
    );
  return data;
}
