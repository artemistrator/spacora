import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { getOrCreateSupabaseUserId } from '../lib/user-mapping';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFoldersTable() {
  console.log('Checking folders table structure and data...');
  
  try {
    // Check folders table structure
    console.log('\n1. Checking folders table structure...');
    const { data: foldersData, error: foldersError } = await supabase
      .from('folders')
      .select('*')
      .limit(3);
      
    if (foldersError) {
      console.error('Error fetching folders:', foldersError);
    } else {
      console.log('Folders sample:', foldersData);
      
      if (foldersData && foldersData.length > 0) {
        console.log('Folders table columns:');
        const columns = Object.keys(foldersData[0]);
        for (const column of columns) {
          console.log(`  ${column}: ${typeof foldersData[0][column]}`);
        }
      }
    }
    
    // Check folders table schema
    console.log('\n2. Checking folders table schema...');
    const { data: foldersSchema, error: schemaError } = await supabase
      .from('folders')
      .select('*')
      .limit(1);
      
    if (schemaError) {
      console.error('Schema error:', schemaError);
    } else {
      console.log('Folders schema check completed');
    }
    
    // Check a specific folder if exists
    console.log('\n3. Checking specific folder...');
    const { data: specificFolder, error: specificFolderError } = await supabase
      .from('folders')
      .select('*')
      .limit(1)
      .maybeSingle();
      
    if (specificFolderError) {
      console.error('Error fetching specific folder:', specificFolderError);
    } else {
      console.log('Specific folder:', specificFolder);
    }
    
    // Check relationship with spaces
    console.log('\n4. Checking folder-space relationships...');
    const { data: folderWithSpace, error: relationshipError } = await supabase
      .from('folders')
      .select('*, spaces(name)')
      .limit(1)
      .maybeSingle();
      
    if (relationshipError) {
      console.error('Error checking folder-space relationship:', relationshipError);
    } else {
      console.log('Folder with space info:', folderWithSpace);
    }
    
    // Test folder creation with proper user ID format
    console.log('\n5. Testing folder creation with proper user ID...');
    // Using a known test user ID
    const testUserId = 'user_33jxvpJJNsyAgXvDHwYql5YPDkD';
    console.log('Test user ID:', testUserId);
    
    // Get Supabase user ID
    const supabaseUserId = await getOrCreateSupabaseUserId(testUserId);
    console.log('Supabase user ID:', supabaseUserId);
    
    // Find a space owned by this user
    const { data: userSpace, error: spaceError } = await supabase
      .from('spaces')
      .select('id, owner_id')
      .eq('owner_id', testUserId)
      .limit(1)
      .maybeSingle();
      
    if (spaceError) {
      console.error('Error finding user space:', spaceError);
    } else if (userSpace) {
      console.log('Found user space:', userSpace);
      
      // Test folder creation data
      const folderData = {
        name: 'Test Folder',
        description: 'Test folder for debugging',
        space_id: userSpace.id
      };
      
      console.log('Folder data to insert:', folderData);
      
      // Check space owner
      const { data: spaceOwner, error: ownerError } = await supabase
        .from('spaces')
        .select('owner_id')
        .eq('id', userSpace.id)
        .maybeSingle();
        
      if (ownerError) {
        console.error('Error checking space owner:', ownerError);
      } else {
        console.log('Space owner:', spaceOwner);
        console.log('Space owner matches user ID:', spaceOwner?.owner_id === testUserId);
        console.log('Space owner matches Supabase ID:', spaceOwner?.owner_id === supabaseUserId);
      }
    } else {
      console.log('No space found for test user');
    }
    
    console.log('\nFolders table check completed');
  } catch (error) {
    console.error('Error checking folders table:', error);
  }
}

// Run the check
checkFoldersTable();