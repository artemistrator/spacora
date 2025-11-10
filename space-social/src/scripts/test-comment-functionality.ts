import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCommentFunctionality() {
  console.log('Testing comment functionality...');
  
  try {
    // First, get a sample post
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
      
    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }
    
    if (!posts || posts.length === 0) {
      console.log('No posts found in the database');
      return;
    }
    
    const post = posts[0];
    console.log('Testing with post:', post.id);
    
    // Get a sample space
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('*')
      .limit(1);
      
    if (spacesError) {
      console.error('Error fetching spaces:', spacesError);
      return;
    }
    
    if (!spaces || spaces.length === 0) {
      console.log('No spaces found in the database');
      return;
    }
    
    const space = spaces[0];
    console.log('Using space:', space.id);
    
    // Test inserting a comment
    console.log('Inserting test comment...');
    const { data: commentData, error: commentError } = await supabase
      .from('post_comments')
      .insert({
        post_id: post.id,
        space_id: space.id,
        content: 'This is a test comment'
      })
      .select();
      
    if (commentError) {
      console.error('Error inserting comment:', commentError);
      return;
    }
    
    console.log('Comment inserted successfully:', commentData);
    
    // Update the comments count in the post
    const newCount = (post.comments_count || 0) + 1;
    console.log('Updating comments count to:', newCount);
    
    const { error: updateError } = await supabase
      .from('posts')
      .update({ comments_count: newCount })
      .eq('id', post.id);
      
    if (updateError) {
      console.error('Error updating comments count:', updateError);
      return;
    }
    
    console.log('Comments count updated successfully');
    
    // Clean up - delete the test comment
    console.log('Cleaning up test comment...');
    const { error: deleteError } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentData[0].id);
      
    if (deleteError) {
      console.error('Error deleting test comment:', deleteError);
      return;
    }
    
    console.log('Test comment deleted successfully');
    
    console.log('Comment functionality test completed successfully!');
    
  } catch (error) {
    console.error('Error testing comment functionality:', error);
  }
}

// Run the test
testCommentFunctionality();