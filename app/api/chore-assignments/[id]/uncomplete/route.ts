import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChoreAssignmentRepository } from '@/lib/repositories';
import { ChoreAssignmentService } from '@/lib/services';
import { getAuthenticatedUser, isParent } from '@/lib/api/auth-helpers';

/**
 * PATCH /api/chore-assignments/[id]/uncomplete
 *
 * Remove completion status from a chore assignment.
 * Only parents can access this endpoint.
 *
 * @param request - NextRequest object
 * @param params - Route parameters containing the assignment ID
 * @param params.id - UUID of the assignment to uncomplete
 *
 * @returns {Promise<NextResponse>} JSON response with updated assignment
 *
 * Response Body:
 * ```json
 * {
 *   "assignment": {
 *     "id": "uuid",
 *     "choreId": "uuid",
 *     "userId": "uuid",
 *     "assignedDate": "2024-01-15T00:00:00.000Z",
 *     "completed": false,
 *     "completedAt": null,
 *     "createdAt": "2024-01-14T00:00:00.000Z",
 *     "updatedAt": "2024-01-15T11:00:00.000Z"
 *   }
 * }
 * ```
 *
 * Status Codes:
 * - 200: Success
 * - 401: Unauthorized (authentication required)
 * - 403: Forbidden (user is not a parent)
 * - 404: Assignment not found
 * - 500: Internal server error
 *
 * Authorization:
 * - Only parents can uncomplete chore assignments
 *
 * @example
 * PATCH /api/chore-assignments/assignment-123/uncomplete
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
