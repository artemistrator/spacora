import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { getOrCreateSupabaseUserId } from '../lib/user-mapping';
import { createFolder } from '../lib/folder-utils';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFolderCreation() {
  console.log('Testing folder creation...');
  
  try {
    // Using a known test user ID
    const testUserId = 'user_33jxvpJJNsyAgXvDHwYql5YPDkD';
    console.log('Test user ID:', testUserId);
    
    // Get Supabase user ID
    const supabaseUserId = await getOrCreateSupabaseUserId(testUserId);
    console.log('Supabase user ID:', supabaseUserId);
    
    // Find a space owned by this user
    console.log('\nFinding space owned by user...');
    const { data: userSpaces, error: spacesError } = await supabase
      .from('spaces')
      .select('id, owner_id')
      .eq('owner_id', testUserId)
      .limit(1);
      
    if (spacesError) {
      console.error('Error finding user spaces:', spacesError);
      return;
    }
    
    if (!userSpaces || userSpaces.length === 0) {
      console.log('No spaces found for test user');
      return;
    }
    
    const userSpace = userSpaces[0];
    console.log('Found user space:', userSpace);
    
    // Test folder creation data
    const folderData = {
      name: 'Test Debug Folder',
      description: 'Test folder created for debugging purposes',
      space_id: userSpace.id,
      color: '#3b82f6',
      icon: 'Folder'
    };
    
    console.log('\nFolder data to insert:', folderData);
    
    // Test folder creation with proper user ID
    console.log('\nTesting folder creation with Clerk ID...');
    const result1 = await createFolder(folderData, testUserId, supabase);
    console.log('Creation result with Clerk ID:', result1);
    
    // Test folder creation with Supabase ID
    if (supabaseUserId) {
      console.log('\nTesting folder creation with Supabase ID...');
      const result2 = await createFolder(folderData, supabaseUserId, supabase);
      console.log('Creation result with Supabase ID:', result2);
    }
    
    console.log('\nFolder creation test completed');
  } catch (error) {
    console.error('Error in folder creation test:', error);
  }
}

// Run the test
testFolderCreation();