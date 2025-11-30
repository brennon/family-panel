import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChoreRepository } from '@/lib/repositories';
import { ChoreService } from '@/lib/services';
import type { CreateChoreData } from '@/types';

/**
 * Helper function to get authenticated user and verify they're a parent
 */
async function getAuthenticatedUser(supabase: any) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: 'Authentication required' };
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { user: null, error: 'User profile not found' };
  }

  return { user: profile, error: null };
}

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
    if (user.role !== 'parent') {
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
