'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSupabaseAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

export default function TestLikes() {
  const { user } = useUser();
  const { getSupabaseWithSession } = useSupabaseAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState<{[key: string]: {liked: boolean, count: number}}>({});

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
      
      // Initialize likes status
      const likesStatus: {[key: string]: {liked: boolean, count: number}} = {};
      
      for (const post of postsData || []) {
        // Check if user has liked this post
        const { data: likeData, error: likeError } = await supabaseClient
          .from('post_reactions')
          .select('*')
          .eq('post_id', post.id)
          .eq('space_id', user?.id) // Using space_id to store user_id
          .eq('reaction_type', 'like')
          .maybeSingle();
          
        likesStatus[post.id] = {
          liked: !!likeData,
          count: post.likes_count || 0
        };
      }
      
      setLikes(likesStatus);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const supabaseClient = await getSupabaseWithSession();
      const isCurrentlyLiked = likes[postId]?.liked || false;
      
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
      
      console.log('Toggling like for post:', postId, 'Currently liked:', isCurrentlyLiked);
      
      if (isCurrentlyLiked) {
        // Remove like
        console.log('Removing like...');
        const { error } = await supabaseClient
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('space_id', actingSpaceId)
          .eq('reaction_type', 'like');
          
        if (error) {
          console.error('Error removing like:', error);
          // Log more details about the error
          console.log('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
        } else {
          console.log('Like removed successfully');
          setLikes(prev => ({
            ...prev,
            [postId]: {
              ...prev[postId],
              liked: false,
              count: Math.max(0, (prev[postId]?.count || 0) - 1)
            }
          }));
        }
      } else {
        // Add like
        console.log('Adding like...');
        const { error } = await supabaseClient
          .from('post_reactions')
          .insert({
            post_id: postId,
            space_id: actingSpaceId,
            reaction_type: 'like'
          });
          
        if (error) {
          console.error('Error adding like:', error);
          // Log more details about the error
          console.log('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
        } else {
          console.log('Like added successfully');
          setLikes(prev => ({
            ...prev,
            [postId]: {
              ...prev[postId],
              liked: true,
              count: (prev[postId]?.count || 0) + 1
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Likes</h1>
      
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="border rounded-lg p-4">
            <div className="mb-4">
              <h2 className="font-semibold">{post.content || 'Без текста'}</h2>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleLike(post.id)}
              className={likes[post.id]?.liked ? "text-red-500 hover:text-red-600" : ""}
            >
              <Heart className={`h-4 w-4 mr-1 ${likes[post.id]?.liked ? "fill-current" : ""}`} />
              {likes[post.id]?.count || post.likes_count || 0}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}