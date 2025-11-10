'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSupabaseAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Heart, Star } from 'lucide-react';

export default function TestReactions() {
  const { user } = useUser();
  const { getSupabaseWithSession } = useSupabaseAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState<{[key: string]: {liked: boolean, favorited: boolean, likeCount: number}}>({});

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
        .select(`
          *,
          spaces (id, name, avatar_url)
        `)
        .order('created_at', { ascending: false });
        
      if (postsError) throw postsError;
      
      setPosts(postsData || []);
      
      // Initialize reactions status
      const reactionsStatus: {[key: string]: {liked: boolean, favorited: boolean, likeCount: number}} = {};
      
      for (const post of postsData || []) {
        // Check if user has liked this post
        const { data: likeData } = await supabaseClient
          .from('post_reactions')
          .select('*')
          .eq('post_id', post.id)
          .eq('space_id', user?.id) // Using space_id to store user_id
          .eq('reaction_type', 'like')
          .single();
          
        // Check if user has favorited this post
        const { data: favoriteData } = await supabaseClient
          .from('favorites')
          .select('*')
          .eq('space_id', user?.id) // Using space_id to store user_id
          .eq('post_id', post.id)
          .single();
          
        reactionsStatus[post.id] = {
          liked: !!likeData,
          favorited: !!favoriteData,
          likeCount: post.likes_count || 0
        };
      }
      
      setReactions(reactionsStatus);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, spaceId: string) => {
    if (!user) return;
    
    try {
      const supabaseClient = await getSupabaseWithSession();
      const isCurrentlyLiked = reactions[postId]?.liked || false;
      
      if (isCurrentlyLiked) {
        // Remove like
        const { error } = await supabaseClient
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('space_id', user.id) // Using space_id to store user_id
          .eq('reaction_type', 'like');
          
        if (!error) {
          setReactions(prev => ({
            ...prev,
            [postId]: {
              ...prev[postId],
              liked: false,
              likeCount: Math.max(0, (prev[postId]?.likeCount || 0) - 1)
            }
          }));
        }
      } else {
        // Add like
        const { error } = await supabaseClient
          .from('post_reactions')
          .insert({
            post_id: postId,
            space_id: user.id, // Using space_id to store user_id
            reaction_type: 'like'
          });
          
        if (!error) {
          setReactions(prev => ({
            ...prev,
            [postId]: {
              ...prev[postId],
              liked: true,
              likeCount: (prev[postId]?.likeCount || 0) + 1
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleFavorite = async (postId: string, spaceId: string) => {
    if (!user) return;
    
    try {
      const supabaseClient = await getSupabaseWithSession();
      const isCurrentlyFavorited = reactions[postId]?.favorited || false;
      
      if (isCurrentlyFavorited) {
        // Remove from favorites
        const { error } = await supabaseClient
          .from('favorites')
          .delete()
          .eq('space_id', user.id) // Using space_id to store user_id
          .eq('post_id', postId);
          
        if (!error) {
          setReactions(prev => ({
            ...prev,
            [postId]: {
              ...prev[postId],
              favorited: false
            }
          }));
        }
      } else {
        // Add to favorites
        const { error } = await supabaseClient
          .from('favorites')
          .insert({
            space_id: user.id, // Using space_id to store user_id
            post_id: postId
          });
          
        if (!error) {
          setReactions(prev => ({
            ...prev,
            [postId]: {
              ...prev[postId],
              favorited: true
            }
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
      <h1 className="text-2xl font-bold mb-6">Test Reactions (Likes & Favorites)</h1>
      
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="border rounded-lg p-4">
            <div className="mb-4">
              <h2 className="font-semibold">{post.content || 'Без текста'}</h2>
              <p className="text-sm text-gray-500">Space: {post.spaces?.name || 'Unknown'}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleLike(post.id, post.space_id)}
                className={reactions[post.id]?.liked ? "text-red-500 hover:text-red-600" : ""}
              >
                <Heart className={`h-4 w-4 mr-1 ${reactions[post.id]?.liked ? "fill-current" : ""}`} />
                {reactions[post.id]?.likeCount || post.likes_count || 0}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleFavorite(post.id, post.space_id)}
                className={reactions[post.id]?.favorited ? "text-yellow-500 hover:text-yellow-600" : ""}
              >
                <Star className={`h-4 w-4 mr-1 ${reactions[post.id]?.favorited ? "fill-current" : ""}`} />
                В избранное
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}