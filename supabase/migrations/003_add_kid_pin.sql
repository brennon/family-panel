-- Migration: 003
-- Description: Add PIN authentication for kids
-- Adds pin_hash column to users table for simplified kid login

-- Add pin_hash column to users table
-- PIN will be hashed before storage for security
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Create index for faster PIN lookups
CREATE INDEX IF NOT EXISTS idx_users_pin_hash ON users(pin_hash) WHERE pin_hash IS NOT NULL;

-- Function to validate kid PIN login
-- Takes user_id and plain PIN, returns true if valid
CREATE OR REPLACE FUNCTION validate_kid_pin(
  p_user_id UUID,
  p_pin TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pin_hash TEXT;
  v_role TEXT;
BEGIN
  -- Get user's PIN hash and role
  SELECT pin_hash, role INTO v_pin_hash, v_role
  FROM users
  WHERE id = p_user_id;

  -- Check if user exists and is a kid
  IF v_role IS NULL OR v_role != 'kid' THEN
    RETURN FALSE;
  END IF;

  -- Check if PIN matches (simple hash comparison)
  -- In production, use proper password hashing via auth.users
  RETURN v_pin_hash = crypt(p_pin, v_pin_hash);
END;
$$;

-- Function to set kid PIN
-- Takes user_id and plain PIN, hashes and stores it
CREATE OR REPLACE FUNCTION set_kid_pin(
  p_user_id UUID,
  p_pin TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Verify user is a kid
  SELECT role INTO v_role
  FROM users
  WHERE id = p_user_id;

  IF v_role IS NULL OR v_role != 'kid' THEN
    RAISE EXCEPTION 'User must be a kid to set PIN';
  END IF;

  -- Validate PIN is 4 digits
  IF p_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 4 digits';
  END IF;

  -- Hash and store PIN
  UPDATE users
  SET pin_hash = crypt(p_pin, gen_salt('bf'))
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION validate_kid_pin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_kid_pin(UUID, TEXT) TO authenticated;

-- Add comment explaining PIN storage
COMMENT ON COLUMN users.pin_hash IS 'Hashed 4-digit PIN for kid login. Only applicable for users with role=kid.';
