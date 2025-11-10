import { supabase } from '@/lib/supabase'
import { executeSupabaseQuery } from '@/lib/request-manager'

export interface Folder {
  id: string
  name: string
  description?: string
  space_id: string
  posts_count: number
  created_at: string
  updated_at: string
  color?: string
  icon?: string
}

/**
 * Create a new folder
 * @param folderData The folder data
 * @param userId The user ID (for permission checking)
 * @param supabaseClient Optional Supabase client
 * @returns The created folder or null if failed
 */
export async function createFolder(
  folderData: Omit<Folder, 'id' | 'posts_count' | 'created_at' | 'updated_at'>, 
  userId: string,
  supabaseClient: any = supabase
): Promise<Folder | null> {
  try {
    console.log('=== CREATE FOLDER DEBUG INFO ===');
    console.log('Input folderData:', folderData);
    console.log('Input userId:', userId);
    console.log('Supabase client type:', typeof supabaseClient);
    console.log('Supabase client keys:', Object.keys(supabaseClient || {}));
    
    // First check if user has permission to create folder in this space
    console.log('Checking space ownership for space_id:', folderData.space_id);
    const { data: spaceData, error: spaceError } = await supabaseClient
      .from('spaces')
      .select('owner_id')
      .eq('id', folderData.space_id)
      .maybeSingle();
    
    console.log('Space data result:', { spaceData, spaceError });
    
    if (spaceError) {
      console.error('Error checking space ownership:', spaceError);
      return null;
    }
    
    if (!spaceData) {
      console.error('Space not found:', folderData.space_id);
      return null;
    }
    
    console.log('Space owner ID:', spaceData.owner_id);
    
    // Check if user is the owner of the space
    // First check if there's a mapping in user_identities
    console.log('Checking user identity mapping for clerk_id:', userId);
    const { data: identityData, error: identityError } = await supabaseClient
      .from('user_identities')
      .select('supabase_id')
      .eq('clerk_id', userId)
      .maybeSingle();
    
    console.log('Identity data result:', { identityData, identityError });
    
    let userHasPermission = false;
    if (identityData) {
      // User has identity mapping, check with supabase_id
      console.log('Found identity mapping:', identityData);
      userHasPermission = identityData.supabase_id === spaceData.owner_id;
      console.log('Permission check with identity mapping:', {
        supabaseId: identityData.supabase_id,
        ownerId: spaceData.owner_id,
        match: identityData.supabase_id === spaceData.owner_id
      });
    } else {
      // No identity mapping, check directly with user_id
      console.log('No identity mapping found, checking directly');
      userHasPermission = userId === spaceData.owner_id;
      console.log('Permission check without identity mapping:', {
        userId: userId,
        ownerId: spaceData.owner_id,
        match: userId === spaceData.owner_id
      });
    }
    
    console.log('Final user has permission:', userHasPermission);
    
    if (!userHasPermission) {
      console.error('User does not have permission to create folder in this space');
      console.error('User ID:', userId);
      console.error('Space owner ID:', spaceData.owner_id);
      if (identityData) {
        console.error('User Supabase ID:', identityData.supabase_id);
      }
      return null;
    }
    
    console.log('User has permission, proceeding with folder creation');
    
    // Check if we can access the folders table at all
    console.log('Testing access to folders table');
    const { data: testFolders, error: testError } = await supabaseClient
      .from('folders')
      .select('id')
      .limit(1);
    
    console.log('Folders table access test:', { testFolders, testError });
    
    const data = await executeSupabaseQuery(async () => {
      console.log('Executing folder insert with data:', folderData);
      const { data, error } = await supabaseClient
        .from('folders')
        .insert(folderData)
        .select()
        .maybeSingle();
      
      console.log('Folder insert result:', { data, error });
      
      if (error) {
        console.error('Folder insert error:', error);
        throw error;
      }
      return data;
    }, 3000);

    console.log('Returning folder data:', data);
    return data as Folder;
  } catch (error: any) {
    console.error('=== UNEXPECTED ERROR IN CREATE FOLDER ===');
    console.error('Error object:', error);
    console.error('Error type:', typeof error);
    console.error('Error keys:', Object.keys(error || {}));
    
    // Log more detailed error information
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    if (error.hint) {
      console.error('Error hint:', error.hint);
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    return null;
  }
}

/**
 * Get all folders for a space
 * @param spaceId The space ID
 * @param supabaseClient Optional Supabase client
 * @returns Array of folders or empty array if failed
 */
export async function getFoldersBySpaceId(spaceId: string, supabaseClient: any = supabase): Promise<Folder[]> {
  console.log('getFoldersBySpaceId called with spaceId:', spaceId);
  try {
    console.log('Executing folders query for spaceId:', spaceId);
    const data = await executeSupabaseQuery(async () => {
      const { data, error } = await supabaseClient
        .from('folders')
        .select('*')
        .eq('space_id', spaceId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    }, 3000);
    
    console.log('Folders query result:', data);
    console.log('Returning folders data:', data);
    return data as Folder[];
  } catch (error: any) {
    console.error('Unexpected error fetching folders:', error);
    // Log more detailed error information
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    if (error.hint) {
      console.error('Error hint:', error.hint);
    }
    return [];
  }
}

/**
 * Update a folder
 * @param folderId The folder ID
 * @param updates The updates to apply
 * @param userId The user ID (for permission checking)
 * @param supabaseClient Optional Supabase client
 * @returns The updated folder or null if failed
 */
export async function updateFolder(
  folderId: string, 
  updates: Partial<Omit<Folder, 'id' | 'space_id' | 'posts_count' | 'created_at' | 'updated_at'>>, 
  userId: string,
  supabaseClient: any = supabase
): Promise<Folder | null> {
  try {
    console.log('Updating folder:', folderId);
    console.log('User ID:', userId);
    
    // First check if user has permission to update this folder
    const { data: folderData, error: folderError } = await supabaseClient
      .from('folders')
      .select('space_id')
      .eq('id', folderId)
      .maybeSingle();
    
    if (folderError) {
      console.error('Error fetching folder:', folderError);
      return null;
    }
    
    if (!folderData) {
      console.error('Folder not found:', folderId);
      return null;
    }
    
    // Check if user has permission to update folder in this space
    const { data: spaceData, error: spaceError } = await supabaseClient
      .from('spaces')
      .select('owner_id')
      .eq('id', folderData.space_id)
      .maybeSingle();
    
    if (spaceError) {
      console.error('Error checking space ownership:', spaceError);
      return null;
    }
    
    if (!spaceData) {
      console.error('Space not found:', folderData.space_id);
      return null;
    }
    
    console.log('Space owner ID:', spaceData.owner_id);
    
    // Check if user is the owner of the space
    // First check if there's a mapping in user_identities
    const { data: identityData, error: identityError } = await supabaseClient
      .from('user_identities')
      .select('supabase_id')
      .eq('clerk_id', userId)
      .maybeSingle();
    
    let userHasPermission = false;
    if (identityData) {
      // User has identity mapping, check with supabase_id
      console.log('Found identity mapping:', identityData);
      userHasPermission = identityData.supabase_id === spaceData.owner_id;
    } else {
      // No identity mapping, check directly with user_id
      console.log('No identity mapping found, checking directly');
      userHasPermission = userId === spaceData.owner_id;
    }
    
    console.log('User has permission:', userHasPermission);
    
    if (!userHasPermission) {
      console.error('User does not have permission to update folder in this space');
      console.error('User ID:', userId);
      console.error('Space owner ID:', spaceData.owner_id);
      if (identityData) {
        console.error('User Supabase ID:', identityData.supabase_id);
      }
      return null;
    }
    
    const data = await executeSupabaseQuery(async () => {
      const { data, error } = await supabaseClient
        .from('folders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', folderId)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }, 3000);

    return data as Folder;
  } catch (error: any) {
    console.error('Unexpected error updating folder:', error);
    // Log more detailed error information
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    if (error.hint) {
      console.error('Error hint:', error.hint);
    }
    return null;
  }
}

/**
 * Delete a folder
 * @param folderId The folder ID
 * @param userId The user ID (for permission checking)
 * @param supabaseClient Optional Supabase client
 * @returns True if successful, false otherwise
 */
export async function deleteFolder(
  folderId: string, 
  userId: string,
  supabaseClient: any = supabase
): Promise<boolean> {
  try {
    console.log('Deleting folder:', folderId);
    console.log('User ID:', userId);
    
    // First check if user has permission to delete this folder
    const { data: folderData, error: folderError } = await supabaseClient
      .from('folders')
      .select('space_id')
      .eq('id', folderId)
      .maybeSingle();
    
    if (folderError) {
      console.error('Error fetching folder:', folderError);
      return false;
    }
    
    if (!folderData) {
      console.error('Folder not found:', folderId);
      return false;
    }
    
    // Check if user has permission to delete folder in this space
    const { data: spaceData, error: spaceError } = await supabaseClient
      .from('spaces')
      .select('owner_id')
      .eq('id', folderData.space_id)
      .maybeSingle();
    
    if (spaceError) {
      console.error('Error checking space ownership:', spaceError);
      return false;
    }
    
    if (!spaceData) {
      console.error('Space not found:', folderData.space_id);
      return false;
    }
    
    console.log('Space owner ID:', spaceData.owner_id);
    
    // Check if user is the owner of the space
    // First check if there's a mapping in user_identities
    const { data: identityData, error: identityError } = await supabaseClient
      .from('user_identities')
      .select('supabase_id')
      .eq('clerk_id', userId)
      .maybeSingle();
    
    let userHasPermission = false;
    if (identityData) {
      // User has identity mapping, check with supabase_id
      console.log('Found identity mapping:', identityData);
      userHasPermission = identityData.supabase_id === spaceData.owner_id;
    } else {
      // No identity mapping, check directly with user_id
      console.log('No identity mapping found, checking directly');
      userHasPermission = userId === spaceData.owner_id;
    }
    
    console.log('User has permission:', userHasPermission);
    
    if (!userHasPermission) {
      console.error('User does not have permission to delete folder in this space');
      console.error('User ID:', userId);
      console.error('Space owner ID:', spaceData.owner_id);
      if (identityData) {
        console.error('User Supabase ID:', identityData.supabase_id);
      }
      return false;
    }
    
    await executeSupabaseQuery(async () => {
      const { error } = await supabaseClient
        .from('folders')
        .delete()
        .eq('id', folderId);
      
      if (error) throw error;
      return true;
    }, 3000);

    return true;
  } catch (error: any) {
    console.error('Unexpected error deleting folder:', error);
    // Log more detailed error information
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    if (error.hint) {
      console.error('Error hint:', error.hint);
    }
    return false;
  }
}