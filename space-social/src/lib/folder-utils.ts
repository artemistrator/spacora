import { supabase } from '@/lib/supabase'

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

export interface FolderStats {
  folderId: string
  postsCount: number
  likesCount: number
  favoritesCount: number
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
    const { data: spaceData, error: spaceError } = await supabaseClient
      .from('spaces')
      .select('owner_id')
      .eq('id', folderData.space_id)
      .maybeSingle();
    
    if (spaceError || !spaceData) {
      return null;
    }
    
    if (userId !== spaceData.owner_id) {
      return null;
    }
    
    const { data, error } = await supabaseClient
      .from('folders')
      .insert(folderData)
      .select()
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    return data as Folder;
  } catch (error: any) {
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
  try {
    const { data, error } = await supabaseClient
      .from('folders')
      .select('*')
      .eq('space_id', spaceId)
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    // Calculate posts_count for each folder
    const foldersWithCounts = await Promise.all(
      (data || []).map(async (folder: Folder) => {
        const { data: posts, error: postsError } = await supabaseClient
          .from('posts')
          .select('id')
          .eq('folder_id', folder.id);
        
        return {
          ...folder,
          posts_count: postsError ? 0 : (posts?.length || 0)
        };
      })
    );
    
    return foldersWithCounts as Folder[];
  } catch (error: any) {
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
    const { data: folderData, error: folderError } = await supabaseClient
      .from('folders')
      .select('space_id')
      .eq('id', folderId)
      .maybeSingle();
    
    if (folderError || !folderData) {
      return null;
    }
    
    const { data: spaceData, error: spaceError } = await supabaseClient
      .from('spaces')
      .select('owner_id')
      .eq('id', folderData.space_id)
      .maybeSingle();
    
    if (spaceError || !spaceData) {
      return null;
    }
    
    if (userId !== spaceData.owner_id) {
      return null;
    }
    
    const { data, error } = await supabaseClient
      .from('folders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', folderId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as Folder;
  } catch (error: any) {
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
    const { data: folderData, error: folderError } = await supabaseClient
      .from('folders')
      .select('space_id')
      .eq('id', folderId)
      .maybeSingle();
    
    if (folderError || !folderData) {
      return false;
    }
    
    const { data: spaceData, error: spaceError } = await supabaseClient
      .from('spaces')
      .select('owner_id')
      .eq('id', folderData.space_id)
      .maybeSingle();
    
    if (spaceError || !spaceData) {
      return false;
    }
    
    if (userId !== spaceData.owner_id) {
      return false;
    }
    
    // Move all posts from this folder to no folder (folder_id = null)
    const { error: updateError } = await supabaseClient
      .from('posts')
      .update({ folder_id: null })
      .eq('folder_id', folderId);
    
    if (updateError) throw updateError;
    
    // Now delete the folder
    const { error } = await supabaseClient
      .from('folders')
      .delete()
      .eq('id', folderId);
    
    if (error) throw error;
    return true;
  } catch (error: any) {
    return false;
  }
}

/**
 * Get statistics for a folder (likes and favorites count from all posts in folder)
 * @param folderId The folder ID
 * @param supabaseClient Optional Supabase client
 * @returns Folder statistics or null if failed
 */
export async function getFolderStats(
  folderId: string,
  supabaseClient: any = supabase
): Promise<FolderStats | null> {
  try {
    const { data: posts, error: postsError } = await supabaseClient
      .from('posts')
      .select('id, likes_count, favorites_count')
      .eq('folder_id', folderId);
    
    if (postsError) throw postsError;
    
    const stats: FolderStats = {
      folderId,
      postsCount: posts?.length || 0,
      likesCount: (posts || []).reduce((sum: number, post: any) => sum + (post.likes_count || 0), 0),
      favoritesCount: (posts || []).reduce((sum: number, post: any) => sum + (post.favorites_count || 0), 0),
    };
    
    return stats;
  } catch (error: any) {
    return null;
  }
}