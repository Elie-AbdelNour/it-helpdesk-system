# Project Documentation

This folder contains the database schema, ERD, workflow diagrams, and UI
screenshots for the IT Help Desk and Ticketing Management System.

## Database Naming Rules

- Table names are plural.
- Every primary key column is named `id`.
- Table names and column names do not use underscores.

## Database Schema

- [GitHub schema copy](database_schema.sql)
- [Executable MySQL schema](../database/schema.sql)

## Entity Relationship Diagram

- [ERD image](ERD%20.jpg)
- [Draw.io source](ERD%20.drawio)

![Entity Relationship Diagram](ERD%20.jpg)

```mermaid
erDiagram
    roles ||--o{ users : roleid
    users ||--o{ passwordresets : userid
    categories ||--o{ tickets : categoryid
    priorities ||--o{ tickets : priorityid
    statuses ||--o{ tickets : statusid
    users ||--o{ tickets : createdby
    users ||--o{ tickets : assignedto
    tickets ||--o{ ticketcomments : ticketid
    users ||--o{ ticketcomments : userid
    tickets ||--o{ ticketattachments : ticketid
    users ||--o{ ticketattachments : uploadedby
    tickets ||--o{ assignmenthistories : ticketid
    users ||--o{ assignmenthistories : assignedfrom
    users ||--o{ assignmenthistories : assignedto
    users ||--o{ assignmenthistories : assignedby
    users ||--o{ notifications : userid
    tickets ||--o{ notifications : ticketid
    users ||--o{ activitylogs : userid
    categories ||--o{ kbarticles : categoryid
    users ||--o{ kbarticles : createdby

    roles {
        INT id PK
        VARCHAR rolename
        VARCHAR description
    }

    categories {
        INT id PK
        VARCHAR name
        VARCHAR description
    }

    priorities {
        INT id PK
        VARCHAR name
        TINYINT level
    }

    statuses {
        INT id PK
        VARCHAR name
        TINYINT sortorder
    }

    users {
        INT id PK
        INT roleid FK
        VARCHAR fullname
        VARCHAR email
        VARCHAR passwordhash
        VARCHAR phone
        BOOLEAN isactive
        DATETIME lastloginat
        DATETIME createdat
        DATETIME updatedat
    }

    passwordresets {
        INT id PK
        INT userid FK
        VARCHAR tokenhash
        DATETIME expiresat
        DATETIME usedat
        DATETIME createdat
    }

    tickets {
        INT id PK
        VARCHAR ticketrefno
        VARCHAR subject
        TEXT description
        INT categoryid FK
        INT priorityid FK
        INT statusid FK
        INT createdby FK
        INT assignedto FK
        DATETIME createdat
        DATETIME updatedat
        DATETIME resolvedat
        DATETIME closedat
    }

    ticketcomments {
        INT id PK
        INT ticketid FK
        INT userid FK
        TEXT commenttext
        BOOLEAN isinternal
        DATETIME createdat
    }

    ticketattachments {
        INT id PK
        INT ticketid FK
        INT uploadedby FK
        VARCHAR filename
        VARCHAR filepath
        INT filesize
        VARCHAR filetype
        DATETIME uploadedat
    }

    assignmenthistories {
        INT id PK
        INT ticketid FK
        INT assignedfrom FK
        INT assignedto FK
        INT assignedby FK
        VARCHAR notes
        DATETIME assignedat
    }

    notifications {
        INT id PK
        INT userid FK
        INT ticketid FK
        VARCHAR message
        VARCHAR type
        BOOLEAN isread
        DATETIME createdat
    }

    activitylogs {
        INT id PK
        INT userid FK
        VARCHAR action
        VARCHAR entitytype
        INT entityid
        VARCHAR details
        VARCHAR ipaddress
        DATETIME createdat
    }

    kbarticles {
        INT id PK
        INT categoryid FK
        INT createdby FK
        VARCHAR title
        TEXT content
        ENUM status
        DATETIME createdat
        DATETIME updatedat
    }
```

## Workflow Diagrams

- [Ticket Creation Workflow](Ticket%20Creation%20Workflow.jpg)
- [Ticket Assignment and Resolution Workflow](Ticket%20Assignment%20Resolution%20Workflow.jpg)
- [Admin Management Workflow](Admin%20Management%20Workflow.jpg)

![Ticket Creation Workflow](Ticket%20Creation%20Workflow.jpg)

![Ticket Assignment and Resolution Workflow](Ticket%20Assignment%20Resolution%20Workflow.jpg)

![Admin Management Workflow](Admin%20Management%20Workflow.jpg)

## UI Screenshots

- [Log In](Log-In.png)
- [Dashboard](Dashboard.png)
- [Tickets](Tickets.png)
- [Reports, Settings, and Notifications](Reports-Settings-Notifications.png)

![Log In](Log-In.png)

![Dashboard](Dashboard.png)

![Tickets](Tickets.png)

![Reports, Settings, and Notifications](Reports-Settings-Notifications.png)
