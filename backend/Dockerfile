FROM python:3.12-slim

WORKDIR /app

# Устанавливаем зависимости системы
RUN apt-get update && apt-get install -y --no-install-recommends \
 libpq-dev \
 gcc \
 g++ \
 python3-dev \
 && rm -rf /var/lib/apt/lists/*

# Обновляем pip
RUN pip install --upgrade pip

COPY requirements.txt .

# Устанавливаем все зависимости
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Создаем директории
RUN mkdir -p /app/uploads /app/data

# Копируем директорию с данными (Excel можно положить в backend/data/)
COPY data/ /app/data/

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]