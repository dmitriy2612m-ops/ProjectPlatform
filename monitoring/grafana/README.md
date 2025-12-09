# Grafana Configuration

## Доступ к Grafana

После запуска проекта Grafana доступна по адресу:
- **URL**: http://localhost:3000
- **Логин**: `admin`
- **Пароль**: `admin` (при первом входе попросит сменить)

## Автоматическая настройка

Файл `datasources.yml` автоматически настраивает подключение к Prometheus при первом запуске Grafana.

## Создание дашборда для мониторинга платформы

### Шаг 1: Создайте новый дашборд
1. Войдите в Grafana
2. Нажмите "+" → "Create dashboard"
3. Нажмите "Add visualization"

### Шаг 2: Добавьте панели

#### Панель 1: Количество активных транспортных средств
- **Тип**: Stat
- **Запрос PromQL**: `count(vehicles_total)`
- **Название**: "Количество активных ТС"

#### Панель 2: Частота запросов API
- **Тип**: Graph
- **Запрос PromQL**: `rate(http_requests_total[5m])`
- **Название**: "API Requests/sec"
- **Легенда**: `{{method}} {{endpoint}}`

#### Панель 3: Время отклика API
- **Тип**: Graph
- **Запрос PromQL**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- **Название**: "API Response Time (95th percentile)"
- **Единицы**: seconds

#### Панель 4: Использование CPU
- **Тип**: Gauge
- **Запрос PromQL**: `100 - (avg(irate(container_cpu_usage_seconds_total[5m])) * 100)`
- **Название**: "CPU Usage %"
- **Min**: 0, **Max**: 100

#### Панель 5: Использование памяти
- **Тип**: Graph
- **Запрос PromQL**: `container_memory_usage_bytes / container_spec_memory_limit_bytes * 100`
- **Название**: "Memory Usage %"

#### Панель 6: Статус сервисов
- **Тип**: Stat
- **Запрос PromQL**: `up`
- **Название**: "Service Status"
- **Thresholds**: 
  - Green: 1
  - Red: 0

### Шаг 3: Сохраните дашборд
1. Нажмите "Save dashboard"
2. Введите название: "Autopark Platform Monitoring"
3. Нажмите "Save"

## Полезные запросы PromQL

- `rate(http_requests_total[5m])` - частота HTTP запросов
- `up` - статус сервисов (1 = работает, 0 = не работает)
- `container_cpu_usage_seconds_total` - использование CPU
- `container_memory_usage_bytes` - использование памяти
- `http_request_duration_seconds` - время обработки запросов

## Экспорт дашборда

После создания дашборда вы можете экспортировать его:
1. Откройте дашборд
2. Нажмите на иконку настроек (⚙️)
3. Выберите "JSON Model"
4. Скопируйте JSON и сохраните в файл `dashboard.json`

