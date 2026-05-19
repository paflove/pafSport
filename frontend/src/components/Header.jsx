import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Header({ onOpenModal, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/';
  let navClass = "top-header"; 
  if (isHomePage) navClass += " home-header-overlay";
  else navClass = "global-header";

  return (
    <header className={navClass}>
      <Link to="/" className="logo">*PafSport</Link>
      <nav>
        <Link to="/clubs">Клубы</Link>
        <Link to="/tariffs">Тарифы</Link>

        {user && user.role === 'admin' && (
            <Link to="/admin" style={{color: "red", fontWeight: "bold"}}>Админка</Link>
        )}

        {user ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '15px', marginLeft: '40px' }}>
            <img 
                src={user.avatar_url ? user.avatar_url : '/assets/images/default-avatar.png'} 
                alt="avatar" 
                style={{width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid #6F4E37'}}
                onClick={() => navigate('/profile')}
            />
            <span onClick={() => navigate('/profile')} style={{ cursor: 'pointer', fontWeight: 'bold', color: '#6F4E37' }}>
              {user.email} 
            </span>
            <button onClick={onLogout} className="logout-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: '#8B5A2B' }}>
              Выйти
            </button>
          </div>
        ) : (
          <a href="#" onClick={(e) => { e.preventDefault(); onOpenModal(); }}>Профиль</a>
        )}
      </nav>
    </header>
  );
}

export default Header;