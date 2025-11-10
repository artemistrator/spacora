'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface Achievement {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  earned_at?: string;
}

export function UserAchievements({ userId }: { userId: string | null }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserAchievements();
    }
  }, [userId]);

  const fetchUserAchievements = async () => {
    setLoading(true);
    
    try {
      // In a real implementation, you would fetch actual achievements from the database
      // For now, we'll use mock data
      const mockAchievements: Achievement[] = [
        { 
          id: '1', 
          name: 'Первый пост', 
          description: 'Создайте свой первый пост', 
          earned: true,
          earned_at: '2025-10-01'
        },
        { 
          id: '2', 
          name: 'Популярный автор', 
          description: 'Получите 100 лайков', 
          earned: false
        },
        { 
          id: '3', 
          name: 'Активный участник', 
          description: 'Создайте 10 постов', 
          earned: true,
          earned_at: '2025-10-05'
        },
        { 
          id: '4', 
          name: 'Исследователь ИИ', 
          description: 'Используйте AI функции 5 раз', 
          earned: false
        },
        { 
          id: '5', 
          name: 'Коллекционер', 
          description: 'Добавьте 20 постов в избранное', 
          earned: false
        },
      ];
      
      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Достижения</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="w-6 h-6 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Достижения</CardTitle>
        <CardDescription>Ваши заработанные и доступные достижения</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map(achievement => (
            <div 
              key={achievement.id} 
              className={`p-4 rounded-lg border ${achievement.earned ? 'bg-primary/10 border-primary' : 'bg-muted'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{achievement.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                  {achievement.earned_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Получено: {new Date(achievement.earned_at).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
                {achievement.earned ? (
                  <Badge variant="default">Получено</Badge>
                ) : (
                  <Badge variant="secondary">Не получено</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}