import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserSpaceRelationship() {
  console.log('Checking user-space relationship...');
  
  try {
    // Check which spaces a specific user is subscribed to
    const clerkUserId = 'user_33pD7rd2gXPTrJPqkFb7nnsUIzx';
    
    const { data: userSpaces, error: userSpacesError } = await supabase
      .from('user_spaces')
      .select('space_id')
      .eq('clerk_id', clerkUserId);
      
    if (userSpacesError) {
      console.error('Error fetching user spaces:', userSpacesError);
    } else {
      console.log('User spaces for', clerkUserId, ':', userSpaces);
      
      if (userSpaces && userSpaces.length > 0) {
        // Check if the space_id in reactions matches any of these spaces
        const spaceIds = userSpaces.map(us => us.space_id);
        console.log('Space IDs user is subscribed to:', spaceIds);
        
        // Check existing reactions
        const { data: reactions, error: reactionsError } = await supabase
          .from('post_reactions')
          .select('*')
          .in('space_id', spaceIds)
          .limit(3);
          
        if (reactionsError) {
          console.error('Error fetching reactions:', reactionsError);
        } else {
          console.log('Reactions for user spaces:', reactions);
        }
      }
    }
    
    // Check the user's own spaces (where they are the owner)
    const { data: ownedSpaces, error: ownedSpacesError } = await supabase
      .from('spaces')
      .select('id')
      .eq('owner_id', clerkUserId);
      
    if (ownedSpacesError) {
      console.error('Error fetching owned spaces:', ownedSpacesError);
    } else {
      console.log('Spaces owned by', clerkUserId, ':', ownedSpaces);
      
      if (ownedSpaces && ownedSpaces.length > 0) {
        const ownedSpaceIds = ownedSpaces.map(s => s.id);
        console.log('Owned space IDs:', ownedSpaceIds);
        
        // Check existing reactions for owned spaces
        const { data: reactions, error: reactionsError } = await supabase
          .from('post_reactions')
          .select('*')
          .in('space_id', ownedSpaceIds)
          .limit(3);
          
        if (reactionsError) {
          console.error('Error fetching reactions for owned spaces:', reactionsError);
        } else {
          console.log('Reactions for owned spaces:', reactions);
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking user-space relationship:', error);
  }
}

// Run the check
checkUserSpaceRelationship();