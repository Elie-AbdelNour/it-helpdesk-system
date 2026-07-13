# IT Help Desk & Ticketing Management System

Full Stack Web Development Internship Project - a web-based IT Help Desk and
Ticketing Management System for streamlining internal technical support.

## Tech Stack

- **Frontend:** React
- **Backend:** PHP
- **Database:** MySQL

## Repository Structure

```text
it-helpdesk-system/
|-- backend/              PHP REST API
|-- frontend/             React application
|-- database/
|   `-- schema.sql        MySQL executable database schema
|-- docs/
|   |-- README.md         Documentation index with ERD, workflows, and screenshots
|   |-- database_schema.sql
|   |-- workflow diagrams
|   `-- UI screenshots
`-- README.md
```

## Documentation

The instructor-facing project materials are in [docs/README.md](docs/README.md).
That page renders the database ERD, workflow diagrams, and UI screenshots
directly on GitHub.

- [Database schema shown in docs](docs/database_schema.sql)
- [Executable MySQL schema](database/schema.sql)
- [Rendered ERD](docs/README.md#entity-relationship-diagram)
- [Ticket Creation Workflow](docs/Ticket%20Creation%20Workflow.jpg)
- [Ticket Assignment and Resolution Workflow](docs/Ticket%20Assignment%20Resolution%20Workflow.jpg)
- [Admin Management Workflow](docs/Admin%20Management%20Workflow.jpg)
- [UI Screenshot: Log In](docs/Log-In.png)
- [UI Screenshot: Dashboard](docs/Dashboard.png)
- [UI Screenshot: Tickets](docs/Tickets.png)
- [UI Screenshot: Reports, Settings, and Notifications](docs/Reports-Settings-Notifications.png)

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

To create the database:

```bash
mysql -u root -p < database/schema.sql
```

## Status

Project in progress - see internship timeline for weekly milestones.
