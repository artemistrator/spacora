import { supabase } from '@/lib/supabase'
import { getOrCreateSupabaseUserId } from '@/lib/user-mapping'

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
    console.log('Creating folder with data:', folderData);
    console.log('User ID:', userId);
    
    // Получаем правильный UUID для пользователя
    const supabaseUserId = await getOrCreateSupabaseUserId(userId);
    console.log('Supabase user ID:', supabaseUserId);
    
    const { data: spaceData, error: spaceError } = await supabaseClient
      .from('spaces')
      .select('owner_id')
      .eq('id', folderData.space_id)
      .maybeSingle();
    
    if (spaceError || !spaceData) {
      console.error('Space error or not found:', spaceError);
      return null;
    }
    
    console.log('Space owner ID:', spaceData.owner_id);
    console.log('User ID match:', spaceData.owner_id === userId);
    console.log('Supabase user ID match:', spaceData.owner_id === supabaseUserId);
    
    // Проверяем права владельца с учетом обоих форматов ID
    if (spaceData.owner_id !== userId && spaceData.owner_id !== supabaseUserId) {
      console.error('User is not the owner of this space');
      return null;
    }
    
    const { data, error } = await supabaseClient
      .from('folders')
      .insert(folderData)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
    
    console.log('Folder created successfully:', data);
    return data as Folder;
  } catch (error: any) {
    console.error('Unexpected error in folder creation:', error);
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
  updates: Partial<Omit<Folder, 'id' | 'posts_count' | 'created_at' | 'updated_at'>>, 
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
    
    // Получаем правильный UUID для пользователя
    const supabaseUserId = await getOrCreateSupabaseUserId(userId);
    
    // Проверяем права владельца с учетом обоих форматов ID
    if (spaceData.owner_id !== userId && spaceData.owner_id !== supabaseUserId) {
      return null;
    }
    
    const { data, error } = await supabaseClient
      .from('folders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', folderId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    
    return data;
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
    
    // Получаем правильный UUID для пользователя
    const supabaseUserId = await getOrCreateSupabaseUserId(userId);
    
    // Проверяем права владельца с учетом обоих форматов ID
    if (spaceData.owner_id !== userId && spaceData.owner_id !== supabaseUserId) {
      return false;
    }
    
    const { error } = await supabaseClient
      .from('folders')
      .delete()
      .eq('id', folderId);
    
    if (error) return false;
    
    return true;
  } catch (error: any) {
    return false;
  }
}

/**
 * Get folder statistics
 * @param folderId The folder ID
 * @param supabaseClient Optional Supabase client
 * @returns FolderStats or null if failed
 */
export async function getFolderStats(folderId: string, supabaseClient: any = supabase): Promise<FolderStats | null> {
  try {
    // Get posts count
    const { count: postsCount, error: postsError } = await supabaseClient
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('folder_id', folderId);
    
    if (postsError) throw postsError;
    
    // Get likes count
    const { data: postsData, error: likesError } = await supabaseClient
      .from('posts')
      .select('likes_count')
      .eq('folder_id', folderId);
    
    if (likesError) throw likesError;
    
    const likesCount = postsData.reduce((sum: number, post: any) => sum + (post.likes_count || 0), 0);
    
    // Get favorites count
    const { data: favoritesData, error: favoritesError } = await supabaseClient
      .from('posts')
      .select('favorites_count')
      .eq('folder_id', folderId);
    
    if (favoritesError) throw favoritesError;
    
    const favoritesCount = favoritesData.reduce((sum: number, post: any) => sum + (post.favorites_count || 0), 0);
    
    return {
      folderId,
      postsCount: postsCount || 0,
      likesCount,
      favoritesCount
    };
  } catch (error: any) {
    return null;
  }
}