import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route: PIN Login for Kids
 * Validates kid's PIN and creates an authenticated session
 */

export async function POST(request: NextRequest) {
  try {
    const { userId, pin } = await request.json();

    // Validate input
    if (!userId || !pin) {
      return NextResponse.json(
        { error: 'User ID and PIN are required' },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 4 digits' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Validate PIN using database function
    const { data: isValid, error } = await supabase.rpc('validate_kid_pin', {
      p_user_id: userId,
      p_pin: pin,
    } as any); // Type assertion needed due to RPC type limitations

    if (error) {
      console.error('PIN validation error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid PIN or user ID' },
        { status: 401 }
      );
    }

    // Get user details
    type UserProfile = {
      id: string;
      email: string;
      name: string;
      role: string;
    };

    const { data, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single();

    if (userError || !data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = data as UserProfile;

    // For now, we validate the PIN but don't create a full Supabase Auth session
    // In production, you would:
    // 1. Use Supabase custom tokens, OR
    // 2. Set up kids with magic link auth, OR
    // 3. Use a session cookie with JWT

    // Return success with user info
    // The client-side will need to handle the session state
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('PIN login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
