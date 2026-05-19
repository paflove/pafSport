import React, { useState } from 'react';
import api from '../api'; 

function AuthModal({ isOpen, onClose, onLoginSuccess }) {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleClose = () => {
        onClose();
        setIsLoginView(true);
        setError('');
        setEmail('');
        setPassword('');
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const endpoint = isLoginView ? '/auth/login' : '/auth/register';
        
        try {
            // Запрос уходит. Сервер пришлет куки в заголовке Set-Cookie
            await api.post(endpoint, {
                email,
                password
            });

            // localStorage больше не используем!
            onLoginSuccess();

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
                    <h2 className="auth-title">{isLoginView ? 'Вход' : 'Регистрация'}</h2>
                    {error && <p style={{color: 'red', marginBottom: '15px'}}>{error}</p>}
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Email:</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Пароль:</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-auth login-btn">
                            {isLoginView ? 'Войти' : 'Зарегистрироваться'}
                        </button>
                    </form>
                    <button className="btn btn-auth register-btn" onClick={toggleView} type="button">
                        {isLoginView ? 'Регистрация' : 'У меня уже есть аккаунт'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AuthModal;