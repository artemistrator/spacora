'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSupabaseAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

export default function TestFavorites() {
  const { user } = useUser();
  const { getSupabaseWithSession } = useSupabaseAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Fetch all posts
      const { data: postsData, error: postsError } = await supabaseClient
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (postsError) throw postsError;
      
      setPosts(postsData || []);
      
      // Initialize favorites status
      const favoritesStatus: {[key: string]: boolean} = {};
      
      for (const post of postsData || []) {
        // Check if user has favorited this post
        const { data: favoriteData, error: favoriteError } = await supabaseClient
          .from('favorites')
          .select('id')
          .eq('space_id', user?.id)
          .eq('post_id', post.id)
          .maybeSingle();
          
        favoritesStatus[post.id] = !!favoriteData;
      }
      
      setFavorites(favoritesStatus);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (postId: string, spaceId: string) => {
    if (!user) return;

    try {
      const supabaseClient = await getSupabaseWithSession();
      const isCurrentlyFavorited = favorites[postId] || false;
      
      // Get the post to determine which space it belongs to
      const { data: post, error: postError } = await supabaseClient
        .from('posts')
        .select('space_id')
        .eq('id', postId)
        .single();
        
      if (postError) {
        console.error('Error fetching post:', postError);
        return;
      }
      
      // Find a space that the user can act on behalf of
      let actingSpaceId = null;
      
      // First, check if user owns the post's space
      const { data: ownedSpace, error: ownedSpaceError } = await supabaseClient
        .from('spaces')
        .select('id')
        .eq('id', post.space_id)
        .eq('owner_id', user.id)
        .maybeSingle();
        
      if (ownedSpace) {
        actingSpaceId = ownedSpace.id;
      } else {
        // Check if user is subscribed to the post's space
        const { data: subscribedSpace, error: subscribedSpaceError } = await supabaseClient
          .from('user_spaces')
          .select('space_id')
          .eq('clerk_id', user.id)
          .eq('space_id', post.space_id)
          .maybeSingle();
          
        if (subscribedSpace) {
          actingSpaceId = subscribedSpace.space_id;
        } else {
          // User is neither owner nor subscriber - find any space they own
          const { data: anyOwnedSpace, error: anyOwnedSpaceError } = await supabaseClient
            .from('spaces')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1)
            .maybeSingle();
            
          if (anyOwnedSpace) {
            actingSpaceId = anyOwnedSpace.id;
          } else {
            // Find any space they're subscribed to
            const { data: anySubscribedSpace, error: anySubscribedSpaceError } = await supabaseClient
              .from('user_spaces')
              .select('space_id')
              .eq('clerk_id', user.id)
              .limit(1)
              .maybeSingle();
              
            if (anySubscribedSpace) {
              actingSpaceId = anySubscribedSpace.space_id;
            }
          }
        }
      }
      
      if (!actingSpaceId) {
        console.error('User has no space to act on behalf of');
        return;
      }
      
      console.log('Toggling favorite for post:', postId, 'Currently favorited:', isCurrentlyFavorited);
      
      if (isCurrentlyFavorited) {
        // Remove from favorites
        console.log('Removing from favorites...');
        const { data: existingFavorite, error: fetchError } = await supabaseClient
          .from('favorites')
          .select('id')
          .eq('space_id', actingSpaceId)
          .eq('post_id', postId)
          .maybeSingle();
          
        if (fetchError) {
          console.error('Error checking favorite status:', fetchError);
          return;
        }
        
        if (existingFavorite) {
          const { error: deleteError } = await supabaseClient
            .from('favorites')
            .delete()
            .eq('id', existingFavorite.id);
            
          if (deleteError) {
            console.error('Error removing from favorites:', deleteError);
            // Log more details about the error
            console.log('Error details:', {
              message: deleteError.message,
              code: deleteError.code,
              details: deleteError.details,
              hint: deleteError.hint
            });
          } else {
            console.log('Removed from favorites successfully');
            setFavorites(prev => ({
              ...prev,
              [postId]: false
            }));
          }
        }
      } else {
        // Add to favorites
        console.log('Adding to favorites...');
        const { error: insertError } = await supabaseClient
          .from('favorites')
          .insert({
            space_id: actingSpaceId,
            post_id: postId,
            collection_name: 'default'
          });
          
        if (insertError) {
          console.error('Error adding to favorites:', insertError);
          // Log more details about the error
          console.log('Error details:', {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint
          });
        } else {
          console.log('Added to favorites successfully');
          setFavorites(prev => ({
            ...prev,
            [postId]: true
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Favorites</h1>
      
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="border rounded-lg p-4">
            <div className="mb-4">
              <h2 className="font-semibold">{post.content || 'Без текста'}</h2>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleFavorite(post.id, post.space_id)}
              className={favorites[post.id] ? "text-yellow-500 hover:text-yellow-600" : ""}
            >
              <Star className={`h-4 w-4 mr-1 ${favorites[post.id] ? "fill-current" : ""}`} />
              {favorites[post.id] ? 'В избранном' : 'В избранное'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}