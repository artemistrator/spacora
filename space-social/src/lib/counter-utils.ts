import { supabase } from '@/lib/supabase'

/**
 * Update the followers count for a space
 * @param spaceId The ID of the space
 * @param increment Whether to increment (true) or decrement (false) the count
 */
export async function updateSpaceFollowersCount(spaceId: string, increment: boolean): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('spaces')
      .select('followers_count')
      .eq('id', spaceId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    if (error) {
      console.error('Error fetching space followers count:', error);
      return false;
    }

    // If space doesn't exist, return true to avoid breaking the flow
    if (!data) {
      console.warn('Space not found for followers count update:', spaceId);
      return true;
    }

    const newCount = increment ? (data.followers_count || 0) + 1 : Math.max(0, (data.followers_count || 0) - 1);

    const { error: updateError } = await supabase
      .from('spaces')
      .update({ followers_count: newCount })
      .eq('id', spaceId);

    if (updateError) {
      console.error('Error updating space followers count:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating space followers count:', error);
    return false;
  }
}

/**
 * Update the posts count for a space
 * @param spaceId The ID of the space
 * @param increment Whether to increment (true) or decrement (false) the count
 */
export async function updateSpacePostsCount(spaceId: string, increment: boolean): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('spaces')
      .select('posts_count')
      .eq('id', spaceId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    if (error) {
      console.error('Error fetching space posts count:', error);
      return false;
    }

    // If space doesn't exist, return true to avoid breaking the flow
    if (!data) {
      console.warn('Space not found for posts count update:', spaceId);
      return true;
    }

    const newCount = increment ? (data.posts_count || 0) + 1 : Math.max(0, (data.posts_count || 0) - 1);

    const { error: updateError } = await supabase
      .from('spaces')
      .update({ posts_count: newCount })
      .eq('id', spaceId);

    if (updateError) {
      console.error('Error updating space posts count:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating space posts count:', error);
    return false;
  }
}

/**
 * Update the likes count for a space
 * @param spaceId The ID of the space
 * @param increment Whether to increment (true) or decrement (false) the count
 */
export async function updateSpaceLikesCount(spaceId: string, increment: boolean): Promise<boolean> {
  // This function is disabled because spaces table doesn't have likes_count column
  // Likes are tracked at the post level instead
  return true;
  
  /*
  try {
    const { data, error } = await supabase
      .from('spaces')
      .select('likes_count')
      .eq('id', spaceId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    if (error) {
      console.error('Error fetching space likes count:', error);
      return false;
    }

    // If space doesn't exist, return true to avoid breaking the flow
    if (!data) {
      console.warn('Space not found for likes count update:', spaceId);
      return true;
    }

    const newCount = increment ? (data.likes_count || 0) + 1 : Math.max(0, (data.likes_count || 0) - 1);

    const { error: updateError } = await supabase
      .from('spaces')
      .update({ likes_count: newCount })
      .eq('id', spaceId);

    if (updateError) {
      console.error('Error updating space likes count:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating space likes count:', error);
    return false;
  }
  */
}

/**
 * Update the favorites count for a space
 * @param spaceId The ID of the space
 * @param increment Whether to increment (true) or decrement (false) the count
 */
export async function updateSpaceFavoritesCount(spaceId: string, increment: boolean): Promise<boolean> {
  try {
    // First check if space exists
    const { data: spaceData, error: fetchError } = await supabase
      .from('spaces')
      .select('favorites_count')
      .eq('id', spaceId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    if (fetchError) {
      console.error('Error fetching space:', fetchError);
      console.error('Space ID that failed:', spaceId);
      return false;
    }

    // If space doesn't exist, return true to avoid breaking the flow
    if (!spaceData) {
      console.warn('Space not found for favorites count update:', spaceId);
      return true;
    }

    const newCount = increment ? (spaceData.favorites_count || 0) + 1 : Math.max(0, (spaceData.favorites_count || 0) - 1);

    const { error: updateError } = await supabase
      .from('spaces')
      .update({ favorites_count: newCount })
      .eq('id', spaceId);

    if (updateError) {
      console.error('Error updating space favorites count:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating space favorites count:', error);
    return false;
  }
}

/**
 * Update the likes count for a post
 * @param postId The ID of the post
 * @param increment Whether to increment (true) or decrement (false) the count
 */
export async function updatePostLikesCount(postId: string, increment: boolean): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('id', postId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    if (error) {
      console.error('Error fetching post likes count:', error);
      return false;
    }

    // If post doesn't exist, return true to avoid breaking the flow
    if (!data) {
      console.warn('Post not found for likes count update:', postId);
      return true;
    }

    const newCount = increment ? (data.likes_count || 0) + 1 : Math.max(0, (data.likes_count || 0) - 1);

    const { error: updateError } = await supabase
      .from('posts')
      .update({ likes_count: newCount })
      .eq('id', postId);

    if (updateError) {
      console.error('Error updating post likes count:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating post likes count:', error);
    return false;
  }
}

/**
 * Toggle favorite status for a post
 * @param spaceId The ID of the space that is adding/removing the favorite
 * @param postId The ID of the post
 * @param postSpaceId The ID of the space that owns the post (for updating counters)
 */
export async function toggleFavorite(spaceId: string, postId: string, postSpaceId: string): Promise<boolean> {
  try {
    const supabaseClient = supabase; // Use the global client for this operation
    
    // Check if favorite already exists
    const { data: existingFavorite, error: checkError } = await supabaseClient
      .from('favorites')
      .select('id')
      .eq('space_id', spaceId)
      .eq('post_id', postId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing favorite:', checkError);
      return false;
    }

    if (existingFavorite) {
      // Remove favorite
      const { error: deleteError } = await supabaseClient
        .from('favorites')
        .delete()
        .eq('id', existingFavorite.id);

      if (deleteError) {
        console.error('Error removing favorite:', deleteError);
        return false;
      }

      // Decrement favorites count for the post
      await updatePostFavoritesCount(postId, false);
      
      // Decrement favorites count for the space that owns the post
      await updateSpaceFavoritesCount(postSpaceId, false);

      return false; // Indicates that the favorite was removed
    } else {
      // Add favorite
      const { error: insertError } = await supabaseClient
        .from('favorites')
        .insert({
          space_id: spaceId,
          post_id: postId
        });

      if (insertError) {
        console.error('Error adding favorite:', insertError);
        return false;
      }

      // Increment favorites count for the post
      await updatePostFavoritesCount(postId, true);
      
      // Increment favorites count for the space that owns the post
      await updateSpaceFavoritesCount(postSpaceId, true);

      return true; // Indicates that the favorite was added
    }
  } catch (error) {
    console.error('Unexpected error toggling favorite:', error);
    return false;
  }
}

/**
 * Update the favorites count for a post
 * @param postId The ID of the post
 * @param increment Whether to increment (true) or decrement (false) the count
 */
export async function updatePostFavoritesCount(postId: string, increment: boolean): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('favorites_count')
      .eq('id', postId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    if (error) {
      console.error('Error fetching post favorites count:', error);
      return false;
    }

    // If post doesn't exist, return true to avoid breaking the flow
    if (!data) {
      console.warn('Post not found for favorites count update:', postId);
      return true;
    }

    const newCount = increment ? (data.favorites_count || 0) + 1 : Math.max(0, (data.favorites_count || 0) - 1);

    const { error: updateError } = await supabase
      .from('posts')
      .update({ favorites_count: newCount })
      .eq('id', postId);

    if (updateError) {
      console.error('Error updating post favorites count:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating post favorites count:', error);
    return false;
  }
}

/**
 * Get the favorite status for a post
 * @param spaceId The ID of the space to check
 * @param postId The ID of the post
 */
export async function getFavoriteStatus(spaceId: string, postId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('space_id', spaceId)
      .eq('post_id', postId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    if (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error checking favorite status:', error);
    return false;
  }
}