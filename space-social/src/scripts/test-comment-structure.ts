import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCommentStructure() {
  console.log('Testing comment data structure...');
  
  try {
    // Get a sample post
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
      
    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }
    
    if (!posts || posts.length === 0) {
      console.log('No posts found');
      return;
    }
    
    const post = posts[0];
    console.log('Using post:', post.id);
    
    // Add a test comment if none exist
    const { data: existingComments, error: commentsError } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', post.id)
      .limit(1);
      
    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return;
    }
    
    let commentId = null;
    if (!existingComments || existingComments.length === 0) {
      // Add a test comment
      const { data: spaces, error: spacesError } = await supabase
        .from('spaces')
        .select('*')
        .limit(1);
        
      if (spacesError) {
        console.error('Error fetching spaces:', spacesError);
        return;
      }
      
      if (!spaces || spaces.length === 0) {
        console.log('No spaces found');
        return;
      }
      
      const space = spaces[0];
      
      const { data: newComment, error: insertError } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          space_id: space.id,
          content: 'Test comment for structure testing'
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('Error inserting test comment:', insertError);
        return;
      }
      
      commentId = newComment.id;
      console.log('Created test comment:', newComment);
    }
    
    // Now test the query structure we want to use
    console.log('\n--- Testing the query structure ---');
    const { data: commentsData, error } = await supabase
      .from('post_comments')
      .select(`
        id,
        content,
        created_at,
        space:spaces(id, name, avatar_url)
      `)
      .eq('post_id', post.id)
      .limit(3);
      
    if (error) {
      console.error('Error in query:', error);
      return;
    }
    
    console.log('Query result:', JSON.stringify(commentsData, null, 2));
    
    // Clean up test comment if we created one
    if (commentId) {
      await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);
      console.log('Cleaned up test comment');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCommentStructure();