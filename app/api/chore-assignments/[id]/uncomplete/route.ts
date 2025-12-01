import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChoreAssignmentRepository } from '@/lib/repositories';
import { ChoreAssignmentService } from '@/lib/services';
import { getAuthenticatedUser, isParent } from '@/lib/api/auth-helpers';

/**
 * PATCH /api/chore-assignments/[id]/uncomplete
 * Mark a chore assignment as uncompleted (parents only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Only parents can uncomplete chores' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const repository = new ChoreAssignmentRepository(supabase);
    const service = new ChoreAssignmentService(repository);

    // Check if assignment exists
    const assignment = await service.getAssignmentById(id);

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    const updatedAssignment = await service.uncompleteChore(id);

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error) {
    console.error('Error uncompleting chore assignment:', error);
    return NextResponse.json(
      { error: 'Failed to uncomplete chore assignment' },
      { status: 500 }
    );
  }
}
