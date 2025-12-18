# Запуск фронтенда через Docker

## Быстрый старт

1. **Убедитесь, что Docker Desktop запущен**

2. **Запустите фронтенд:**
   ```bash
   ./start-frontend-docker.sh
   ```
   
   Или вручную:
   ```bash
   docker compose up -d --build frontend
   ```

3. **Фронтенд будет доступен на:** http://localhost:5174

## Полезные команды

- **Просмотр логов:**
  ```bash
  docker compose logs -f frontend
  ```

- **Остановка:**
  ```bash
  docker compose stop frontend
  ```

- **Перезапуск:**
  ```bash
  docker compose restart frontend
  ```

- **Удаление контейнера:**
  ```bash
  docker compose down frontend
  ```

## Структура

- `frontend/frontend/front/Dockerfile` - Dockerfile для фронтенда
- `docker-compose.yml` - конфигурация сервисов (обновлен с сервисом frontend)
- `frontend/frontend/front/vite.config.ts` - настроен порт 5174


