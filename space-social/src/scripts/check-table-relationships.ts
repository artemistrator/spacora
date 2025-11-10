import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableRelationships() {
  console.log('Checking table relationships...');
  
  try {
    // Check spaces table
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('*')
      .limit(3);
      
    if (spacesError) {
      console.error('Error fetching spaces:', spacesError);
    } else {
      console.log('Spaces:', spaces);
    }
    
    // Check a specific space that we know exists
    const { data: specificSpace, error: specificSpaceError } = await supabase
      .from('spaces')
      .select('*')
      .eq('owner_id', 'user_33jxvpJJNsyAgXvDHwYql5YPDkD')
      .limit(1)
      .maybeSingle();
      
    if (specificSpaceError) {
      console.error('Error fetching specific space:', specificSpaceError);
    } else {
      console.log('Specific space:', specificSpace);
    }
    
    // Check user_spaces table to see how users are connected to spaces
    const { data: userSpaces, error: userSpacesError } = await supabase
      .from('user_spaces')
      .select('*')
      .limit(3);
      
    if (userSpacesError) {
      console.error('Error fetching user_spaces:', userSpacesError);
    } else {
      console.log('User spaces:', userSpaces);
    }
    
  } catch (error) {
    console.error('Error checking table relationships:', error);
  }
}

// Run the check
checkTableRelationships();