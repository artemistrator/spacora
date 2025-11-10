import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCommentsTable() {
  console.log('Testing if post_comments table exists...');
  
  try {
    // Try to insert a test record into post_comments
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: '00000000-0000-0000-0000-000000000000',
        space_id: '00000000-0000-0000-0000-000000000000',
        content: 'Test comment'
      })
      .select();
      
    if (error) {
      if (error.code === '42P01') { // undefined_table
        console.log('post_comments table does not exist!');
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
      } else if (error.code === '23503') { // foreign_key_violation
        console.log('post_comments table exists! (Got foreign key violation which means table exists)');
        console.log('Now checking if comments_count column exists in posts table...');
        
        // Test if comments_count column exists
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('comments_count')
          .limit(1);
          
        if (postsError) {
          if (postsError.code === '42703') { // undefined_column
            console.log('comments_count column does not exist in posts table!');
            console.log('Please add the comments_count column to the posts table with the following SQL:');
            console.log(`
ALTER TABLE posts 
ADD COLUMN comments_count INTEGER DEFAULT 0;
            `);
          } else {
            console.error('Error checking posts table:', postsError);
          }
        } else {
          console.log('comments_count column exists in posts table!');
        }
      } else {
        console.error('Unexpected error:', error);
      }
    } else {
      console.log('post_comments table exists and insertion worked!');
      // Clean up the test record
      await supabase
        .from('post_comments')
        .delete()
        .eq('post_id', '00000000-0000-0000-0000-000000000000');
    }
    
  } catch (error) {
    console.error('Error testing comments table:', error);
  }
}

// Run the function
testCommentsTable();