import React, { useState } from 'react';
import axios from 'axios';

// Адрес бэкенда
const API_URL = 'http://localhost:8000/api/v1/auth';

function AuthModal({ isOpen, onClose, onLoginSuccess }) {
    // true = Форма Входа, false = Форма Регистрации
    const [isLoginView, setIsLoginView] = useState(true);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    // Сброс полей при закрытии
    const handleClose = () => {
        onClose();
        setIsLoginView(true);
        setError('');
        setEmail('');
        setPassword('');
    };

    // Переключение между Входом и Регистрацией
    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Выбираем, куда стучаться
        const endpoint = isLoginView ? '/login' : '/register';
        
        try {
            // Отправляем данные (работает и для входа, и для регистрации)
            const response = await axios.post(`${API_URL}${endpoint}`, {
                email,
                password
            });

            // Получаем токен и передаем его в App.jsx
            const token = response.data.access_token;
            onLoginSuccess(token);

        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.detail || 'Ошибка сервера';
            setError(msg);
        }
    };

    return (
        <div className={isOpen ? "modal-overlay active" : "modal-overlay"} onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close-btn" onClick={handleClose}>&times;</span>
                
                <div className="auth-box">
                    <h2 className="auth-title">
                        {isLoginView ? 'Вход' : 'Регистрация'}
                    </h2>
                    
                    {error && <p style={{color: 'red', marginBottom: '15px'}}>{error}</p>}
                    
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="auth-email">Email:</label>
                            <input 
                                type="email" 
                                id="auth-email" 
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="example@mail.ru" 
                                required 
                            />
                        </div>
                        
                        <div className="input-group">
                            <label htmlFor="auth-password">Пароль:</label>
                            <input 
                                type="password" 
                                id="auth-password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="********" 
                                required 
                            />
                        </div>

                        <button type="submit" className="btn btn-auth login-btn">
                            {isLoginView ? 'Войти' : 'Зарегистрироваться'}
                        </button>
                    </form>

                    {/* Кнопка переключения режима */}
                    <button 
                        className="btn btn-auth register-btn" 
                        onClick={toggleView}
                        type="button" 
                    >
                        {isLoginView ? 'Регистрация' : 'У меня уже есть аккаунт'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AuthModal;