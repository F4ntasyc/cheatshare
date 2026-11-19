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
