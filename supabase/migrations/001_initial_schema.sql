-- Family Panel - Initial Database Schema
-- Migration: 001
-- Description: Creates core tables for users, chores, incentives, and screen time tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
-- Stores parent and kid user accounts
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'kid')),
    screen_time_daily_minutes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Chores table
-- Defines available chores with their monetary values
CREATE TABLE IF NOT EXISTS chores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    monetary_value_cents INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chore assignments table
-- Tracks which chores are assigned to which kids and their completion status
CREATE TABLE IF NOT EXISTS chore_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chore_id UUID NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_chore_assignments_user_id ON chore_assignments(user_id);
CREATE INDEX idx_chore_assignments_chore_id ON chore_assignments(chore_id);
CREATE INDEX idx_chore_assignments_completed ON chore_assignments(completed);
CREATE INDEX idx_chore_assignments_assigned_date ON chore_assignments(assigned_date);

-- Incentive types table
-- Defines types of incentives (e.g., reading, exercise) and their reward values
CREATE TABLE IF NOT EXISTS incentive_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    unit TEXT NOT NULL, -- e.g., 'minutes', 'pages', 'laps'
    reward_cents_per_unit INTEGER NOT NULL DEFAULT 0,
    reward_minutes_per_unit INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incentive logs table
-- Records when kids complete incentive activities
CREATE TABLE IF NOT EXISTS incentive_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    incentive_type_id UUID NOT NULL REFERENCES incentive_types(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    units_completed DECIMAL(10, 2) NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('money', 'screen_time', 'both')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_incentive_logs_user_id ON incentive_logs(user_id);
CREATE INDEX idx_incentive_logs_incentive_type_id ON incentive_logs(incentive_type_id);
CREATE INDEX idx_incentive_logs_date ON incentive_logs(date);

-- Screen time sessions table
-- Tracks when kids use their screen time
CREATE TABLE IF NOT EXISTS screen_time_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_screen_time_sessions_user_id ON screen_time_sessions(user_id);
CREATE INDEX idx_screen_time_sessions_date ON screen_time_sessions(date);
CREATE INDEX idx_screen_time_sessions_start_time ON screen_time_sessions(start_time);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updated_at updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chores_updated_at BEFORE UPDATE ON chores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chore_assignments_updated_at BEFORE UPDATE ON chore_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incentive_types_updated_at BEFORE UPDATE ON incentive_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incentive_logs_updated_at BEFORE UPDATE ON incentive_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_screen_time_sessions_updated_at BEFORE UPDATE ON screen_time_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
