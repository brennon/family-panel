# Architecture Guide

This document describes the layered architecture used in the Family Panel application.

## Overview

The application follows a clean architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                     │
│              (Next.js App Router, React Components)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                       API Routes Layer                      │
│               (Next.js API Routes - /app/api)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Service Layer                          │
│          (Business Logic - /lib/services)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Repository Layer                         │
│        (Data Access Abstractions - /lib/repositories)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Database Layer                         │
│                  (Supabase PostgreSQL)                      │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Domain Types (\`/types\`)

**Purpose**: Define business domain models

**Contains**:
- Domain entity interfaces (e.g., \`User\`, \`Chore\`)
- Data transfer objects (DTOs) for create/update operations
- Filter and query parameter types

**Example**:
\`\`\`typescript
// types/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  screenTimeDailyMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}
\`\`\`

**Key principles**:
- Domain-centric (camelCase, Date objects, no database specifics)
- Immutable interfaces
- Clear naming that reflects business concepts

### 2. Repository Layer (\`/lib/repositories\`)

**Purpose**: Abstract data access and handle database operations

**Responsibilities**:
- Execute database queries via Supabase client
- Transform between database types (snake_case) and domain types (camelCase)
- Handle database errors and translate to meaningful messages
- Encapsulate all SQL/database logic

**Key principles**:
- One repository per domain entity
- Constructor injection of Supabase client
- Private transformation methods (\`toDomain\`, \`toDbInsert\`, \`toDbUpdate\`)
- Return domain types, not database types
- Handle "not found" gracefully (return null, don't throw)

### 3. Service Layer (\`/lib/services\`)

**Purpose**: Implement business logic and orchestrate repository operations

**Responsibilities**:
- Enforce business rules and validations
- Coordinate multiple repository calls (transactions, complex workflows)
- Apply domain-specific transformations (e.g., email normalization)
- Provide high-level API for use by API routes

**Key principles**:
- One service per domain entity (or aggregate root)
- Constructor injection of repositories
- Validate inputs and enforce business rules
- Throw descriptive errors for business rule violations
- Keep methods focused on single responsibilities

### 4. API Client (\`/lib/api\`)

**Purpose**: Frontend HTTP client for calling API routes

**Responsibilities**:
- Provide typed interfaces for all API endpoints
- Handle request formatting (JSON, headers)
- Handle response parsing and error handling
- Abstract fetch/HTTP details from components

See examples in:
- \`lib/repositories/user-repository.ts\`
- \`lib/services/user-service.ts\`
- \`lib/api/client.ts\`
