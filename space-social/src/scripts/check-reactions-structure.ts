import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkReactionsStructure() {
  console.log('Checking post_reactions table structure...');
  
  try {
    // Get table info
    const { data, error } = await supabase
      .from('post_reactions')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error fetching post_reactions:', error);
      return;
    }
    
    console.log('Post reactions table sample record:', data[0]);
    
    // Show all column names
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('Post reactions table columns:', columns);
      
      // Show the structure of each column
      for (const column of columns) {
        console.log(`Column: ${column}, Value: ${data[0][column]}, Type: ${typeof data[0][column]}`);
      }
    }
  } catch (error) {
    console.error('Error checking post_reactions structure:', error);
  }
}

// Run the check
checkReactionsStructure();