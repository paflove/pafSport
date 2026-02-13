import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios'; // 1. Импортируем axios
import Header from '../components/Header';

// 2. Дни недели статичны, их оставляем
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// 3. Карта сопоставления URL-slug -> ID клуба в базе данных
// (В URL у тебя /club/riviera, а бэкенд ждет ID=1)
const CLUB_ID_MAP = {
  'riviera': 1,
  'gorod': 2,
  'afimoll': 3
};

function ClubDetailsPage({ onOpenModal }) {
  const { clubId } = useParams(); // Получаем строку, например "riviera"
  
  // 4. Состояния для данных, загрузки и ошибок
  const [clubData, setClubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        setLoading(true);
        
        // Определяем цифровой ID
        const backendId = CLUB_ID_MAP[clubId];
        
        if (!backendId) {
          throw new Error("Клуб не найден в списке маппинга");
        }

        // 5. Реальный запрос к твоему API
        const response = await axios.get(`http://localhost:8000/api/v1/clubs/${backendId}`);
        setClubData(response.data);
      
      } catch (err) {
        console.error("Ошибка загрузки данных клуба:", err);
        setError("Не удалось загрузить данные о клубе. Возможно, сервер недоступен.");
      } finally {
        setLoading(false);
      }
    };

    fetchClubData();
  }, [clubId]);

  // 6. Отображение состояния загрузки или ошибки
  if (loading) return <div style={{padding: "100px", textAlign: "center"}}>Загрузка данных клуба...</div>;
  if (error) return <div style={{padding: "100px", textAlign: "center", color: "red"}}>{error}</div>;
  if (!clubData) return null;

  return (
    <>
      <Header onOpenModal={onOpenModal} />

      <div className="page-container">
        <div className="details-content-panel">
          
          <div className="club-header-info">
            <h2 className="club-title">{clubData.name}</h2> {/* Поле name вместо title (как в Python модели) */}
            <p className="club-address">{clubData.address}</p>
          </div>

          <div className="details-main-grid">
            
            <div className="details-left-column">
              <ul className="club-features-list">
                {/* 7. Рендерим особенности с бэкенда */}
                {clubData.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>

              <div className="club-load-chart">
                <h3>Загруженность</h3>
                <div className="chart-area">
                  <div className="bar-chart">
                    {/* 8. API возвращает числа (int), добавляем '%' для CSS */}
                    {clubData.load_data.map((val, index) => (
                      <div 
                        key={index}
                        className="bar" 
                        style={{ height: `${val}%` }} 
                        title={`${val}%`}
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
                {/* 9. Используем картинку с бэкенда. 
                   Если путь с бэкенда начинается с /images, добавляем /assets если нужно, 
                   но твой Python отдает /images/..., а фронт ждет /assets/images. 
                   Делаем фикс пути: */}
                <img 
                    src={`/assets${clubData.image}`} 
                    onError={(e) => { e.target.src = clubData.image; }} /* Фолбек */
                    alt={clubData.name} 
                    className="club-image" 
                />
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