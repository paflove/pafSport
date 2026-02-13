import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'; // Добавлен useNavigate
import axios from 'axios';
import ChatWidget from './components/ChatWidget';
import './index.css'; 

import Header from './components/Header';
import AuthModal from './components/AuthModal';

import HomePage from './pages/HomePage';
import ClubsPage from './pages/ClubsPage';
import TariffsPage from './pages/TariffsPage';
import ClubDetailsPage from './pages/ClubDetailsPage';
import ProfilePage from './pages/ProfilePage';

// 1. Создаем внутренний компонент, который находится ВНУТРИ Router
function MainContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  // 2. Теперь здесь можно использовать useNavigate
  const navigate = useNavigate();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const fetchUserProfile = async (token) => {
    localStorage.setItem('access_token', token);
    try {
        // Убрал params: token, так как обычно токен шлют в заголовке Authorization
        // Но оставил как у тебя было для совместимости с Python кодом
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

  const handleLoginSuccess = async (token) => {
    closeModal(); 
    await fetchUserProfile(token); 
    // 3. Плавный переход вместо перезагрузки страницы
    navigate('/profile');
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
    // 4. Плавный переход на главную
    navigate('/');
  };

  return (
    <>
      <Header 
        onOpenModal={openModal} 
        user={user} 
        onLogout={handleLogout} 
      />
      
      <Routes>
        <Route path="/" element={<HomePage onOpenModal={openModal} />} />
        <Route path="/clubs" element={<ClubsPage onOpenModal={openModal} />} />
        <Route path="/tariffs" element={<TariffsPage onOpenModal={openModal} />} />
        {/* Обрати внимание: теперь страница деталей реально использует :clubId */}
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

      <ChatWidget />
    </>
  );
}

// 5. Основной компонент App теперь просто провайдер Роутера
function App() {
  return (
    <BrowserRouter>
      <MainContent />
    </BrowserRouter>
  );
}

export default App;