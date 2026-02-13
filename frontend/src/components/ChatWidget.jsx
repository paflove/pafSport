import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';


function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    // Начальное сообщение
    const [messages, setMessages] = useState([
        { id: 1, text: "Привет! Я AI-помощник PafSport. Я знаю всё о наших клубах и ценах. Спрашивайте!", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // 1. Добавляем сообщение пользователя
        const userMsg = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // 2. Отправляем на сервер
            const response = await axios.post('http://localhost:8000/api/v1/support/chat', {
                message: userMsg.text
            });
            
            // 3. Получаем ответ от AI
            const botMsg = { id: Date.now() + 1, text: response.data.response, sender: 'bot' };
            setMessages(prev => [...prev, botMsg]);
            
        } catch (error) {
            console.error(error);
            const errorMsg = { id: Date.now() + 1, text: "Что-то пошло не так. Попробуйте позже.", sender: 'bot' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-widget-container">
            {/* Окно чата */}
            <div className={`chat-window ${isOpen ? 'active' : ''}`}>
                <div className="chat-header">
                    <span>Поддержка (AI)</span>
                    <button className="close-chat" onClick={() => setIsOpen(false)}>×</button>
                </div>
                
                <div className="chat-messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.sender}`}>
                            <div className="message-bubble">
                                {/* Здесь можно добавить парсинг Markdown, если AI вернет жирный текст */}
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message bot">
                            <div className="message-bubble typing">
                                <span>.</span><span>.</span><span>.</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={sendMessage}>
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Задайте вопрос..." 
                    />
                    <button type="submit" disabled={isLoading}>➤</button>
                </form>
            </div>

            {/* Кнопка открытия */}
            <button className={`chat-toggle-btn ${isOpen ? 'hidden' : ''}`} onClick={() => setIsOpen(true)}>
                💬
            </button>
        </div>
    );
}

export default ChatWidget;