import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFoldersRLS() {
  console.log('Checking folders table RLS policies...');
  
  try {
    // Check if RLS is enabled on folders table
    const { data: rlsInfo, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('table_name, is_insertable_into')
      .eq('table_name', 'folders');
      
    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);
    } else {
      console.log('RLS info for folders table:', rlsInfo);
    }
    
    // Check policies on folders table
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .ilike('tablename', 'folders');
      
    if (policiesError) {
      console.error('Error getting policies:', policiesError);
    } else {
      console.log('\nFolders table policies:');
      console.log(policies);
    }
    
    // Try a simple insert to test permissions
    console.log('\nTesting folder creation permissions...');
    const testData = {
      name: 'Test Folder RLS',
      space_id: 'test-space-id',
      description: 'Test for RLS permissions'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('folders')
      .insert(testData)
      .select()
      .maybeSingle();
      
    if (insertError) {
      console.log('Insert test result (expected to fail):', insertError.message);
    } else {
      console.log('Insert test result (unexpected success):', insertData);
      
      // Clean up if insert succeeded
      if (insertData && insertData.id) {
        await supabase
          .from('folders')
          .delete()
          .eq('id', insertData.id);
        console.log('Cleaned up test folder');
      }
    }
    
    console.log('\nRLS check completed');
  } catch (error) {
    console.error('Error in RLS check:', error);
  }
}

// Run the check
checkFoldersRLS();