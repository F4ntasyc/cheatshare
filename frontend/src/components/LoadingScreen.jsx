import './LoadingScreen.css';

// Layar netral saat token ada tetapi akun/data awal belum siap.
export default function LoadingScreen({ error, onRetry, onLogout }) {
  return (
    <div className="loading-screen">
      <img src="/logo.png" alt="" width="192" height="109" />
      {error ? (
        <div className="loading-error" role="alert">
          <p>{error}</p>
          <div className="loading-actions">
            <button type="button" className="loading-btn" onClick={onRetry}>
              Coba lagi
            </button>
            <button
              type="button"
              className="loading-btn loading-btn--ghost"
              onClick={onLogout}
            >
              Keluar
            </button>
          </div>
        </div>
      ) : (
        <div className="loading-status" role="status" aria-busy="true">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Memuat…</span>
        </div>
      )}
    </div>
  );
}
