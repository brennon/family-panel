import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChoreAssignmentRepository } from '@/lib/repositories';
import { ChoreAssignmentService } from '@/lib/services';
import { getAuthenticatedUser, isParent } from '@/lib/api/auth-helpers';
import type { CreateChoreAssignmentData } from '@/types';

/**
 * GET /api/chore-assignments?date=YYYY-MM-DD&kidId=uuid
 * List chore assignments for a date (optionally filtered by kid)
 * All authenticated users can access
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, error } = await getAuthenticatedUser(supabase);

    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get('date');
    const kidId = searchParams.get('kidId') || undefined;

    // Validate date parameter (required)
    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date parameter is required (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Parse and validate date format
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const repository = new ChoreAssignmentRepository(supabase);
    const service = new ChoreAssignmentService(repository);

    const assignments = await service.getAssignmentsForDate(date, kidId);

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching chore assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chore assignments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chore-assignments
 * Assign a chore to a kid (parents only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, error } = await getAuthenticatedUser(supabase);

    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is a parent
    if (!isParent(user)) {
      return NextResponse.json(
        { error: 'Only parents can assign chores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { choreId, userId, assignedDate } = body;

    // Validate required fields
    if (!choreId || typeof choreId !== 'string') {
      return NextResponse.json(
        { error: 'Chore ID is required' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!assignedDate || typeof assignedDate !== 'string') {
      return NextResponse.json(
        { error: 'Assigned date is required' },
        { status: 400 }
      );
    }

    // Parse and validate date
    const date = new Date(assignedDate);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const createData: CreateChoreAssignmentData = {
      choreId,
      userId,
      assignedDate: date,
    };

    const repository = new ChoreAssignmentRepository(supabase);
    const service = new ChoreAssignmentService(repository);

    const assignment = await service.assignChore(
      createData.choreId,
      createData.userId,
      createData.assignedDate
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
