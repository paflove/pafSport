import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import ChatWidget from './components/ChatWidget'; // <-- Импорт виджета
// Импорт стилей
import './index.css'; 

// Импорт компонентов
import Header from './components/Header';
import AuthModal from './components/AuthModal';

// Импорт страниц
import HomePage from './pages/HomePage';
import ClubsPage from './pages/ClubsPage';
import TariffsPage from './pages/TariffsPage';
import ClubDetailsPage from './pages/ClubDetailsPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null); 

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const fetchUserProfile = async (token) => {
    localStorage.setItem('access_token', token);

    try {
        const response = await axios.get('http://localhost:8000/api/v1/users/me', {
            params: { token: token } 
        });
        setUser(response.data);
    } catch (error) {
        console.error("Ошибка загрузки профиля:", error);
        localStorage.removeItem('access_token');
        setUser(null);
    }
  };

  // Исправленная логика: добавлен async и редирект
  const handleLoginSuccess = async (token) => {
    closeModal(); 
    await fetchUserProfile(token); 
    window.location.href = '/profile'; // Перенаправление
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
        fetchUserProfile(storedToken);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    window.location.href = '/'; 
  };

  return (
    <BrowserRouter>
      <Header 
        onOpenModal={openModal} 
        user={user} 
        onLogout={handleLogout} 
      />
      
      <Routes>
        <Route path="/" element={<HomePage onOpenModal={openModal} />} />
        <Route path="/clubs" element={<ClubsPage onOpenModal={openModal} />} />
        <Route path="/tariffs" element={<TariffsPage onOpenModal={openModal} />} />
        <Route path="/club/:clubId" element={<ClubDetailsPage onOpenModal={openModal} />} />
        
        <Route 
            path="/profile" 
            element={<ProfilePage user={user} onLogout={handleLogout} />} 
        />
        
        <Route path="/information" element={<h1>Информация</h1>} />
      </Routes>
      
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onLoginSuccess={handleLoginSuccess} 
      />

      {/* --- ДОБАВЛЕН ВИДЖЕТ ЧАТА --- */}
      {/* Он находится вне Routes, чтобы быть доступным на любой странице */}
      <ChatWidget />
      
    </BrowserRouter>
  );
}

export default App;