'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSupabaseAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function TestSubscription() {
  const { user } = useUser();
  const { getSupabaseWithSession } = useSupabaseAuth();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{[key: string]: boolean}>({});
  const [followerCounts, setFollowerCounts] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (user) {
      fetchSpaces();
    }
  }, [user]);

  const fetchSpaces = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Fetch all spaces
      const { data: spacesData, error: spacesError } = await supabaseClient
        .from('spaces')
        .select('*');
        
      if (spacesError) throw spacesError;
      
      setSpaces(spacesData || []);
      
      // Initialize follower counts
      const counts: {[key: string]: number} = {};
      const status: {[key: string]: boolean} = {};
      
      for (const space of spacesData || []) {
        counts[space.id] = space.followers_count || 0;
        
        // Check subscription status for each space
        const { data: subscriptionData } = await supabaseClient
          .from('user_spaces')
          .select('*')
          .eq('clerk_id', user?.id)
          .eq('space_id', space.id)
          .single();
          
        status[space.id] = !!subscriptionData;
      }
      
      setFollowerCounts(counts);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error fetching spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (spaceId: string) => {
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      console.log('Toggling subscription for space:', spaceId);
      console.log('Current subscription status:', subscriptionStatus[spaceId]);
      
      if (subscriptionStatus[spaceId]) {
        // Unsubscribe
        console.log('Unsubscribing...');
        const { error } = await supabaseClient
          .from('user_spaces')
          .delete()
          .eq('clerk_id', user?.id)
          .eq('space_id', spaceId);
          
        if (error) {
          console.error('Error unsubscribing:', error);
        } else {
          console.log('Unsubscribed successfully');
          setSubscriptionStatus(prev => ({ ...prev, [spaceId]: false }));
          // Update follower count via API
          try {
            const response = await fetch('/api/update-follower', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                spaceId,
                increment: false
              })
            });
            
            const result = await response.json();
            if (result.success) {
              setFollowerCounts(prev => ({ 
                ...prev, 
                [spaceId]: result.newCount
              }));
            }
          } catch (apiError) {
            console.error('Error updating follower count via API:', apiError);
            // Fallback to client-side update
            setFollowerCounts(prev => ({ 
              ...prev, 
              [spaceId]: Math.max(0, (prev[spaceId] || 0) - 1) 
            }));
          }
        }
      } else {
        // Subscribe
        console.log('Subscribing...');
        const { error } = await supabaseClient
          .from('user_spaces')
          .insert({
            clerk_id: user?.id,
            space_id: spaceId,
            role: 'subscriber'
          });
          
        if (error) {
          console.error('Error subscribing:', error);
        } else {
          console.log('Subscribed successfully');
          setSubscriptionStatus(prev => ({ ...prev, [spaceId]: true }));
          // Update follower count via API
          try {
            const response = await fetch('/api/update-follower', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                spaceId,
                increment: true
              })
            });
            
            const result = await response.json();
            if (result.success) {
              setFollowerCounts(prev => ({ 
                ...prev, 
                [spaceId]: result.newCount
              }));
            }
          } catch (apiError) {
            console.error('Error updating follower count via API:', apiError);
            // Fallback to client-side update
            setFollowerCounts(prev => ({ 
              ...prev, 
              [spaceId]: (prev[spaceId] || 0) + 1 
            }));
          }
        }
      }
      
      // Refresh the data after a short delay
      setTimeout(() => {
        fetchSpaces();
      }, 1000);
    } catch (error) {
      console.error('Error toggling subscription:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Subscription</h1>
      
      <div className="space-y-4">
        {spaces.map(space => (
          <div key={space.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold">{space.name}</h2>
                <p className="text-sm text-gray-500">Owner: {space.owner_id}</p>
                <div className="flex space-x-4 mt-2 text-sm">
                  <span>Followers: {followerCounts[space.id] || space.followers_count || 0}</span>
                  <span>Posts: {space.posts_count || 0}</span>
                  <span>Likes: {space.likes_count || 0}</span>
                  <span>Favorites: {space.favorites_count || 0}</span>
                </div>
              </div>
              
              {user?.id !== space.owner_id && (
                <Button 
                  variant={subscriptionStatus[space.id] ? "default" : "outline"}
                  onClick={() => handleSubscribe(space.id)}
                >
                  {subscriptionStatus[space.id] ? 'Отписаться' : 'Подписаться'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}