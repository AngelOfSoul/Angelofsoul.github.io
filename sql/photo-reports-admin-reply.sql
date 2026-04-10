-- photo-reports-admin-reply.sql
-- Optional: stores admin reply text on photo reports.
-- Safe to re-run.

alter table if exists photo_reports
  add column if not exists admin_reply text;