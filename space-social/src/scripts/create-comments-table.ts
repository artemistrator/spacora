import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createCommentsTable() {
  console.log('Checking post_comments table and comments_count column...');
  
  try {
    // Check if post_comments table exists
    const { error: selectError } = await supabase
      .from('post_comments')
      .select('id')
      .limit(1);
      
    if (selectError && selectError.code === '42P01') { // 42P01 = undefined_table
      console.log('post_comments table does not exist.');
      console.log('Please create the post_comments table in your Supabase dashboard with the following SQL:');
      console.log(`
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
      `);
    } else {
      console.log('post_comments table already exists!');
    }
    
    // Check if comments_count column exists in posts table
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
      
    if (postsError) {
      console.error('Error checking posts table:', postsError);
    } else if (postsData && postsData.length > 0) {
      // Check if comments_count property exists by examining the keys of the first row
      const postKeys = Object.keys(postsData[0]);
      if (!postKeys.includes('comments_count')) {
        console.log('comments_count column does not exist in posts table.');
        console.log('Please add the comments_count column to the posts table with the following SQL:');
        console.log(`
ALTER TABLE posts 
ADD COLUMN comments_count INTEGER DEFAULT 0;
        `);
      } else {
        console.log('comments_count column already exists in posts table!');
      }
    }
    
  } catch (error) {
    console.error('Error checking comments table:', error);
  }
}

// Run the function
createCommentsTable();