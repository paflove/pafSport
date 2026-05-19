import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function HomePage({ onOpenModal }) {

  // НАТИВНОЕ SEO: Меняем теги при загрузке страницы
  useEffect(() => {
    document.title = "PafSport - Премиум Фитнес Клубы в Москве";
    
    // Ищем тег meta description и меняем его контент
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.content = "Лучшая сеть фитнес-клубов в Москве. Тренажерный зал, SPA, групповые тренировки и анализ InBody.";
    }
  },[]);

  return (
    <div className="container">
      <div className="image-panel" loading="lazy"></div>
      
      <div className="content-panel">
        <main>
          <h1>Лучшее место для ваших тренировок!</h1>
          <p>Наша задача обеспечить вам безопасность и комфорт. Ваша задача - прийти.</p>
          <Link to="/clubs" className="btn">Выбрать клуб</Link>
        </main>
      </div>
    </div>
  );
}

export default HomePage;