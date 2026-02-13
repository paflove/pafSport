import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header'; // Импортируем шапку

function ClubsPage({ onOpenModal }) {
  return (
    <> {/* Используем Фрагмент, чтобы вернуть два элемента */}
      
      {/* Шапка для других страниц (fixed, .global-header) */}
      <Header onOpenModal={onOpenModal} />

      <div className="page-container">
        <div className="clubs-grid">
          
          <div className="club-card">
            {/* ИСПРАВЛЕН ПУТЬ */}
            <img src="/assets/images/city.jpg" alt="ТЦ 'Город'" /> 
            <h2>ТЦ "Город"</h2>
            <p>ш. Энтузиастов, 12 к.2, Москва, 11024</p>
            {/* Ссылка на динамический маршрут */}
            <Link to="/club/gorod" className="btn">Выбрать клуб</Link>
          </div>

          <div className="club-card">
            {/* ИСПРАВЛЕН ПУТЬ */}
            <img src="/assets/images/afimoll.jpg" alt="ТЦ 'Афимолл'" />
            <h2>ТЦ "Афимолл"</h2>
            <p>Пресненская наб., 2, Москва, 123112</p>
            <Link to="/club/afimoll" className="btn">Выбрать клуб</Link>
          </div>

          <div className="club-card">
            {/* ИСПРАВЛЕН ПУТЬ */}
            <img src="/assets/images/rivera.png" alt="ТЦ 'Ривьера'" />
            <h2>ТЦ "Ривьера"</h2>
            <p>Автозаводская ул., 18, Москва, 115280</p>
            <Link to="/club/riviera" className="btn">Выбрать клуб</Link>
          </div>
          
        </div>
      </div>
    </>
  );
}

export default ClubsPage;