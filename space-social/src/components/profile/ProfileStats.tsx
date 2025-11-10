'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ProfileStatsProps {
  userId: string;
}

export function ProfileStats({ userId }: ProfileStatsProps) {
  const [stats, setStats] = useState({
    spacesCount: 0,
    postsCount: 0,
    followersCount: 0,
    likesCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      // Количество пространств
      const { count: spacesCount, error: spacesError } = await supabase
        .from('spaces')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      if (spacesError) throw spacesError;

      // Количество постов
      const { data: spacesData, error: spacesDataError } = await supabase
        .from('spaces')
        .select('id')
        .eq('owner_id', userId);

      if (spacesDataError) throw spacesDataError;

      let postsCount = 0;
      if (spacesData.length > 0) {
        const spaceIds = spacesData.map(space => space.id);
        const { count, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .in('space_id', spaceIds);

        if (postsError) throw postsError;
        postsCount = count || 0;
      }

      // Количество лайков на посты пользователя
      let likesCount = 0;
      if (spacesData.length > 0) {
        const spaceIds = spacesData.map(space => space.id);
        const { data: postsData, error: postsDataError } = await supabase
          .from('posts')
          .select('likes_count')
          .in('space_id', spaceIds);

        if (postsDataError) throw postsDataError;
        
        likesCount = postsData.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      }

      setStats({
        spacesCount: spacesCount || 0,
        postsCount,
        followersCount: 0, // Пока не реализовано
        likesCount
      });
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center p-4 border rounded-lg">
            <div className="h-6 w-12 bg-gray-200 animate-pulse mx-auto mb-2 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 animate-pulse mx-auto rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-4 border rounded-lg">
        <div className="text-2xl font-bold">{stats.spacesCount}</div>
        <div className="text-sm text-muted-foreground">Пространства</div>
      </div>
      <div className="text-center p-4 border rounded-lg">
        <div className="text-2xl font-bold">{stats.postsCount}</div>
        <div className="text-sm text-muted-foreground">Посты</div>
      </div>
      <div className="text-center p-4 border rounded-lg">
        <div className="text-2xl font-bold">{stats.likesCount}</div>
        <div className="text-sm text-muted-foreground">Лайки</div>
      </div>
      <div className="text-center p-4 border rounded-lg">
        <div className="text-2xl font-bold">{stats.followersCount}</div>
        <div className="text-sm text-muted-foreground">Подписчики</div>
      </div>
    </div>
  );
}