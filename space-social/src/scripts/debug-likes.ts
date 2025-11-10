import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugLikes() {
  console.log('Debugging likes functionality...');
  
  try {
    const clerkUserId = 'user_33pD7rd2gXPTrJPqkFb7nnsUIzx';
    
    // Get a post to test with
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .limit(1)
      .maybeSingle();
      
    if (postError) {
      console.error('Error fetching post:', postError);
      return;
    }
    
    if (!post) {
      console.error('No posts found');
      return;
    }
    
    console.log('Using post:', { id: post.id, space_id: post.space_id });
    
    // Find a space that the user can act on behalf of
    let actingSpaceId = null;
    
    // First, check if user owns the post's space
    const { data: ownedSpace, error: ownedSpaceError } = await supabase
      .from('spaces')
      .select('id')
      .eq('id', post.space_id)
      .eq('owner_id', clerkUserId)
      .maybeSingle();
      
    console.log('Owned space check:', { data: ownedSpace, error: ownedSpaceError });
    
    if (ownedSpace) {
      actingSpaceId = ownedSpace.id;
    } else {
      // Check if user is subscribed to the post's space
      const { data: subscribedSpace, error: subscribedSpaceError } = await supabase
        .from('user_spaces')
        .select('space_id')
        .eq('clerk_id', clerkUserId)
        .eq('space_id', post.space_id)
        .maybeSingle();
        
      console.log('Subscribed space check:', { data: subscribedSpace, error: subscribedSpaceError });
        
      if (subscribedSpace) {
        actingSpaceId = subscribedSpace.space_id;
      } else {
        // User is neither owner nor subscriber - find any space they own
        const { data: anyOwnedSpace, error: anyOwnedSpaceError } = await supabase
          .from('spaces')
          .select('id')
          .eq('owner_id', clerkUserId)
          .limit(1)
          .maybeSingle();
          
        console.log('Any owned space check:', { data: anyOwnedSpace, error: anyOwnedSpaceError });
          
        if (anyOwnedSpace) {
          actingSpaceId = anyOwnedSpace.id;
        } else {
          // Find any space they're subscribed to
          const { data: anySubscribedSpace, error: anySubscribedSpaceError } = await supabase
            .from('user_spaces')
            .select('space_id')
            .eq('clerk_id', clerkUserId)
            .limit(1)
            .maybeSingle();
            
          console.log('Any subscribed space check:', { data: anySubscribedSpace, error: anySubscribedSpaceError });
            
          if (anySubscribedSpace) {
            actingSpaceId = anySubscribedSpace.space_id;
          }
        }
      }
    }
    
    console.log('Acting space ID:', actingSpaceId);
    
    if (!actingSpaceId) {
      console.error('User has no space to act on behalf of');
      return;
    }
    
    // Try to add a like
    const testReaction = {
      post_id: post.id,
      space_id: actingSpaceId,
      reaction_type: 'like'
    };
    
    console.log('Testing post reaction insert:', testReaction);
    
    const { data: reactionData, error: reactionError } = await supabase
      .from('post_reactions')
      .insert(testReaction)
      .select()
      .single();
      
    console.log('Post reaction result:', { data: reactionData, error: reactionError });
    
    // Clean up
    if (reactionData?.id) {
      await supabase
        .from('post_reactions')
        .delete()
        .eq('id', reactionData.id);
      console.log('Cleaned up test reaction');
    }
    
  } catch (error) {
    console.error('Error in debug likes:', error);
  }
}

// Run the debug
debugLikes();