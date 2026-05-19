import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app, fake_users_db, active_refresh_tokens, WeatherService

# Создаем тестового клиента (имитация браузера/фронтенда)
client = TestClient(app)

# ==========================================
# ФИКСТУРЫ (Изолированная тестовая БД)
# Запускается автоматически перед каждым тестом
# ==========================================
@pytest.fixture(autouse=True)
def reset_db():
    # Очищаем базу данных перед каждым тестом
    fake_users_db.clear()
    active_refresh_tokens.clear()
    
    # Создаем эталонного админа для тестов
    fake_users_db["admin@pafsport.ru"] = {
        "email": "admin@pafsport.ru", "password": "admin", "tariff": "Infinity", 
        "club": "Все клубы", "role": "admin", "startDate": "01.01.2024", "endDate": "01.02.2024", "avatar_url": None
    }

# ==========================================
# 1. ИНТЕГРАЦИОННЫЕ ТЕСТЫ (Аутентификация)
# ==========================================
def test_register_user_success():
    """Сквозной сценарий: Успешная регистрация"""
    response = client.post("/api/v1/auth/register", json={"email": "test@mail.ru", "password": "123"})
    assert response.status_code == 200
    assert response.json() == {"status": "success"}
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies

def test_login_wrong_password():
    """Проверка граничного случая: Неверный пароль"""
    response = client.post("/api/v1/auth/login", json={"email": "admin@pafsport.ru", "password": "wrong"})
    assert response.status_code == 401
    # ИСПРАВЛЕНО: Ждем актуальный короткий текст ошибки
    assert response.json()["detail"] == "Ошибка"

# ==========================================
# 2. ТЕСТИРОВАНИЕ RBAC (Роли и Права)
# ==========================================
def test_admin_access_allowed():
    """Сценарий: Админ имеет доступ к списку пользователей"""
    client.post("/api/v1/auth/login", json={"email": "admin@pafsport.ru", "password": "admin"})
    response = client.get("/api/v1/admin/users")
    assert response.status_code == 200
    assert "total_users" in response.json()

def test_user_access_denied():
    """Сценарий: Обычный юзер получает 403 Forbidden при доступе к админке"""
    client.post("/api/v1/auth/register", json={"email": "user@mail.ru", "password": "123"})
    
    response = client.get("/api/v1/admin/users")
    assert response.status_code == 403
    # ИСПРАВЛЕНО: Ждем стандартный ответ FastAPI для 403 ошибки
    assert response.json()["detail"] == "Forbidden"

# ==========================================
# 3. МОДУЛЬНЫЕ ТЕСТЫ (Мокирование внешнего API)
# ==========================================
@patch("main.requests.get")
def test_weather_service_success(mock_get):
    """Тестирование сервиса погоды БЕЗ реального выхода в интернет (Мокирование)"""
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "current_weather": {"temperature": 25.5, "windspeed": 10.0}
    }
    mock_response.raise_for_status.return_value = None
    mock_get.return_value = mock_response

    service = WeatherService()
    result = service.get_weather()

    assert result["status"] == "success"
    assert result["temp"] == 25.5
    assert result["wind"] == 10.0
    mock_get.assert_called_once()