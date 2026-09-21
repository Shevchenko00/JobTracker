# JobTracker

JobTracker is a web application for conveniently managing and tracking job applications. The project helps users save information about companies and vacancies, track the stages of their job search, quickly find the required records, and manage everything in one place.

## Features

- adding, editing, and deleting job applications;
- storing vacancy and company information;
- viewing applications in a table;
- filtering and searching through the list of vacancies;
- pagination for large lists;
- exporting data to PDF;
- switching between light and dark themes;
- multilingual interface;
- automatic PostgreSQL database backups.

## Supported Languages

The application interface is available in three languages:

- English (`en`);
- Ukrainian (`uk` / UA);
- German (`de`).

## Technologies

### Frontend

- React 19;
- TypeScript;
- Vite;
- Axios for HTTP requests to the API;
- i18next and react-i18next for localization;
- Sass/SCSS for styling;
- jsPDF and jspdf-autotable for exporting data to PDF;
- ESLint for code quality checks.

### Backend

- Python;
- Django;
- Django REST Framework;
- django-cors-headers;
- PostgreSQL;
- psycopg2 for connecting to PostgreSQL;
- django-environ and python-dotenv for working with environment variables.

### Infrastructure

- Docker;
- Docker Compose;
- PostgreSQL 17;
- automatic Django migrations;
- daily database backups with backups retained for the last 7 days.

## Project Structure

```text
JobTracker/
├── backend/              # Django application and REST API
│   ├── apps/jobs/        # job application logic
│   ├── config/           # project configuration
│   ├── locale/           # backend localization
│   └── requirements.txt  # Python dependencies
├── fe/                   # React application
│   ├── src/components/   # UI components
│   ├── src/hooks/        # custom hooks
│   ├── src/i18n/         # en, uk, and de localizations
│   └── package.json      # frontend dependencies
├── backups/              # PostgreSQL backups
└── docker-compose.yml    # service configuration
```

## Running with Docker Compose

### Requirements

- Docker;
- Docker Compose.

### Launch

Before the first launch, create the external Docker resources specified in `docker-compose.yml`:

```bash
docker network create jobs_network
docker volume create jobs_postgres_data
```

Start the application:

```bash
docker compose up --build
```

After startup, the services are available at:

- frontend: http://localhost:5172
- backend: http://localhost:9212
- PostgreSQL: localhost:5433

When the backend starts, Django migrations are applied automatically. PostgreSQL data is stored in a Docker volume, while the backup service creates a SQL dump every day in the `backups/` directory.

## Local Development

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

Main frontend commands:

```bash
npm run dev      # start the development server
npm run build    # check TypeScript and create a production build
npm run lint     # run ESLint checks
npm run preview  # preview the production build
```

## Architecture

The project consists of a React frontend and a Django REST API backend. The frontend communicates with the backend through HTTP requests, while the backend stores data in PostgreSQL. All services can be launched together using Docker Compose.

## License

No license has been specified for the project yet.
