import React from 'react';
import { Link } from 'react-router-dom';

function ProfilePage({ user, onLogout }) {
  if (!user) {
    return <div style={{paddingTop: "150px", textAlign: "center"}}>Загрузка профиля...</div>;
  }

  // 1. Конфигурация для каждого тарифа (какой класс и какие услуги показывать)
  const TARIFF_CONFIG = {
    'Light': {
      cssClass: 'light-tariff',
      features: [
        'безлимитный доступ в клуб',
        'тренажерный зал',
        'анализ состава тела InBody',
        'бесплатные тренировки с тренером (Smart Start)',
        'мобильное приложение'
      ]
    },
    'Smart': {
      cssClass: 'smart-tariff',
      features: [
        'безлимитный доступ в клуб',
        'тренажерный зал',
        'анализ состава тела InBody',
        'бесплатные тренировки с тренером (Smart Start)',
        'мобильное приложение',
        'групповые занятия' // Добавлено для Smart
      ]
    },
    'Infinity': {
      cssClass: 'infinity-tariff',
      features: [
        'безлимитный доступ во все клубы сети',
        'доступ для друзей',
        'семейный доступ',
        'тренажерный зал',
        'анализ состава тела InBody',
        'бесплатные тренировки с тренером (Smart Start)',
        'мобильное приложение',
        'групповые занятия',
        'SPA-зона' // Добавлено для Infinity
      ]
    }
  };

  // 2. Получаем настройки для текущего тарифа пользователя
  // Если тариф не найден (например, старый юзер), берем Light по умолчанию
  const currentConfig = TARIFF_CONFIG[user.tariff] || TARIFF_CONFIG['Light'];

  return (
    <>
      <div className="profile-container">
        <div className="profile-content">
          <h2 className="profile-heading">Ваш абонемент:</h2>
          
          {/* 
              3. Комбинируем класс карточки профиля и класс цвета тарифа.
              active-tariff-card дает форму и тень.
              currentConfig.cssClass (например, smart-tariff) дает цвет фона и текста.
          */}
          <div className={`active-tariff-card ${currentConfig.cssClass}`} style={{position: 'relative'}}>
            
            {/* Название Тарифа */}
            {/* Цвет наследуется от класса тарифа (см. CSS) */}
            <h3 className="tariff-name">{user.tariff}</h3>
            
            {/* Название Клуба */}
            <div className="profile-club-info">
                Клуб: <span>{user.club || "Не выбран"}</span>
            </div>

            {/* Список услуг */}
            <ul className="tariff-details-list">
              {currentConfig.features.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="tariff-dates">
            <p>Оформлен: <span>{user.startDate}</span></p>
            <p>Истекает: <span>{user.endDate}</span></p>
          </div>
          
          <div style={{marginTop: "20px"}}>
             <Link to="/tariffs" className="btn">Сменить тариф</Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;