# KMF PeopleFlow Architecture

## Goal

Build a production-ready recruitment automation system for KMF Bank with a migration path from the old E-Staff system.

## Target Modules

1. Vacancies
   - vacancy creation and approval;
   - statuses: open, paused, closed, filled;
   - internal and external publication channels;
   - attachments and access control.

2. Candidates
   - centralized candidate database;
   - contacts, work experience, education, skills, tags;
   - resumes and parsed resume data;
   - deduplication by email/phone.

3. Applications
   - candidate-to-vacancy relation;
   - source tracking;
   - recruiter ownership;
   - current stage and full stage history.

4. Pipeline
   - reusable pipeline templates;
   - custom stages;
   - movement history with dates, comments, and responsible users.

5. Interviews
   - interview scheduling;
   - participants;
   - feedback and scoring;
   - future calendar/mail integration.

6. Communication
   - templates;
   - draft and sent messages;
   - history by candidate and application;
   - future email integration.

7. Reports
   - responses per vacancy;
   - time to close;
   - conversion by stage;
   - candidate sources;
   - recruiter workload.

8. Security
   - users, roles, permissions;
   - branch and department scoping;
   - audit logs.

## Proposed Stack

Frontend:

- React or Next.js;
- component-based UI;
- role-aware navigation;
- tables, filters, Kanban pipeline, reports.

Backend:

- NestJS, Laravel, or FastAPI;
- REST API first;
- background jobs for parsing resumes, sending emails, and importing legacy data.

Database:

- PostgreSQL;
- normalized ATS schema;
- JSONB only for parser results and audit snapshots, not as primary data storage.

Files:

- local storage for development;
- S3-compatible object storage for production.

## Data Model Principle

Do not attach a candidate directly to only one vacancy. Use:

```text
Candidate -> Application -> Vacancy
```

This allows one candidate to apply to multiple vacancies and keeps the candidate profile reusable.

## Migration Readiness

The future E-Staff migration should use a staging layer:

```text
Old E-Staff export -> staging tables -> validation -> production tables
```

This avoids polluting the production model with legacy-specific fields and makes reconciliation easier.

