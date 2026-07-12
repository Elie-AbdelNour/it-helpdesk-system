# IT Help Desk & Ticketing Management System

Full Stack Web Development Internship Project — a web-based IT Help Desk and
Ticketing Management System for streamlining internal technical support.

## Tech stack

- **Frontend:** React
- **Backend:** PHP
- **Database:** MySQL

## Repository structure

```
it-helpdesk-system/
├── backend/          PHP REST API
├── frontend/          React application
├── database/
│   └── schema.sql      MySQL DDL (tables, constraints, seed data)
├── docs/
│   └── ERD.html         Entity Relationship Diagram (open in any browser)
└── README.md
```

## Database

The schema covers:

- Roles, Users, authentication (`roles`, `users`, `password_resets`)
- Ticket lookups (`categories`, `priorities`, `statuses`)
- Core ticketing (`tickets`, `ticket_comments`, `ticket_attachments`)
- Workflow & audit (`assignment_history`, `activity_logs`)
- Communication (`notifications`)
- Optional knowledge base module (`kb_articles`)

To set up the database:

```bash
mysql -u root -p < database/schema.sql
```

See `docs/ERD.html` for the entity relationship diagram.

## Status

Project in progress — see internship timeline for weekly milestones.
