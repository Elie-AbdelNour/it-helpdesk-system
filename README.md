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
|   `-- schema.sql        MySQL database schema
|-- docs/
|   |-- README.md         Documentation index with diagrams and screenshots
|   |-- database-schema.md
|   |-- ERD .jpg
|   |-- workflow diagrams
|   `-- UI screenshots
`-- README.md
```

## Documentation

The instructor-facing project materials are in [docs/README.md](docs/README.md).
That page renders the ERD, workflow diagrams, and UI screenshots directly on
GitHub.

- [Database schema notes](docs/database-schema.md)
- [Executable MySQL schema](database/schema.sql)
- [Entity Relationship Diagram](docs/ERD%20.jpg)
- [Ticket Creation Workflow](docs/Ticket%20Creation%20Workflow.jpg)
- [Ticket Assignment and Resolution Workflow](docs/Ticket%20Assignment%20Resolution%20Workflow.jpg)
- [Admin Management Workflow](docs/Admin%20Management%20Workflow.jpg)
- [UI Screenshot: Log In](docs/Log-In.png)
- [UI Screenshot: Dashboard](docs/Dashboard.png)
- [UI Screenshot: Tickets](docs/Tickets.png)
- [UI Screenshot: Reports, Settings, and Notifications](docs/Reports-Settings-Notifications.png)

## Database

The schema covers:

- Roles, users, and password reset support (`roles`, `users`, `password_resets`)
- Ticket lookups (`categories`, `priorities`, `statuses`)
- Core ticketing (`tickets`, `ticket_comments`, `ticket_attachments`)
- Workflow and audit history (`assignment_history`, `activity_logs`)
- Communication (`notifications`)
- Optional knowledge base module (`kb_articles`)

To create the database:

```bash
mysql -u root -p < database/schema.sql
```

## Status

Project in progress - see internship timeline for weekly milestones.
