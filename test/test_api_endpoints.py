import json
import os
import pytest
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

VITAWIN_API_SPEC = 'vitawin-api-endpoints.json'
BASE_URL = 'https://vitawins.ru'  # теперь внешний домен
PORT = 443

@pytest.fixture(scope='session')
def api_spec():
    with open(VITAWIN_API_SPEC, encoding='utf-8') as f:
        return json.load(f)['vitawin_api_endpoints']

@pytest.fixture(scope='session')
def base_url(api_spec):
    return BASE_URL  # не добавляем :443

@pytest.fixture(scope='session')
def test_token(api_spec, base_url):
    # Получаем тестовый токен через /api/auth/telegram
    url = f"{base_url}/api/auth/telegram"
    data = api_spec['test_user_data'].copy()
    data['referral_code'] = data['telegram_id']
    data['id'] = data['telegram_id']
    data['auth_date'] = 1234567890  # фиктивное значение
    data['hash'] = 'testhash'       # фиктивное значение
    resp = requests.post(url, json=data, verify=False)
    if resp.ok and 'token' in resp.json():
        return resp.json()['token']
    pytest.skip(f'Не удалось получить тестовый токен: {resp.status_code} {resp.text}')

@pytest.mark.parametrize('ep', [
    (group, name, ep)
    for group, group_val in json.load(open(VITAWIN_API_SPEC, encoding='utf-8'))['vitawin_api_endpoints']['endpoints'].items()
    for name, ep in (group_val.items() if isinstance(group_val, dict) else [(group, group_val)])
])
def test_endpoint(ep, base_url, test_token):
    group, name, endpoint = ep
    url = endpoint['url']
    method = endpoint['method']
    full_url = base_url + url.replace(':id', '18').replace(':filename', 'test_image.jpg')
    headers = {}
    data = None
    if endpoint.get('auth_required'):
        headers['Authorization'] = f'Bearer {test_token}'
    if method == 'POST' and endpoint.get('request_body'):
        data = endpoint['request_body']
    try:
        if method == 'GET':
            r = requests.get(full_url, headers=headers, timeout=10, verify=False)
        elif method == 'POST':
            r = requests.post(full_url, headers=headers, json=data, timeout=10, verify=False)
        elif method == 'DELETE':
            r = requests.delete(full_url, headers=headers, timeout=10, verify=False)
        else:
            pytest.skip(f'Не поддерживаемый метод {method}')
    except Exception as e:
        pytest.fail(f'Ошибка запроса: {e}')
    assert r.status_code < 500, f"{group}/{name}: Сервер вернул {r.status_code} — {r.text}" 