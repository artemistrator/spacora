'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { SpaceCard } from '@/components/space/SpaceCard';
import { useSupabaseAuth } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SpacesPage() {
  const { user } = useUser();
  const { getSupabaseWithSession } = useSupabaseAuth();
  const [subscribedSpaces, setSubscribedSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscribedSpaces();
    }
  }, [user]);

  const fetchSubscribedSpaces = async () => {
    try {
      setLoading(true);
      const supabaseClient = await getSupabaseWithSession();
      
      // First get the space IDs the user is subscribed to
      const { data: subscriptions, error: subscriptionError } = await supabaseClient
        .from('user_spaces')
        .select('space_id')
        .eq('clerk_id', user?.id);
        
      if (subscriptionError) throw subscriptionError;
      
      if (subscriptions.length > 0) {
        const spaceIds = subscriptions.map((sub: any) => sub.space_id);
        
        // Then fetch the actual space data
        const { data: spaces, error: spacesError } = await supabaseClient
          .from('spaces')
          .select('*')
          .in('id', spaceIds)
          .order('created_at', { ascending: false });
          
        if (spacesError) throw spacesError;
        
        setSubscribedSpaces(spaces);
      }
    } catch (error) {
      console.error('Error fetching subscribed spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Мои подписки</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Мои подписки</h1>
          <Link href="/spaces/create">
            <Button>Создать пространство</Button>
          </Link>
        </div>
        
        {subscribedSpaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscribedSpaces.map(space => (
              <SpaceCard 
                key={space.id} 
                space={space} 
                onClick={() => window.location.href = `/space/${space.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Вы еще не подписались ни на одно пространство</p>
            <Link href="/">
              <Button>Посмотреть пространства</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}