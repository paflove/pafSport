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
import AdminPage from './pages/AdminPage'; // <-- Импорт

function MainContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // --- ЛОГИКА ВЫБОРА ---
  const updateUserPreference = async (type, value) => {
    if (user) {
        try {
            const token = localStorage.getItem('access_token');
            const payload = { [type]: value }; 
            await axios.patch('http://localhost:8000/api/v1/users/me/info', payload, {
                params: { token: token }
            });
            setUser(prev => ({ ...prev, [type]: value }));
        } catch (error) {
            console.error(`Ошибка обновления ${type}:`, error);
        }
    } else {
        localStorage.setItem(`pending_${type}`, value);
        if (type === 'tariff') {
            openModal();
        }
    }
  };

  const fetchUserProfile = async (token) => {
    localStorage.setItem('access_token', token);
    try {
        // Теперь get_current_user требует query param 'token'
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
    const pendingClub = localStorage.getItem('pending_club');
    const pendingTariff = localStorage.getItem('pending_tariff');

    if (pendingClub || pendingTariff) {
        try {
            await axios.patch('http://localhost:8000/api/v1/users/me/info', {
                club: pendingClub || undefined,
                tariff: pendingTariff || undefined
            }, {
                params: { token: token }
            });
            localStorage.removeItem('pending_club');
            localStorage.removeItem('pending_tariff');
        } catch (err) {
            console.error("Ошибка синхронизации данных:", err);
        }
    }

    await fetchUserProfile(token); 
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

        {/* --- НОВЫЙ МАРШРУТ: АДМИНКА --- */}
        <Route path="/admin" element={<AdminPage user={user} />} />
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