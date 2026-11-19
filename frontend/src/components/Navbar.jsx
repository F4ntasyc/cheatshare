import './Navbar.css'

function Navbar({ currentUser, onLogout }) {
  return (
    <header className="navbar">
      <h2>CheatShare</h2>

      <div className="nav-actions">
        <span>
          {currentUser
            ? `Halo, ${currentUser.name}`
            : 'Memuat pengguna...'}
        </span>

        <button
          type="button"
          className="logout-button"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default Navbar
