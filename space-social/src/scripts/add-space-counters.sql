-- Add likes_count and favorites_count columns to spaces table
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0;

-- Update existing spaces with default values
UPDATE spaces 
SET likes_count = 0 
WHERE likes_count IS NULL;

UPDATE spaces 
SET favorites_count = 0 
WHERE favorites_count IS NULL;