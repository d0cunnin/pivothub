-- Enable realtime for admin dashboard tables
-- This allows real-time subscriptions to see INSERT/UPDATE events

-- Enable replica identity for full row data capture
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE tool_usage_analytics REPLICA IDENTITY FULL;
ALTER TABLE assessment_results REPLICA IDENTITY FULL;
ALTER TABLE subscribers_public REPLICA IDENTITY FULL;

-- Add tables to the realtime publication
-- This makes these tables available for realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE tool_usage_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE assessment_results;
ALTER PUBLICATION supabase_realtime ADD TABLE subscribers_public;