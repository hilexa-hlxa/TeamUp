#!/usr/bin/env python3
"""
Тестирование API проектов
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000/api/v1"

def print_test(name, status, details=""):
    """Выводит результат теста"""
    icon = "✅" if status else "❌"
    print(f"{icon} {name}")
    if details:
        print(f"   {details}")

def test_server_health():
    """Проверка доступности сервера"""
    try:
        response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/health", timeout=5)
        if response.status_code == 200:
            print_test("Сервер доступен", True, response.json())
            return True
        else:
            print_test("Сервер недоступен", False, f"Status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_test("Сервер недоступен", False, str(e))
        return False

def get_auth_token(email="mentor@campus.test", password="password123"):
    """Получение токена авторизации"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"   Ошибка авторизации: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"   Ошибка при получении токена: {e}")
        return None

def test_list_projects():
    """Тест получения списка проектов"""
    try:
        response = requests.get(f"{BASE_URL}/projects", timeout=5)
        if response.status_code == 200:
            projects = response.json()
            print_test("GET /projects", True, f"Найдено проектов: {len(projects)}")
            return projects
        else:
            print_test("GET /projects", False, f"Status: {response.status_code}")
            return []
    except Exception as e:
        print_test("GET /projects", False, str(e))
        return []

def test_get_project(project_id):
    """Тест получения проекта по ID"""
    try:
        response = requests.get(f"{BASE_URL}/projects/{project_id}", timeout=5)
        if response.status_code == 200:
            project = response.json()
            print_test(f"GET /projects/{project_id}", True, f"Название: {project.get('title')}")
            return project
        elif response.status_code == 404:
            print_test(f"GET /projects/{project_id}", False, "Проект не найден")
            return None
        else:
            print_test(f"GET /projects/{project_id}", False, f"Status: {response.status_code}")
            return None
    except Exception as e:
        print_test(f"GET /projects/{project_id}", False, str(e))
        return None

def test_create_project(token):
    """Тест создания проекта"""
    if not token:
        print_test("POST /projects", False, "Нет токена авторизации")
        return None
    
    project_data = {
        "title": f"Test Project {datetime.now().strftime('%H%M%S')}",
        "description": "Это тестовый проект для проверки API",
        "tech_stack": ["Python", "FastAPI", "React"],
        "prize": "1000 USD",
        "deadline": (datetime.now() + timedelta(days=30)).isoformat(),
        "max_participants": 5
    }
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BASE_URL}/projects",
            json=project_data,
            headers=headers,
            timeout=5
        )
        if response.status_code == 201:
            project = response.json()
            print_test("POST /projects", True, f"Создан проект ID: {project.get('id')}")
            return project
        else:
            print_test("POST /projects", False, f"Status: {response.status_code} - {response.text[:100]}")
            return None
    except Exception as e:
        print_test("POST /projects", False, str(e))
        return None

def test_update_project(project_id, token):
    """Тест обновления проекта"""
    if not token:
        print_test(f"PATCH /projects/{project_id}", False, "Нет токена авторизации")
        return None
    
    update_data = {
        "description": "Обновленное описание проекта",
        "status": "in_progress"
    }
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.patch(
            f"{BASE_URL}/projects/{project_id}",
            json=update_data,
            headers=headers,
            timeout=5
        )
        if response.status_code == 200:
            project = response.json()
            print_test(f"PATCH /projects/{project_id}", True, f"Обновлен: {project.get('title')}")
            return project
        else:
            print_test(f"PATCH /projects/{project_id}", False, f"Status: {response.status_code} - {response.text[:100]}")
            return None
    except Exception as e:
        print_test(f"PATCH /projects/{project_id}", False, str(e))
        return None

def test_delete_project(project_id, token):
    """Тест удаления проекта"""
    if not token:
        print_test(f"DELETE /projects/{project_id}", False, "Нет токена авторизации")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.delete(
            f"{BASE_URL}/projects/{project_id}",
            headers=headers,
            timeout=5
        )
        if response.status_code == 204:
            print_test(f"DELETE /projects/{project_id}", True, "Проект удален")
            return True
        else:
            print_test(f"DELETE /projects/{project_id}", False, f"Status: {response.status_code} - {response.text[:100]}")
            return False
    except Exception as e:
        print_test(f"DELETE /projects/{project_id}", False, str(e))
        return False

def test_filter_projects():
    """Тест фильтрации проектов"""
    try:
        # Тест фильтрации по статусу
        response = requests.get(f"{BASE_URL}/projects?status=active", timeout=5)
        if response.status_code == 200:
            projects = response.json()
            print_test("GET /projects?status=active", True, f"Найдено: {len(projects)}")
        
        # Тест фильтрации по tech_stack
        response = requests.get(f"{BASE_URL}/projects?tech_stack=Python&tech_stack=React", timeout=5)
        if response.status_code == 200:
            projects = response.json()
            print_test("GET /projects?tech_stack=Python,React", True, f"Найдено: {len(projects)}")
        
        return True
    except Exception as e:
        print_test("Фильтрация проектов", False, str(e))
        return False

def main():
    print("=" * 60)
    print("🧪 ТЕСТИРОВАНИЕ API ПРОЕКТОВ")
    print("=" * 60)
    print()
    
    # 1. Проверка сервера
    if not test_server_health():
        print("\n❌ Сервер недоступен. Убедитесь, что бэкенд запущен:")
        print("   python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        return
    
    print()
    
    # 2. Получение токена (для тестов создания/обновления/удаления)
    print("🔐 Авторизация...")
    token = get_auth_token()
    if token:
        print_test("Авторизация", True, "Токен получен")
    else:
        print_test("Авторизация", False, "Используем тесты без авторизации")
    print()
    
    # 3. Получение списка проектов
    print("📋 Тесты получения данных:")
    projects = test_list_projects()
    print()
    
    # 4. Получение проекта по ID (если есть проекты)
    if projects:
        first_project = projects[0]
        project_id = first_project.get("id")
        if project_id:
            test_get_project(project_id)
    else:
        print("⚠️  Нет проектов для тестирования GET /projects/{id}")
    print()
    
    # 5. Фильтрация проектов
    print("🔍 Тесты фильтрации:")
    test_filter_projects()
    print()
    
    # 6. Создание проекта (требует авторизации)
    if token:
        print("➕ Тесты создания/обновления/удаления:")
        new_project = test_create_project(token)
        print()
        
        # 7. Обновление проекта
        if new_project:
            project_id = new_project.get("id")
            test_update_project(project_id, token)
            print()
            
            # 8. Удаление проекта
            test_delete_project(project_id, token)
        else:
            print("⚠️  Не удалось создать проект для тестирования обновления/удаления")
    else:
        print("⚠️  Пропущены тесты создания/обновления/удаления (требуется авторизация)")
    
    print()
    print("=" * 60)
    print("✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
    print("=" * 60)

if __name__ == "__main__":
    main()

