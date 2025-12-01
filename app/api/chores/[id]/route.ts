import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChoreRepository } from '@/lib/repositories';
import { ChoreService } from '@/lib/services';
import { getAuthenticatedUser, isParent } from '@/lib/api/auth-helpers';
import type { UpdateChoreData } from '@/types';

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
    if (!isParent(user)) {
      return NextResponse.json(
        { error: 'Only parents can update chores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, monetaryValueCents } = body;

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
    if (!isParent(user)) {
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
