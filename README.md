# JobTracker

JobTracker — веб-приложение для удобного ведения и контроля откликов на вакансии. Проект помогает сохранять информацию о компаниях и вакансиях, отслеживать этапы поиска работы, быстро находить нужные записи и управлять ими в одном месте.

## Возможности

- добавление, редактирование и удаление откликов на вакансии;
- хранение информации о вакансии и компании;
- просмотр откликов в виде таблицы;
- фильтрация и поиск по списку вакансий;
- пагинация больших списков;
- экспорт данных в PDF;
- переключение светлой и тёмной темы;
- мультиязычный интерфейс;
- автоматическое резервное копирование базы данных PostgreSQL.

## Поддерживаемые языки

Интерфейс приложения доступен на трёх языках:

- English (`en`);
- Українська (`uk` / UA);
- Deutsch (`de`).

## Технологии

### Frontend

- React 19;
- TypeScript;
- Vite;
- Axios для HTTP-запросов к API;
- i18next и react-i18next для локализации;
- Sass/SCSS для стилизации;
- jsPDF и jspdf-autotable для экспорта данных в PDF;
- ESLint для проверки качества кода.

### Backend

- Python;
- Django;
- Django REST Framework;
- django-cors-headers;
- PostgreSQL;
- psycopg2 для подключения к PostgreSQL;
- django-environ и python-dotenv для работы с переменными окружения.

### Инфраструктура

- Docker;
- Docker Compose;
- PostgreSQL 17;
- автоматические миграции Django;
- ежедневное резервное копирование базы данных с хранением бэкапов за последние 7 дней.

## Структура проекта

```text
JobTracker/
├── backend/              # Django-приложение и REST API
│   ├── apps/jobs/        # логика работы с откликами
│   ├── config/           # настройки проекта
│   ├── locale/           # локализация backend
│   └── requirements.txt  # Python-зависимости
├── fe/                   # React-приложение
│   ├── src/components/   # UI-компоненты
│   ├── src/hooks/        # пользовательские хуки
│   ├── src/i18n/         # локализации en, uk и de
│   └── package.json      # frontend-зависимости
├── backups/              # резервные копии PostgreSQL
└── docker-compose.yml    # конфигурация сервисов
```

## Запуск через Docker Compose

### Требования

- Docker;
- Docker Compose.

### Запуск

Перед первым запуском создайте внешние Docker-ресурсы, указанные в `docker-compose.yml`:

```bash
docker network create jobs_network
docker volume create jobs_postgres_data
```

Запустите приложение:

```bash
docker compose up --build
```

После запуска сервисы доступны по адресам:

- frontend: http://localhost:5172
- backend: http://localhost:9212
- PostgreSQL: localhost:5433

При старте backend автоматически выполняются миграции Django. Данные PostgreSQL сохраняются в Docker volume, а сервис резервного копирования ежедневно создаёт SQL-дамп в директории `backups/`.

## Локальная разработка

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 9212
```

### Frontend

```bash
cd fe
npm install
npm run dev
```

Основные команды frontend:

```bash
npm run dev      # запуск dev-сервера
npm run build    # проверка TypeScript и production-сборка
npm run lint     # проверка ESLint
npm run preview  # просмотр production-сборки
```

## Архитектура

Проект состоит из React frontend и Django REST API backend. Frontend взаимодействует с backend через HTTP-запросы, а backend хранит данные в PostgreSQL. Все сервисы могут запускаться вместе через Docker Compose.

## Лицензия

Лицензия проекта пока не указана.
