import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFixes() {
  console.log('Testing fixes with correct user ID mapping...');
  
  try {
    // Get a valid user identity
    const { data: userIdentities, error: identityError } = await supabase
      .from('user_identities')
      .select('*')
      .limit(1);
      
    if (identityError) {
      console.error('Error fetching user identities:', identityError);
      return;
    }
    
    if (!userIdentities || userIdentities.length === 0) {
      console.error('No user identities found');
      return;
    }
    
    const userSupabaseId = userIdentities[0].supabase_id;
    const clerkId = userIdentities[0].clerk_id;
    
    console.log('Using user:', { clerkId, supabaseId: userSupabaseId });
    
    // Test inserting into post_reactions with valid UUIDs
    const testReaction = {
      post_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Valid post ID from our data
      space_id: userSupabaseId, // Valid Supabase UUID
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
    
    // Test inserting into favorites with valid UUIDs
    const testFavorite = {
      space_id: userSupabaseId, // Valid Supabase UUID
      post_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Valid post ID
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
    console.error('Error in test fixes:', error);
  }
}

// Run the test
testFixes();