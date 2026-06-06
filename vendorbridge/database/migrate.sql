-- Run this in phpMyAdmin > vendorbridge database > SQL tab
-- Only run once — these add columns to existing tables

USE vendorbridge;

-- rfqs: add category + status
ALTER TABLE rfqs
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) AFTER title,
  ADD COLUMN IF NOT EXISTS status ENUM('Draft','Published','Closed') NOT NULL DEFAULT 'Draft' AFTER deadline;

-- quotations: add workflow fields
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS tax_rate      DECIMAL(5,2)  NOT NULL DEFAULT 18 AFTER notes,
  ADD COLUMN IF NOT EXISTS delivery_days INT           DEFAULT NULL AFTER tax_rate,
  ADD COLUMN IF NOT EXISTS total_amount  DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER delivery_days,
  ADD COLUMN IF NOT EXISTS status        ENUM('Draft','Submitted','Selected','Rejected') NOT NULL DEFAULT 'Draft' AFTER total_amount,
  ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(255)  DEFAULT NULL AFTER status;

-- quotation_lines: add item description + unit
ALTER TABLE quotation_lines
  ADD COLUMN IF NOT EXISTS item_description VARCHAR(500) AFTER quotation_id,
  ADD COLUMN IF NOT EXISTS unit             VARCHAR(50)  AFTER quantity;

-- purchase_order_lines: add description + unit + unit_price
ALTER TABLE purchase_order_lines
  ADD COLUMN IF NOT EXISTS item_description VARCHAR(500)  AFTER po_id,
  ADD COLUMN IF NOT EXISTS unit             VARCHAR(50)   AFTER quantity,
  ADD COLUMN IF NOT EXISTS unit_price       DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER unit;

-- vendors: switch active boolean to status enum (skip if already done)
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS status ENUM('Active','Pending','Blocked') NOT NULL DEFAULT 'Pending' AFTER address;
