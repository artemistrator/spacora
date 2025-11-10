'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { sendPostReactionNotification } from '@/lib/notifications';
import { Button } from '@/components/ui/button';

interface PostReaction {
  id: string;
  post_id: string;
  space_id: string;
  reaction_type: 'like' | 'fire' | 'heart' | 'wow' | 'cute';
  created_at: string;
}

interface ReactionCount {
  reaction_type: string;
  count: number;
}

export function PostReactions({ 
  postId, 
  spaceName,
  initialReactions = []
}: { 
  postId: string; 
  spaceName: string;
  initialReactions: ReactionCount[];
}) {
  const { getSupabaseWithSession, userId } = useSupabaseAuth(); // Используем правильный хук
  const [reactions, setReactions] = useState<ReactionCount[]>(initialReactions);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userSpaceId, setUserSpaceId] = useState<string | null>(null); // Будем хранить Supabase space ID

  useEffect(() => {
    if (userId) {
      fetchUserSpaceId();
      fetchUserReaction();
    }
    
    const unsubscribe = setupRealtimeSubscription();
    
    return () => {
      unsubscribe();
    };
  }, [userId, postId]);

  // Получаем Supabase space ID для текущего пользователя
  const fetchUserSpaceId = async () => {
    if (!userId) return;
    
    try {
      const supabaseClient = await getSupabaseWithSession(); // Используем аутентифицированный клиент
      const { data, error } = await supabaseClient
        .from('spaces')
        .select('id')
        .eq('owner_id', userId) // Clerk user ID
        .limit(1);

      if (error) {
        console.error('Error fetching user space:', error);
        return;
      }

      if (data && data.length > 0) {
        setUserSpaceId(data[0].id); // Supabase space ID
      }
    } catch (error) {
      console.error('Error fetching user space ID:', error);
    }
  };

  const fetchUserReaction = async () => {
    if (!userId || !userSpaceId) return;
    
    try {
      const supabaseClient = await getSupabaseWithSession(); // Используем аутентифицированный клиент
      const { data, error } = await supabaseClient
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', postId)
        .eq('space_id', userSpaceId) // Используем Supabase space ID
        .single();

      if (error) {
        // No reaction found, that's okay
        return;
      }

      setUserReaction(data.reaction_type);
    } catch (error) {
      console.error('Error fetching user reaction:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    // We'll use the direct client for realtime subscriptions
    // since they don't require authentication in the same way
    const channel = supabase
      .channel('post-reactions')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${postId}` },
        (payload: any) => {
          updateReactionCounts();
        }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${postId}` },
        (payload: any) => {
          updateReactionCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateReactionCounts = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession(); // Используем аутентифицированный клиент
      const { data, error } = await supabaseClient
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', postId);

      if (error) throw error;

      // Group by reaction type and count
      const groupedReactions = data.reduce((acc: ReactionCount[], reaction: any) => {
        const existing = acc.find(r => r.reaction_type === reaction.reaction_type);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ reaction_type: reaction.reaction_type, count: 1 });
        }
        return acc;
      }, []);

      setReactions(groupedReactions);
    } catch (error) {
      console.error('Error updating reaction counts:', error);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (!userId) {
      alert('Пожалуйста, войдите в систему, чтобы добавить реакцию');
      return;
    }
    
    // Убедимся, что у пользователя есть space
    if (!userSpaceId) {
      alert('Сначала создайте пространство, чтобы добавить реакцию');
      return;
    }
    
    setLoading(true);
    
    try {
      const supabaseClient = await getSupabaseWithSession(); // Используем аутентифицированный клиент
      
      // Check if user already has this reaction
      const { data: existingReaction, error: fetchError } = await supabaseClient
        .from('post_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('space_id', userSpaceId) // Используем Supabase space ID
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingReaction) {
        // If user already has the same reaction, remove it (toggle off)
        if (userReaction === reactionType) {
          const { error } = await supabaseClient
            .from('post_reactions')
            .delete()
            .eq('id', existingReaction.id);

          if (error) throw error;
          
          setUserReaction(null);
        } else {
          // Change reaction type
          const { error } = await supabaseClient
            .from('post_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existingReaction.id);

          if (error) throw error;
          
          setUserReaction(reactionType);
        }
      } else {
        // Add new reaction
        const { error } = await supabaseClient
          .from('post_reactions')
          .insert({
            post_id: postId,
            space_id: userSpaceId, // Используем Supabase space ID
            reaction_type: reactionType
          });

        if (error) throw error;
        
        setUserReaction(reactionType);
        
        // Send notification to post owner (in real implementation, you'd get post owner ID)
        // sendPostReactionNotification(postOwnerId, postId, spaceName, reactionType);
      }

      // Update reaction counts
      await updateReactionCounts();
    } catch (error: any) {
      console.error('Error handling reaction:', error);
      // Покажем более подробное сообщение об ошибке
      alert(`Ошибка при добавлении реакции: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getReactionCount = (type: string) => {
    const reaction = reactions.find(r => r.reaction_type === type);
    return reaction ? reaction.count : 0;
  };

  const reactionTypes = [
    { type: 'like', emoji: '❤️', label: 'Нравится' },
    { type: 'fire', emoji: '🔥', label: 'Огонь' },
    { type: 'heart', emoji: '💖', label: 'Сердце' },
    { type: 'wow', emoji: '😮', label: 'Вау' },
    { type: 'cute', emoji: '😍', label: 'Мило' }
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {reactionTypes.map(({ type, emoji, label }) => (
        <Button
          key={type}
          variant={userReaction === type ? "default" : "outline"}
          size="sm"
          onClick={() => handleReaction(type)}
          disabled={loading || !userSpaceId}
          className="flex items-center gap-1"
        >
          <span>{emoji}</span>
          <span>{getReactionCount(type)}</span>
        </Button>
      ))}
    </div>
  );
}