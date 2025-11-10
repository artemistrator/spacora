'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PostCard } from '@/components/post/PostCard';
import { supabase } from '@/lib/supabase';

export default function FavoritesPage() {
  const { userId } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchFavorites();
    }
  }, [userId]);

  const fetchFavorites = async () => {
    setLoading(true);
    
    try {
      // First, get all spaces the user owns or is subscribed to
      const userSpaces = await getUserSpaces(userId!);
      
      if (userSpaces.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          posts(*),
          spaces(name, avatar_url)
        `)
        .in('space_id', userSpaces) // Use all spaces the user can access
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFavorites(data || []);
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      // Log more details about the error
      console.log('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserSpaces = async (clerkUserId: string) => {
    if (!clerkUserId) return [];
    
    try {
      // Get spaces the user owns
      const { data: ownedSpaces, error: ownedSpacesError } = await supabase
        .from('spaces')
        .select('id')
        .eq('owner_id', clerkUserId);
        
      if (ownedSpacesError) {
        console.error('Error fetching owned spaces:', ownedSpacesError);
        return [];
      }
      
      // Get spaces the user is subscribed to
      const { data: subscribedSpaces, error: subscribedSpacesError } = await supabase
        .from('user_spaces')
        .select('space_id')
        .eq('clerk_id', clerkUserId);
        
      if (subscribedSpacesError) {
        console.error('Error fetching subscribed spaces:', subscribedSpacesError);
        return [];
      }
      
      // Combine both arrays and extract IDs
      const spaceIds = [
        ...ownedSpaces.map((space: any) => space.id),
        ...subscribedSpaces.map((subscription: any) => subscription.space_id)
      ];
      
      // Remove duplicates
      return [...new Set(spaceIds)];
    } catch (error) {
      console.error('Error getting user spaces:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Избранное</h1>
        
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">У вас пока нет избранных постов.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {favorites.map(favorite => (
              <PostCard
                key={favorite.posts.id}
                post={favorite.posts}
                isFavoritesPage={true}
                onRemoveFromFavorites={fetchFavorites}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}