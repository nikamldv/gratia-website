# GRATIA admin workflow rollout

Apply `20261110_admin_workflows.sql` and `20261110_appointment_confirmations.sql`
once to the intended MySQL database before deploying the matching backend
code. SQL migrations are deliberately not run by the application at startup.

## Workflow values

- Contact requests: `Neu`, `In Bearbeitung`, `Erledigt`
- Consultation requests additionally support `Terminvorschlag gesendet`,
  `Termin bestätigt`, and `Abgelehnt`.
- Applications: `neu`, `in_bearbeitung`, `abgeschlossen`, `abgelehnt`
- Older contact requests remain `NULL` and appear as `Nicht erfasst` until an
  administrator sets a status.
- The audit log stores status transitions only; it does not copy message text,
  applicant details, or uploaded file data.

## Prepared API and permissions

- `PATCH /api/contact-messages/:id/status` uses `contact_messages.manage`.
- `POST /api/contact-messages/:id/confirm-appointment` validates, stores, and
  emails the confirmed appointment time with the existing SMTP configuration.
- `PATCH /api/applications/:id/status` uses `applications.manage`.
- `GET /api/admin/audit-log?limit=30` is restricted to `users.manage`.
- The user management screen can grant the two new `*.manage` permissions;
  each one also grants the matching read permission.
- Status changes and their audit records are committed in one transaction.
- The public contact form request/response shape remains unchanged; new
  submissions receive the initial `Neu` state on the server. Consultation
  details stay in the existing subject/message fields; appointment timestamps
  are added by the second migration.
- A manager confirms a future consultation time through the protected appointment
  endpoint. The backend stores the UTC appointment time, marks the request as
  `Termin bestätigt`, sends a confirmation email, and stores the delivery time.
- If SMTP delivery fails, the appointment remains saved and the email delivery
  timestamp remains empty; staff can retry from the request details. The system
  does not create calendar events, reminders, or cancellation notices.

## Deployment order

1. Back up the database and verify the actual `contact_messages` and
   `applications` table definitions on the target server.
2. Apply both SQL migrations once and verify their columns/tables.
3. Deploy the backend code and confirm the live `.env` has valid database
   settings plus `SMTP_USER` and `SMTP_APP_PASSWORD`.
4. Deploy the frontend files in this change.
5. Verify status updates, authorization, and audit entries with a non-production
   account before enabling the workflow for staff.

This local preparation adds a MySQL pool and JSON body parser to
`gratia-backend/server.js`, which was required because the checked-in file used
`db` and `req.body` without configuring either. The live backend may use a
different entry point; compare its source and environment variable names before
deploying. This local work does not connect to or modify the live server or
database.
