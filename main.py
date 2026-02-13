from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import uvicorn
import requests

# --- НАСТРОЙКА OLLAMA ---
OLLAMA_URL = "http://localhost:11434/api/generate"
# Можно попробовать "llama3", "mistral" или "gemma" (gemma хорошо говорит по-русски)
OLLAMA_MODEL = "llama3"

app = FastAPI()

# --- CORS ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- МОДЕЛИ ДАННЫХ ---
class UserAuth(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserProfile(BaseModel):
    email: str
    tariff: str
    club: str
    startDate: str
    endDate: str

class UpdateProfileRequest(BaseModel):
    tariff: Optional[str] = None
    club: Optional[str] = None

class Club(BaseModel):
    id: int
    name: str
    address: str
    image: str
    link: str

class ClubDetails(Club):
    description: str
    features: List[str]
    load_data: List[int]

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []

# --- БАЗА ДАННЫХ ---
fake_users_db = {}

FAKE_CLUBS_DATA = [
    {"id": 1, "name": "Ривьера", "address": "Автозаводская ул., 18, Москва", "image": "/images/rivera.png", "link": "/club-riviera"},
    {"id": 2, "name": "Город", "address": "ш. Энтузиастов, 12 к.2, Москва", "image": "/images/city.jpg", "link": "/club-gorod"},
    {"id": 3, "name": "Афимолл", "address": "Пресненская наб., 2, Москва", "image": "/images/afimoll.jpg", "link": "/club-afimoll"},
]

FAKE_CLUB_DETAILS = {
    1: {
        "id": 1, "name": "Ривьера", "address": "Автозаводская ул., 18, Москва, 115280", "image": "/images/rivera.png", "link": "/club-riviera",
        "description": "Описание...", "features": ["Ежедневно с 6 до 24", "Парковка", "Групповые программы", "SPA-зона"], "load_data": [65, 75, 55, 70, 85, 40, 25]
    },
    2: {
        "id": 2, "name": "Город", "address": "ш. Энтузиастов, 12 к.2, Москва, 111024", "image": "/images/city.jpg", "link": "/club-gorod",
        "description": "Описание...", "features": ["Ежедневно с 6 до 24", "Парковка", "SPA-зона", "Анализ InBody"], "load_data": [50, 60, 65, 75, 80, 55, 30]
    },
    3: {
        "id": 3, "name": "Афимолл", "address": "Пресненская наб., 2, Москва, 123112", "image": "/images/afimoll.jpg", "link": "/club-afimoll",
        "description": "Описание...", "features": ["Ежедневно с 6 до 24", "Парковка", "Доступ для друзей"], "load_data": [70, 80, 60, 90, 95, 45, 35]
    }
}

# --- ФУНКЦИИ ---
def get_system_context():
    clubs_info = ""
    for details in FAKE_CLUB_DETAILS.values():
        clubs_info += (
            f"\n- Клуб: {details['name']}. Адрес: {details['address']}. "
            f"Особенности: {', '.join(details['features'])}."
        )

    tariffs_info = (
        "\n- Light: базовый, тренажерный зал."
        "\n- Smart: с тренером, InBody, групповые."
        "\n- Infinity: все включено, SPA, доступ для друзей."
    )

    # !!! ВАЖНОЕ ИЗМЕНЕНИЕ НИЖЕ !!!
    return (
        "Ты — вежливый AI-консультант фитнес-клуба 'PafSport'. "
        "Твоя главная задача — говорить ТОЛЬКО НА РУССКОМ ЯЗЫКЕ. "
        "Никогда не используй английский язык в ответе. "
        "Используй ТОЛЬКО информацию ниже для ответа. Не выдумывай факты."
        "Если не знаешь ответа — предложи позвонить администратору."
        f"\n\nИНФОРМАЦИЯ О КЛУБАХ:{clubs_info}"
        f"\n\nТАРИФЫ:{tariffs_info}"
        "\n\nЧасы работы: 06:00 - 24:00."
    )

def ask_ollama(prompt: str) -> str:
    try:
        response = requests.post(
            OLLAMA_URL, 
            json={
                "model": OLLAMA_MODEL, 
                "prompt": prompt, 
                "stream": False,
                # options можно добавить, чтобы уменьшить креативность (меньше выдумок)
                "options": {
                    "temperature": 0.3 
                }
            }, 
            timeout=60
        )
        if response.status_code == 200:
            return response.json().get("response", "").strip()
        return ""
    except Exception as e:
        print(f"Ollama Error: {e}")
        return ""

# --- ЭНДПОИНТЫ ---

@app.post("/api/v1/support/chat")
async def chat_support(request: ChatRequest):
    # Добавляем инструкцию языка ПРЯМО перед вопросом, чтобы модель не забыла
    final_prompt = (
        get_system_context() + 
        f"\n\nВАЖНОЕ ПРАВИЛО: Ответь на следующий вопрос строго на русском языке.\n"
        f"Вопрос клиента: {request.message}"
    )
    
    answer = ask_ollama(final_prompt)
    
    if answer:
        return {"response": answer}
    else:
        return {"response": "Извините, сейчас я не могу ответить. Попробуйте позже."}

@app.get("/api/v1/users/me", response_model=UserProfile)
def get_me(token: str):
    if not token.startswith("token-"):
        raise HTTPException(status_code=401, detail="Неверный токен")
    user_email = token.replace("token-", "")
    user_data = fake_users_db.get(user_email)
    if not user_data:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    
    return {
        "email": user_data["email"],
        "tariff": user_data["tariff"],
        "club": user_data.get("club", "Не выбран"),
        "startDate": user_data["reg_date"],
        "endDate": (datetime.strptime(user_data["reg_date"], "%d.%m.%Y") + timedelta(days=30)).strftime("%d.%m.%Y")
    }

@app.patch("/api/v1/users/me/info")
def update_user_info(token: str, data: UpdateProfileRequest):
    if not token.startswith("token-"):
        raise HTTPException(status_code=401, detail="Неверный токен")
    user_email = token.replace("token-", "")
    
    if user_email not in fake_users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    if data.tariff:
        fake_users_db[user_email]["tariff"] = data.tariff
    if data.club:
        fake_users_db[user_email]["club"] = data.club
        
    return {"status": "updated", "tariff": fake_users_db[user_email]["tariff"], "club": fake_users_db[user_email]["club"]}

@app.post("/api/v1/auth/login", response_model=Token)
def login(user: UserAuth):
    db_user = fake_users_db.get(user.email)
    if not db_user or db_user["password"] != user.password:
        raise HTTPException(status_code=400, detail="Неверный логин или пароль")
    return {"access_token": f"token-{user.email}"}

@app.post("/api/v1/auth/register", response_model=Token)
def register(user: UserAuth):
    if user.email in fake_users_db:
        raise HTTPException(status_code=400, detail="Email занят")
    fake_users_db[user.email] = {
        "email": user.email,
        "password": user.password,
        "tariff": "Light",
        "club": "Не выбран",
        "reg_date": datetime.now().strftime("%d.%m.%Y")
    }
    return login(user)

@app.get("/api/v1/clubs", response_model=List[Club])
def get_clubs():
    return FAKE_CLUBS_DATA

@app.get("/api/v1/clubs/{club_id}", response_model=ClubDetails)
def get_club_details(club_id: int):
    return FAKE_CLUB_DETAILS.get(club_id, None)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)