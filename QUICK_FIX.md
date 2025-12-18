# ✅ Код возвращен к рабочему состоянию

## Что было исправлено

1. **`frontend/front/src/api/axios.ts`**
   - Убраны переменные окружения
   - Возвращен простой хардкод URL
   - Для локальной разработки просто измените URL в коде

2. **`backend/db/session.py`**
   - Убраны лишние проверки и логирование
   - Возвращен к простому виду

3. **`backend/seed_data.py`**
   - Исправлен импорт (удален неиспользуемый `get_password_hash`)

## Как использовать

### Для локальной разработки

В `frontend/front/src/api/axios.ts` измените:
```typescript
baseURL: "http://127.0.0.1:8000/api/v1/",
```

### Для продакшена

В `frontend/front/src/api/axios.ts` используйте:
```typescript
baseURL: "http://146.103.117.133:8000/api/v1/",
```

## Запуск seed данных

```bash
cd /Users/hilexa/Desktop/app
source venv/bin/activate  # если используете venv
python3 seed_data.py
```

**Требования:**
- В базе должен быть хотя бы один пользователь
- В базе должен быть хотя бы один проект



