import os
import io
import json
import uuid
import time
from fastapi import FastAPI, HTTPException, Depends, Request, Response, UploadFile, File
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import jwt
import uvicorn
from minio import Minio
from minio.error import S3Error
import requests

# ==========================================
# КОНФИГУРАЦИЯ И ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ (Для Docker)
# ==========================================
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_pafsport_key_for_jwt_tokens_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Настройки S3 (MinIO)
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "127.0.0.1:9000") # В Docker будет "minio:9000"
PUBLIC_MINIO_URL = os.getenv("PUBLIC_MINIO_URL", "http://localhost:9000") # Ссылка для браузера
MINIO_ACCESS_KEY = os.getenv("MINIO_ROOT_USER", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "pafsport-avatars")

app = FastAPI()

# Инициализация S3 клиента
s3_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False # Работаем по HTTP
)

# Создание бакета при старте приложения
@app.on_event("startup")
def init_s3_bucket():
    try:
        if not s3_client.bucket_exists(MINIO_BUCKET_NAME):
            s3_client.make_bucket(MINIO_BUCKET_NAME)
            print(f"S3 Бакет '{MINIO_BUCKET_NAME}' успешно создан!")
            
            # Делаем бакет публичным для чтения
            policy = {
                "Version": "2012-10-17",
                "Statement":[
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": ["*"]},
                        "Action":["s3:GetObject"],
                        "Resource":[f"arn:aws:s3:::{MINIO_BUCKET_NAME}/*"]
                    }
                ]
            }
            s3_client.set_bucket_policy(MINIO_BUCKET_NAME, json.dumps(policy))
            print("S3 Политика публичного доступа применена.")
    except Exception as e:
        print(f"Ошибка инициализации S3 MinIO: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. МОДЕЛИ ДАННЫХ (DTO)
# ==========================================
class UserAuth(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    email: str
    tariff: str
    club: str
    role: str
    avatar_url: Optional[str] = None
    startDate: str
    endDate: str

class UpdateProfileRequest(BaseModel):
    tariff: Optional[str] = None
    club: Optional[str] = None

class AdminUpdateUserRequest(BaseModel):
    tariff: str
    club: str
    role: str

class PaginatedUsersResponse(BaseModel):
    total_users: int
    users: List[UserProfile]

class ChangeRoleRequest(BaseModel):
    role: str

class ChatRequest(BaseModel):
    message: str

# ==========================================
# 2. РЕПОЗИТОРИИ (Работа с БД)
# ==========================================
fake_users_db = {
    "admin@pafsport.ru": {
        "email": "admin@pafsport.ru", "password": "admin", "tariff": "Infinity", 
        "club": "Все клубы", "role": "admin", "startDate": "01.01.2024", "endDate": "01.02.2024", "avatar_url": None
    }
}
active_refresh_tokens: Dict[str, str] = {}

class UserRepository:
    def get_user_by_email(self, email: str) -> Optional[dict]:
        return fake_users_db.get(email)
    
    def create_user(self, user_data: dict):
        fake_users_db[user_data["email"]] = user_data
        
    def update_user(self, email: str, updates: dict):
        if email in fake_users_db:
            fake_users_db[email].update(updates)
            return fake_users_db[email]
        return None

    def delete_user(self, email: str) -> bool:
        if email in fake_users_db:
            del fake_users_db[email]
            return True
        return False
    
    def get_all_users(self):
        return list(fake_users_db.values())

class SessionRepository:
    def save_refresh_token(self, email: str, token: str):
        active_refresh_tokens[email] = token
        
    def revoke_refresh_token(self, email: str):
        if email in active_refresh_tokens:
            del active_refresh_tokens[email]
            
    def is_token_valid(self, email: str, token: str) -> bool:
        return active_refresh_tokens.get(email) == token

# ==========================================
# 3. СЕРВИСЫ (Бизнес-логика)
# ==========================================
class FileService:
    def save_avatar(self, file: UploadFile) -> str:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Можно загружать только изображения")
        
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        try:
            file_content = file.file.read()
            file_size = len(file_content)
            
            s3_client.put_object(
                bucket_name=MINIO_BUCKET_NAME,
                object_name=unique_filename,
                data=io.BytesIO(file_content),
                length=file_size,
                content_type=file.content_type
            )
            
            s3_url = f"{PUBLIC_MINIO_URL}/{MINIO_BUCKET_NAME}/{unique_filename}"
            return s3_url
            
        except S3Error as e:
            raise HTTPException(status_code=500, detail=f"Ошибка загрузки в S3: {str(e)}")

class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
    
    def get_filtered_users(
        self, skip: int, limit: int, sort_by: Optional[str],
        email_filter: Optional[str], role_filter: Optional[str], tariff_filter: Optional[str]
    ) -> PaginatedUsersResponse:
        users = self.user_repo.get_all_users()

        if email_filter:
            users = [u for u in users if email_filter.lower() in u["email"].lower()]
        if role_filter:
            users = [u for u in users if u["role"] == role_filter]
        if tariff_filter:
            users = [u for u in users if u["tariff"] == tariff_filter]
        
        total_users = len(users)

        if sort_by:
            reverse = sort_by.startswith("-")
            sort_key = sort_by.lstrip("-")
            if sort_key == "email":
                users.sort(key=lambda u: u["email"], reverse=reverse)
        
        paginated_users = users[skip : skip + limit]
        user_profiles = [UserProfile(**u) for u in paginated_users]
        return PaginatedUsersResponse(total_users=total_users, users=user_profiles)

class AuthService:
    def __init__(self, user_repo: UserRepository, session_repo: SessionRepository):
        self.user_repo = user_repo
        self.session_repo = session_repo

    def create_jwt_token(self, data: dict, expires_delta: timedelta):
        to_encode = data.copy()
        expire = datetime.utcnow() + expires_delta
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    def generate_tokens(self, email: str):
        access_payload = {"sub": email, "type": "access"}
        access_token = self.create_jwt_token(access_payload, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        
        refresh_payload = {"sub": email, "type": "refresh"}
        refresh_token = self.create_jwt_token(refresh_payload, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
        
        self.session_repo.save_refresh_token(email, refresh_token)
        return access_token, refresh_token

    def login(self, auth_data: UserAuth):
        user = self.user_repo.get_user_by_email(auth_data.email)
        if not user or user["password"] != auth_data.password:
            raise HTTPException(status_code=401, detail="Ошибка") # Короткая ошибка для тестов
        return self.generate_tokens(auth_data.email)

    def register(self, auth_data: UserAuth):
        if self.user_repo.get_user_by_email(auth_data.email):
            raise HTTPException(status_code=400, detail="Email занят")
        
        now = datetime.now()
        new_user = {
            "email": auth_data.email, "password": auth_data.password,
            "tariff": "Light", "club": "Не выбран", "role": "user",
            "startDate": now.strftime("%d.%m.%Y"),
            "endDate": (now + timedelta(days=30)).strftime("%d.%m.%Y"),
            "avatar_url": None
        }
        self.user_repo.create_user(new_user)
        return self.generate_tokens(auth_data.email)


    def refresh(self, refresh_token: str):
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            if payload.get("type") != "refresh":
                raise HTTPException(status_code=401, detail="Неверный тип токена")
            email = payload.get("sub")
            if not email:
                raise HTTPException(status_code=401, detail="Невалидный токен")
            if not self.session_repo.is_token_valid(email, refresh_token):
                raise HTTPException(status_code=401, detail="Токен отозван")
            return self.generate_tokens(email)
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Refresh токен истек")
        except (jwt.InvalidTokenError, Exception):
            raise HTTPException(status_code=401, detail="Невалидный токен")


    def logout(self, refresh_token: str):
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
            if email:
                self.session_repo.revoke_refresh_token(email)
        except:
            pass


class WeatherService:
    def get_weather(self, lat: float = 55.75, lon: float = 37.62):
        api_url = os.getenv("WEATHER_API_URL", "https://api.open-meteo.com/v1/forecast")
        params = {"latitude": lat, "longitude": lon, "current_weather": "true"}
        
        # 3 попытки (retries) на случай сбоя
        for attempt in range(3):
            try:
                response = requests.get(api_url, params=params, timeout=2.0)
                response.raise_for_status()
                data = response.json()
                return {
                    "status": "success",
                    "temp": data["current_weather"]["temperature"],
                    "wind": data["current_weather"]["windspeed"]
                }
            except requests.exceptions.RequestException as e:
                time.sleep(0.5)
                if attempt == 2:
                    return {"status": "error", "message": "Сервис погоды недоступен"}

# ==========================================
# 4. DEPENDENCY INJECTION & GUARDS
# ==========================================
def get_user_repo() -> UserRepository: return UserRepository()
def get_session_repo() -> SessionRepository: return SessionRepository()
def get_file_service() -> FileService: return FileService()
def get_user_service(user_repo: UserRepository = Depends(get_user_repo)) -> UserService: return UserService(user_repo)
def get_auth_service(user_repo: UserRepository = Depends(get_user_repo), session_repo: SessionRepository = Depends(get_session_repo)) -> AuthService: return AuthService(user_repo, session_repo)
def get_weather_service() -> WeatherService: return WeatherService()

def get_current_user(request: Request, user_repo: UserRepository = Depends(get_user_repo)):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Не авторизован")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Неверный тип токена")
        email = payload.get("sub")
        user = user_repo.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=401, detail="Пользователь не найден")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Access токен истек")
    except (jwt.InvalidTokenError, Exception):
        raise HTTPException(status_code=401, detail="Невалидный токен")

def verify_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden") # Короткая ошибка для тестов
    return current_user

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, samesite="lax")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60, samesite="lax")

# ==========================================
# 5. API КОНТРОЛЛЕРЫ
# ==========================================

# --- SEO: Robots & Sitemap ---
@app.get("/robots.txt", response_class=PlainTextResponse)
def get_robots_txt():
    content = """User-agent: *
Disallow: /api/
Disallow: /admin
Allow: /
Sitemap: http://localhost:8000/sitemap.xml
"""
    return content

@app.get("/sitemap.xml")
def get_sitemap():
    xml_content = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>http://localhost:5173/</loc><priority>1.0</priority></url>
    <url><loc>http://localhost:5173/clubs</loc><priority>0.8</priority></url>
    <url><loc>http://localhost:5173/tariffs</loc><priority>0.8</priority></url>
</urlset>"""
    return Response(content=xml_content, media_type="application/xml")

# --- АВТОРИЗАЦИЯ ---
@app.post("/api/v1/auth/login")
def login(user: UserAuth, response: Response, auth_service: AuthService = Depends(get_auth_service)):
    access, refresh = auth_service.login(user)
    set_auth_cookies(response, access, refresh)
    return {"status": "success"}

@app.post("/api/v1/auth/register")
def register(user: UserAuth, response: Response, auth_service: AuthService = Depends(get_auth_service)):
    access, refresh = auth_service.register(user)
    set_auth_cookies(response, access, refresh)
    return {"status": "success"}

@app.post("/api/v1/auth/refresh")
def refresh_token(request: Request, response: Response, auth_service: AuthService = Depends(get_auth_service)):
    old_refresh = request.cookies.get("refresh_token")
    if not old_refresh:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    access, refresh = auth_service.refresh(old_refresh)
    set_auth_cookies(response, access, refresh)
    return {"status": "success"}

@app.post("/api/v1/auth/logout")
def logout(request: Request, response: Response, auth_service: AuthService = Depends(get_auth_service)):
    old_refresh = request.cookies.get("refresh_token")
    if old_refresh:
        auth_service.logout(old_refresh)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"status": "Logged out"}

# --- ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ---
@app.get("/api/v1/users/me", response_model=UserProfile)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserProfile(**current_user)

@app.patch("/api/v1/users/me/info")
def update_user_info(data: UpdateProfileRequest, current_user: dict = Depends(get_current_user), user_repo: UserRepository = Depends(get_user_repo)):
    updates = {}
    if data.tariff: updates["tariff"] = data.tariff
    if data.club: updates["club"] = data.club
    user_repo.update_user(current_user["email"], updates)
    return {"status": "updated"}

@app.post("/api/v1/users/me/avatar", response_model=UserProfile)
def upload_avatar(
    current_user: dict = Depends(get_current_user),
    file: UploadFile = File(...),
    file_service: FileService = Depends(get_file_service),
    user_repo: UserRepository = Depends(get_user_repo)
):
    s3_avatar_url = file_service.save_avatar(file)
    updated_user = user_repo.update_user(current_user["email"], {"avatar_url": s3_avatar_url})
    return UserProfile(**updated_user)

# --- АДМИН ПАНЕЛЬ ---
@app.get("/api/v1/admin/users", response_model=PaginatedUsersResponse)
def get_all_users(
    skip: int = 0, limit: int = 5, sort_by: Optional[str] = "email",
    email: Optional[str] = None, role: Optional[str] = None, tariff: Optional[str] = None,
    admin_user: dict = Depends(verify_admin), user_service: UserService = Depends(get_user_service)
):
    return user_service.get_filtered_users(skip, limit, sort_by, email, role, tariff)

@app.patch("/api/v1/admin/users/{user_email}/role")
def change_user_role(
    user_email: str, req: ChangeRoleRequest,
    admin_user: dict = Depends(verify_admin), user_repo: UserRepository = Depends(get_user_repo)
):
    user = user_repo.get_user_by_email(user_email)
    if not user: raise HTTPException(status_code=404)
    if user_email == admin_user["email"] and req.role != "admin": raise HTTPException(status_code=400)
    user_repo.update_user(user_email, {"role": req.role})
    return {"status": "success"}

@app.delete("/api/v1/admin/users/{user_email}")
def delete_user_by_admin(user_email: str, admin_user: dict = Depends(verify_admin), user_repo: UserRepository = Depends(get_user_repo)):
    if user_email == admin_user["email"]:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
    if not user_repo.delete_user(user_email):
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return {"status": "deleted"}

# --- СТОРОННИЙ API (ПОГОДА) ---
@app.get("/api/v1/weather")
def get_club_weather(weather_service: WeatherService = Depends(get_weather_service)):
    return weather_service.get_weather()

# --- КЛУБЫ ---
FAKE_CLUBS_DATA = [
    {"id": 1, "name": "Ривьера", "address": "Автозаводская ул., 18, Москва", "image": "/assets/images/rivera.png", "link": "/club/riviera"},
    {"id": 2, "name": "Город", "address": "ш. Энтузиастов, 12 к.2, Москва", "image": "/assets/images/city.jpg", "link": "/club/gorod"},
    {"id": 3, "name": "Афимолл", "address": "Пресненская наб., 2, Москва", "image": "/assets/images/afimoll.jpg", "link": "/club/afimoll"},
]

FAKE_CLUB_DETAILS = {
    1: {"id": 1, "name": "Ривьера", "address": "Автозаводская ул., 18, Москва, 115280", "image": "/assets/images/rivera.png", "link": "/club/riviera", "description": "Описание...", "features": ["Ежедневно с 6 до 24", "Парковка", "Групповые программы", "SPA-зона"], "load_data": [65, 75, 55, 70, 85, 40, 25]},
    2: {"id": 2, "name": "Город", "address": "ш. Энтузиастов, 12 к.2, Москва, 111024", "image": "/assets/images/city.jpg", "link": "/club/gorod", "description": "Описание...", "features": ["Ежедневно с 6 до 24", "Парковка", "SPA-зона", "Анализ InBody"], "load_data": [50, 60, 65, 75, 80, 55, 30]},
    3: {"id": 3, "name": "Афимолл", "address": "Пресненская наб., 2, Москва, 123112", "image": "/assets/images/afimoll.jpg", "link": "/club/afimoll", "description": "Описание...", "features": ["Ежедневно с 6 до 24", "Парковка", "Доступ для друзей"], "load_data": [70, 80, 60, 90, 95, 45, 35]}
}

@app.get("/api/v1/clubs")
def get_clubs():
    return FAKE_CLUBS_DATA

@app.get("/api/v1/clubs/{club_id}")
def get_club_details(club_id: int):
    details = FAKE_CLUB_DETAILS.get(club_id)
    if not details:
        raise HTTPException(status_code=404, detail="Клуб не найден")
    return details

@app.post("/api/v1/support/chat")
async def chat_support(request: ChatRequest):
    return {"response": "AI чат отключен в тестовой среде"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)