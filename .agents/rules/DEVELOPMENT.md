---
trigger: always_on
---

# DEVELOPMENT.md

# Development Guidelines

## Purpose

This document defines the development standards for the Posyandu Backend project.

All contributors, including AI coding agents, should follow these guidelines to ensure consistency, maintainability, and code quality.

---

# Technology Stack

| Category       | Technology            |
| -------------- | --------------------- |
| Runtime        | Node.js 22+           |
| Language       | TypeScript            |
| Framework      | Express.js            |
| Database       | PostgreSQL (Supabase) |
| ORM            | Prisma ORM            |
| Validation     | Zod                   |
| Authentication | Supabase Auth         |
| Logging        | Pino                  |
| API            | REST                  |

---

# General Principles

Follow these principles throughout the project:

* Keep code simple and readable.
* Prefer clarity over cleverness.
* Write modular, reusable components.
* Follow Separation of Concerns.
* Avoid code duplication (DRY).
* Favor composition over inheritance.
* Keep functions focused on a single responsibility.
* Use dependency injection where appropriate.
* Fail fast when validation fails.

---

# Project Structure

```text
src/
├── config/
├── controllers/
├── middleware/
├── repositories/
├── routes/
├── services/
├── validations/
├── lib/
├── generated/
├── types/
├── utils/
├── app.ts
└── server.ts
```

Every new module should follow this structure consistently.

---

# Layer Responsibilities

## Routes

Responsibilities

* Register API endpoints.
* Apply middleware.
* Connect routes to controllers.

Routes must **not** contain:

* Business logic
* Database queries

---

## Controllers

Responsibilities

* Handle HTTP requests.
* Parse parameters.
* Call services.
* Return HTTP responses.

Controllers must **not** contain:

* Prisma queries
* Business logic
* Validation logic

Controllers should remain thin.

---

## Services

Responsibilities

* Implement business rules.
* Coordinate repositories.
* Perform calculations.
* Throw domain-specific errors.

Services must **not**:

* Return HTTP responses
* Access Express request or response objects

---

## Repositories

Responsibilities

* Access the database.
* Execute Prisma queries.
* Encapsulate persistence logic.

Repositories must **not**:

* Perform business validation
* Return HTTP responses

Repositories are the only layer allowed to access Prisma.

---

# Prisma Guidelines

## Generator

Use the new Prisma Client generator.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

---

## Shared Prisma Client

Only one PrismaClient instance may exist.

Create it in:

```text
src/lib/prisma.ts
```

Example

```ts
import { PrismaClient } from "../generated/prisma";

export const prisma = new PrismaClient();
```

Never instantiate `new PrismaClient()` anywhere else.

---

## Database Access

Always access the database through repositories.

Correct flow

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Prisma
```

Incorrect

```text
Controller
    ↓
Prisma
```

---

# Validation

Use **Zod** for all request validation.

Every endpoint that accepts user input must have a corresponding validation schema.

Example

```text
CreateWargaSchema
UpdateWargaSchema
CreateBalitaSchema
CreateLansiaSchema
```

Validation should occur before the request reaches the controller.

---

# Authentication

Authentication uses Supabase JWT.

Protected endpoints must:

* Verify JWT.
* Attach authenticated user information to the request.

Authorization logic should be implemented in middleware.

---

# Error Handling

Use centralized error handling.

Controllers should throw errors rather than manually formatting error responses.

Use appropriate HTTP status codes.

Examples

| Status | Meaning               |
| ------ | --------------------- |
| 400    | Bad Request           |
| 401    | Unauthorized          |
| 403    | Forbidden             |
| 404    | Not Found             |
| 409    | Conflict              |
| 422    | Validation Error      |
| 500    | Internal Server Error |

Never expose internal stack traces in API responses.

---

# API Response Format

Success

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

Error

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
```

Maintain this response structure across all endpoints.

---

# Logging

Use **Pino** for structured logging.

Log

* Incoming requests
* Errors
* Warnings
* Authentication failures
* Unexpected exceptions

Never log

* Passwords
* JWT tokens
* NIK
* Sensitive health information

---

# Naming Conventions

## Source Code

Language: English

Examples

```text
CitizenController
CitizenRepository
DashboardService
```

---

## Variables

Use camelCase.

Example

```ts
tanggalKunjungan
createdAt
citizenId
```

---

## Classes

Use PascalCase.

Example

```text
CitizenService
AuthenticationMiddleware
```

---

## Files

Use kebab-case.

Example

```text
citizen.controller.ts
citizen.repository.ts
dashboard.service.ts
```

---

## Routes

Use lowercase.

Example

```text
/api/v1/warga
/api/v1/dashboard
```

---

## Database

Database tables and columns use Indonesian.

Examples

```text
warga
pemeriksaan_lansia
tanggal_kunjungan
jenis_kelamin
```

---

# Async Programming

Use `async/await`.

Avoid Promise chains.

Preferred

```ts
const warga = await repository.findById(id);
```

---

# Environment Variables

Never hardcode secrets.

All sensitive configuration must come from `.env`.

Examples

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
```

---

# Code Style

* Enable TypeScript strict mode.
* Prefer explicit types for public APIs.
* Keep functions under approximately 50 lines where practical.
* Keep controllers small.
* Move reusable logic into services.
* Move reusable queries into repositories.
* Remove unused imports.
* Avoid magic strings and numbers.

---

# AI Agent Instructions

When generating code:

1. Follow the project architecture defined in `ARCHITECTURE.md`.
2. Follow the database schema defined in `DATABASE.md`.
3. Follow the API contract defined in `API.md`.
4. Never bypass the repository layer.
5. Never access Prisma outside repositories.
6. Generate reusable, modular code.
7. Prefer readability over premature optimization.
8. Reuse existing utilities instead of duplicating logic.
9. Maintain consistent naming conventions.
10. Do not introduce new architectural patterns without explicit approval.

---

# Future Improvements

Future enhancements may include:

* Unit testing (Vitest)
* Integration testing
* Repository interfaces for dependency inversion
* Dependency injection container
* Background job processing
* Redis caching
* Docker support
* CI/CD pipeline
* OpenTelemetry tracing
* Role-Based Access Control (RBAC)
