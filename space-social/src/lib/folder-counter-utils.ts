import { supabase } from '@/lib/supabase'

export async function updateFolderPostsCount(
  folderId: string,
  supabaseClient: any = supabase
): Promise<boolean> {
  try {
    const { data: posts, error: countError } = await supabaseClient
      .from('posts')
      .select('id')
      .eq('folder_id', folderId)

    if (countError) {
      return false
    }

    const postsCount = posts?.length || 0

    const { error: updateError } = await supabaseClient
      .from('folders')
      .update({ 
        posts_count: postsCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', folderId)

    return !updateError
  } catch (error) {
    return false
  }
}
