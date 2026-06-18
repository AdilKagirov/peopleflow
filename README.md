# KMF PeopleFlow

KMF PeopleFlow is an ATS/HR recruitment system prototype for KMF Bank. The current repository contains:

- a static clickable prototype: `peopleflow.html`, `peopleflow.css`, `peopleflow.js`;
- a PostgreSQL data model for the future production system;
- API and architecture notes prepared for later backend/frontend development;
- a migration-ready structure for a future import from the old E-Staff database.

## Run The Current Prototype

```bash
cd /tmp
python3 -m http.server 8000 --directory /Users/adilkagirov/Documents/hr
```

Open:

```text
http://localhost:8000/peopleflow.html
```

## Start PostgreSQL

Docker is required.

```bash
cd /Users/adilkagirov/Documents/hr
docker compose up -d postgres
```

Database connection:

```text
Host: localhost
Port: 5432
Database: kmf_peopleflow
User: kmf
Password: kmf_dev_password
```

The schema is loaded from `database/schema.sql`. Demo data is loaded from `database/seed.sql`.

## Run Backend

```bash
cd /Users/adilkagirov/Documents/hr/backend
cp .env.example .env
npm run start:dev
```

Backend URLs:

```text
http://localhost:3000/api
http://localhost:3000/api/health
```

The health endpoint checks the PostgreSQL connection when the database container is running.

## Project Direction

The next implementation step is to add a real backend API and connect the UI to PostgreSQL:

```text
frontend -> REST API -> PostgreSQL
```

The schema is intentionally normalized around candidates, vacancies, applications, pipeline stages, interviews, communications, attachments, users, roles, and audit logs. This makes it possible to migrate data from old E-Staff later, even if the old database structure is different.
