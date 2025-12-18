# Запуск фронтенда через Docker (без docker-compose)

## Быстрый старт

1. **Убедитесь, что Docker Desktop запущен**

2. **Запустите скрипт:**
   ```bash
   ./run-frontend-docker.sh
   ```

3. **Или вручную выполните команды:**

   ```bash
   cd frontend/frontend/front
   
   # Сборка образа
   docker build -t teamup-frontend .
   
   # Запуск контейнера
   docker run -d \
     --name teamup-frontend \
     -p 5174:5174 \
     -v "$(pwd):/app" \
     -v /app/node_modules \
     teamup-frontend
   ```

4. **Фронтенд будет доступен на:** http://localhost:5174

## Полезные команды

- **Просмотр логов:**
  ```bash
  docker logs -f teamup-frontend
  ```

- **Остановка:**
  ```bash
  docker stop teamup-frontend
  ```

- **Запуск остановленного контейнера:**
  ```bash
  docker start teamup-frontend
  ```

- **Удаление контейнера:**
  ```bash
  docker rm teamup-frontend
  ```

- **Удаление образа:**
  ```bash
  docker rmi teamup-frontend
  ```

- **Пересборка и перезапуск:**
  ```bash
  docker stop teamup-frontend && docker rm teamup-frontend
  docker build -t teamup-frontend .
  docker run -d --name teamup-frontend -p 5174:5174 \
    -v "$(pwd):/app" -v /app/node_modules teamup-frontend
  ```

## Объяснение параметров

- `-d` - запуск в фоновом режиме (detached)
- `--name teamup-frontend` - имя контейнера
- `-p 5174:5174` - проброс порта (host:container)
- `-v "$(pwd):/app"` - монтирование текущей директории для hot reload
- `-v /app/node_modules` - анонимный том для node_modules (чтобы не перезаписывать)


