CREATE DATABASE IF NOT EXISTS vendorbridge;

USE vendorbridge;

CREATE TABLE IF NOT EXISTS users (
  id                   INT           AUTO_INCREMENT PRIMARY KEY,
  first_name           VARCHAR(100)  NOT NULL,
  last_name            VARCHAR(100)  NOT NULL,
  email                VARCHAR(255)  NOT NULL UNIQUE,
  phone                VARCHAR(20),
  password             VARCHAR(255)  NOT NULL,
  role                 ENUM('admin', 'vendor', 'procurement_officer', 'manager') NOT NULL DEFAULT 'vendor',
  country              VARCHAR(100),
  additional_info      TEXT,
  reset_token          VARCHAR(255),
  reset_token_expires  DATETIME,
  created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
