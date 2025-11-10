import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserIdentities() {
  console.log('Checking user identities table...');
  
  try {
    // Fetch user identities
    const { data, error } = await supabase
      .from('user_identities')
      .select('*')
      .limit(5);
      
    if (error) {
      console.error('Error fetching user identities:', error);
      return;
    }
    
    console.log('User identities:', data);
    
    // Show the structure
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('User identities table columns:', columns);
      
      for (const column of columns) {
        console.log(`Column: ${column}, Value: ${data[0][column]}, Type: ${typeof data[0][column]}`);
      }
    }
  } catch (error) {
    console.error('Error checking user identities:', error);
  }
}

// Run the check
checkUserIdentities();