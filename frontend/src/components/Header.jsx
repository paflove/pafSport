import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header({ onOpenModal, user, onLogout, isHomePage = false, isDetailsPage = false }) {
  const navigate = useNavigate();

  let headerClass = 'top-header';
  
  if (isHomePage) {
    // Используется внутри .content-panel
  } else if (isDetailsPage) {
    headerClass += ' fixed-header';
  } else {
    headerClass = 'global-header';
  }

  // Обработчик для клика по "Профилю" (если НЕ залогинен)
  const handleAuthClick = (e) => {
    e.preventDefault();
    onOpenModal(); 
  };

  // Обработчик перехода в профиль (если залогинен)
  const goToProfile = (e) => {
    e.preventDefault();
    navigate('/profile');
  };

  return (
    <header className={headerClass}>
      <Link to="/" className="logo">*PafSport</Link>
      <nav>
        <Link to="/clubs">Клубы</Link>
        <Link to="/tariffs">Тарифы</Link>

        {/* ПРОВЕРКА: Авторизован пользователь или нет */}
        {user ? (
          <div className="user-nav" style={{ display: 'inline-flex', alignItems: 'center', gap: '20px', marginLeft: '40px' }}>
            {/* Клик по почте ведет в личный кабинет */}
            <a href="/profile" onClick={goToProfile} className="user-email">
              {user.email}
            </a>
            <button onClick={onLogout} className="logout-btn">
              Выйти
            </button>
          </div>
        ) : (
          /* Если пользователя нет, показываем кнопку входа */
          <a href="#" onClick={handleAuthClick}>
            Профиль
          </a>
        )}
      </nav>
    </header>
  );
}

export default Header;