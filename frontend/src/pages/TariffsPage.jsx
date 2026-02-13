import React from 'react';
import Header from '../components/Header'; // Импортируем шапку

function TariffsPage({ onOpenModal }) {
  return (
    <>
      {/* Шапка для других страниц (fixed, .global-header) */}
      <Header onOpenModal={onOpenModal} />

      <div className="tariffs-container">
        <div className="tariffs-grid">
          
          <div className="tariff-card light-tariff">
            <h2>Light</h2>
            {/* ИСПРАВЛЕНИЕ: Полный список */}
            <ul className="tariff-features">
              <li>безлимитный доступ в клуб</li>
              <li>тренажерный зал</li>
              <li>анализ состава тела InBody</li>
              <li>бесплатные тренировки с тренером (Smart Start)</li>
              <li>мобильное приложение</li>
            </ul>
            <button onClick={onOpenModal} className="btn btn-tariff light-btn">Выбрать тариф</button>
          </div>

          <div className="tariff-card smart-tariff">
            <h2>Smart</h2>
            {/* ИСПРАВЛЕНИЕ: Полный список */}
            <ul className="tariff-features">
              <li>безлимитный доступ в клуб</li>
              <li>тренажерный зал</li>
              <li>анализ состава тела InBody</li>
              <li>бесплатные тренировки с тренером (Smart Start)</li>
              <li>мобильное приложение</li>
              <li>групповые занятия</li>
            </ul>
            <button onClick={onOpenModal} className="btn btn-tariff smart-btn">Выбрать тариф</button>
          </div>

          <div className="tariff-card infinity-tariff">
            <h2>Infinity</h2>
            {/* ИСПРАВЛЕНИЕ: Полный список */}
            <ul className="tariff-features">
              <li>безлимитный доступ во все клубы сети</li>
              <li>доступ для друзей</li>
              <li>семейный доступ</li>
              <li>тренажерный зал</li>
              <li>анализ состава тела InBody</li>
              <li>бесплатные тренировки с тренером (Smart Start)</li>
              <li>мобильное приложение</li>
              <li>групповые занятия</li>
              <li>SPA-зона</li>
            </ul>
            <button onClick={onOpenModal} className="btn btn-tariff infinity-btn">Выбрать тариф</button>
          </div>
          
        </div>
      </div>
    </>
  );
}

export default TariffsPage;