import axios from 'axios';

const api = axios.create({
    // Относительный путь. 
    // В Docker его перехватит Nginx, а локально - Vite Proxy (сделаем в шаге 2)
    baseURL: '/api/v1', 
    withCredentials: true 
});

api.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._isRetry) {
        originalRequest._isRetry = true;
        try {
            // Здесь тоже относительный путь
            await axios.post('/api/v1/auth/refresh', {}, {
                withCredentials: true 
            });
            return api.request(originalRequest);
        } catch (refreshError) {
            console.log("Сессия истекла");
            return Promise.reject(refreshError);
        }
    }
    return Promise.reject(error);
});

export default api;