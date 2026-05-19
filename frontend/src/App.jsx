import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import api from './api'; 
import ChatWidget from './components/ChatWidget';
import './index.css'; 
import Header from './components/Header';
import AuthModal from './components/AuthModal';

const HomePage = lazy(() => import('./pages/HomePage'));
const ClubsPage = lazy(() => import('./pages/ClubsPage'));
const TariffsPage = lazy(() => import('./pages/TariffsPage'));
const ClubDetailsPage = lazy(() => import('./pages/ClubDetailsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function MainContent() {
  const[isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const updateUserPreference = async (type, value) => {
    if (user) {
        try {
            await api.patch('/users/me/info', { [type]: value });
            setUser(prev => ({ ...prev, [type]: value }));
        } catch (error) { console.error(error); }
    } else {
        localStorage.setItem(`pending_${type}`, value);
        if (type === 'tariff') openModal();
    }
  };

  const fetchUserProfile = async () => {
    try {
        const response = await api.get('/users/me');
        setUser(response.data);
    } catch (error) { setUser(null); }
  };

  const handleLoginSuccess = async () => {
    closeModal(); 
    const pendingClub = localStorage.getItem('pending_club');
    const pendingTariff = localStorage.getItem('pending_tariff');
    if (pendingClub || pendingTariff) {
        try {
            await api.patch('/users/me/info', { club: pendingClub || undefined, tariff: pendingTariff || undefined });
            localStorage.removeItem('pending_club'); localStorage.removeItem('pending_tariff');
        } catch (err) {}
    }
    await fetchUserProfile(); 
    navigate('/profile');
  };

  useEffect(() => { fetchUserProfile(); },[]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (e) {} 
    finally { setUser(null); navigate('/'); }
  };

  return (
    <>
      <Header onOpenModal={openModal} user={user} onLogout={handleLogout} />
      
      <Suspense fallback={<div style={{paddingTop: '150px', textAlign: 'center'}}>Загрузка интерфейса...</div>}>
        <Routes>
            <Route path="/" element={<HomePage onOpenModal={openModal} />} />
            <Route path="/clubs" element={<ClubsPage onSelectClub={(name) => updateUserPreference('club', name)} />} />
            <Route path="/tariffs" element={<TariffsPage onSelectTariff={(name) => updateUserPreference('tariff', name)} />} />
            <Route path="/club/:clubId" element={<ClubDetailsPage onOpenModal={openModal} onSelectClub={(name) => updateUserPreference('club', name)} />} />
            <Route path="/profile" element={<ProfilePage user={user} onLogout={handleLogout} onUserUpdate={setUser} />} />
            <Route path="/admin" element={<AdminPage user={user} />} />
        </Routes>
      </Suspense>
      
      <AuthModal isOpen={isModalOpen} onClose={closeModal} onLoginSuccess={handleLoginSuccess} />
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