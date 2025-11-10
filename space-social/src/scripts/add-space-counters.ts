// Script to add likes_count and favorites_count columns to spaces table
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addSpaceCounters() {
  console.log('Adding likes_count and favorites_count columns to spaces table...');
  
  try {
    // Add likes_count and favorites_count columns
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE spaces 
        ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0;
      `
    });
    
    if (alterError) {
      console.error('Error adding columns:', alterError);
    } else {
      console.log('Columns added successfully');
    }
    
    // Update existing spaces with default values
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE spaces 
        SET likes_count = 0 
        WHERE likes_count IS NULL;

        UPDATE spaces 
        SET favorites_count = 0 
        WHERE favorites_count IS NULL;
      `
    });
    
    if (updateError) {
      console.error('Error updating existing spaces:', updateError);
    } else {
      console.log('Existing spaces updated successfully');
    }
    
    console.log('Space counters migration completed');
  } catch (error) {
    console.error('Space counters migration error:', error);
  }
}

// Run the migration
addSpaceCounters();