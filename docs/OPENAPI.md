# OPENAPI.md

# OpenAPI (Swagger) Documentation Specification

## Purpose

This document defines the standards for generating and maintaining the OpenAPI (Swagger) documentation for the Posyandu Backend.

The generated documentation must always stay synchronized with:

- ARCHITECTURE.md
- DATABASE.md
- API.md
- DEVELOPMENT.md

The OpenAPI specification is the single source of truth for frontend integration and API testing.

---

# Specification Version

Use:

- OpenAPI 3.1.0
- YAML format

Output file:

```
docs/swagger.yaml
```

---

# API Information

```yaml
openapi: 3.1.0

info:
  title: Posyandu Digital API
  version: 1.0.0
  description: REST API for Sistem Digitalisasi Posyandu
```

---

# Server

Define development server.

Example

```yaml
servers:
  - url: http://localhost:3000/api/v1
    description: Development
```

Production server can be added later.

---

# Authentication

Use JWT Bearer Authentication.

Define once under:

```
components.securitySchemes
```

Example

```yaml
BearerAuth:
  type: http
  scheme: bearer
  bearerFormat: JWT
```

Every protected endpoint must include:

```yaml
security:
  - BearerAuth: []
```

---

# Tags

Organize endpoints using tags.

Required tags

- Authentication
- Posyandu
- Warga
- Balita
- Imunisasi
- Bumil
- Pasca Persalinan
- Lansia
- Pendataan Bulanan
- Dashboard

Every endpoint must belong to exactly one tag.

---

# Paths

Every endpoint documented in API.md must exist inside swagger.yaml.

Do not create undocumented endpoints.

Do not omit existing endpoints.

---

# Request Bodies

Every POST, PUT, and PATCH endpoint must define:

- requestBody
- schema
- examples

Use reusable schemas whenever possible.

---

# Parameters

Every path parameter must define:

- name
- type
- required
- description

Every query parameter must define:

- type
- example
- description

---

# Responses

Every endpoint must document:

200

201

204 (if applicable)

400

401

403

404

409 (locking conflict)

422

500

Each response should include:

- description
- schema
- example

---

# Components

Reusable schemas must be stored inside

```
components.schemas
```

Examples

- Warga
- Posyandu
- PemeriksaanBalita
- PemeriksaanBumil
- PemeriksaanPascaPersalinan
- PemeriksaanLansia
- RiwayatImunisasi
- PendataanBulanan
- DashboardResponse
- SuccessResponse
- ErrorResponse

Avoid duplicated schemas.

---

# Enum Definitions

Document enums explicitly.

Examples

Jenis Kelamin

```
L
P
```

Kategori Pendataan

```
balita
imunisasi
bumil
pasca_persalinan
lansia
```

Status Pendataan

```
draft
selesai
```

---

# Date Format

Use

```yaml
type: string
format: date
```

Datetime

```yaml
type: string
format: date-time
```

---

# UUID Format

All IDs use

```yaml
type: string
format: uuid
```

---

# Pagination

Endpoints returning lists should document:

Query

```
page
limit
search
```

Response

```yaml
data:
metadata:
```

Metadata should include

- page
- limit
- total
- totalPages

---

# Standard Response Format

Success

```json
{
    "success": true,
    "message": "Operation successful.",
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

Reuse these schemas across the specification.

---

# Monthly Data Collection

Document the following endpoints:

GET /pendataan

POST /pendataan/selesai

GET /pendataan/status

Include business descriptions explaining that:

- Pendataan Bulanan is an administrative workflow.
- It does not store medical records.
- It marks completion of monthly data entry.
- Once completed, the period becomes locked.

---

# Locking Rules

Document that:

POST

PUT

DELETE

operations on examination records may return

```
409 Conflict
```

Example response

```json
{
    "success": false,
    "message": "Pendataan untuk kategori ini pada periode tersebut telah diselesaikan dan tidak dapat diubah."
}
```

---

# Examples

Every endpoint must include realistic examples.

Example citizen

```
Nama:
Siti Nurhaliza

NIK:
3201XXXXXXXXXXXX

Jenis Kelamin:
P
```

Example date

```
2026-07-13
```

---

# Naming Convention

Schema names use PascalCase.

Examples

```
Warga

Posyandu

PemeriksaanBumil

DashboardResponse
```

Property names use camelCase.

Examples

```
tanggalKunjungan

jenisKelamin

submittedAt
```

---

# Documentation Rules

Descriptions should be concise.

Do not duplicate descriptions.

Avoid implementation details.

Focus on API consumers.

---

# Synchronization Rules

Whenever API.md changes:

- Update swagger.yaml.
- Update schemas.
- Update examples.
- Update request bodies.
- Update responses.
- Update enums if necessary.

Swagger documentation must never become inconsistent with API.md.

---

# AI Agent Instructions

When generating or modifying swagger.yaml:

1. Use OpenAPI 3.1.0.
2. Output YAML only.
3. Generate reusable component schemas.
4. Do not duplicate schemas.
5. Every endpoint in API.md must exist.
6. Every endpoint must include examples.
7. Every protected endpoint must use BearerAuth.
8. Document all query parameters.
9. Document all path parameters.
10. Include all HTTP response codes.
11. Reuse SuccessResponse and ErrorResponse where possible.
12. Keep swagger.yaml synchronized with API.md.
13. Never invent endpoints that are not defined in API.md.
14. Validate the generated YAML before completion.
## Multi-Tenancy
All APIs dynamically inject `posyandu_id` from the Bearer Token user context. Client payloads must omit `posyandu_id`.
