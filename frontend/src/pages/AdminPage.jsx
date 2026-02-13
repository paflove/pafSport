import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminPage({ user }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Загрузка списка пользователей
  useEffect(() => {
    // Если юзер не админ - выкидываем на главную (Frontend защита)
    if (user && user.role !== 'admin') {
        navigate('/');
        return;
    }

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        // ВАЖНО: В axios get параметры передаются через params, но token у нас ожидается 
        // в query params по старой логике get_current_user(token: str).
        // Но так как мы переделали на Depends(get_current_user), 
        // FastAPI ожидает query param 'token' (так как имя аргумента 'token').
        // Чтобы было красивее, лучше передавать в Headers, но оставим совместимость с кодом:
        const response = await axios.get('http://localhost:8000/api/v1/admin/users', {
            params: { token: token }
        });
        setUsers(response.data);
      } catch (err) {
        console.error(err);
        setError("Ошибка доступа или загрузки данных");
      }
    };

    if (user) {
        fetchUsers();
    }
  }, [user, navigate]);

  // Функция смены роли
  const changeRole = async (email, newRole) => {
    try {
        const token = localStorage.getItem('access_token');
        await axios.patch(`http://localhost:8000/api/v1/admin/users/${email}/role`, 
        { role: newRole }, 
        { params: { token: token } } // Передаем токен для авторизации админа
        );
        
        // Обновляем локальный стейт
        setUsers(users.map(u => u.email === email ? { ...u, role: newRole } : u));
    } catch (err) {
        alert("Ошибка при смене роли: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="page-container" style={{paddingTop: "120px"}}>
      <h1 style={{color: "#6F4E37", textAlign: "center"}}>Панель Администратора</h1>
      
      {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}

      <div style={{maxWidth: "800px", margin: "0 auto", background: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)"}}>
        <table style={{width: "100%", borderCollapse: "collapse"}}>
            <thead>
                <tr style={{borderBottom: "2px solid #F8D7B5"}}>
                    <th style={{padding: "10px", textAlign: "left"}}>Email</th>
                    <th style={{padding: "10px", textAlign: "left"}}>Тариф</th>
                    <th style={{padding: "10px", textAlign: "left"}}>Роль</th>
                    <th style={{padding: "10px", textAlign: "left"}}>Действие</th>
                </tr>
            </thead>
            <tbody>
                {users.map(u => (
                    <tr key={u.email} style={{borderBottom: "1px solid #eee"}}>
                        <td style={{padding: "10px"}}>{u.email}</td>
                        <td style={{padding: "10px"}}>{u.tariff}</td>
                        <td style={{padding: "10px"}}>
                            {/* Бейджик роли */}
                            <span style={{
                                padding: "4px 8px", 
                                borderRadius: "4px",
                                backgroundColor: u.role === 'admin' ? '#F8D7B5' : '#e0e0e0',
                                fontWeight: "bold"
                            }}>
                                {u.role}
                            </span>
                        </td>
                        <td style={{padding: "10px"}}>
                            {u.role === 'user' ? (
                                <button 
                                    onClick={() => changeRole(u.email, 'admin')}
                                    style={{cursor: "pointer", background: "#6F4E37", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px"}}
                                >
                                    Сделать Админом
                                </button>
                            ) : (
                                <button 
                                    onClick={() => changeRole(u.email, 'user')}
                                    style={{cursor: "pointer", background: "#aaa", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px"}}
                                >
                                    Разжаловать
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPage;