const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

/**
 * Migration script to update spaces with old Clerk ID format to use Supabase UUID format
 * This script will:
 * 1. Find all spaces with owner_id in the old Clerk ID format (user_xxx...)
 * 2. For each such space, find or create a mapping in user_identities table
 * 3. Update the space's owner_id to use the Supabase UUID
 */

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create a Supabase client for the migration
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateSpaceOwners() {
  console.log('Starting space owner migration...');
  
  try {
    // Find all spaces with old Clerk ID format (starting with 'user_')
    const { data: oldFormatSpaces, error: fetchError } = await supabase
      .from('spaces')
      .select('*')
      .like('owner_id', 'user_%');
    
    if (fetchError) {
      console.error('Error fetching spaces with old format:', fetchError);
      return;
    }
    
    console.log(`Found ${oldFormatSpaces?.length || 0} spaces with old Clerk ID format`);
    
    if (!oldFormatSpaces || oldFormatSpaces.length === 0) {
      console.log('No spaces with old format found. Migration complete.');
      return;
    }
    
    let migratedCount = 0;
    
    // Process each space
    for (const space of oldFormatSpaces) {
      const oldOwnerId = space.owner_id;
      console.log(`Processing space ${space.id} with owner ${oldOwnerId}`);
      
      try {
        // Check if mapping already exists
        let { data: existingMapping, error: selectError } = await supabase
          .from('user_identities')
          .select('supabase_id')
          .eq('clerk_id', oldOwnerId)
          .maybeSingle();
        
        let supabaseUserId;
        
        if (selectError) {
          console.error(`Error checking mapping for ${oldOwnerId}:`, selectError);
          continue;
        }
        
        if (existingMapping) {
          // Use existing mapping
          supabaseUserId = existingMapping.supabase_id;
          console.log(`  Using existing mapping: ${supabaseUserId}`);
        } else {
          // Create new mapping
          supabaseUserId = require('crypto').randomUUID();
          const { error: insertError } = await supabase
            .from('user_identities')
            .insert({
              clerk_id: oldOwnerId,
              supabase_id: supabaseUserId
            });
          
          if (insertError) {
            console.error(`Error creating mapping for ${oldOwnerId}:`, insertError);
            continue;
          }
          
          console.log(`  Created new mapping: ${supabaseUserId}`);
        }
        
        // Update the space owner_id
        const { error: updateError } = await supabase
          .from('spaces')
          .update({ owner_id: supabaseUserId })
          .eq('id', space.id);
        
        if (updateError) {
          console.error(`Error updating space ${space.id}:`, updateError);
          continue;
        }
        
        console.log(`  Successfully updated space ${space.id} owner from ${oldOwnerId} to ${supabaseUserId}`);
        migratedCount++;
      } catch (error) {
        console.error(`Error processing space ${space.id}:`, error);
      }
    }
    
    console.log(`Migration complete. Successfully migrated ${migratedCount} spaces.`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateSpaceOwners().then(() => {
    console.log('Migration script finished');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = migrateSpaceOwners;