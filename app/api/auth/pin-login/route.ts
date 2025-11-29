import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * API Route: PIN Login for Kids
 * Validates kid's PIN and creates an authenticated session via magic link token
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

    // Use admin client to bypass RLS for authentication
    const adminClient = createAdminClient();

    // Validate PIN using database function
    const { data: isValid, error } = await adminClient.rpc('validate_kid_pin', {
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

    const { data, error: userError} = await adminClient
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single();

    if (userError || !data) {
      console.error('User lookup error:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = data as UserProfile;

    // Verify user is a kid
    if (user.role !== 'kid') {
      return NextResponse.json(
        { error: 'PIN login is only for kids' },
        { status: 403 }
      );
    }

    // Generate a magic link token for the user
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    });

    if (linkError || !linkData) {
      console.error('Magic link generation error:', linkError);
      return NextResponse.json(
        { error: 'Failed to generate authentication token' },
        { status: 500 }
      );
    }

    // Extract the hashed token from the response
    const tokenHash = linkData.properties.hashed_token;

    if (!tokenHash) {
      console.error('No hashed token in magic link response');
      return NextResponse.json(
        { error: 'Failed to generate authentication token' },
        { status: 500 }
      );
    }

    // Return the token hash to the client
    return NextResponse.json({
      success: true,
      token: tokenHash,
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
