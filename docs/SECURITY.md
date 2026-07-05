# SECURITY.md

# Security Guidelines

## Purpose

This document defines the security requirements for the Posyandu Backend.

The system manages Personally Identifiable Information (PII) and health records. All contributors, including AI coding agents, must follow these rules to ensure confidentiality, integrity, and availability of data.

---

# Security Principles

The backend follows these principles:

- Authentication required by default.
- Least privilege.
- Defense in depth.
- Secure by default.
- Never trust client input.
- Validate every request.
- Protect sensitive information.

---

# Authentication

Authentication uses **Supabase Auth**.

The frontend authenticates users and sends a JWT access token.

Backend responsibilities:

- Verify JWT.
- Reject invalid tokens.
- Reject expired tokens.
- Reject malformed tokens.
- Attach authenticated user information to the request.

Every protected endpoint must require authentication.

---

# Authorization

Authenticated users may only access resources permitted by their role.

Current MVP

- Cadre

Future versions

- Administrator
- Bidan
- Puskesmas
- Super Admin

Authorization must be implemented in middleware.

Never rely on frontend authorization.

---

# Row Level Security (RLS)

All PostgreSQL tables must enable Row Level Security.

No table may expose unrestricted access.

Policies should only allow authenticated users.

Service Role Key must never bypass security outside trusted backend operations.

---

# Environment Variables

Secrets must never be committed to Git.

Examples

```
DATABASE_URL

SUPABASE_URL

SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

JWT_SECRET
```

Rules

- Never hardcode secrets.
- Never expose secrets to frontend.
- Never log secrets.
- Never return secrets in API responses.

---

# Service Role Key

The Service Role Key is backend-only.

It must never:

- appear in frontend code
- appear inside browser bundles
- use NEXT_PUBLIC prefix
- be returned by any endpoint

Only trusted backend services may access it.

---

# Input Validation

Every request body must be validated using Zod.

Validation occurs before reaching controllers.

Never trust:

- Request Body
- Query Parameters
- URL Parameters
- Headers

Reject malformed input immediately.

---

# SQL Injection

Database access must only occur through Prisma ORM.

Never concatenate SQL strings.

Prefer parameterized queries.

Avoid raw SQL unless absolutely necessary.

---

# XSS

Backend must return JSON only.

Never return HTML generated from user input.

Escape user-generated content where appropriate.

---

# CORS

Only trusted frontend origins may access the API.

Example

Development

```
http://localhost:3000
```

Production

Configured using environment variables.

Do not allow wildcard origins in production.

---

# HTTPS

Production deployments must use HTTPS only.

Reject insecure transport whenever possible.

---

# Rate Limiting

Sensitive endpoints should implement rate limiting.

Recommended

Authentication

```
5 requests/minute
```

General API

```
100 requests/minute
```

Implementation may use express-rate-limit.

---

# Logging

Use Pino.

Log

- Requests
- Errors
- Warnings
- Authentication failures

Never log

- Password
- JWT
- NIK
- Medical records
- Access tokens
- Service Role Key

---

# Error Messages

API responses must never expose:

- Stack traces
- Database errors
- Internal file paths
- SQL queries
- Prisma errors

Instead return standardized messages.

Example

```json
{
    "success": false,
    "message": "Internal server error."
}
```

---

# Password Policy

Passwords are managed by Supabase Auth.

Backend never stores passwords.

Backend never hashes passwords manually.

---

# Medical Records

Medical examination data is sensitive.

Only authenticated users may access examination records.

Medical data must never appear in logs.

Medical records should only be returned when explicitly requested.

---

# Locking Rules

Monthly data collection lock must always be enforced by the backend.

Frontend restrictions are for user experience only.

Before every Create, Update, or Delete operation:

1. Check Pendataan Bulanan.
2. If status is "selesai", reject the request.

Return

```
409 Conflict
```

This rule must never be bypassed.

---

# File Uploads

Current MVP

No file upload support.

Future versions should:

- Validate MIME type.
- Validate file size.
- Generate random filenames.
- Scan uploads before storage.

---

# Audit Trail

Future versions should maintain an audit log.

Recommended fields

- User ID
- Action
- Resource
- Timestamp
- IP Address

Audit logs should be immutable.

---

# Dependency Security

Dependencies should be updated regularly.

Recommended commands

```
npm audit

npm outdated
```

High severity vulnerabilities should be resolved before deployment.

---

# Backup

Database backups are managed by Supabase.

Periodic backup verification is recommended.

---

# Deployment

Production environment must:

- Enable HTTPS.
- Disable debug mode.
- Disable stack traces.
- Enable request logging.
- Enable security headers.
- Enable CORS restrictions.

---

# AI Agent Instructions

When generating backend code:

1. Never expose secrets.
2. Never bypass authentication.
3. Never bypass authorization.
4. Always validate input.
5. Never log sensitive data.
6. Use Prisma for database access.
7. Enforce monthly lock validation.
8. Return standardized error responses.
9. Follow least privilege.
10. Do not weaken security without explicit instruction.