import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addTestComments() {
  console.log('Adding test comments...');
  
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
      console.log('No spaces found');
      return;
    }
    
    const space = spaces[0];
    console.log('Using space:', space.id);
    
    // Add 5 test comments
    const testComments = [
      'This is the first test comment',
      'Here is another comment for testing',
      'Third comment to check the display limit',
      'Fourth comment to test the "show more" functionality',
      'Fifth and final test comment'
    ];
    
    for (let i = 0; i < testComments.length; i++) {
      const { data: commentData, error: insertError } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          space_id: space.id,
          content: testComments[i]
        })
        .select();
        
      if (insertError) {
        console.error(`Error inserting comment ${i + 1}:`, insertError);
      } else {
        console.log(`✅ Comment ${i + 1} inserted:`, commentData[0].id);
      }
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Update the comments count in the post
    const newCount = (post.comments_count || 0) + testComments.length;
    console.log('Updating comments count to:', newCount);
    
    const { error: updateError } = await supabase
      .from('posts')
      .update({ comments_count: newCount })
      .eq('id', post.id);
      
    if (updateError) {
      console.error('Error updating comments count:', updateError);
    } else {
      console.log('✅ Comments count updated successfully');
    }
    
    console.log('\n🎉 Added 5 test comments! Refresh your app to see them.');
    
  } catch (error) {
    console.error('Error adding test comments:', error);
  }
}

// Run the function
addTestComments();