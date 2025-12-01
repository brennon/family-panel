import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChoreRepository } from '@/lib/repositories';
import { ChoreService } from '@/lib/services';
import { getAuthenticatedUser, isParent } from '@/lib/api/auth-helpers';
import type { CreateChoreData } from '@/types';

/**
 * GET /api/chores
 * List all chores (accessible to all authenticated users)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, error } = await getAuthenticatedUser(supabase);

    if (error || !user) {
      return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
    }

    const repository = new ChoreRepository(supabase);
    const service = new ChoreService(repository);

    const chores = await service.getAllChores();

    return NextResponse.json({ chores });
  } catch (error) {
    console.error('Error fetching chores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chores' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chores
 * Create a new chore (parents only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, error } = await getAuthenticatedUser(supabase);

    if (error || !user) {
      return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
    }

    // Verify user is a parent
    if (!isParent(user)) {
      return NextResponse.json(
        { error: 'Only parents can create chores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, monetaryValueCents } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Chore name is required' },
        { status: 400 }
      );
    }

    // Validate monetary value if provided
    if (monetaryValueCents !== undefined && monetaryValueCents !== null) {
      if (!Number.isInteger(monetaryValueCents)) {
        return NextResponse.json(
          { error: 'Monetary value must be an integer (cents)' },
          { status: 400 }
        );
      }
      if (monetaryValueCents < 0) {
        return NextResponse.json(
          { error: 'Monetary value cannot be negative' },
          { status: 400 }
        );
      }
    }

    const createData: CreateChoreData = {
      name: name.trim(),
      description: description || null,
      monetaryValueCents: monetaryValueCents || 0,
    };

    const repository = new ChoreRepository(supabase);
    const service = new ChoreService(repository);

    const chore = await service.createChore(createData);

    return NextResponse.json({ chore }, { status: 201 });
  } catch (error) {
    console.error('Error creating chore:', error);
    return NextResponse.json(
      { error: 'Failed to create chore' },
      { status: 500 }
    );
  }
}
