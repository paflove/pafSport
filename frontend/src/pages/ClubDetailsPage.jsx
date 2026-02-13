import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';

// ... (Ваша FAKE_DB и DAYS остаются здесь без изменений) ...
const FAKE_DB = {
  riviera: {
    title: 'ТЦ "Ривьера"',
    address: 'Автозаводская ул., 18, Москва, 115280',
    image: '/assets/images/rivera.png',
    features: [
      'Ежедневно с 6 до 24', 'Парковка', 'Групповые программы', 'SPA-зона', 
      'Удобные раздевалки и душевые', 'Премиальное оборудование'
    ],
    load: ['70%', '90%', '60%', '75%', '80%', '65%', '50%']
  },
  gorod: {
    title: 'ТЦ "Город"',
    address: 'ш. Энтузиастов, 12 к.2, Москва, 111024',
    image: '/assets/images/city.jpg',
    features: [
      'Ежедневно с 6 до 24', 'Парковка', 'Групповые программы', 'SPA-зона', 
      'Удобные раздевалки и душевые', 'Премиальное оборудование'
    ],
    load: ['95%', '70%', '75%', '65%', '85%', '55%', '45%']
  },
  afimoll: {
    title: 'ТЦ "Афимолл"',
    address: 'Пресненская наб., 2, Москва, 123112',
    image: '/assets/images/afimoll.jpg',
    features: [
      'Ежедневно с 6 до 24', 'Парковка', 'Групповые программы', 'SPA-зона', 
      'Удобные раздевалки и душевые', 'Премиальное оборудование'
    ],
    load: ['80%', '95%', '70%', '85%', '90%', '60%', '40%']
  }
};
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];


function ClubDetailsPage({ onOpenModal }) {
  const { clubId } = useParams(); 
  const clubData = FAKE_DB[clubId] || FAKE_DB.riviera;

  return (
    // ИСПРАВЛЕНИЕ: Мы убираем класс 'club-details-page' 
    // и используем ту же структуру, что и 'ClubsPage'
    <>
      {/* ИСПРАВЛЕНИЕ: 
        Мы больше не передаем 'isDetailsPage={true}'.
        Теперь компонент Header будет использовать '.global-header' 
        (шапку как на 2-м скриншоте), а не прозрачную.
      */}
      <Header onOpenModal={onOpenModal} />

      {/* ИСПРАВЛЕНИЕ:
        Мы используем '.page-container' (как на 'ClubsPage') 
        вместо '.details-container', чтобы отступ от шапки был правильным.
      */}
      <div className="page-container">
        <div className="details-content-panel">
          
          <div className="club-header-info">
            <h2 className="club-title">{clubData.title}</h2>
            <p className="club-address">{clubData.address}</p>
          </div>

          <div className="details-main-grid">
            
            <div className="details-left-column">
              <ul className="club-features-list">
                {clubData.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>

              <div className="club-load-chart">
                <h3>Загруженность</h3>
                <div className="chart-area">
                  <div className="bar-chart">
                    {clubData.load.map((height, index) => (
                      <div 
                        key={index}
                        className="bar" 
                        style={{ height: height }}
                        title={DAYS[index]}
                      ></div>
                    ))}
                  </div>
                  <div className="chart-labels">
                    {DAYS.map(day => <span key={day}>{day}</span>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="details-right-column">
              <div className="club-image-wrapper">
                <img src={clubData.image} alt={clubData.title} className="club-image" />
              </div>
              <Link to="/tariffs" className="btn btn-green">Выбрать клуб</Link>
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
}

export default ClubDetailsPage;