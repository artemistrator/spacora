# Comments Feature Setup

To enable the comments functionality in the spacora application, you need to create the `post_comments` table in your Supabase database.

## Database Setup

Run the following SQL script in your Supabase dashboard (SQL Editor):

```sql
-- Create post_comments table
CREATE TABLE post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_space_id ON post_comments(space_id);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at);

-- Add comments_count column to posts table (if it doesn't exist)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
```

## How It Works

1. When a user clicks the comment button on a post, a text input field appears
2. The user can enter their comment and click "Send"
3. The comment is saved to the `post_comments` table
4. The `comments_count` field in the `posts` table is updated automatically

## Error Handling

If the `post_comments` table doesn't exist, users will see an alert message when trying to add a comment. Make sure to run the SQL script above to enable the comments feature.

## File Locations

- Component: `src/components/post/PostCard.tsx`
- Migration script: `src/scripts/migrations/001_create_post_comments_table.sql`

## Testing

You can test the comments functionality by running:

```bash
cd x:\spacora\space-social
npx ts-node src/scripts/test-comment-functionality.ts
```

This script will:
1. Find a sample post and space
2. Insert a test comment
3. Update the comments count
4. Clean up by deleting the test comment