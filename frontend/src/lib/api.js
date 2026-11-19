import { API_URL } from '../config'

export async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      typeof data.detail === 'string'
        ? data.detail
        : 'Permintaan gagal'
    )
  }

  return data
}
