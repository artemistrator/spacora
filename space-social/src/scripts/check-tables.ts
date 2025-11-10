import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('Checking database tables...');
  
  try {
    // Check if spaces table exists
    const { data: spacesData, error: spacesError } = await supabase
      .from('spaces')
      .select('*')
      .limit(1);
      
    console.log('Spaces table check:', { 
      success: !spacesError, 
      error: spacesError,
      data: spacesData 
    });
    
    // Check if posts table exists
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
      
    console.log('Posts table check:', { 
      success: !postsError, 
      error: postsError,
      data: postsData 
    });
    
    // Check if favorites table exists
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('favorites')
      .select('*')
      .limit(1);
      
    console.log('Favorites table check:', { 
      success: !favoritesError, 
      error: favoritesError,
      data: favoritesData 
    });
    
    // Check if post_reactions table exists
    const { data: reactionsData, error: reactionsError } = await supabase
      .from('post_reactions')
      .select('*')
      .limit(1);
      
    console.log('Post reactions table check:', { 
      success: !reactionsError, 
      error: reactionsError,
      data: reactionsData 
    });
    
    // Check if user_spaces table exists
    const { data: userSpacesData, error: userSpacesError } = await supabase
      .from('user_spaces')
      .select('*')
      .limit(1);
      
    console.log('User spaces table check:', { 
      success: !userSpacesError, 
      error: userSpacesError,
      data: userSpacesData 
    });
    
    console.log('Table check completed');
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

// Run the check
checkTables();