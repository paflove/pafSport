import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const CLUB_ID_MAP = {
  'riviera': 1,
  'gorod': 2,
  'afimoll': 3
};

function ClubDetailsPage({ onOpenModal, onSelectClub }) {
  const { clubId } = useParams();
  const [clubData, setClubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        setLoading(true);
        const backendId = CLUB_ID_MAP[clubId];
        if (!backendId) throw new Error("Клуб не найден");

        const response = await axios.get(`http://localhost:8000/api/v1/clubs/${backendId}`);
        setClubData(response.data);
      } catch (err) {
        console.error(err);
        setError("Ошибка загрузки данных");
      } finally {
        setLoading(false);
      }
    };
    fetchClubData();
  }, [clubId]);

  if (loading) return <div style={{padding:"100px", textAlign:"center"}}>Загрузка...</div>;
  if (error) return <div style={{padding:"100px", textAlign:"center"}}>{error}</div>;
  if (!clubData) return null;

  return (
    <>
      <div className="page-container">
        <div className="details-content-panel">
          
          <div className="club-header-info">
            <h2 className="club-title">{clubData.name}</h2>
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
                    {clubData.load_data.map((val, index) => (
                      <div key={index} className="bar" style={{ height: `${val}%` }}></div>
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
                    onError={(e) => { e.target.src = clubData.image; }}
                    alt={clubData.name} 
                    className="club-image" 
                />
              </div>
              {/* Клик по кнопке сохраняет клуб и ведет к Тарифам */}
              <Link 
                  to="/tariffs" 
                  className="btn btn-green"
                  onClick={() => onSelectClub(clubData.name)}
              >
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