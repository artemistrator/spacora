import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanTest() {
  console.log('Clean test with deletion first...');
  
  try {
    // Get a valid user
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
            
          if (anySubscribedSpace) {
            actingSpaceId = anySubscribedSpace.space_id;
          }
        }
      }
    }
    
    if (!actingSpaceId) {
      console.error('User has no space to act on behalf of');
      return;
    }
    
    console.log('Using acting space ID:', actingSpaceId);
    
    // Clean up any existing records first
    console.log('Cleaning up existing records...');
    
    // Delete existing post reaction
    const { error: deleteReactionError } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', post.id)
      .eq('space_id', actingSpaceId)
      .eq('reaction_type', 'like');
      
    if (deleteReactionError) {
      console.error('Error deleting existing reaction:', deleteReactionError);
    } else {
      console.log('Existing reaction deleted');
    }
    
    // Delete existing favorite
    const { error: deleteFavoriteError } = await supabase
      .from('favorites')
      .delete()
      .eq('post_id', post.id)
      .eq('space_id', actingSpaceId);
      
    if (deleteFavoriteError) {
      console.error('Error deleting existing favorite:', deleteFavoriteError);
    } else {
      console.log('Existing favorite deleted');
    }
    
    // Now test inserting into post_reactions with valid space ID
    const testReaction = {
      post_id: post.id,
      space_id: actingSpaceId, // Valid space UUID
      reaction_type: 'like'
    };
    
    console.log('Testing post_reactions insert with valid data:', testReaction);
    
    const { data: reactionData, error: reactionError } = await supabase
      .from('post_reactions')
      .insert(testReaction)
      .select()
      .single();
      
    console.log('Post reaction insert result:', { success: !reactionError, data: reactionData, error: reactionError });
    
    // Clean up test record
    if (reactionData?.id) {
      await supabase
        .from('post_reactions')
        .delete()
        .eq('id', reactionData.id);
      console.log('Cleaned up test reaction');
    }
    
    // Test inserting into favorites with valid space ID
    const testFavorite = {
      space_id: actingSpaceId, // Valid space UUID
      post_id: post.id,
      collection_name: 'default'
    };
    
    console.log('Testing favorites insert with valid data:', testFavorite);
    
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorites')
      .insert(testFavorite)
      .select()
      .single();
      
    console.log('Favorite insert result:', { success: !favoriteError, data: favoriteData, error: favoriteError });
    
    // Clean up test record
    if (favoriteData?.id) {
      await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteData.id);
      console.log('Cleaned up test favorite');
    }
    
    console.log('All tests completed successfully!');
    
  } catch (error) {
    console.error('Error in clean test:', error);
  }
}

// Run the test
cleanTest();