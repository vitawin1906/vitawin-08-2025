#!/usr/bin/env python3
"""
Исправленный тест всех API эндпоинтов VitaWin платформы
Использует упрощенный метод получения токена для тестирования
"""

import pytest
import requests
import json
import urllib3
from typing import Optional

# Отключаем SSL warnings для тестов
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Базовые настройки
BASE_URL = "https://vitawins.ru"
TEST_TELEGRAM_ID = 1622907369
ADMIN_EMAIL = "admin@vitawins.ru"
ADMIN_PASSWORD = "VitawinAdmin2025!"

class APITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.user_token: Optional[str] = None
        self.admin_token: Optional[str] = None
        self.session = requests.Session()
        self.session.verify = False  # Отключаем SSL проверку для тестов
        
    def get_test_user_token(self) -> Optional[str]:
        """Получаем токен через telegram-bot-login эндпоинт"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/telegram-bot-login",
                json={
                    "telegram_id": TEST_TELEGRAM_ID,
                    "first_name": "Test User", 
                    "username": "test_user"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("authToken"):
                    print(f"✅ Получен тестовый токен пользователя")
                    return data["authToken"]
            
            print(f"❌ Ошибка получения токена: {response.status_code} {response.text}")
            return None
            
        except Exception as e:
            print(f"❌ Исключение при получении токена: {e}")
            return None
    
    def get_admin_token(self) -> Optional[str]:
        """Получаем админ токен через вход в админку"""
        try:
            # Сначала получаем капчу
            captcha_response = self.session.get(f"{self.base_url}/api/admin/captcha", timeout=10)
            if captcha_response.status_code != 200:
                print(f"❌ Ошибка получения капчи: {captcha_response.status_code}")
                return None
                
            captcha_data = captcha_response.json()
            captcha_token = captcha_data.get("token")
            
            if not captcha_token:
                print("❌ Не удалось получить captcha token")
                return None
                
            # Делаем логин (капчу оставляем пустой или тестовую)
            login_response = self.session.post(
                f"{self.base_url}/api/admin/login",
                json={
                    "email": ADMIN_EMAIL,
                    "password": ADMIN_PASSWORD,
                    "captcha": "test",  # Упрощенная капча для тестов
                    "captchaToken": captcha_token
                },
                timeout=10
            )
            
            if login_response.status_code == 200:
                data = login_response.json()
                if data.get("success"):
                    # Токен может быть в cookie или в ответе
                    admin_token = data.get("token")
                    if admin_token:
                        print(f"✅ Получен админ токен")
                        return admin_token
                    
                    # Проверяем cookies
                    for cookie in self.session.cookies:
                        if cookie.name == "adminToken":
                            print(f"✅ Получен админ токен из cookie")
                            return cookie.value
            
            print(f"❌ Ошибка входа админа: {login_response.status_code} {login_response.text}")
            return None
            
        except Exception as e:
            print(f"❌ Исключение при получении админ токена: {e}")
            return None

@pytest.fixture(scope="session")
def api_tester():
    """Создаем и настраиваем тестер API"""
    tester = APITester()
    
    # Получаем токены
    tester.user_token = tester.get_test_user_token()
    tester.admin_token = tester.get_admin_token()
    
    return tester

# Список всех эндпоинтов для тестирования
TEST_ENDPOINTS = [
    # Базовые проверки
    {
        "name": "Health Check",
        "method": "GET",
        "url": "/health",
        "auth_type": None,
        "expected_status": 200
    },
    
    # Пользовательская авторизация
    {
        "name": "Get Current User",
        "method": "GET", 
        "url": "/api/user",
        "auth_type": "user",
        "expected_status": 200
    },
    
    # Товары
    {
        "name": "Get Products",
        "method": "GET",
        "url": "/api/products?limit=10",
        "auth_type": None,
        "expected_status": 200
    },
    {
        "name": "Get Specific Product",
        "method": "GET",
        "url": "/api/product/18",
        "auth_type": None,
        "expected_status": 200
    },
    
    # Корзина
    {
        "name": "Get Cart",
        "method": "GET",
        "url": "/api/cart",
        "auth_type": None,
        "expected_status": 200
    },
    {
        "name": "Update Cart",
        "method": "POST",
        "url": "/api/cart",
        "auth_type": None,
        "data": {"product_id": 18, "quantity": 1},
        "expected_status": 200
    },
    
    # Заказы пользователя
    {
        "name": "Get User Orders",
        "method": "GET",
        "url": "/api/orders",
        "auth_type": "user",
        "expected_status": 200
    },
    
    # Реферальная система
    {
        "name": "Get Referral Stats", 
        "method": "GET",
        "url": "/api/referral/stats",
        "auth_type": "user",
        "expected_status": 200
    },
    {
        "name": "Validate Referral Code",
        "method": "POST",
        "url": "/api/validate-referral-code",
        "auth_type": "user", 
        "data": {"referral_code": "1234567890"},
        "expected_status": [200, 400]  # Может быть невалидный код
    },
    
    # MLM система
    {
        "name": "Get MLM Levels",
        "method": "GET",
        "url": "/api/mlm/levels",
        "auth_type": None,
        "expected_status": 200
    },
    {
        "name": "Get My MLM Network Tree",
        "method": "GET",
        "url": "/api/mlm/network/my-tree",
        "auth_type": "user",
        "expected_status": 200
    },
    
    # Блог
    {
        "name": "Get Blog Posts",
        "method": "GET", 
        "url": "/api/blog?limit=10",
        "auth_type": None,
        "expected_status": 200
    },
    {
        "name": "Get Specific Blog Post",
        "method": "GET",
        "url": "/api/blog/6",
        "auth_type": None,
        "expected_status": [200, 404]  # Может не существовать
    },
    
    # Настройки сайта
    {
        "name": "Get Site Scripts",
        "method": "GET",
        "url": "/api/site-scripts",
        "auth_type": None,
        "expected_status": 200
    },
    
    # Админские эндпоинты
    {
        "name": "Get Admin Products",
        "method": "GET",
        "url": "/api/admin/products",
        "auth_type": "admin",
        "expected_status": 200
    },
    {
        "name": "Get Admin Users",
        "method": "GET",
        "url": "/api/admin/users?limit=10",
        "auth_type": "admin", 
        "expected_status": 200
    },
    {
        "name": "Get Admin Stats",
        "method": "GET",
        "url": "/api/admin/stats",
        "auth_type": "admin",
        "expected_status": 200
    },
    {
        "name": "Get Admin Orders",
        "method": "GET",
        "url": "/api/admin/orders",
        "auth_type": "admin",
        "expected_status": 200
    },
    {
        "name": "Get Admin MLM Network Users",
        "method": "GET",
        "url": "/api/admin/mlm/network/users",
        "auth_type": "admin",
        "expected_status": 200
    },
    
    # Изображения
    {
        "name": "Get Sample Image",
        "method": "GET",
        "url": "/api/uploads/test_image.jpg",
        "auth_type": None,
        "expected_status": [200, 404]  # Может не существовать
    },
    
    # Дополнительные проверки
    {
        "name": "Get User by Telegram ID",
        "method": "GET",
        "url": f"/api/user/telegram/{TEST_TELEGRAM_ID}",
        "auth_type": None,
        "expected_status": 200
    },
    {
        "name": "Get Orders by Telegram ID",
        "method": "GET", 
        "url": f"/api/orders/telegram/{TEST_TELEGRAM_ID}",
        "auth_type": None,
        "expected_status": 200
    }
]

@pytest.mark.parametrize("endpoint", TEST_ENDPOINTS)
def test_endpoint(api_tester, endpoint):
    """Тестируем каждый эндпоинт"""
    
    # Определяем нужна ли авторизация
    headers = {}
    
    if endpoint["auth_type"] == "user":
        if not api_tester.user_token:
            pytest.skip("Не удалось получить пользовательский токен")
        headers["Authorization"] = f"Bearer {api_tester.user_token}"
        
    elif endpoint["auth_type"] == "admin":
        if not api_tester.admin_token:
            pytest.skip("Не удалось получить админский токен")
        # Админский токен может быть в cookie
        api_tester.session.cookies.set("adminToken", api_tester.admin_token)
    
    # Выполняем запрос
    url = api_tester.base_url + endpoint["url"]
    method = endpoint["method"].upper()
    data = endpoint.get("data")
    
    try:
        if method == "GET":
            response = api_tester.session.get(url, headers=headers, timeout=15)
        elif method == "POST":
            response = api_tester.session.post(url, headers=headers, json=data, timeout=15)
        elif method == "PUT":
            response = api_tester.session.put(url, headers=headers, json=data, timeout=15)
        elif method == "DELETE":
            response = api_tester.session.delete(url, headers=headers, timeout=15)
        else:
            pytest.fail(f"Неподдерживаемый HTTP метод: {method}")
            
    except requests.exceptions.RequestException as e:
        pytest.fail(f"Ошибка запроса к {endpoint['name']}: {e}")
    
    # Проверяем статус код
    expected_status = endpoint["expected_status"]
    if isinstance(expected_status, list):
        assert response.status_code in expected_status, \
            f"{endpoint['name']}: Ожидался статус {expected_status}, получен {response.status_code}. Ответ: {response.text[:200]}"
    else:
        assert response.status_code == expected_status, \
            f"{endpoint['name']}: Ожидался статус {expected_status}, получен {response.status_code}. Ответ: {response.text[:200]}"
    
    # Для успешных JSON ответов проверяем структуру
    if response.status_code == 200 and 'application/json' in response.headers.get('content-type', ''):
        try:
            json_data = response.json()
            # Большинство эндпоинтов возвращают success: true
            if "success" in json_data:
                assert json_data["success"] is True, f"{endpoint['name']}: success должен быть true"
        except json.JSONDecodeError:
            # Некоторые эндпоинты могут возвращать не JSON (например, изображения)
            pass
    
    print(f"✅ {endpoint['name']}: {response.status_code}")

if __name__ == "__main__":
    # Запуск тестов
    print("🚀 Запуск исправленных тестов API эндпоинтов VitaWin")
    print(f"🎯 Тестируем {len(TEST_ENDPOINTS)} эндпоинтов")
    print(f"🌐 Базовый URL: {BASE_URL}")
    
    pytest.main([__file__, "-v", "--tb=short"])