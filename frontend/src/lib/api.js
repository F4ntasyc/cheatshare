export const API = '/api';

// Handler sesi berakhir (didaftarkan App). Dipanggil hanya untuk 401 pada
// request BERTOKEN; 401 login/register (kredensial salah) bukan sesi berakhir.
let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
  return () => {
    if (unauthorizedHandler === fn) unauthorizedHandler = null;
  };
}

// Pesan galat dari respons: detail string apa adanya; detail array (422
// pydantic) -> "Data tidak valid: field, field."; selain itu fallback.
export function errorMessage(data, fallback = 'Permintaan gagal') {
  const detail = data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const fields = [
      ...new Set(
        detail
          .map((d) => (Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : null))
          .filter((f) => f !== null && f !== undefined && f !== ''),
      ),
    ];
    if (fields.length) return `Data tidak valid: ${fields.join(', ')}.`;
  }
  return fallback;
}

async function finish(res, token, fallback) {
  if (res.status === 204) return null;
  // Respons non-JSON (mis. halaman galat nginx) tidak boleh memunculkan
  // SyntaxError; pakai pesan fallback.
  const data = await res.json().catch(() => null);
  if (res.ok) return data;
  const err = new Error(errorMessage(data, fallback));
  err.status = res.status;
  if (res.status === 401 && token) unauthorizedHandler?.(token);
  throw err;
}

export async function request(path, method = 'GET', body, token) {
  const res = await fetch(API + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return finish(res, token);
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
  return finish(
    res,
    token,
    res.status === 413 ? 'Foto terlalu besar (maks. 10 MB)' : undefined,
  );
}
