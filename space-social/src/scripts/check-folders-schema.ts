import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFoldersSchema() {
  console.log('Checking folders table schema...');
  
  try {
    // Check if folders table exists by querying its structure
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error accessing folders table:', error);
      return;
    }
    
    console.log('Folders table exists and is accessible');
    
    // Try to get table info from information_schema
    const { data: tableInfo, error: tableInfoError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'folders')
      .order('ordinal_position');
      
    if (tableInfoError) {
      console.error('Error getting table schema info:', tableInfoError);
    } else {
      console.log('\nFolders table schema:');
      tableInfo.forEach((column: any) => {
        console.log(`  ${column.column_name}: ${column.data_type} (${column.is_nullable})`);
      });
    }
    
    // Check a few sample records if they exist
    const { data: sampleData, error: sampleError } = await supabase
      .from('folders')
      .select('*')
      .limit(3);
      
    if (sampleError) {
      console.error('Error getting sample data:', sampleError);
    } else {
      console.log('\nSample folders data:');
      console.log(sampleData);
    }
    
    console.log('\nSchema check completed');
  } catch (error) {
    console.error('Error in schema check:', error);
  }
}

// Run the check
checkFoldersSchema();