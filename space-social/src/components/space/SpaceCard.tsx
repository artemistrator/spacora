'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/lib/auth'
import { updateSpaceFollowersCount } from '@/lib/counter-utils'
import { 
  Home, 
  Building, 
  DoorOpen, 
  Warehouse, 
  Bed,
  Users,
  Heart,
  Star,
  AlertTriangle
} from 'lucide-react'

interface SpaceCardProps {
  space: any
  onClick?: () => void
}

const spaceTypeIcons = {
  apartment: Home,
  house: Building,
  studio: DoorOpen,
  loft: Warehouse,
  room: Bed,
}

const spaceTypeLabels = {
  apartment: 'Квартира',
  house: 'Дом',
  studio: 'Студия',
  loft: 'Лофт',
  room: 'Комната',
}

export function SpaceCard({ space, onClick }: SpaceCardProps) {
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [followerCount, setFollowerCount] = useState(space.followers_count || 0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSubscription = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }
      
      try {
        const supabaseClient = await getSupabaseWithSession()
        
        // Add timeout for the request
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
        
        const subscriptionPromise = supabaseClient
          .from('user_spaces')
          .select('*')
          .eq('clerk_id', userId)
          .eq('space_id', space.id)
          .maybeSingle() // Changed from .single() to .maybeSingle()
          
        // Race the request with timeout
        const { data, error } = await Promise.race([subscriptionPromise, timeoutPromise]) as any
          
        if (data) {
          setIsSubscribed(true)
        }
      } catch (error: any) {
        console.error('Error checking subscription:', error)
        
        // Handle network errors specifically
        if (error.message === 'Failed to fetch' || error.message === 'Request timeout') {
          setError('Проблемы с подключением к серверу.')
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    checkSubscription()
  }, [userId, space.id, getSupabaseWithSession])

  const handleSubscribe = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!userId || isLoading) return
    
    try {
      setIsLoading(true)
      setError(null)
      const supabaseClient = await getSupabaseWithSession()
      
      if (isSubscribed) {
        // Unsubscribe
        const { error } = await supabaseClient
          .from('user_spaces')
          .delete()
          .eq('clerk_id', userId)
          .eq('space_id', space.id)
          
        if (!error) {
          setIsSubscribed(false)
          // Update follower count
          const newCount = Math.max(0, followerCount - 1)
          setFollowerCount(newCount)
          
          // Update space followers count in database
          await updateSpaceFollowersCount(space.id, false)
        }
      } else {
        // Subscribe
        const { error } = await supabaseClient
          .from('user_spaces')
          .insert({
            clerk_id: userId,
            space_id: space.id,
            role: 'subscriber'
          })
          
        if (!error) {
          setIsSubscribed(true)
          // Update follower count
          const newCount = followerCount + 1
          setFollowerCount(newCount)
          
          // Update space followers count in database
          await updateSpaceFollowersCount(space.id, true)
        }
      }
    } catch (error: any) {
      console.error('Error toggling subscription:', error)
      
      // Handle network errors specifically
      if (error.message === 'Failed to fetch' || error.message === 'Request timeout') {
        setError('Проблемы с подключением к серверу.')
      } else {
        setError('Ошибка при изменении подписки.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const SpaceTypeIcon = spaceTypeIcons[space.space_type as keyof typeof spaceTypeIcons] || Home
  const spaceTypeLabel = spaceTypeLabels[space.space_type as keyof typeof spaceTypeLabels] || space.space_type

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{space.name}</CardTitle>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{followerCount}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <SpaceTypeIcon className="h-4 w-4 mr-1" />
          <span>{spaceTypeLabel}</span>
        </div>
        
        {space.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {space.description}
          </p>
        )}
        
        {space.location && (
          <p className="text-sm text-muted-foreground mb-3">
            📍 {space.location}
          </p>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-3">
            <div className="flex items-center text-red-700">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-xs">{error}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center space-x-3 text-sm text-muted-foreground">
            <span>Постов: {space.posts_count || 0}</span>
            <span className="flex items-center">
              <Heart className="h-4 w-4 mr-1" />
              {space.likes_count || 0}
            </span>
            <span className="flex items-center">
              <Star className="h-4 w-4 mr-1" />
              {space.favorites_count || 0}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {space.is_public ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                Публичное
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                Приватное
              </span>
            )}
            
            {userId && space.owner_id !== userId && (
              <Button 
                variant={isSubscribed ? "default" : "outline"} 
                size="sm"
                onClick={handleSubscribe}
                disabled={isLoading}
              >
                {isSubscribed ? 'Подписан' : 'Подписаться'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}