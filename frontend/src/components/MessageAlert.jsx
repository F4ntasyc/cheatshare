// Pesan: tone 'success' -> role="status" (sopan), selain itu role="alert".
export default function MessageAlert({ message, setMessage, tone = 'error' }) {
  return (
    <div
      role={tone === 'success' ? 'status' : 'alert'}
      className={'alert' + (tone === 'success' ? ' alert--success' : '')}
    >
      {message}{' '}
      <button type="button" aria-label="Tutup pesan" onClick={() => setMessage('')}>
        ×
      </button>
    </div>
  );
}
