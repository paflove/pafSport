import React from 'react';
import { Link } from 'react-router-dom';

function ClubsPage({ onSelectClub }) {
  
  // Функция-обертка: сохраняет клуб и не мешает переходу по ссылке (хотя ссылка ведет на детали)
  // Но если мы хотим, чтобы кнопка "Выбрать клуб" вела сразу к тарифам (логично для покупки),
  // то можно изменить Link to="/tariffs".
  // В твоем коде было Link to="/club/..." (детали). 
  // Давай сделаем так: клик по карточке сохраняет клуб.

  const handleClubClick = (clubName) => {
    onSelectClub(clubName);
  };

  return (
    <>
      <div className="page-container">
        <div className="clubs-grid">
          
          <div className="club-card">
            <img src="/assets/images/city.jpg" alt="ТЦ 'Город'" /> 
            <h2>ТЦ "Город"</h2>
            <p>ш. Энтузиастов, 12 к.2, Москва, 11024</p>
            {/* Клик по кнопке сохраняет выбор */}
            <Link 
                to="/club/gorod" 
                className="btn"
                onClick={() => handleClubClick('ТЦ "Город"')}
            >
                Подробнее
            </Link>
          </div>

          <div className="club-card">
            <img src="/assets/images/afimoll.jpg" alt="ТЦ 'Афимолл'" />
            <h2>ТЦ "Афимолл"</h2>
            <p>Пресненская наб., 2, Москва, 123112</p>
            <Link 
                to="/club/afimoll" 
                className="btn"
                onClick={() => handleClubClick('ТЦ "Афимолл"')}
            >
                Подробнее
            </Link>
          </div>

          <div className="club-card">
            <img src="/assets/images/rivera.png" alt="ТЦ 'Ривьера'" />
            <h2>ТЦ "Ривьера"</h2>
            <p>Автозаводская ул., 18, Москва, 115280</p>
            <Link 
                to="/club/riviera" 
                className="btn"
                onClick={() => handleClubClick('ТЦ "Ривьера"')}
            >
                Подробнее
            </Link>
          </div>
          
        </div>
      </div>
    </>
  );
}

export default ClubsPage;