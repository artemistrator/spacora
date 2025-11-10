import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllTables() {
  console.log('Checking all tables in the database...');
  
  try {
    // Query information schema to get all table names
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (error) {
      console.error('Error fetching table list:', error);
    } else {
      console.log('Tables in the database:');
      data.forEach((table: any) => {
        console.log(`- ${table.table_name}`);
      });
    }
    
    // Specifically check for post_comments table
    console.log('\nChecking specifically for post_comments table...');
    const { data: commentsData, error: commentsError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'post_comments');
      
    if (commentsError) {
      console.error('Error checking for post_comments table:', commentsError);
    } else if (commentsData && commentsData.length > 0) {
      console.log('post_comments table exists!');
      
      // Check the structure of post_comments table
      const { data: columnsData, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'public')
        .eq('table_name', 'post_comments')
        .order('ordinal_position');
        
      if (columnsError) {
        console.error('Error fetching post_comments columns:', columnsError);
      } else {
        console.log('post_comments table structure:');
        columnsData.forEach((column: any) => {
          console.log(`  - ${column.column_name} (${column.data_type})`);
        });
      }
    } else {
      console.log('post_comments table does not exist!');
    }
    
    // Check posts table structure for comments_count column
    console.log('\nChecking posts table structure...');
    const { data: postsColumns, error: postsColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'posts')
      .order('ordinal_position');
      
    if (postsColumnsError) {
      console.error('Error fetching posts columns:', postsColumnsError);
    } else {
      console.log('posts table structure:');
      postsColumns.forEach((column: any) => {
        console.log(`  - ${column.column_name} (${column.data_type})`);
      });
      
      // Check specifically for comments_count
      const hasCommentsCount = postsColumns.some((col: any) => col.column_name === 'comments_count');
      if (hasCommentsCount) {
        console.log('✓ comments_count column exists in posts table');
      } else {
        console.log('✗ comments_count column does not exist in posts table');
      }
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

// Run the function
checkAllTables();