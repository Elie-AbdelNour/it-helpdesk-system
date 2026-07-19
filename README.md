# IT Help Desk & Ticketing Management System

Full Stack Web Development Internship Project - a web-based IT Help Desk and
Ticketing Management System for streamlining internal technical support.

## Tech Stack

- **Frontend:** React 18 (Vite) + Tailwind CSS + React Router + Axios
- **Backend:** PHP 8.2+ / Laravel 13 + Laravel Sanctum (SPA cookie auth)
- **Database:** MySQL 8

See [requirements.txt](requirements.txt) for exact prerequisites and versions.

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

### Prerequisites

See [requirements.txt](requirements.txt). In short: PHP 8.2+, Composer,
Node.js 18+/npm, and a running MySQL 8 server.

### 1. Backend (Laravel API)

```bash
cd backend
composer install
copy .env.example .env        # Windows (use `cp` on macOS/Linux)
php artisan key:generate
```

Edit `backend/.env` and set your database credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ithelpdesk
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

Create the database, then run migrations and seeders:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ithelpdesk CHARACTER SET utf8mb4;"
php artisan migrate --seed
php artisan serve
```

The API is now running at `http://localhost:8000`. The seeders create the 4
roles (Admin, IT Support Agent, Employee, Manager), the ticket lookup tables
(categories/priorities/statuses), and one test admin login:

- **Email:** `admin@ithelpdesk.test`
- **Password:** `Password123!`

### 2. Frontend (React)

```bash
cd frontend
npm install
copy .env.example .env        # Windows (use `cp` on macOS/Linux) - or create .env with:
                               # VITE_API_URL=http://localhost:8000
npm run dev
```

The app is now running at `http://localhost:5173`. Register a new account
(created as an Employee) or log in with the seeded admin above.

**Note:** the backend and frontend must run on the ports above (8000 and
5173) for Sanctum's cookie-based session auth and CORS to work out of the
box; see `SANCTUM_STATEFUL_DOMAINS` / `FRONTEND_URL` in `backend/.env` if you
need to change them.

## Status

Project in progress - see internship timeline for weekly milestones. Week 2
(project setup, Laravel + React scaffolding, Sanctum authentication,
role-based authorization) is complete.
