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

If the backend is running on `http://localhost:3000`, the prototype loads vacancies, candidates, applications, and reference data from PostgreSQL through the API. If the backend is not running, it falls back to local demo data in the browser.

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
http://localhost:3000/api/vacancies
http://localhost:3000/api/candidates
http://localhost:3000/api/applications
http://localhost:3000/api/approvals
http://localhost:3000/api/reference
```

The health endpoint checks the PostgreSQL connection when the database container is running.

Delete an imported candidate:

```bash
curl -X DELETE http://localhost:3000/api/candidates/<candidateId>
```

Candidate applications and resume rows are removed by database cascade. Imported candidate attachments and local uploaded files are also cleaned up by the API.

## Candidate Approval Workflow

Apply pending database migrations after pulling changes:

```bash
cd /Users/adilkagirov/Documents/hr/backend
npm run db:migrate
```

Workflow:

```text
Recruiter -> Customer approval -> Customer interview -> Security check -> Recruiter follow-up
```

API:

```text
GET  /api/approvals
POST /api/approvals/applications/:applicationId
POST /api/approvals/:id/decision
```

The frontend provides an `Approvals` page. Recruiters send a candidate to the customer or security, while the Customer and Security roles receive their own decision queues.

## Resume And HH Imports

Manual resume upload endpoint:

```text
POST http://localhost:3000/api/imports/resumes
field: resume
optional field: vacancyId
```

The current implementation stores uploaded PDF/DOC/DOCX/TXT files, creates or updates a candidate, creates an attachment and resume record, and links the candidate to a vacancy when `vacancyId` is provided. TXT files get basic text parsing; PDF/DOC/DOCX parser integration is planned as the next enhancement.

HH integration skeleton:

```text
GET  http://localhost:3000/api/integrations/hh/status
GET  http://localhost:3000/api/integrations/hh/connect
POST http://localhost:3000/api/integrations/hh/sync
```

Set these variables before real hh.kz OAuth integration:

```text
HH_CLIENT_ID=
HH_CLIENT_SECRET=
HH_REDIRECT_URI=http://localhost:3000/api/integrations/hh/oauth/callback
```

## Project Direction

The next implementation step is to add a real backend API and connect the UI to PostgreSQL:

```text
frontend -> REST API -> PostgreSQL
```

The schema is intentionally normalized around candidates, vacancies, applications, pipeline stages, interviews, communications, attachments, users, roles, and audit logs. This makes it possible to migrate data from old E-Staff later, even if the old database structure is different.
