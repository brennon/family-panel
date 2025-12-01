import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChoreAssignmentRepository } from '@/lib/repositories';
import { ChoreAssignmentService } from '@/lib/services';
import { getAuthenticatedUser, isParent } from '@/lib/api/auth-helpers';

/**
 * PATCH /api/chore-assignments/[id]/complete
 * Mark a chore assignment as completed
 * Can be done by the assigned kid or any parent
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

    const { id } = await params;

    // Get the assignment to check authorization
    const repository = new ChoreAssignmentRepository(supabase);
    const service = new ChoreAssignmentService(repository);

    const assignment = await service.getAssignmentById(id);

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Authorization: assigned kid or parents can complete
    const isAssignedKid = assignment.userId === user.id;
    const isParentUser = isParent(user);

    if (!isAssignedKid && !isParentUser) {
      return NextResponse.json(
        { error: 'Only the assigned kid or parents can complete this chore' },
        { status: 403 }
      );
    }

    const updatedAssignment = await service.completeChore(id);

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error) {
    console.error('Error completing chore assignment:', error);
    return NextResponse.json(
      { error: 'Failed to complete chore assignment' },
      { status: 500 }
    );
  }
}
