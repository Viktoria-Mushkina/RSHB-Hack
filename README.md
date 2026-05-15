# Платформа сезонного меню для шеф-поваров

Web-приложение для шеф-поваров и ресторанов: загрузка PDF-меню, анализ ингредиентов по справочнику продуктов, оценка сезонности блюд, календарь сезонности, подбор поставщиков из базы «Своё Родное».

---

## Функциональность проекта

### Главная
- Загрузка и замена PDF-меню
- Глобальный поиск с переходом в разделы
- Блок «Ближайшие сезонные изменения» (по справочнику или по загруженному меню)
- Оценка сезонности меню или обзор «Сезон сейчас»
- Мини-календарь сезонности
- Лента ингредиентов из меню с пометками сезона
- Топ поставщиков

### Календарь сезонности
- Просмотр всех продуктов или только ингредиентов из загруженного меню
- Виды: сетка по месяцам / список
- Фильтрация по поиску
- Карточка продукта: сезон, фермеры, связанные блюда

### Меню и ингредиенты
- Справочник блюд из БД + блюда из PDF после загрузки
- Статусы: в меню / требует обновления / не в меню
- Фильтры по категории, статусу и ингредиентам
- Редактирование состава блюда
- Добавление и удаление блюда из меню

### Поставщики и поставки
- Раздел в разработке

---

## Технологический стек

### Frontend
- React — UI-библиотека
- TypeScript — типизация
- React Router — маршрутизация
- Vite — сборщик и dev-сервер
- Axios — HTTP-запросы
- CSS Modules — модульные стили

### Backend
- Python 3.12
- FastAPI — HTTP API
- Uvicorn — ASGI-сервер
- asyncpg — асинхронный доступ к PostgreSQL
- PostgreSQL — СУБД
- PyPDF2 — извлечение текста из PDF
- pymorphy2 — нормализация русских названий ингредиентов
- pandas / openpyxl — импорт поставщиков из Excel

### Инфраструктура
- Docker Compose — PostgreSQL, backend, frontend

### Design
- Figma
https://www.figma.com/design/Y812sKrwBZ53HChOk6yrlc/Edu-v-MISIS-%D0%A0%D0%A1%D0%A5%D0%91?node-id=0-1&t=e4VWOCWjEISIgUFi-1
---

## Структура проекта

```txt
RSHB-Hack/
├── docker-compose.yml
├── README.md
│
├── backend/
│   ├── main.py                  # Точка входа FastAPI
│   ├── config.py                # Re-export настроек
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── core/
│   │   ├── config.py            # DATABASE_URL, пути к Excel
│   │   └── lifespan.py          # Старт БД, seed, импорт фермеров
│   ├── schemas/
│   │   └── api.py               # Pydantic-модели API
│   ├── database/
│   │   ├── db.py                # Пул и запросы к PostgreSQL
│   │   ├── init.sql             # Схема и начальные данные
│   │   └── seed_dishes.sql      # Сид блюд
│   ├── routers/
│   │   ├── upload.py            # POST /upload-pdf
│   │   ├── products.py          # Продукты, категории, сезон
│   │   ├── farmers.py           # Фермеры и поставщики
│   │   └── menu.py              # GET /menu/dishes
│   ├── services/
│   │   ├── upload_service.py    # Разбор PDF-меню
│   │   ├── seasonality.py       # Логика сезонности
│   │   ├── menu_dishes.py       # Блоки блюд из текста
│   │   ├── menu_dish_builder.py
│   │   ├── pdf_parser.py
│   │   ├── text_processor.py
│   │   ├── farmer_matcher.py
│   │   └── excel_importer.py
│   └── data/
│       └── farmers.xlsx         # Локально (не в git)
│
└── frontend/
    ├── public/                  # Иконки, фото ингредиентов и блюд
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── app/                 # main, router, layout
        ├── pages/               # home, calendar, menu, suppliers
        ├── modules/             # UI-блоки 
        └── shared/
            ├── api/             # HTTP-клиент
            ├── context/         # MenuDataProvider
            ├── config/
            ├── lib/             # Сезонность, изображения, мутации меню
            ├── styles/
            └── types/
```

---

## Установка и запуск

### Требования
- Docker и Docker Compose
- (опционально) Node.js 20+ и Python 3.12+ для локальной разработки без Docker

### 1. Клонирование репозитория

```bash
git clone https://github.com/Viktoria-Mushkina/RSHB-Hack.git
cd RSHB-Hack
```

### 2. Данные поставщиков (опционально)

Файл `backend/data/farmers.xlsx` в репозиторий не входит. Скопируйте Excel локально — при старте backend импортирует поставщиков в БД.

### 3. Запуск через Docker Compose

```bash
docker compose up -d --build
```

| Сервис   | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:8000      |
| Postgres | localhost:5432             |

Проверка API:

```bash
curl http://localhost:8000/health
```

Остановка:

```bash
docker compose down
```

Остановка с удалением данных БД:

```bash
docker compose down -v
```

### 4. Локальная разработка (без Docker)

**Backend:**

```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL=postgresql://rshb_user:rshb_password@localhost:5432/rshb_db
export FARMERS_EXCEL_PATH=./data/farmers.xlsx
uvicorn main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Прокси `/api` → `http://127.0.0.1:8000` настроен в `frontend/vite.config.ts`.

Переменные окружения frontend (опционально):

```bash
VITE_API_URL=/api
VITE_PROXY_TARGET=http://127.0.0.1:8000
```

---

## Основные API-эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Проверка сервиса |
| GET | `/products` | Справочник продуктов |
| GET | `/products/categories` | Категории |
| GET | `/products/seasonal-changes` | Сезонные изменения |
| POST | `/upload-pdf` | Загрузка PDF-меню |
| GET | `/menu/dishes` | Справочник блюд |
| GET | `/suppliers-preview` | Поставщики для главной |
| GET | `/farmers/product/{name}` | Фермеры по продукту |

---
## Планы развития

- Раздел «Поставщики и поставки» (заказы, статусы доставок)
- Рекомендации блюд и замен ингредиентов с учётом сезона

---

## Команда проекта

- Full-stack Developer — Мушкина Виктория / tg: @ViktoriaM06
- Designer — Николаев Иван / tg: @okayokayd
- Designer — Волков Владимир / tg: @vovobla
- Product manager — Кузина Татьяна / tg: @Tanuhh_ka

