import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCommentsTable() {
  console.log('Checking if post_comments table exists...');
  
  try {
    // Try to query the post_comments table
    const { data, error } = await supabase
      .from('post_comments')
      .select('id')
      .limit(1);
      
    if (error) {
      console.log('Table check error:', error);
      if (error.code === '42P01') {
        console.log('❌ post_comments table does not exist!');
        console.log('\nPlease run the following SQL in your Supabase dashboard:\n');
        console.log(`
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

-- Add comments_count column to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
        `);
      } else {
        console.log('❌ Other error:', error.message);
      }
    } else {
      console.log('✅ post_comments table exists!');
      
      // Check if posts table has comments_count column
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('comments_count')
        .limit(1);
        
      if (postError) {
        console.log('❌ Error checking posts table:', postError.message);
        if (postError.code === '42703') { // undefined_column
          console.log('\nPlease run this SQL to add comments_count column:');
          console.log('ALTER TABLE posts ADD COLUMN comments_count INTEGER DEFAULT 0;');
        }
      } else {
        console.log('✅ posts table has comments_count column');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkCommentsTable();