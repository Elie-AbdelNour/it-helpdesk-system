# How to Run the IT Help Desk & Ticketing System

This guide covers everything needed to get the app running on a machine,
from a clean checkout to a working login screen. It's written for Windows
(the project's primary dev environment) with notes for macOS/Linux where
things differ.

## 1. Requirements

Install these before doing anything else:

| Tool | Minimum version | Notes |
| --- | --- | --- |
| **PHP** | **8.3** | Matches `backend/composer.json`'s `"php": "^8.3"` constraint exactly — 8.2 will fail `composer install`. |
| **Composer** | 2.x | [getcomposer.org](https://getcomposer.org/download/) |
| **Node.js** | **20+** (LTS recommended) | Vite 8 (used by the frontend) will not start on Node 18 — it throws `SyntaxError: node:util does not provide an export named 'styleText'`. Use Node 20 or newer. |
| **npm** | 9+ | Bundled with Node.js |
| **MySQL** | 8.0+ | Must be running and reachable before backend setup |
| **Git** | any recent version | To clone/pull the repo |

Full dependency list (exact package versions): [requirements.txt](requirements.txt).

### Windows / WAMP-specific notes

- WAMP bundles several PHP versions side by side (e.g.
  `C:\wamp64\bin\php\php8.3.6\php.exe`). The PHP on your system `PATH` may be
  an older one WAMP defaults to. If `php -v` shows less than 8.3, either
  switch WAMP's active PHP version, or call the 8.3+ binary directly by full
  path for every `composer`/`php artisan` command below, e.g.:

  ```powershell
  & "C:\wamp64\bin\php\php8.3.6\php.exe" artisan migrate
  ```

- If you have more than one MySQL install/service (common if WAMP's bundled
  MySQL coexists with a standalone MySQL Server install), confirm which port
  your target server listens on (`3306` by default) and use that server's
  credentials in `backend/.env`, not WAMP's.

- If `npm run dev` fails with an error mentioning `styleText` or
  `rolldown-binding`, your active Node is too old. Install a current LTS
  (e.g. via [nodejs.org](https://nodejs.org) or `winget install
  OpenJS.NodeJS.LTS`), then delete `frontend/node_modules` and run
  `npm install` again — a `node_modules` built under the old Node version
  will keep failing even after Node itself is upgraded.

## 2. First-time setup

Only needed once per machine (or after a `git pull` that touches
dependencies/migrations — see [Section 5](#5-keeping-your-environment-in-sync-after-a-git-pull)).

### 2.1 Clone the repo

```bash
git clone https://github.com/Elie-AbdelNour/it-helpdesk-system.git
cd it-helpdesk-system
```

### 2.2 Backend (Laravel API)

```bash
cd backend
composer install
```

Copy the environment file:

```bash
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux
```

Generate the app encryption key:

```bash
php artisan key:generate
```

Open `backend/.env` and set your MySQL credentials:

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
```

The seeders create:
- The 4 roles: Admin, IT Support Agent, Employee, Manager
- Ticket lookup data: categories, priorities (with SLA target hours), statuses
- One seeded login for testing:
  - **Email:** `admin@ithelpdesk.test`
  - **Password:** `Password123!`

### 2.3 Frontend (React)

```bash
cd frontend
npm install
```

Create `frontend/.env` (copy the example, or create it manually):

```bash
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux
```

It should contain:

```env
VITE_API_URL=http://localhost:8000
```

## 3. Running the app

You need **two terminals** open at once — one per server.

**Terminal 1 — backend API:**

```bash
cd backend
php artisan serve
```

Runs at `http://localhost:8000`.

**Terminal 2 — frontend:**

```bash
cd frontend
npm run dev
```

Runs at `http://localhost:5173`.

Then open **http://localhost:5173** in a browser. Register a new account
(created as an Employee) or log in with the seeded admin login from
[Section 2.2](#22-backend-laravel-api).

**Important:** both servers must run on these exact ports (8000 and 5173).
Sanctum's cookie-based session auth and CORS are configured for them via
`SANCTUM_STATEFUL_DOMAINS` / `FRONTEND_URLS` in `backend/.env` — using
different ports without updating those values will cause CORS errors or
silently-failed logins.

To stop either server, press `Ctrl+C` in its terminal.

## 4. Running the automated tests

```bash
cd backend
php artisan test
```

Tests run against an in-memory SQLite database (configured in
`backend/phpunit.xml`), so they don't touch your local MySQL data.

## 5. Keeping your environment in sync after a `git pull`

This project is under active multi-person development. After pulling new
commits, check whether any of the following changed and re-run the matching
step — skipping this is the most common cause of "it worked yesterday, now
it's broken":

| If this changed... | ...run this |
| --- | --- |
| `backend/composer.json` / `composer.lock` | `cd backend && composer install` |
| `backend/database/migrations/*` | `cd backend && php artisan migrate` |
| A seeder changed existing seed data (e.g. new fields) | `cd backend && php artisan db:seed --class=<TheSeeder>` (or `migrate:fresh --seed` to rebuild from scratch, which erases local data) |
| `frontend/package.json` / `package-lock.json` | `cd frontend && npm install` |
| Node itself was just upgraded | Delete `frontend/node_modules` and re-run `npm install` (stale native bindings from the old Node version will not "just work") |

## 6. Troubleshooting quick reference

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `composer install` fails on platform requirements | PHP version too old | Confirm `php -v` shows 8.3+; on WAMP, invoke the correct PHP binary directly |
| `npm run dev` throws `styleText` / `rolldown-binding` errors | Node version too old, or `node_modules` built under an old Node | Upgrade to Node 20+, delete `frontend/node_modules`, `npm install` again |
| `SQLSTATE[HY000] [1045] Access denied for user 'root'@'localhost'` | Wrong `DB_USERNAME`/`DB_PASSWORD` in `backend/.env`, or the wrong MySQL server/port | Verify which MySQL service is actually listening on `DB_PORT` and use its credentials |
| Login/register works via `curl` but not in the browser, or CORS errors in the console | Frontend not running on `http://localhost:5173`, or `SANCTUM_STATEFUL_DOMAINS`/`FRONTEND_URLS` in `backend/.env` don't include the origin you're using | Run frontend on port 5173, or update those `.env` values to match and restart `php artisan serve` |
| `CSRF token mismatch` on login | Frontend didn't hit `/sanctum/csrf-cookie` before posting, or cookies are blocked | Make sure you're going through the actual login form (the `AuthContext` handles this), not calling `/api/login` directly without the CSRF step |
