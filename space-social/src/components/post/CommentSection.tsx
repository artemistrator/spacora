'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseAuth } from '@/lib/auth';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Comment {
  id: string;
  post_id: string;
  space_id: string;
  content: string;
  created_at: string;
  space: {
    name: string;
  };
}

export function CommentSection({ postId }: { postId: string }) {
  const { userId } = useAuth();
  const { getSupabaseWithSession } = useSupabaseAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
    setupRealtimeSubscription();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          space:spaces(name)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        setError('Не удалось загрузить комментарии');
        return;
      }

      setComments(data as unknown as Comment[]);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Не удалось загрузить комментарии');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('post_comments')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
        (payload) => {
          const newComment = payload.new as Comment;
          setComments(prev => [...prev, newComment]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !newComment.trim()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Find a space that the user can act on behalf of
      let actingSpaceId = null
      
      // First, check if user owns any space
      const { data: anyOwnedSpace, error: anyOwnedSpaceError } = await supabaseClient
        .from('spaces')
        .select('id')
        .eq('owner_id', userId)
        .limit(1)
        .maybeSingle()
        
      if (anyOwnedSpace) {
        actingSpaceId = anyOwnedSpace.id
      } else {
        // If user doesn't own any space, check if they're subscribed to any space
        const { data: anySubscribedSpace, error: anySubscribedSpaceError } = await supabaseClient
          .from('user_spaces')
          .select('space_id')
          .eq('clerk_id', userId)
          .limit(1)
          .maybeSingle()
          
        if (anySubscribedSpace) {
          actingSpaceId = anySubscribedSpace.space_id
        }
      }
      
      if (!actingSpaceId) {
        console.error('User has no space to act on behalf of')
        setError('Вам нужно создать или подписаться на пространство перед тем как комментировать.');
        setSubmitting(false);
        return
      }
      
      const { error } = await supabaseClient
        .from('post_comments')
        .insert({
          post_id: postId,
          space_id: actingSpaceId,
          content: newComment.trim()
        });

      if (error) {
        console.error('Error adding comment:', error);
        setError('Не удалось добавить комментарий');
        setSubmitting(false);
        return;
      }

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Не удалось добавить комментарий');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    fetchComments();
  };

  if (loading) {
    return <div className="text-center py-4">Загрузка комментариев...</div>;
  }

  if (error) {
    return (
      <div className="mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 font-medium">Ошибка загрузки комментариев</span>
          </div>
          <p className="text-red-600 text-sm mt-1 mb-3">{error}</p>
          <Button 
            onClick={handleRetry} 
            variant="outline" 
            size="sm" 
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Повторить попытку
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Комментарии ({comments.length})</h3>
      
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">Пока нет комментариев. Будьте первым!</p>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <Avatar>
                <AvatarFallback>
                  {comment.space?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">{comment.space?.name || 'Unknown User'}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {userId && (
        <form onSubmit={handleSubmit} className="mt-6">
          {error && (
            <div className="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
          <Textarea
            placeholder="Напишите комментарий..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            required
          />
          <div className="mt-2 flex justify-end">
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? 'Отправка...' : 'Отправить'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}