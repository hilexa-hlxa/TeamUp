#!/bin/bash

# Скрипт для запуска фронтенда через Docker (без docker-compose)

echo "🚀 Запуск фронтенда через Docker..."

# Проверяем, запущен ли Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker не запущен. Пожалуйста, запустите Docker Desktop и попробуйте снова."
    exit 1
fi

# Переходим в директорию фронтенда
cd "$(dirname "$0")/frontend/frontend/front"

# Имя образа
IMAGE_NAME="teamup-frontend"
CONTAINER_NAME="teamup-frontend"

# Останавливаем и удаляем старый контейнер, если существует
echo "🛑 Остановка старого контейнера (если есть)..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Собираем образ
echo "📦 Сборка Docker образа..."
docker build -t $IMAGE_NAME .

# Запускаем контейнер
echo "🚀 Запуск контейнера на порту 5174..."
docker run -d \
  --name $CONTAINER_NAME \
  -p 5174:5174 \
  -v "$(pwd):/app" \
  -v /app/node_modules \
  $IMAGE_NAME

# Проверяем статус
if [ $? -eq 0 ]; then
    echo "✅ Фронтенд запущен на http://localhost:5174"
    echo "📋 Для просмотра логов: docker logs -f $CONTAINER_NAME"
    echo "🛑 Для остановки: docker stop $CONTAINER_NAME"
    echo "🗑️  Для удаления: docker rm $CONTAINER_NAME"
else
    echo "❌ Ошибка при запуске фронтенда"
    exit 1
fi


