-- Family Panel - Seed Data
-- Optional test data for development and testing
-- Run this after applying the schema migrations

-- WARNING: This will insert test data. Only run in development environments!

-- Insert test users (1 parent, 2 kids)
INSERT INTO users (id, email, name, role, screen_time_daily_minutes) VALUES
  ('00000000-0000-0000-0000-000000000001', 'parent@example.com', 'John Parent', 'parent', 0),
  ('00000000-0000-0000-0000-000000000002', 'kid1@example.com', 'Alice Kid', 'kid', 120),
  ('00000000-0000-0000-0000-000000000003', 'kid2@example.com', 'Bob Kid', 'kid', 90)
ON CONFLICT (id) DO NOTHING;

-- Insert sample chores
INSERT INTO chores (id, name, description, monetary_value_cents) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Make Bed', 'Make your bed neatly every morning', 50),
  ('10000000-0000-0000-0000-000000000002', 'Wash Dishes', 'Wash and dry all dishes after dinner', 100),
  ('10000000-0000-0000-0000-000000000003', 'Take Out Trash', 'Take all trash bins to the curb', 75),
  ('10000000-0000-0000-0000-000000000004', 'Vacuum Room', 'Vacuum your bedroom thoroughly', 150),
  ('10000000-0000-0000-0000-000000000005', 'Feed Pet', 'Feed the family pet and refill water', 25),
  ('10000000-0000-0000-0000-000000000006', 'Clean Bathroom', 'Clean and organize bathroom', 200)
ON CONFLICT (id) DO NOTHING;

-- Insert sample chore assignments
INSERT INTO chore_assignments (chore_id, user_id, assigned_date, completed, completed_at) VALUES
  -- Alice's chores
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', CURRENT_DATE, true, NOW() - INTERVAL '2 hours'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', CURRENT_DATE, false, NULL),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', CURRENT_DATE, true, NOW() - INTERVAL '1 hour'),

  -- Bob's chores
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', CURRENT_DATE, false, NULL),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', CURRENT_DATE, false, NULL)
ON CONFLICT DO NOTHING;

-- Insert sample incentive types
INSERT INTO incentive_types (id, name, unit, reward_cents_per_unit, reward_minutes_per_unit) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Reading', 'minutes', 10, 15),
  ('20000000-0000-0000-0000-000000000002', 'Exercise', 'minutes', 15, 20),
  ('20000000-0000-0000-0000-000000000003', 'Practice Instrument', 'minutes', 20, 25),
  ('20000000-0000-0000-0000-000000000004', 'Homework', 'hours', 100, 60)
ON CONFLICT (id) DO NOTHING;

-- Insert sample incentive logs
INSERT INTO incentive_logs (user_id, incentive_type_id, date, units_completed, reward_type) VALUES
  -- Alice's incentives
  ('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', CURRENT_DATE, 30.0, 'screen_time'),
  ('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', CURRENT_DATE, 45.0, 'both'),

  -- Bob's incentives
  ('00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', CURRENT_DATE, 20.0, 'money'),
  ('00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', CURRENT_DATE, 1.5, 'screen_time')
ON CONFLICT DO NOTHING;

-- Insert sample screen time sessions
INSERT INTO screen_time_sessions (user_id, date, start_time, end_time, duration_seconds) VALUES
  -- Alice's screen time
  ('00000000-0000-0000-0000-000000000002', CURRENT_DATE, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', 3600),
  ('00000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '1 day', NOW() - INTERVAL '1 day 2 hours', NOW() - INTERVAL '1 day 1 hour', 3600),

  -- Bob's screen time (one active session)
  ('00000000-0000-0000-0000-000000000003', CURRENT_DATE, NOW() - INTERVAL '30 minutes', NULL, NULL),
  ('00000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '1 day', NOW() - INTERVAL '1 day 1 hour', NOW() - INTERVAL '1 day 30 minutes', 1800)
ON CONFLICT DO NOTHING;

-- Display summary
SELECT 'Seed data inserted successfully!' AS message;
SELECT 'Users:' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'Chores:', COUNT(*) FROM chores
UNION ALL
SELECT 'Chore Assignments:', COUNT(*) FROM chore_assignments
UNION ALL
SELECT 'Incentive Types:', COUNT(*) FROM incentive_types
UNION ALL
SELECT 'Incentive Logs:', COUNT(*) FROM incentive_logs
UNION ALL
SELECT 'Screen Time Sessions:', COUNT(*) FROM screen_time_sessions;
