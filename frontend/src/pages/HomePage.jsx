import React from 'react';
import { Link } from 'react-router-dom';
// Header удален, так как он есть в App.jsx

function HomePage({ onOpenModal }) {
  return (
    <div className="container">
      <div className="image-panel"></div>
      <div className="content-panel">
        
        {/* Header удален отсюда */}

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