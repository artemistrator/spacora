'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { executeSupabaseQuery } from '@/lib/request-manager'

let userSpacesCache: {
  userId: string | null
  ownedSpace: any | null
  subscribedSpace: any | null
  timestamp: number
} | null = null

const CACHE_TTL = 5 * 60 * 1000

export function useUserSpaces() {
  const { userId } = useSupabaseAuth()
  const { getSupabaseWithSession } = useSupabaseAuth()
  const [ownedSpace, setOwnedSpace] = useState<any | null>(null)
  const [subscribedSpace, setSubscribedSpace] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setOwnedSpace(null)
      setSubscribedSpace(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    const fetchUserSpaces = async () => {
      const now = Date.now()
      if (
        userSpacesCache && 
        userSpacesCache.userId === userId && 
        now - userSpacesCache.timestamp < CACHE_TTL
      ) {
        if (cancelled) return
        setOwnedSpace(userSpacesCache.ownedSpace)
        setSubscribedSpace(userSpacesCache.subscribedSpace)
        setIsLoading(false)
        return
      }

      try {
        const supabaseClient = await getSupabaseWithSession()
        if (cancelled) return

        const ownedSpaceData = await executeSupabaseQuery(async () => {
          const { data, error } = await supabaseClient
            .from('spaces')
            .select('id')
            .eq('owner_id', userId)
            .limit(1)
            .maybeSingle()

          if (error) throw error
          return data
        }, 5000)

        if (cancelled) return

        let subscribedSpaceData = null
        if (!ownedSpaceData) {
          subscribedSpaceData = await executeSupabaseQuery(async () => {
            const { data, error } = await supabaseClient
              .from('user_spaces')
              .select('space_id')
              .eq('clerk_id', userId)
              .limit(1)
              .maybeSingle()

            if (error) throw error
            return data
          }, 5000)
        }

        if (cancelled) return

        userSpacesCache = {
          userId,
          ownedSpace: ownedSpaceData,
          subscribedSpace: subscribedSpaceData,
          timestamp: now
        }

        setOwnedSpace(ownedSpaceData)
        setSubscribedSpace(subscribedSpaceData)
      } catch (error) {
        if (!cancelled) {
          setOwnedSpace(null)
          setSubscribedSpace(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchUserSpaces()
    return () => {
      cancelled = true
    }
  }, [userId])

  const actingSpaceId = ownedSpace?.id || subscribedSpace?.space_id || null

  return { ownedSpace, subscribedSpace, actingSpaceId, isLoading }
}
