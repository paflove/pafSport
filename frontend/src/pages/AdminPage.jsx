import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    if (totalPages <= 1) return null;
    return (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '20px' }}>
            {pages.map(page => (
                <button 
                    key={page} disabled={page === currentPage} onClick={() => onPageChange(page)}
                    style={{padding: '5px 10px', cursor: 'pointer'}}
                >
                    {page}
                </button>
            ))}
        </div>
    );
};

function AdminPage({ user }) {
    const [users, setUsers] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState('');
    
    const [searchParams, setSearchParams] = useSearchParams();

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const emailFilter = searchParams.get('email') || '';
    const roleFilter = searchParams.get('role') || '';
    const tariffFilter = searchParams.get('tariff') || '';

    const updateSearchParam = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) newParams.set(key, value);
        else newParams.delete(key);
        
        if (key !== 'page') newParams.set('page', '1');
        setSearchParams(newParams);
    };
    
    const fetchUsers = useCallback(async () => {
        try {
            const params = {
                skip: (currentPage - 1) * 5,
                limit: 5,
                email: emailFilter,
                role: roleFilter,
                tariff: tariffFilter,
            };
            const response = await api.get('/admin/users', { params });
            setUsers(response.data.users);
            setTotalPages(Math.ceil(response.data.total_users / 5));
        } catch (err) {
            setError("Ошибка загрузки. Проверьте права.");
        }
    }, [searchParams, currentPage, emailFilter, roleFilter, tariffFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDelete = async (email) => {
        if (window.confirm(`Удалить ${email}?`)) {
            try {
                await api.delete(`/admin/users/${email}`);
                fetchUsers(); 
            } catch (err) {
                alert("Ошибка удаления");
            }
        }
    };

    if (user && user.role !== 'admin') return <div style={{paddingTop: '150px', textAlign:'center'}}>Доступ запрещен</div>;

    return (
        <div className="page-container" style={{ paddingTop: "120px" }}>
            <h1 style={{ color: "#6F4E37", textAlign: "center" }}>Панель Администратора</h1>
            
            <div style={{ maxWidth: "900px", margin: "20px auto", display: 'flex', gap: '15px', padding: '15px', background: '#fdfaf5', borderRadius: '10px' }}>
                <input 
                    type="text" placeholder="Поиск по Email..." value={emailFilter}
                    onChange={(e) => updateSearchParam('email', e.target.value)} style={{padding: '8px', flexGrow: 1}}
                />
                <select value={roleFilter} onChange={(e) => updateSearchParam('role', e.target.value)} style={{padding: '8px'}}>
                    <option value="">Все роли</option><option value="user">User</option><option value="admin">Admin</option>
                </select>
                <select value={tariffFilter} onChange={(e) => updateSearchParam('tariff', e.target.value)} style={{padding: '8px'}}>
                    <option value="">Все тарифы</option><option value="Light">Light</option><option value="Smart">Smart</option><option value="Infinity">Infinity</option>
                </select>
            </div>

            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

            <div style={{ maxWidth: "900px", margin: "0 auto", background: "white", padding: "20px", borderRadius: "15px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: 'left' }}>
                    <thead><tr style={{borderBottom: '2px solid #eee'}}><th style={{padding:'10px'}}>Email</th><th style={{padding:'10px'}}>Тариф</th><th style={{padding:'10px'}}>Действие</th></tr></thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.email} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{padding: "10px", display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    <img src={u.avatar_url ? u.avatar_url : '/assets/images/default-avatar.png'} alt="" style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}}/>
                                    {u.email}
                                </td>
                                <td style={{padding: "10px"}}>{u.tariff}</td>
                                <td style={{padding: "10px"}}>
                                    <button onClick={() => handleDelete(u.email)} style={{cursor: 'pointer', background: '#e57373', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px'}}>
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => updateSearchParam('page', page.toString())} />
            </div>
        </div>
    );
}

export default AdminPage;