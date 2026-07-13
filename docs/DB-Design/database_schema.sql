CREATE DATABASE IF NOT EXISTS ithelpdesk
  CHARACTER SET utf8mb4;

USE ithelpdesk;

CREATE TABLE roles (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    rolename     VARCHAR(50) NOT NULL UNIQUE,
    description  VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE categories (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(50) NOT NULL UNIQUE,
    description  VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE priorities (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    name   VARCHAR(20) NOT NULL UNIQUE,
    level  TINYINT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE statuses (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(20) NOT NULL UNIQUE,
    sortorder  TINYINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    roleid        INT NOT NULL,
    fullname      VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    passwordhash  VARCHAR(255) NOT NULL,
    phone         VARCHAR(30),
    isactive      BOOLEAN NOT NULL DEFAULT TRUE,
    lastloginat   DATETIME NULL,
    createdat     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fkusersrole FOREIGN KEY (roleid) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE INDEX idxusersrole ON users(roleid);

CREATE TABLE passwordresets (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    userid      INT NOT NULL,
    tokenhash   VARCHAR(255) NOT NULL,
    expiresat   DATETIME NOT NULL,
    usedat      DATETIME NULL,
    createdat   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fkpasswordresetsuser FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tickets (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    ticketrefno  VARCHAR(20) NOT NULL UNIQUE,
    subject      VARCHAR(200) NOT NULL,
    description  TEXT NOT NULL,
    categoryid   INT NOT NULL,
    priorityid   INT NOT NULL,
    statusid     INT NOT NULL,
    createdby    INT NOT NULL,
    assignedto   INT NULL,
    createdat    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolvedat   DATETIME NULL,
    closedat     DATETIME NULL,
    CONSTRAINT fkticketscategory FOREIGN KEY (categoryid) REFERENCES categories(id),
    CONSTRAINT fkticketspriority FOREIGN KEY (priorityid) REFERENCES priorities(id),
    CONSTRAINT fkticketsstatus   FOREIGN KEY (statusid)   REFERENCES statuses(id),
    CONSTRAINT fkticketscreator  FOREIGN KEY (createdby)  REFERENCES users(id),
    CONSTRAINT fkticketsagent    FOREIGN KEY (assignedto) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idxticketsstatus   ON tickets(statusid);
CREATE INDEX idxticketspriority ON tickets(priorityid);
CREATE INDEX idxticketscategory ON tickets(categoryid);
CREATE INDEX idxticketscreator  ON tickets(createdby);
CREATE INDEX idxticketsagent    ON tickets(assignedto);
CREATE INDEX idxticketscreated  ON tickets(createdat);

CREATE TABLE ticketcomments (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    ticketid     INT NOT NULL,
    userid       INT NOT NULL,
    commenttext  TEXT NOT NULL,
    isinternal   BOOLEAN NOT NULL DEFAULT FALSE,
    createdat    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fkcommentsticket FOREIGN KEY (ticketid) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fkcommentsuser   FOREIGN KEY (userid)   REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idxcommentsticket ON ticketcomments(ticketid);

CREATE TABLE ticketattachments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    ticketid    INT NOT NULL,
    uploadedby  INT NOT NULL,
    filename    VARCHAR(255) NOT NULL,
    filepath    VARCHAR(500) NOT NULL,
    filesize    INT NOT NULL,
    filetype    VARCHAR(50) NOT NULL,
    uploadedat  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fkattachmentsticket FOREIGN KEY (ticketid)   REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fkattachmentsuser   FOREIGN KEY (uploadedby) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idxattachmentsticket ON ticketattachments(ticketid);

CREATE TABLE assignmenthistories (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    ticketid      INT NOT NULL,
    assignedfrom  INT NULL,
    assignedto    INT NOT NULL,
    assignedby    INT NOT NULL,
    notes         VARCHAR(255),
    assignedat    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fkassignmentsticket FOREIGN KEY (ticketid)     REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fkassignmentsfrom   FOREIGN KEY (assignedfrom) REFERENCES users(id),
    CONSTRAINT fkassignmentsto     FOREIGN KEY (assignedto)   REFERENCES users(id),
    CONSTRAINT fkassignmentsby     FOREIGN KEY (assignedby)   REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idxassignmentsticket ON assignmenthistories(ticketid);

CREATE TABLE notifications (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    userid     INT NOT NULL,
    ticketid   INT NULL,
    message    VARCHAR(255) NOT NULL,
    type       VARCHAR(50) NOT NULL DEFAULT 'general',
    isread     BOOLEAN NOT NULL DEFAULT FALSE,
    createdat  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fknotificationsuser   FOREIGN KEY (userid)   REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fknotificationsticket FOREIGN KEY (ticketid) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idxnotificationsuserread ON notifications(userid, isread);

CREATE TABLE activitylogs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    userid      INT NULL,
    action      VARCHAR(100) NOT NULL,
    entitytype  VARCHAR(50),
    entityid    INT,
    details     VARCHAR(500),
    ipaddress   VARCHAR(45),
    createdat   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fklogsuser FOREIGN KEY (userid) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idxlogsuser ON activitylogs(userid);
CREATE INDEX idxlogsentity ON activitylogs(entitytype, entityid);

CREATE TABLE kbarticles (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    categoryid  INT NULL,
    createdby   INT NOT NULL,
    title       VARCHAR(200) NOT NULL,
    content     TEXT NOT NULL,
    status      ENUM('draft','pendingapproval','published') NOT NULL DEFAULT 'draft',
    createdat   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fkkbcategory FOREIGN KEY (categoryid) REFERENCES categories(id),
    CONSTRAINT fkkbauthor   FOREIGN KEY (createdby)  REFERENCES users(id)
) ENGINE=InnoDB;
