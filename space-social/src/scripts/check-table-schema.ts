import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableSchema() {
  console.log('Checking table schema for post_reactions and favorites...');
  
  try {
    // Check existing post_reactions data
    const { data: reactions, error: reactionsError } = await supabase
      .from('post_reactions')
      .select('*')
      .limit(3);
      
    if (reactionsError) {
      console.error('Error fetching post_reactions:', reactionsError);
    } else {
      console.log('Post reactions sample:', reactions);
      
      if (reactions && reactions.length > 0) {
        console.log('Post reaction space_id values:', reactions.map(r => r.space_id));
      }
    }
    
    // Check existing favorites data
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select('*')
      .limit(3);
      
    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError);
    } else {
      console.log('Favorites sample:', favorites);
      
      if (favorites && favorites.length > 0) {
        console.log('Favorites space_id values:', favorites.map(f => f.space_id));
      }
    }
    
  } catch (error) {
    console.error('Error checking table schema:', error);
  }
}

// Run the check
checkTableSchema();