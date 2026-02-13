// src/pages/ProfilePage.jsx
import React from 'react';
import Header from '../components/Header';

function ProfilePage({ user, onLogout }) {
  // Если данных нет (например, страница перезагрузилась), показываем заглушку
  if (!user) {
    return <div>Загрузка...</div>;
  }

  return (
    <>
     
      
      <div className="profile-container">
        <div className="profile-content">
          <h2 className="profile-heading">Ваш тариф:</h2>
          
          {/* Карточка тарифа (стилизуем под Light Blue) */}
          <div className="active-tariff-card">
            <h3 className="tariff-name">{user.tariff}</h3>
            
            <ul className="tariff-details-list">
              <li>безлимитный доступ в клуб</li>
              <li>тренажерный зал</li>
              <li>анализ состава тела InBody</li>
              <li>бесплатные тренировки с тренером (Smart Start)</li>
              <li>мобильное приложение</li>
            </ul>
          </div>

          <div className="tariff-dates">
            <p>Оформлен: <span>{user.startDate}</span></p>
            <p>Истекает: <span>{user.endDate}</span></p>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;