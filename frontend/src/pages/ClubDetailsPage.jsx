import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

const DAYS =['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const CLUB_ID_MAP = { 'riviera': 1, 'gorod': 2, 'afimoll': 3 };

function ClubDetailsPage({ onOpenModal, onSelectClub }) {
  const { clubId } = useParams();
  const [clubData, setClubData] = useState(null);
  
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(false);

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const backendId = CLUB_ID_MAP[clubId];
        if (!backendId) return;
        const response = await api.get(`/clubs/${backendId}`);
        setClubData(response.data);
      } catch (err) { console.error(err); }
    };

    const fetchWeather = async () => {
        try {
            const resp = await api.get('/weather');
            if (resp.data.status === 'success') {
                setWeather(resp.data);
            } else {
                setWeatherError(true);
            }
        } catch(e) {
            setWeatherError(true);
        }
    };
    
    fetchClubData();
    fetchWeather();
  },[clubId]);

  // НАТИВНОЕ SEO для страницы клуба
  useEffect(() => {
      if (clubData) {
          // Меняем заголовок вкладки в браузере
          document.title = `Фитнес клуб ${clubData.name} - PafSport`;
          
          // Меняем описание для поисковиков
          let metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription) {
              metaDescription.content = `Фитнес клуб по адресу ${clubData.address}. Доступные цены и премиум оборудование.`;
          }
      }
  }, [clubData]);

  if (!clubData) return <div style={{paddingTop: "150px", textAlign: "center"}}>Загрузка данных клуба...</div>;

  return (
    <>
      <div className="page-container">
        <div className="details-content-panel">
          
          <div className="club-header-info" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
                <h2 className="club-title">{clubData.name}</h2>
                <p className="club-address">{clubData.address}</p>
            </div>
            
            <div style={{background: '#fdfaf5', padding: '10px 20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #F8D7B5'}}>
                <span style={{fontSize: '12px', color: '#8B5A2B', display: 'block', marginBottom: '5px'}}>Погода возле клуба</span>
                {weather ? (
                    <strong style={{color: '#6F4E37', fontSize: '18px'}}>+{weather.temp}°C, 💨 {weather.wind} km/h</strong>
                ) : weatherError ? (
                    <span style={{color: '#999'}}>Нет данных</span>
                ) : (
                    <span>Загрузка...</span>
                )}
            </div>
          </div>

          <div className="details-main-grid">
            <div className="details-left-column">
              <ul className="club-features-list">
                {clubData.features?.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              <div className="club-load-chart">
                <h3>Загруженность</h3>
                <div className="chart-area">
                  <div className="bar-chart">
                    {clubData.load_data?.map((val, index) => (
                      <div key={index} className="bar" style={{ height: `${val}%` }} title={`${val}%`}></div>
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
                <img 
                    src={`/assets${clubData.image}`} 
                    loading="lazy"
                    onError={(e) => { e.target.src = clubData.image; }}
                    alt={`Интерьер фитнес клуба ${clubData.name}`} 
                    className="club-image" 
                />
              </div>
              <Link to="/tariffs" className="btn btn-green" onClick={() => onSelectClub(clubData.name)}>
                  Выбрать этот клуб
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ClubDetailsPage;