CREATE DATABASE IF NOT EXISTS it_helpdesk
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE it_helpdesk;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE roles (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    role_name    VARCHAR(50) NOT NULL UNIQUE,
    description  VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE categories (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(50) NOT NULL UNIQUE,
    description  VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE priorities (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(20) NOT NULL UNIQUE,
    level        TINYINT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE statuses (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(20) NOT NULL UNIQUE,
    sort_order   TINYINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

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

CREATE TABLE password_resets (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    token_hash   VARCHAR(255) NOT NULL,
    expires_at   DATETIME NOT NULL,
    used_at      DATETIME NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pwreset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tickets (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    ticket_ref_no  VARCHAR(20) NOT NULL UNIQUE,
    subject        VARCHAR(200) NOT NULL,
    description    TEXT NOT NULL,
    category_id    INT NOT NULL,
    priority_id    INT NOT NULL,
    status_id      INT NOT NULL,
    created_by     INT NOT NULL,
    assigned_to    INT NULL,
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

CREATE TABLE ticket_comments (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id     INT NOT NULL,
    user_id       INT NOT NULL,
    comment_text  TEXT NOT NULL,
    is_internal   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user   FOREIGN KEY (user_id)   REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_comments_ticket ON ticket_comments(ticket_id);

CREATE TABLE ticket_attachments (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id      INT NOT NULL,
    uploaded_by    INT NOT NULL,
    file_name      VARCHAR(255) NOT NULL,
    file_path      VARCHAR(500) NOT NULL,
    file_size      INT NOT NULL,
    file_type      VARCHAR(50) NOT NULL,
    uploaded_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attach_ticket FOREIGN KEY (ticket_id)   REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_attach_user   FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_attach_ticket ON ticket_attachments(ticket_id);

CREATE TABLE assignment_history (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id      INT NOT NULL,
    assigned_from  INT NULL,
    assigned_to    INT NOT NULL,
    assigned_by    INT NOT NULL,
    notes          VARCHAR(255),
    assigned_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignhist_ticket FOREIGN KEY (ticket_id)     REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignhist_from   FOREIGN KEY (assigned_from) REFERENCES users(id),
    CONSTRAINT fk_assignhist_to     FOREIGN KEY (assigned_to)   REFERENCES users(id),
    CONSTRAINT fk_assignhist_by     FOREIGN KEY (assigned_by)   REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_assignhist_ticket ON assignment_history(ticket_id);

CREATE TABLE notifications (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    ticket_id         INT NULL,
    message           VARCHAR(255) NOT NULL,
    type              VARCHAR(50) NOT NULL DEFAULT 'general',
    is_read           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user   FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read);

CREATE TABLE activity_logs (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NULL,
    action       VARCHAR(100) NOT NULL,
    entity_type  VARCHAR(50),
    entity_id    INT,
    details      VARCHAR(500),
    ip_address   VARCHAR(45),
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_logs_user ON activity_logs(user_id);
CREATE INDEX idx_logs_entity ON activity_logs(entity_type, entity_id);

CREATE TABLE kb_articles (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    category_id  INT NULL,
    created_by   INT NOT NULL,
    title        VARCHAR(200) NOT NULL,
    content      TEXT NOT NULL,
    status       ENUM('draft','pending_approval','published') NOT NULL DEFAULT 'draft',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_kb_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_kb_author   FOREIGN KEY (created_by)  REFERENCES users(id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
