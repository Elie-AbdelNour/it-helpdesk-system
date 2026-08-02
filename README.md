# IT Help Desk & Ticketing Management System

Full Stack Web Development Internship Project - a web-based IT Help Desk and
Ticketing Management System for streamlining internal technical support.

## Tech Stack

- **Frontend:** React 19 (Vite 8) + Tailwind CSS + React Router + Axios
- **Backend:** PHP 8.3+ / Laravel 13 + Laravel Sanctum (SPA cookie auth)
- **Database:** MySQL 8

See [HOW_TO_RUN.md](HOW_TO_RUN.md) for full setup instructions and
[requirements.txt](requirements.txt) for exact prerequisites and versions.

## Repository Structure

```text
it-helpdesk-system/
|-- backend/              Laravel REST API
|   |-- app/Models/       Eloquent models (mapped onto database/schema.sql)
|   |-- app/Http/         Controllers + RBAC middleware
|   |-- database/         Migrations + seeders (roles, categories, priorities, statuses, admin user)
|   `-- routes/api.php    /api/register, /api/login, /api/logout, /api/user
|-- frontend/             React application
|   `-- src/
|       |-- api/          Axios client (Sanctum-aware)
|       |-- context/      AuthContext (login/register/logout/session state)
|       |-- components/   ProtectedRoute
|       `-- pages/        Login, Register, Dashboard
|-- database/
|   `-- schema.sql        MySQL executable database schema (source of truth for the migrations)
|-- docs/
|   |-- README.md         Documentation index with ERD, workflows, and screenshots
|   `-- ...                workflow diagrams, ERD, UI prototypes
|-- requirements.txt      Prerequisite software/tools to run this project
|-- HOW_TO_RUN.md         Step-by-step setup and run guide
`-- README.md
```

## Documentation

The instructor-facing project materials are in [docs/README.md](docs/README.md).
That page renders the database ERD, workflow diagrams, and UI screenshots
directly on GitHub.

- [Database schema shown in docs](docs/database_schema.sql)
- [Executable MySQL schema](database/schema.sql)
- [Rendered ERD](docs/README.md#entity-relationship-diagram)

## Database Naming Rules

- Table names are plural.
- Every primary key column is named `id`.
- Table names and column names do not use underscores.

## Database

The schema covers:

- Roles, users, and password reset support (`roles`, `users`, `passwordresets`)
- Ticket lookups (`categories`, `priorities`, `statuses`)
- Core ticketing (`tickets`, `ticketcomments`, `ticketattachments`)
- Workflow and audit history (`assignmenthistories`, `activitylogs`)
- Communication (`notifications`)
- Optional knowledge base module (`kbarticles`)

`database/schema.sql` is kept as the canonical reference. In practice the
database is created by running the Laravel migrations in `backend/`, which
mirror it exactly (see Setup below).

## Setup

See **[HOW_TO_RUN.md](HOW_TO_RUN.md)** for the full step-by-step guide:
prerequisites, first-time backend/frontend setup, running both dev servers,
running the test suite, keeping your environment in sync after a `git pull`,
and troubleshooting.

## Status

Project in progress - see internship timeline for weekly milestones. Weeks 1-4
are complete: project setup, Sanctum authentication and RBAC, ticket CRUD,
and the assignment/status/comment workflow with SLA tracking.
