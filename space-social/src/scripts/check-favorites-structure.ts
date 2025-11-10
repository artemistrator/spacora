import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFavoritesStructure() {
  console.log('Checking favorites table structure...');
  
  try {
    // Get table info
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error fetching favorites:', error);
      return;
    }
    
    console.log('Favorites table sample record:', data[0]);
    
    // Show all column names
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('Favorites table columns:', columns);
      
      // Show the structure of each column
      for (const column of columns) {
        console.log(`Column: ${column}, Value: ${data[0][column]}, Type: ${typeof data[0][column]}`);
      }
    }
  } catch (error) {
    console.error('Error checking favorites structure:', error);
  }
}

// Run the check
checkFavoritesStructure();