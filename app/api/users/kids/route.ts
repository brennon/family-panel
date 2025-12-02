import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserRepository } from '@/lib/repositories';
import { UserService } from '@/lib/services';
import { getAuthenticatedUser, isParent } from '@/lib/api/auth-helpers';

/**
 * GET /api/users/kids
 *
 * Retrieve all users with 'kid' role.
 * Only parents can access this endpoint.
 *
 * @param request - NextRequest object
 *
 * @returns {Promise<NextResponse>} JSON response with kids array
 *
 * Response Body:
 * ```json
 * {
 *   "kids": [
 *     {
 *       "id": "uuid",
 *       "name": "Kid Name",
 *       "email": "kid@example.com",
 *       "role": "kid",
 *       "screenTimeDailyMinutes": 120,
 *       "createdAt": "2024-01-01T00:00:00.000Z",
 *       "updatedAt": "2024-01-01T00:00:00.000Z"
 *     }
 *   ]
 * }
 * ```
 *
 * Status Codes:
 * - 200: Success
 * - 401: Unauthorized (authentication required)
 * - 403: Forbidden (user is not a parent)
 * - 500: Internal server error
 *
 * Authorization:
 * - Only parents can access this endpoint
 *
 * @example
 * GET /api/users/kids
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

    // Verify user is a parent
    if (!isParent(user)) {
      return NextResponse.json(
        { error: 'Only parents can view kids list' },
        { status: 403 }
      );
    }

    const repository = new UserRepository(supabase);
    const service = new UserService(repository);

    const kids = await service.getKids();

    return NextResponse.json({ kids });
  } catch (error) {
    console.error('Error fetching kids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kids' },
      { status: 500 }
    );
  }
}
