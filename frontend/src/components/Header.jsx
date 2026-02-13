import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Header({ onOpenModal, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/';
  
  let navClass = "top-header"; 
  
  if (isHomePage) {
    navClass += " home-header-overlay";
  } else {
    navClass = "global-header";
  }

  const handleAuthClick = (e) => {
    e.preventDefault();
    onOpenModal(); 
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    navigate('/profile');
  };

  return (
    <header className={navClass}>
      <Link to="/" className="logo">*PafSport</Link>
      <nav>
        <Link to="/clubs">Клубы</Link>
        <Link to="/tariffs">Тарифы</Link>

        {/* --- НОВОЕ: Ссылка на админку только для администратора --- */}
        {user && user.role === 'admin' && (
            <Link to="/admin" style={{color: "red", fontWeight: "bold"}}>Админка</Link>
        )}

        {user ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '20px', marginLeft: '40px' }}>
            <span 
                onClick={handleProfileClick} 
                style={{ cursor: 'pointer', fontWeight: 'bold', color: '#6F4E37' }}
            >
              {user.email} 
              {/* Можно отобразить роль рядом с email */}
              {user.role === 'admin' && <span style={{fontSize: "0.8em", color: "red", marginLeft: "5px"}}>(ADM)</span>}
            </span>
            <button 
                onClick={onLogout} 
                className="logout-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: '#8B5A2B' }}
            >
              Выйти
            </button>
          </div>
        ) : (
          <a href="#" onClick={handleAuthClick}>
            Профиль
          </a>
        )}
      </nav>
    </header>
  );
}

export default Header;