'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/lib/auth'
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions'
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
  const { isSubscribedTo, addSubscription, removeSubscription, isLoading: subsLoading } = useUserSubscriptions()
  const [isLoading, setIsLoading] = useState(false)
  const [followerCount, setFollowerCount] = useState(space.followers_count || 0)
  
  const isSubscribed = isSubscribedTo(space.id)

  const handleSubscribe = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!userId || isLoading || subsLoading) return
    
    try {
      setIsLoading(true)
      const supabaseClient = await getSupabaseWithSession()
      
      if (isSubscribed) {
        const { error } = await supabaseClient
          .from('user_spaces')
          .delete()
          .eq('clerk_id', userId)
          .eq('space_id', space.id)
          
        if (!error) {
          removeSubscription(space.id)
          const newCount = Math.max(0, followerCount - 1)
          setFollowerCount(newCount)
          await updateSpaceFollowersCount(space.id, false)
        }
      } else {
        const { error } = await supabaseClient
          .from('user_spaces')
          .insert({
            clerk_id: userId,
            space_id: space.id,
            role: 'subscriber'
          })
          
        if (!error) {
          addSubscription(space.id)
          const newCount = followerCount + 1
          setFollowerCount(newCount)
          await updateSpaceFollowersCount(space.id, true)
        }
      }
    } catch (error) {
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
      {space.cover_url && (
        <div className="w-full h-32 overflow-hidden border-b border-gray-200">
          <img 
            src={space.cover_url} 
            alt={space.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3 flex-1">
            {space.avatar_url && (
              <img 
                src={space.avatar_url} 
                alt={space.name}
                className="h-10 w-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-2">{space.name}</CardTitle>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground flex-shrink-0 ml-2">
            <Users className="h-4 w-4" />
            <span>{space.followers_count || 0}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <SpaceTypeIcon className="h-4 w-4 mr-1" />
          <span>{spaceTypeLabel}</span>
        </div>
        
        {space.style && (
          <p className="text-sm text-gray-600 mb-2">
            Стиль: {space.style}
          </p>
        )}
        
        {space.area_m2 && (
          <p className="text-sm text-gray-600 mb-2">
            Площадь: {space.area_m2} кв.м
          </p>
        )}
        
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
                disabled={isLoading || subsLoading}
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
