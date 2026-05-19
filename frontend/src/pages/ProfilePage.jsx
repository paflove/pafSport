import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function ProfilePage({ user, onLogout, onUserUpdate }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(user);

    useEffect(() => { 
        setCurrentUser(user); 
    }, [user]);

    const handleFileChange = (event) => setSelectedFile(event.target.files[0]);

    const handleUpload = async () => {
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append('file', selectedFile);
        setError(''); setUploadProgress(0);
        
        try {
            const response = await api.post('/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total))
            });
            setCurrentUser(response.data);
            if (onUserUpdate) onUserUpdate(response.data); // Обновляем аватарку в шапке
            alert("Аватар успешно обновлен!");
        } catch (err) {
            setError(err.response?.data?.detail || "Ошибка загрузки");
        } finally {
            setUploadProgress(0); setSelectedFile(null);
        }
    };
    
    if (!currentUser) return <div style={{ paddingTop: "150px", textAlign: "center" }}>Загрузка профиля...</div>;

    // --- ВОССТАНОВЛЕННЫЙ ПОЛНЫЙ СПИСОК УСЛУГ ---
    const TARIFF_CONFIG = {
        'Light': { 
            cssClass: 'light-tariff', 
            features:[
                'безлимитный доступ в клуб',
                'тренажерный зал',
                'анализ состава тела InBody',
                'бесплатные тренировки с тренером (Smart Start)',
                'мобильное приложение'
            ] 
        },
        'Smart': { 
            cssClass: 'smart-tariff', 
            features:[
                'безлимитный доступ в клуб',
                'тренажерный зал',
                'анализ состава тела InBody',
                'бесплатные тренировки с тренером (Smart Start)',
                'мобильное приложение',
                'групповые занятия'
            ] 
        },
        'Infinity': { 
            cssClass: 'infinity-tariff', 
            features:[
                'безлимитный доступ во все клубы сети',
                'доступ для друзей',
                'семейный доступ',
                'тренажерный зал',
                'анализ состава тела InBody',
                'бесплатные тренировки с тренером (Smart Start)',
                'мобильное приложение',
                'групповые занятия',
                'SPA-зона'
            ] 
        }
    };
    const tariffName = currentUser.tariff || 'Light';
    const currentConfig = TARIFF_CONFIG[tariffName] || TARIFF_CONFIG['Light'];

    return (
        <div className="profile-container">
            <div className="profile-content">
                <h2 className="profile-heading">Личный кабинет</h2>

                <div style={{textAlign: 'center', marginBottom: '20px'}}>
                    <img 
                        src={currentUser.avatar_url ? currentUser.avatar_url : '/assets/images/default-avatar.png'} 
                        alt="Avatar" style={{width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #F8D7B5'}}
                    />
                    <div style={{marginTop: '15px'}}>
                        <input type="file" onChange={handleFileChange} accept="image/*" />
                        <button onClick={handleUpload} disabled={!selectedFile} style={{cursor: "pointer"}}>Загрузить</button>
                    </div>
                    {uploadProgress > 0 && (
                        <div style={{width: '100%', background: '#eee', borderRadius: '5px', marginTop: '10px'}}>
                            <div style={{width: `${uploadProgress}%`, background: '#6F4E37', color: 'white', textAlign: 'center', borderRadius: '5px'}}>{uploadProgress}%</div>
                        </div>
                    )}
                    {error && <p style={{color: 'red'}}>{error}</p>}
                </div>

                <div className={`active-tariff-card ${currentConfig.cssClass}`}>
                    <h3 className="tariff-name">{tariffName}</h3>
                    <div className="profile-club-info">Клуб: <span>{currentUser.club || "Не выбран"}</span></div>
                    <ul className="tariff-details-list">
                        {currentConfig.features.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </div>

                {/* --- ВОССТАНОВЛЕННЫЕ ДАТЫ И КНОПКА СМЕНЫ ТАРИФА --- */}
                <div className="tariff-dates">
                    <p>Оформлен: <span>{currentUser.startDate}</span></p>
                    <p>Истекает: <span>{currentUser.endDate}</span></p>
                </div>
                
                <div style={{marginTop: "20px"}}>
                    <Link to="/tariffs" className="btn">Сменить тариф</Link>
                </div>

            </div>
        </div>
    );
}

export default ProfilePage;