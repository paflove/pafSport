import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
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

function MainContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // --- ФУНКЦИЯ ВЫБОРА (Клуба или Тарифа) ---
  const updateUserPreference = async (type, value) => {
    // type: 'club' | 'tariff'
    // value: 'ТЦ Ривьера' | 'Smart'
    
    if (user) {
        // 1. Если пользователь вошел, сразу обновляем на сервере
        try {
            const token = localStorage.getItem('access_token');
            // Формируем объект { club: "..." } или { tariff: "..." }
            const payload = { [type]: value }; 
            
            await axios.patch('http://localhost:8000/api/v1/users/me/info', payload, {
                params: { token: token }
            });
            
            // Обновляем локальный стейт, чтобы сразу отобразилось
            setUser(prev => ({ ...prev, [type]: value }));
        } catch (error) {
            console.error(`Ошибка обновления ${type}:`, error);
        }
    } else {
        // 2. Если НЕ вошел, сохраняем в память браузера
        console.log(`Сохранено локально: ${type} = ${value}`);
        localStorage.setItem(`pending_${type}`, value);
        
        // Если выбрали тариф, обычно сразу просим войти
        if (type === 'tariff') {
            openModal();
        }
    }
  };

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

  const handleLoginSuccess = async (token) => {
    // 1. Сначала закрываем окно
    closeModal(); 
    
    // 2. ПРОВЕРЯЕМ, БЫЛ ЛИ ОТЛОЖЕННЫЙ ВЫБОР
    const pendingClub = localStorage.getItem('pending_club');
    const pendingTariff = localStorage.getItem('pending_tariff');

    if (pendingClub || pendingTariff) {
        try {
            // Отправляем всё, что накопилось, на сервер
            await axios.patch('http://localhost:8000/api/v1/users/me/info', {
                club: pendingClub || undefined,
                tariff: pendingTariff || undefined
            }, {
                params: { token: token }
            });
            // Чистим память
            localStorage.removeItem('pending_club');
            localStorage.removeItem('pending_tariff');
        } catch (err) {
            console.error("Ошибка синхронизации данных:", err);
        }
    }

    // 3. Теперь загружаем уже обновленный профиль
    await fetchUserProfile(token); 
    
    // 4. Идем в профиль
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
        
        {/* Передаем функцию выбора в страницы */}
        <Route 
            path="/clubs" 
            element={<ClubsPage onSelectClub={(name) => updateUserPreference('club', name)} />} 
        />
        
        <Route 
            path="/tariffs" 
            element={<TariffsPage onSelectTariff={(name) => updateUserPreference('tariff', name)} />} 
        />
        
        <Route 
            path="/club/:clubId" 
            element={<ClubDetailsPage onOpenModal={openModal} onSelectClub={(name) => updateUserPreference('club', name)} />} 
        />
        
        <Route path="/profile" element={<ProfilePage user={user} onLogout={handleLogout} />} />
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

function App() {
  return (
    <BrowserRouter>
      <MainContent />
    </BrowserRouter>
  );
}

export default App;