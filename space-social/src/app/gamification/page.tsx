'use client';

import { useAuth } from '@/hooks/useAuth';
import { UserStats } from '@/components/gamification/UserStats';
import { UserAchievements } from '@/components/gamification/UserAchievements';

export default function GamificationPage() {
  const { userId, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Геймификация</h1>
          <p className="text-muted-foreground mb-6">
            Для просмотра статистики и достижений необходимо войти в систему.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Геймификация</h1>
        
        <div className="mb-8">
          <UserStats />
        </div>
        
        <div className="mb-8">
          <UserAchievements userId={userId || null} />
        </div>
      </div>
    </div>
  );
}