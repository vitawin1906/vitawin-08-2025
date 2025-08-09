#!/bin/bash
set -e

echo '1. Останавливаю docker compose...'
docker compose down || true

echo '2. Запускаю docker compose up --build -d...'
docker compose up --build -d

sleep 8
echo '3. Запускаю pytest test/test_api_endpoints.py...'
pytest test/test_api_endpoints.py || echo 'Тесты test_api_endpoints.py завершились с ошибками, но docker продолжает работать.'

echo '4. Запускаю pytest test/test_api_endpoints_fixed.py...'
pytest test/test_api_endpoints_fixed.py || echo 'Тесты test_api_endpoints_fixed.py завершились с ошибками, но docker продолжает работать.'

echo '5. Запускаю python test_api_simple.py...'
python3 test_api_simple.py || echo 'Тесты test_api_simple.py завершились с ошибками, но docker продолжает работать.'

echo 'Готово!' 