CREATE DATABASE IF NOT EXISTS vendorbridge;
USE vendorbridge;

-- ─── VENDOR CATEGORIES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_categories (
  category_id  INT          AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE
);

-- ─── VENDORS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  vendor_id      INT          AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(200) NOT NULL UNIQUE,
  category_id    INT,
  gst_number     VARCHAR(50)  UNIQUE,
  contact_name   VARCHAR(100),
  contact_email  VARCHAR(255),
  contact_phone  VARCHAR(50),
  address        TEXT,
  active         BOOLEAN      NOT NULL DEFAULT TRUE,
  FOREIGN KEY (category_id) REFERENCES vendor_categories(category_id) ON DELETE SET NULL
);

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                   INT           AUTO_INCREMENT PRIMARY KEY,
  first_name           VARCHAR(100)  NOT NULL,
  last_name            VARCHAR(100)  NOT NULL,
  email                VARCHAR(255)  NOT NULL UNIQUE,
  phone                VARCHAR(20),
  password             VARCHAR(255)  NOT NULL,
  role                 ENUM('admin', 'vendor', 'procurement_officer', 'manager') NOT NULL DEFAULT 'vendor',
  vendor_id            INT,
  country              VARCHAR(100),
  additional_info      TEXT,
  reset_token          VARCHAR(255),
  reset_token_expires  DATETIME,
  last_login           TIMESTAMP     NULL,
  created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE SET NULL
);

-- ─── SESSIONS (refresh tokens) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  session_id     INT        AUTO_INCREMENT PRIMARY KEY,
  user_id        INT        NOT NULL,
  refresh_token  CHAR(36)   NOT NULL UNIQUE,
  expires_at     TIMESTAMP  NOT NULL,
  created_at     TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── RFQs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfqs (
  rfq_id        INT          AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  created_by    INT          NOT NULL,
  created_date  DATE         NOT NULL DEFAULT (CURRENT_DATE),
  deadline      DATE         NOT NULL,
  approved      BOOLEAN      NOT NULL DEFAULT FALSE,
  approved_by   INT,
  FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── RFQ LINES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfq_lines (
  rfq_line_id       INT          AUTO_INCREMENT PRIMARY KEY,
  rfq_id            INT          NOT NULL,
  line_no           INT          NOT NULL,
  item_description  VARCHAR(500) NOT NULL,
  quantity          INT          NOT NULL CHECK (quantity > 0),
  unit              VARCHAR(50),
  FOREIGN KEY (rfq_id) REFERENCES rfqs(rfq_id) ON DELETE CASCADE
);

-- ─── RFQ–VENDOR ASSIGNMENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfq_vendors (
  rfq_id     INT NOT NULL,
  vendor_id  INT NOT NULL,
  PRIMARY KEY (rfq_id, vendor_id),
  FOREIGN KEY (rfq_id)    REFERENCES rfqs(rfq_id)       ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE
);

-- ─── QUOTATIONS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotations (
  quotation_id    INT          AUTO_INCREMENT PRIMARY KEY,
  rfq_id          INT          NOT NULL,
  vendor_id       INT          NOT NULL,
  quotation_date  DATE         NOT NULL DEFAULT (CURRENT_DATE),
  supplier_ref    VARCHAR(100),
  notes           TEXT,
  delivery_date   DATE,
  selected        BOOLEAN      NOT NULL DEFAULT FALSE,
  FOREIGN KEY (rfq_id)    REFERENCES rfqs(rfq_id)       ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE
);

-- ─── QUOTATION LINES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotation_lines (
  quotation_line_id  INT             AUTO_INCREMENT PRIMARY KEY,
  quotation_id       INT             NOT NULL,
  rfq_line_id        INT,
  unit_price         DECIMAL(12, 2)  NOT NULL CHECK (unit_price >= 0),
  quantity           INT             NOT NULL CHECK (quantity > 0),
  promised_date      DATE,
  FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE,
  FOREIGN KEY (rfq_line_id)  REFERENCES rfq_lines(rfq_line_id)   ON DELETE SET NULL
);

-- ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  po_id          INT             AUTO_INCREMENT PRIMARY KEY,
  quotation_id   INT,
  vendor_id      INT             NOT NULL,
  created_by     INT             NOT NULL,
  po_number      VARCHAR(20)     NOT NULL UNIQUE,
  order_date     DATE            NOT NULL DEFAULT (CURRENT_DATE),
  total_amount   DECIMAL(14, 2)  NOT NULL DEFAULT 0,
  approved       BOOLEAN         NOT NULL DEFAULT FALSE,
  approved_by    INT,
  FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id)   ON DELETE SET NULL,
  FOREIGN KEY (vendor_id)    REFERENCES vendors(vendor_id)          ON DELETE RESTRICT,
  FOREIGN KEY (created_by)   REFERENCES users(id)                   ON DELETE RESTRICT,
  FOREIGN KEY (approved_by)  REFERENCES users(id)                   ON DELETE SET NULL
);

-- ─── PURCHASE ORDER LINES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_order_lines (
  po_line_id          INT             AUTO_INCREMENT PRIMARY KEY,
  po_id               INT             NOT NULL,
  quotation_line_id   INT,
  quantity            INT             NOT NULL CHECK (quantity > 0),
  line_total          DECIMAL(14, 2)  NOT NULL,
  FOREIGN KEY (po_id)              REFERENCES purchase_orders(po_id)              ON DELETE CASCADE,
  FOREIGN KEY (quotation_line_id)  REFERENCES quotation_lines(quotation_line_id)  ON DELETE SET NULL
);

-- ─── INVOICES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id      INT             AUTO_INCREMENT PRIMARY KEY,
  po_id           INT             NOT NULL,
  vendor_id       INT             NOT NULL,
  created_by      INT             NOT NULL,
  invoice_number  VARCHAR(20)     NOT NULL UNIQUE,
  invoice_date    DATE            NOT NULL DEFAULT (CURRENT_DATE),
  total_amount    DECIMAL(14, 2)  NOT NULL DEFAULT 0,
  status          ENUM('Pending', 'Paid', 'Cancelled') NOT NULL DEFAULT 'Pending',
  FOREIGN KEY (po_id)       REFERENCES purchase_orders(po_id)  ON DELETE CASCADE,
  FOREIGN KEY (vendor_id)   REFERENCES vendors(vendor_id)      ON DELETE RESTRICT,
  FOREIGN KEY (created_by)  REFERENCES users(id)               ON DELETE RESTRICT
);

-- ─── INVOICE LINES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_lines (
  invoice_line_id  INT             AUTO_INCREMENT PRIMARY KEY,
  invoice_id       INT             NOT NULL,
  po_line_id       INT             NOT NULL,
  quantity         INT             NOT NULL CHECK (quantity > 0),
  line_total       DECIMAL(14, 2)  NOT NULL,
  FOREIGN KEY (invoice_id)  REFERENCES invoices(invoice_id)                ON DELETE CASCADE,
  FOREIGN KEY (po_line_id)  REFERENCES purchase_order_lines(po_line_id)    ON DELETE RESTRICT
);

-- ─── APPROVALS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approvals (
  approval_id  INT        AUTO_INCREMENT PRIMARY KEY,
  user_id      INT        NOT NULL,
  rfq_id       INT,
  po_id        INT,
  approved     BOOLEAN    NOT NULL,
  remarks      TEXT,
  created_at   TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (rfq_id IS NOT NULL OR po_id IS NOT NULL),
  FOREIGN KEY (user_id) REFERENCES users(id)                  ON DELETE RESTRICT,
  FOREIGN KEY (rfq_id)  REFERENCES rfqs(rfq_id)               ON DELETE CASCADE,
  FOREIGN KEY (po_id)   REFERENCES purchase_orders(po_id)     ON DELETE CASCADE
);

-- ─── ACTIVITY LOG ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  log_id      INT          AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  entity      VARCHAR(50)  NOT NULL,
  entity_id   INT          NOT NULL,
  action      TEXT         NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ─── TRIGGERS ────────────────────────────────────────────────────────────────
DELIMITER $$

CREATE TRIGGER trg_gen_po_number
BEFORE INSERT ON purchase_orders
FOR EACH ROW
BEGIN
  DECLARE next_id INT;
  SELECT AUTO_INCREMENT INTO next_id
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_orders';
  SET NEW.po_number = CONCAT('PO', LPAD(next_id, 6, '0'));
END$$

CREATE TRIGGER trg_gen_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
BEGIN
  DECLARE next_inv INT;
  SELECT AUTO_INCREMENT INTO next_inv
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invoices';
  SET NEW.invoice_number = CONCAT('INV', LPAD(next_inv, 6, '0'));
END$$

DELIMITER ;
