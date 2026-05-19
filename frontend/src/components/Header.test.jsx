import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Header from './Header';

describe('Header Component - RBAC Interface Testing', () => {

    it('должен отображать кнопку "Войти/Профиль", если пользователь не авторизован (Гость)', () => {
        render(
            <BrowserRouter>
                <Header user={null} onOpenModal={() => {}} onLogout={() => {}} />
            </BrowserRouter>
        );
        
        // Проверяем, что есть кнопка "Профиль"
        expect(screen.getByText('Профиль')).toBeInTheDocument();
        // Убеждаемся, что админки нет
        expect(screen.queryByText('Админка')).not.toBeInTheDocument();
    });

    it('НЕ должен отображать ссылку "Админка" для обычного пользователя (User)', () => {
        const mockUser = { email: 'user@test.com', role: 'user' };
        
        render(
            <BrowserRouter>
                <Header user={mockUser} onOpenModal={() => {}} onLogout={() => {}} />
            </BrowserRouter>
        );
        
        // Проверяем, что email пользователя отображается
        expect(screen.getByText(/user@test.com/i)).toBeInTheDocument();
        // САМОЕ ВАЖНОЕ: Проверяем, что ссылки "Админка" НЕТ в DOM дереве
        expect(screen.queryByText('Админка')).not.toBeInTheDocument();
    });

    it('ДОЛЖЕН отображать ссылку "Админка" для администратора (Admin)', () => {
        const mockAdmin = { email: 'admin@pafsport.ru', role: 'admin' };
        
        render(
            <BrowserRouter>
                <Header user={mockAdmin} onOpenModal={() => {}} onLogout={() => {}} />
            </BrowserRouter>
        );
        
        // Проверяем, что ссылка на Админку ПОЯВИЛАСЬ
        const adminLink = screen.getByText('Админка');
        expect(adminLink).toBeInTheDocument();
        expect(adminLink).toHaveAttribute('href', '/admin');
    });

});