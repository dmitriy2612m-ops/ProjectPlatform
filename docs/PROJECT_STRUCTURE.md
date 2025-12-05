# Структура проекта

```
ProjectPlatform/
├── .github/
│   └── workflows/
│       └── ci-cd.yml              # CI/CD pipeline (GitHub Actions)
│
├── database/
│   └── postgres/
│       └── init.sql                # SQL скрипты инициализации БД
│
├── kubernetes/
│   ├── configmap.yaml              # Kubernetes ConfigMap
│   ├── deployment.yaml             # Kubernetes Deployments
│   ├── ingress.yaml                # Kubernetes Ingress
│   └── service.yaml                # Kubernetes Services
│
├── monitoring/
│   └── prometheus/
│       ├── prometheus.yml          # Prometheus config для Docker Compose
│       └── prometheus-swarm.yml    # Prometheus config для Docker Swarm
│
├── nginx/
│   ├── nginx.conf                  # Nginx config для Docker Compose
│   └── nginx-swarm.conf           # Nginx config для Docker Swarm
│
├── scripts/
│   ├── check-swarm.sh              # Скрипт проверки статуса Swarm
│   └── deploy-swarm.sh              # Скрипт деплоя в Swarm
│
├── src/
│   ├── api/
│   │   ├── Dockerfile              # Dockerfile для API сервиса
│   │   ├── main.py                 # Основной API (с БД и телеметрией)
│   │   ├── simple_main.py          # Упрощенный API (без БД)
│   │   └── requirements.txt        # Python зависимости
│   │
│   └── dashboard/
│       ├── Dockerfile              # Dockerfile для Dashboard
│       └── index.html               # Веб-интерфейс
│
├── docker-compose.yml              # Docker Compose конфигурация (для разработки)
├── docker-stack.yml                 # Docker Swarm конфигурация (для продакшена)
├── start-project.bat               # Скрипт запуска (Windows)
├── stop-project.bat                # Скрипт остановки (Windows)
├── docs/                           # Документация
│   ├── README.md                   # Основная документация
│   ├── CHANGELOG.md                # История изменений
│   └── PROJECT_STRUCTURE.md        # Структура проекта
└── .gitignore                       # Git ignore правила
```

## Описание компонентов

### Основные сервисы (6 контейнеров)

1. **PostgreSQL** - База данных
2. **Redis** - Кэш
3. **API** - REST API сервис (2 реплики)
4. **Dashboard** - Веб-интерфейс (1 реплика)
5. **Nginx** - Reverse proxy и балансировщик
6. **Prometheus** - Мониторинг

### Конфигурационные файлы

- `docker-stack.yml` - Основной файл для Docker Swarm (продакшен)
- `docker-compose.yml` - Для локальной разработки
- `nginx/nginx-swarm.conf` - Конфигурация Nginx для Swarm
- `monitoring/prometheus/prometheus-swarm.yml` - Конфигурация Prometheus для Swarm

### Скрипты

- `start-project.bat` - Автоматический запуск проекта (Windows)
- `stop-project.bat` - Остановка проекта (Windows)
- `scripts/deploy-swarm.sh` - Деплой в Swarm (Linux/Mac)
- `scripts/check-swarm.sh` - Проверка статуса Swarm


