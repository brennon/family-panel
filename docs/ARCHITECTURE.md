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
- Domain entity interfaces (e.g., \`User\`, \`Chore\`, \`ChoreAssignment\`)
- Data transfer objects (DTOs) for create/update operations
- Filter and query parameter types

**Example**: \`types/user.ts\`
\`\`\`typescript
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

**Example**: \`types/chore-assignment.ts\`
\`\`\`typescript
export interface ChoreAssignment {
  id: string;
  choreId: string;
  userId: string;
  assignedDate: Date;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChoreAssignmentData {
  choreId: string;
  userId: string;
  assignedDate: Date;
}
\`\`\`

**Key principles**:
- Domain-centric (camelCase, Date objects, no database specifics)
- Immutable interfaces
- Clear naming that reflects business concepts
- Separate types for create/update operations (DTOs)

### 2. Repository Layer (\`/lib/repositories\`)

**Purpose**: Abstract data access and handle database operations

**Responsibilities**:
- Execute database queries via Supabase client
- Transform between database types (snake_case) and domain types (camelCase)
- Handle database errors and translate to meaningful messages
- Encapsulate all SQL/database logic

**Example**: \`lib/repositories/chore-assignment-repository.ts\`
\`\`\`typescript
export class ChoreAssignmentRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  // Transform database row to domain model
  private toDomain(dbAssignment: DbChoreAssignment): ChoreAssignment {
    return {
      id: dbAssignment.id,
      choreId: dbAssignment.chore_id,
      userId: dbAssignment.user_id,
      assignedDate: new Date(dbAssignment.assigned_date),
      completed: dbAssignment.completed,
      completedAt: dbAssignment.completed_at
        ? new Date(dbAssignment.completed_at)
        : null,
      createdAt: new Date(dbAssignment.created_at),
      updatedAt: new Date(dbAssignment.updated_at),
    };
  }

  // Find assignments by date, optionally filtered by kid
  async findByDate(date: Date, kidId?: string): Promise<ChoreAssignment[]> {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    const query = this.supabase
      .from('chore_assignments')
      .select('*')
      .eq('assigned_date', dateStr);

    const { data, error } = kidId
      ? await query.eq('user_id', kidId)
      : await query;

    if (error) {
      throw new Error(\`Failed to fetch chore assignments: \${error.message}\`);
    }

    return data ? data.map((assignment) => this.toDomain(assignment)) : [];
  }
}
\`\`\`

**Key principles**:
- One repository per domain entity
- Constructor injection of Supabase client
- Private transformation methods (\`toDomain\`, \`toDbInsert\`, \`toDbUpdate\`)
- Return domain types, not database types
- Handle "not found" gracefully (return null, don't throw)
- Transform database snake_case to domain camelCase
- Convert database timestamps to Date objects

### 3. Service Layer (\`/lib/services\`)

**Purpose**: Implement business logic and orchestrate repository operations

**Responsibilities**:
- Enforce business rules and validations
- Coordinate multiple repository calls (transactions, complex workflows)
- Apply domain-specific transformations (e.g., email normalization)
- Provide high-level API for use by API routes

**Example**: \`lib/services/chore-assignment-service.ts\`
\`\`\`typescript
export class ChoreAssignmentService {
  constructor(private repository: ChoreAssignmentRepository) {}

  async assignChore(
    choreId: string,
    userId: string,
    assignedDate: Date
  ): Promise<ChoreAssignment> {
    try {
      const data: CreateChoreAssignmentData = {
        choreId,
        userId,
        assignedDate,
      };
      return await this.repository.create(data);
    } catch (error) {
      throw new Error(\`Failed to assign chore: \${error.message}\`);
    }
  }

  async completeChore(assignmentId: string): Promise<ChoreAssignment> {
    try {
      const data: UpdateChoreAssignmentData = {
        completed: true,
        completedAt: new Date(),
      };
      return await this.repository.update(assignmentId, data);
    } catch (error) {
      throw new Error(\`Failed to complete chore: \${error.message}\`);
    }
  }
}
\`\`\`

**Key principles**:
- One service per domain entity (or aggregate root)
- Constructor injection of repositories
- Validate inputs and enforce business rules
- Throw descriptive errors for business rule violations
- Keep methods focused on single responsibilities
- Orchestrate repository calls and implement business logic

### 4. API Routes Layer (\`/app/api\`)

**Purpose**: HTTP endpoints that expose service layer functionality

**Responsibilities**:
- Handle HTTP requests and responses (NextRequest/NextResponse)
- Authenticate and authorize requests
- Validate request parameters and body
- Call service layer methods
- Format responses with appropriate status codes
- Handle errors and return meaningful error messages

**Example**: \`app/api/chore-assignments/route.ts\`
\`\`\`typescript
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, error } = await getAuthenticatedUser(supabase);

    if (error || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify authorization (parents only)
    if (!isParent(user)) {
      return NextResponse.json(
        { error: 'Only parents can assign chores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { choreId, userId, assignedDate } = body;

    // Validate inputs
    if (!choreId || !userId || !assignedDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call service layer
    const repository = new ChoreAssignmentRepository(supabase);
    const service = new ChoreAssignmentService(repository);
    const assignment = await service.assignChore(
      choreId,
      userId,
      new Date(assignedDate)
    );

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('Error assigning chore:', error);
    return NextResponse.json(
      { error: 'Failed to assign chore' },
      { status: 500 }
    );
  }
}
\`\`\`

**Key principles**:
- Authenticate and authorize before processing requests
- Validate all inputs before calling service layer
- Use appropriate HTTP status codes (200, 201, 400, 401, 403, 500)
- Return consistent JSON response format
- Log errors for debugging
- Handle errors gracefully with user-friendly messages

### 5. API Client (\`/lib/api\`)

**Purpose**: Frontend HTTP client for calling API routes

**Responsibilities**:
- Provide typed interfaces for all API endpoints
- Handle request formatting (JSON, headers)
- Handle response parsing and error handling
- Abstract fetch/HTTP details from components

**See complete implementations**:
- Types: \`types/chore-assignment.ts\`, \`types/user.ts\`, \`types/chore.ts\`
- Repositories: \`lib/repositories/chore-assignment-repository.ts\`, \`lib/repositories/user-repository.ts\`
- Services: \`lib/services/chore-assignment-service.ts\`, \`lib/services/user-service.ts\`
- API Routes: \`app/api/chore-assignments/route.ts\`, \`app/api/chores/route.ts\`
- API Client: \`lib/api/client.ts\` (when implemented)
