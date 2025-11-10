-- This SQL script should be run directly in the Supabase SQL editor
-- It adds the missing columns to the spaces table

-- Add likes_count and favorites_count columns to spaces table
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0;

-- Initialize any existing rows with default values
UPDATE spaces 
SET likes_count = 0 
WHERE likes_count IS NULL;

UPDATE spaces 
SET favorites_count = 0 
WHERE favorites_count IS NULL;

-- Add a trigger to automatically update counters
-- This is a simplified version - in production you might want more sophisticated triggers

-- Create a function to update space counters
CREATE OR REPLACE FUNCTION update_space_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialize counters when a space is created
  IF TG_OP = 'INSERT' THEN
    NEW.followers_count := COALESCE(NEW.followers_count, 0);
    NEW.posts_count := COALESCE(NEW.posts_count, 0);
    NEW.likes_count := COALESCE(NEW.likes_count, 0);
    NEW.favorites_count := COALESCE(NEW.favorites_count, 0);
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for spaces table
DROP TRIGGER IF EXISTS spaces_count_trigger ON spaces;
CREATE TRIGGER spaces_count_trigger
  BEFORE INSERT OR UPDATE ON spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_space_counters();