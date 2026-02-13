# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import List
# from datetime import datetime, timedelta
# import uvicorn
# import google.generativeai as genai
# import os

# # --- НАСТРОЙКА GEMINI ---
# # Вставь сюда свой НОВЫЙ ключ
# GEMINI_API_KEY = "AIzaSyC3sPl-Y8SJnhWy_dqaaQ3v3iRAM1gp6Dc"

# app = FastAPI()

# # --- CORS ---
# origins = [
#     "http://localhost:5173",
#     "http://127.0.0.1:5173",
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # --- МОДЕЛИ ДАННЫХ ---
# class UserAuth(BaseModel):
#     email: str
#     password: str

# class Token(BaseModel):
#     access_token: str
#     token_type: str = "bearer"

# class UserProfile(BaseModel):
#     email: str
#     tariff: str
#     startDate: str
#     endDate: str

# class Club(BaseModel):
#     id: int
#     name: str
#     address: str
#     image: str
#     link: str

# class ClubDetails(Club):
#     description: str
#     features: List[str]
#     load_data: List[int]

# class ChatRequest(BaseModel):
#     message: str
#     history: List[dict] = []

# # --- БАЗА ДАННЫХ ---
# fake_users_db = {}

# FAKE_CLUBS_DATA = [
#     {"id": 1, "name": "Ривьера", "address": "Автозаводская ул., 18, Москва", "image": "/images/rivera.png", "link": "/club-riviera"},
#     {"id": 2, "name": "Город", "address": "ш. Энтузиастов, 12 к.2, Москва", "image": "/images/city.jpg", "link": "/club-gorod"},
#     {"id": 3, "name": "Афимолл", "address": "Пресненская наб., 2, Москва", "image": "/images/afimoll.jpg", "link": "/club-afimoll"},
# ]

# FAKE_CLUB_DETAILS = {
#     1: {"id": 1, "name": "Ривьера", "address": "Автозаводская ул., 18, Москва, 115280", "image": "/images/rivera.png", "link": "/club-riviera",
#         "description": "Описание Ривьеры...", "features": ["Ежедневно с 6 до 24", "Парковка", "Групповые программы", "Удобные раздевалки", "Премиальное оборудование"],
#         "load_data": [65, 75, 55, 70, 85, 40, 25]},
#     2: {"id": 2, "name": "Город", "address": "ш. Энтузиастов, 12 к.2, Москва, 111024", "image": "/images/city.jpg", "link": "/club-gorod",
#         "description": "Описание Города...", "features": ["Ежедневно с 6 до 24", "Парковка", "SPA-зона", "Групповые программы", "Анализ InBody"],
#         "load_data": [50, 60, 65, 75, 80, 55, 30]},
#     3: {"id": 3, "name": "Афимолл", "address": "Пресненская наб., 2, Москва, 123112", "image": "/images/afimoll.jpg", "link": "/club-afimoll",
#         "description": "Описание Афимолла...", "features": ["Ежедневно с 6 до 24", "Парковка", "SPA-зона", "Удобные раздевалки", "Доступ для друзей"],
#         "load_data": [70, 80, 60, 90, 95, 45, 35]},
# }

# # --- УМНАЯ НАСТРОЙКА AI ---
# model = None

# def configure_ai():
#     global model
#     try:
#         genai.configure(api_key=GEMINI_API_KEY)
        
#         # 1. Сначала пробуем самую актуальную модель
#         try:
#             print("Попытка подключить gemini-1.5-flash...")
#             test_model = genai.GenerativeModel('gemini-1.5-flash')
#             # Делаем тестовый запрос, чтобы убедиться, что она работает
#             test_model.generate_content("test") 
#             model = test_model
#             print("УСПЕХ: Подключена модель gemini-1.5-flash")
#             return
#         except Exception:
#             print("gemini-1.5-flash не ответила, ищем доступные модели...")

#         # 2. Если не вышло, ищем любую доступную в списке
#         found_model = False
#         for m in genai.list_models():
#             if 'generateContent' in m.supported_generation_methods:
#                 print(f"Найдена доступная модель: {m.name}")
#                 # Берем первую попавшуюся 'gemini'
#                 if 'gemini' in m.name:
#                     model = genai.GenerativeModel(m.name)
#                     print(f"УСПЕХ: Автоматически выбрана модель {m.name}")
#                     found_model = True
#                     break
        
#         if not found_model:
#             print("ОШИБКА: Не найдено ни одной рабочей модели Gemini для этого ключа.")

#     except Exception as e:
#         print(f"Критическая ошибка настройки AI: {e}")

# # Запускаем настройку при старте
# configure_ai()

# def get_system_context():
#     clubs_info = ""
#     for club_id, details in FAKE_CLUB_DETAILS.items():
#         clubs_info += f"\nКлуб: {details['name']}. Адрес: {details['address']}. Особенности: {', '.join(details['features'])}."
    
#     tariffs_info = "\nТарифы: Light (базовый), Smart (с тренером), Infinity (все включено + SPA)."
    
#     return (
#         "Ты — вежливый AI-консультант фитнес-клуба 'PafSport'. "
#         "Отвечай на вопросы клиентов, используя ТОЛЬКО информацию ниже. "
#         "Если не знаешь ответа, предложи позвонить администратору. "
#         f"\n\nКЛУБЫ:{clubs_info}"
#         f"\n\nТАРИФЫ:{tariffs_info}"
#         "\n\nЧасы работы: 06:00 - 24:00."
#     )

# # --- ЭНДПОИНТ ЧАТА ---
# @app.post("/api/v1/support/chat")
# async def chat_support(request: ChatRequest):
#     if not model:
#         # Пытаемся переподключиться, если при старте не вышло
#         configure_ai()
#         if not model:
#              return {"response": "AI сервис сейчас недоступен. Проверьте консоль сервера."}

#     prompt = get_system_context() + f"\n\nВопрос клиента: {request.message}"
    
#     try:
#         response = model.generate_content(prompt)
#         if response.text:
#             return {"response": response.text}
#         else:
#             return {"response": "Я задумался, но не смог сформулировать ответ."}
#     except Exception as e:
#         print(f"Error generating content: {e}")
#         return {"response": "Произошла ошибка связи с нейросетью. Попробуйте позже."}


# # --- ОСТАЛЬНЫЕ ЭНДПОИНТЫ ---
# @app.get("/api/v1/users/me", response_model=UserProfile)
# def get_me(token: str):
#     if not token.startswith("token-"):
#         raise HTTPException(status_code=401, detail="Неверный токен")
#     user_email = token.replace("token-", "")
#     user_data = fake_users_db.get(user_email)
#     if not user_data:
#         raise HTTPException(status_code=404, detail="Профиль не найден")
    
#     reg_date = datetime.strptime(user_data["reg_date"], "%d.%m.%Y")
#     end_date = reg_date + timedelta(days=30)
    
#     return {
#         "email": user_data["email"],
#         "tariff": user_data["tariff"],
#         "startDate": user_data["reg_date"],
#         "endDate": end_date.strftime("%d.%m.%Y")
#     }

# @app.delete("/api/v1/users/me")
# def delete_me(token: str):
#     if not token.startswith("token-"):
#         raise HTTPException(status_code=401, detail="Неверный токен")
#     user_email = token.replace("token-", "")
#     if user_email in fake_users_db:
#         del fake_users_db[user_email]
#         return {"status": "deleted"}
#     raise HTTPException(status_code=404, detail="User not found")

# @app.patch("/api/v1/users/me/tariff")
# def update_tariff(token: str, new_tariff: str):
#     if not token.startswith("token-"):
#         raise HTTPException(status_code=401, detail="Неверный токен")
#     user_email = token.replace("token-", "")
#     if user_email in fake_users_db:
#         fake_users_db[user_email]["tariff"] = new_tariff
#         return {"status": "updated", "new_tariff": new_tariff}
#     raise HTTPException(status_code=404, detail="User not found")

# @app.post("/api/v1/auth/login", response_model=Token)
# def login(user: UserAuth):
#     db_user = fake_users_db.get(user.email)
#     if not db_user or db_user["password"] != user.password:
#         raise HTTPException(status_code=400, detail="Неверный логин или пароль")
#     return {"access_token": f"token-{user.email}", "token_type": "bearer"}

# @app.post("/api/v1/auth/register", response_model=Token)
# def register(user: UserAuth):
#     if user.email in fake_users_db:
#         raise HTTPException(status_code=400, detail="Email занят")
#     fake_users_db[user.email] = {
#         "email": user.email,
#         "password": user.password,
#         "tariff": "Light",
#         "reg_date": datetime.now().strftime("%d.%m.%Y")
#     }
#     return login(user)

# @app.get("/api/v1/clubs", response_model=List[Club])
# def get_clubs():
#     return FAKE_CLUBS_DATA

# @app.get("/api/v1/clubs/{club_id}", response_model=ClubDetails)
# def get_club_details(club_id: int):
#     details = FAKE_CLUB_DETAILS.get(club_id)
#     if not details:
#         raise HTTPException(status_code=404, detail="Клуб не найден")
#     return details

# if __name__ == "__main__":
#     uvicorn.run(app, host="127.0.0.1", port=8000)



from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
import uvicorn
import requests

# --- НАСТРОЙКА OLLAMA ---
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3"  # можно заменить на mistral, gemma, phi и т.д.

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
    startDate: str
    endDate: str

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
        "id": 1,
        "name": "Ривьера",
        "address": "Автозаводская ул., 18, Москва, 115280",
        "image": "/images/rivera.png",
        "link": "/club-riviera",
        "description": "Описание Ривьеры...",
        "features": [
            "Ежедневно с 6 до 24",
            "Парковка",
            "Групповые программы",
            "Удобные раздевалки",
            "Премиальное оборудование"
        ],
        "load_data": [65, 75, 55, 70, 85, 40, 25]
    },
    2: {
        "id": 2,
        "name": "Город",
        "address": "ш. Энтузиастов, 12 к.2, Москва, 111024",
        "image": "/images/city.jpg",
        "link": "/club-gorod",
        "description": "Описание Города...",
        "features": [
            "Ежедневно с 6 до 24",
            "Парковка",
            "SPA-зона",
            "Групповые программы",
            "Анализ InBody"
        ],
        "load_data": [50, 60, 65, 75, 80, 55, 30]
    },
    3: {
        "id": 3,
        "name": "Афимолл",
        "address": "Пресненская наб., 2, Москва, 123112",
        "image": "/images/afimoll.jpg",
        "link": "/club-afimoll",
        "description": "Описание Афимолла...",
        "features": [
            "Ежедневно с 6 до 24",
            "Парковка",
            "SPA-зона",
            "Удобные раздевалки",
            "Доступ для друзей"
        ],
        "load_data": [70, 80, 60, 90, 95, 45, 35]
    }
}

# --- СИСТЕМНЫЙ КОНТЕКСТ ---
def get_system_context():
    clubs_info = ""
    for details in FAKE_CLUB_DETAILS.values():
        clubs_info += (
            f"\nКлуб: {details['name']}. "
            f"Адрес: {details['address']}. "
            f"Особенности: {', '.join(details['features'])}."
        )

    tariffs_info = (
        "\nТарифы: "
        "Light (базовый), "
        "Smart (с тренером), "
        "Infinity (все включено + SPA)."
    )

    return (
        "Ты — вежливый AI-консультант фитнес-клуба 'PafSport'. "
        "Отвечай на вопросы клиентов, используя ТОЛЬКО информацию ниже. "
        "Если не знаешь ответа — предложи позвонить администратору."
        f"\n\nКЛУБЫ:{clubs_info}"
        f"\n\nТАРИФЫ:{tariffs_info}"
        "\n\nЧасы работы: 06:00 - 24:00."
    )

# --- ФУНКЦИЯ ВЫЗОВА OLLAMA ---
def ask_ollama(prompt: str) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=60)

    if response.status_code != 200:
        raise Exception("Ollama не отвечает")

    data = response.json()
    return data.get("response", "").strip()

# --- ЭНДПОИНТ ЧАТА ---
@app.post("/api/v1/support/chat")
async def chat_support(request: ChatRequest):
    prompt = (
        get_system_context()
        + f"\n\nВопрос клиента: {request.message}"
    )

    try:
        answer = ask_ollama(prompt)
        if answer:
            return {"response": answer}
        return {"response": "Я задумался, но не смог сформулировать ответ."}
    except Exception as e:
        print(f"Ollama error: {e}")
        return {"response": "AI сервис временно недоступен. Попробуйте позже."}


@app.get("/api/v1/users/me", response_model=UserProfile)
def get_me(token: str):
    if not token.startswith("token-"):
        raise HTTPException(status_code=401, detail="Неверный токен")

    user_email = token.replace("token-", "")
    user_data = fake_users_db.get(user_email)

    if not user_data:
        raise HTTPException(status_code=404, detail="Профиль не найден")

    reg_date = datetime.strptime(user_data["reg_date"], "%d.%m.%Y")
    end_date = reg_date + timedelta(days=30)

    return {
        "email": user_data["email"],
        "tariff": user_data["tariff"],
        "startDate": user_data["reg_date"],
        "endDate": end_date.strftime("%d.%m.%Y")
    }

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
        "reg_date": datetime.now().strftime("%d.%m.%Y")
    }
    return login(user)

@app.get("/api/v1/clubs", response_model=List[Club])
def get_clubs():
    return FAKE_CLUBS_DATA

@app.get("/api/v1/clubs/{club_id}", response_model=ClubDetails)
def get_club_details(club_id: int):
    details = FAKE_CLUB_DETAILS.get(club_id)
    if not details:
        raise HTTPException(status_code=404, detail="Клуб не найден")
    return details

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
