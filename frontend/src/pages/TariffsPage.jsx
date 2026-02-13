import React from 'react';

function TariffsPage({ onSelectTariff }) {
  
  // Обработчик просто передает название наверх
  const handleSelect = (tariffName) => {
    onSelectTariff(tariffName);
  };

  return (
    <>
      <div className="tariffs-container">
        <div className="tariffs-grid">
          
          <div className="tariff-card light-tariff">
            <h2>Light</h2>
            <ul className="tariff-features">
              <li>безлимитный доступ в клуб</li>
              <li>тренажерный зал</li>
              <li>анализ состава тела InBody</li>
              <li>бесплатные тренировки с тренером (Smart Start)</li>
              <li>мобильное приложение</li>
            </ul>
            <button onClick={() => handleSelect('Light')} className="btn btn-tariff light-btn">Выбрать тариф</button>
          </div>

          <div className="tariff-card smart-tariff">
            <h2>Smart</h2>
            <ul className="tariff-features">
              <li>безлимитный доступ в клуб</li>
              <li>тренажерный зал</li>
              <li>анализ состава тела InBody</li>
              <li>бесплатные тренировки с тренером (Smart Start)</li>
              <li>мобильное приложение</li>
              <li>групповые занятия</li>
            </ul>
            <button onClick={() => handleSelect('Smart')} className="btn btn-tariff smart-btn">Выбрать тариф</button>
          </div>

          <div className="tariff-card infinity-tariff">
            <h2>Infinity</h2>
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
            <button onClick={() => handleSelect('Infinity')} className="btn btn-tariff infinity-btn">Выбрать тариф</button>
          </div>
          
        </div>
      </div>
    </>
  );
}

export default TariffsPage;