'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStats } from '@/hooks/useUserStats';
import { useAuth } from '@/hooks/useAuth';
import { LevelProgress } from '@/components/gamification/LevelProgress';

export function UserStats() {
  const { userId } = useAuth();
  // Only call useUserStats if userId is not null
  const { stats, loading } = userId ? useUserStats(userId) : { stats: null, loading: false };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="w-6 h-6 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ваша статистика</CardTitle>
        <CardDescription>Прогресс в приложении</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <LevelProgress currentPoints={stats.total_points} level={stats.level} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total_points}</div>
            <div className="text-sm text-muted-foreground">Очков</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.level}</div>
            <div className="text-sm text-muted-foreground">Уровень</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.posts_created}</div>
            <div className="text-sm text-muted-foreground">Постов</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.ai_features_used}</div>
            <div className="text-sm text-muted-foreground">AI функций</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}