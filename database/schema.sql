-- ============================================================
-- IT Help Desk & Ticketing Management System
-- MySQL Database Schema
-- Naming convention: primary key column = "id",
--                     foreign key column = "<referenced_entity>_id"
-- ============================================================

CREATE DATABASE IF NOT EXISTS it_helpdesk
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE it_helpdesk;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Lookup tables
-- ------------------------------------------------------------

CREATE TABLE roles (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    role_name    VARCHAR(50) NOT NULL UNIQUE,   -- Admin, IT Support Agent, Employee, Manager
    description  VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE categories (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(50) NOT NULL UNIQUE,   -- Hardware, Software, Network, Email, Access Request, Other
    description  VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE priorities (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(20) NOT NULL UNIQUE,   -- Low, Medium, High, Critical
    level        TINYINT NOT NULL               -- 1=Low ... 4=Critical, used for sorting
) ENGINE=InnoDB;

CREATE TABLE statuses (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(20) NOT NULL UNIQUE,   -- Open, In Progress, Pending, Resolved, Closed
    sort_order   TINYINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------

CREATE TABLE users (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    role_id        INT NOT NULL,
    full_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    phone          VARCHAR(30),
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at  DATETIME NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE INDEX idx_users_role ON users(role_id);

-- Password reset tokens (Forgot/Reset password feature)
CREATE TABLE password_resets (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    token_hash   VARCHAR(255) NOT NULL,
    expires_at   DATETIME NOT NULL,
    used_at      DATETIME NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pwreset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tickets
-- ------------------------------------------------------------

CREATE TABLE tickets (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    ticket_ref_no  VARCHAR(20) NOT NULL UNIQUE,   -- e.g. TCK-2026-000123
    subject        VARCHAR(200) NOT NULL,
    description    TEXT NOT NULL,
    category_id    INT NOT NULL,
    priority_id    INT NOT NULL,
    status_id      INT NOT NULL,
    created_by     INT NOT NULL,                  -- user_id of employee who raised it
    assigned_to    INT NULL,                       -- user_id of current agent, nullable until assigned
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at    DATETIME NULL,
    closed_at      DATETIME NULL,
    CONSTRAINT fk_tickets_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_tickets_priority FOREIGN KEY (priority_id) REFERENCES priorities(id),
    CONSTRAINT fk_tickets_status   FOREIGN KEY (status_id)   REFERENCES statuses(id),
    CONSTRAINT fk_tickets_creator  FOREIGN KEY (created_by)  REFERENCES users(id),
    CONSTRAINT fk_tickets_agent    FOREIGN KEY (assigned_to) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_tickets_status   ON tickets(status_id);
CREATE INDEX idx_tickets_priority ON tickets(priority_id);
CREATE INDEX idx_tickets_category ON tickets(category_id);
CREATE INDEX idx_tickets_creator  ON tickets(created_by);
CREATE INDEX idx_tickets_agent    ON tickets(assigned_to);
CREATE INDEX idx_tickets_created  ON tickets(created_at);

-- ------------------------------------------------------------
-- Ticket comments (internal notes + replies)
-- ------------------------------------------------------------

CREATE TABLE ticket_comments (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id     INT NOT NULL,
    user_id       INT NOT NULL,
    comment_text  TEXT NOT NULL,
    is_internal   BOOLEAN NOT NULL DEFAULT FALSE,  -- internal note vs visible reply
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user   FOREIGN KEY (user_id)   REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_comments_ticket ON ticket_comments(ticket_id);

-- ------------------------------------------------------------
-- Ticket attachments
-- ------------------------------------------------------------

CREATE TABLE ticket_attachments (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id      INT NOT NULL,
    uploaded_by    INT NOT NULL,                   -- user_id of uploader
    file_name      VARCHAR(255) NOT NULL,
    file_path      VARCHAR(500) NOT NULL,
    file_size      INT NOT NULL,          -- bytes
    file_type      VARCHAR(50) NOT NULL,  -- mime type
    uploaded_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attach_ticket FOREIGN KEY (ticket_id)   REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_attach_user   FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_attach_ticket ON ticket_attachments(ticket_id);

-- ------------------------------------------------------------
-- Ticket assignment history (audit trail)
-- ------------------------------------------------------------

CREATE TABLE assignment_history (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id      INT NOT NULL,
    assigned_from  INT NULL,      -- user_id of previous agent, NULL if first assignment
    assigned_to    INT NOT NULL,  -- user_id of new agent
    assigned_by    INT NOT NULL,  -- user_id of who performed the assignment (agent/admin)
    notes          VARCHAR(255),
    assigned_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignhist_ticket FOREIGN KEY (ticket_id)     REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignhist_from   FOREIGN KEY (assigned_from) REFERENCES users(id),
    CONSTRAINT fk_assignhist_to     FOREIGN KEY (assigned_to)   REFERENCES users(id),
    CONSTRAINT fk_assignhist_by     FOREIGN KEY (assigned_by)   REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_assignhist_ticket ON assignment_history(ticket_id);

-- ------------------------------------------------------------
-- Notifications
-- ------------------------------------------------------------

CREATE TABLE notifications (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,       -- recipient
    ticket_id         INT NULL,           -- related ticket, if any
    message           VARCHAR(255) NOT NULL,
    type              VARCHAR(50) NOT NULL DEFAULT 'general', -- ticket_update, comment, assignment, mention...
    is_read           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user   FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read);

-- ------------------------------------------------------------
-- Activity logs (system-wide audit trail)
-- ------------------------------------------------------------

CREATE TABLE activity_logs (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NULL,               -- NULL for system-generated actions
    action       VARCHAR(100) NOT NULL,  -- e.g. 'login', 'ticket_created', 'ticket_assigned'
    entity_type  VARCHAR(50),            -- e.g. 'ticket', 'user'
    entity_id    INT,                    -- id of the affected record
    details      VARCHAR(500),
    ip_address   VARCHAR(45),
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_logs_user ON activity_logs(user_id);
CREATE INDEX idx_logs_entity ON activity_logs(entity_type, entity_id);

-- ------------------------------------------------------------
-- Knowledge base (optional advanced module)
-- ------------------------------------------------------------

CREATE TABLE kb_articles (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    category_id  INT NULL,
    created_by   INT NOT NULL,            -- user_id of author
    title        VARCHAR(200) NOT NULL,
    content      TEXT NOT NULL,
    status       ENUM('draft','pending_approval','published') NOT NULL DEFAULT 'draft',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_kb_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_kb_author   FOREIGN KEY (created_by)  REFERENCES users(id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Seed data for lookup tables
-- ============================================================

INSERT INTO roles (role_name, description) VALUES
    ('Admin', 'Full system access'),
    ('IT Support Agent', 'Manages and resolves tickets'),
    ('Employee', 'Creates and tracks tickets'),
    ('Manager', 'Monitors team tickets and reports');

INSERT INTO categories (name, description) VALUES
    ('Hardware', 'Physical device issues'),
    ('Software', 'Application and OS issues'),
    ('Network', 'Connectivity and VPN issues'),
    ('Email', 'Mailbox and Outlook issues'),
    ('Access Request', 'Permission and account access'),
    ('Other', 'Uncategorized requests');

INSERT INTO priorities (name, level) VALUES
    ('Low', 1),
    ('Medium', 2),
    ('High', 3),
    ('Critical', 4);

INSERT INTO statuses (name, sort_order) VALUES
    ('Open', 1),
    ('In Progress', 2),
    ('Pending', 3),
    ('Resolved', 4),
    ('Closed', 5);