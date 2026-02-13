import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Header({ onOpenModal, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Логика стилей:
  // Если мы на главной ('/') -> используем особый стиль (прозрачный/абсолютный)
  // В остальных случаях -> глобальный стиль (бежевый фон)
  const isHomePage = location.pathname === '/';
  
  // Базовый класс для навигации
  let navClass = "top-header"; 
  
  // Добавляем модификаторы в зависимости от страницы
  if (isHomePage) {
    navClass += " home-header-overlay"; // Новый класс для главной (см. CSS ниже)
  } else {
    navClass = "global-header"; // Стандартный класс для остальных страниц
  }

  // Обработчик для клика по "Профилю" (если НЕ залогинен)
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

        {/* Если user есть - показываем почту и выход. Если нет - кнопку Профиль */}
        {user ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '20px', marginLeft: '40px' }}>
            <span 
                onClick={handleProfileClick} 
                style={{ cursor: 'pointer', fontWeight: 'bold', color: '#6F4E37' }}
            >
              {user.email}
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