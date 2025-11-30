import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChoreRepository } from '@/lib/repositories';
import { ChoreService } from '@/lib/services';
import type { UpdateChoreData } from '@/types';

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
 * PATCH /api/chores/[id]
 * Update a chore (parents only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { user, error } = await getAuthenticatedUser(supabase);

    if (error || !user) {
      return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
    }

    // Verify user is a parent
    if (user.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can update chores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, monetaryValueCents } = body;

    const updateData: UpdateChoreData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (monetaryValueCents !== undefined) updateData.monetaryValueCents = monetaryValueCents;

    const repository = new ChoreRepository(supabase);
    const service = new ChoreService(repository);

    const chore = await service.updateChore(id, updateData);

    return NextResponse.json({ chore });
  } catch (error) {
    console.error('Error updating chore:', error);
    return NextResponse.json(
      { error: 'Failed to update chore' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chores/[id]
 * Delete a chore (parents only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { user, error } = await getAuthenticatedUser(supabase);

    if (error || !user) {
      return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
    }

    // Verify user is a parent
    if (user.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can delete chores' },
        { status: 403 }
      );
    }

    const repository = new ChoreRepository(supabase);
    const service = new ChoreService(repository);

    await service.deleteChore(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting chore:', error);
    return NextResponse.json(
      { error: 'Failed to delete chore' },
      { status: 500 }
    );
  }
}
