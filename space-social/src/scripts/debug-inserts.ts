import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugInserts() {
  console.log('Testing database inserts...');
  
  try {
    // Test inserting into post_reactions with valid UUIDs
    const testReaction = {
      post_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Valid post ID from our data
      space_id: 'user_33jxvpJJNsyAgXvDHwYql5YPDkD', // Valid user ID
      reaction_type: 'like'
    };
    
    console.log('Testing post_reactions insert with valid data:', testReaction);
    
    const { data: reactionData, error: reactionError } = await supabase
      .from('post_reactions')
      .insert(testReaction)
      .select()
      .single();
      
    console.log('Post reaction insert result:', { data: reactionData, error: reactionError });
    
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
      space_id: 'user_33jxvpJJNsyAgXvDHwYql5YPDkD', // Valid user ID
      post_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Valid post ID
      collection_name: 'default'
    };
    
    console.log('Testing favorites insert with valid data:', testFavorite);
    
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorites')
      .insert(testFavorite)
      .select()
      .single();
      
    console.log('Favorite insert result:', { data: favoriteData, error: favoriteError });
    
    // Clean up test record
    if (favoriteData?.id) {
      await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteData.id);
      console.log('Cleaned up test favorite');
    }
    
  } catch (error) {
    console.error('Error in debug inserts:', error);
  }
}

// Run the debug
debugInserts();