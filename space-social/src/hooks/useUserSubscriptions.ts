'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { executeSupabaseQuery } from '@/lib/request-manager'

let subscriptionCache: {
  userId: string | null
  subscriptions: Set<string>
  timestamp: number
} | null = null

const CACHE_TTL = 5 * 60 * 1000

export function useUserSubscriptions() {
  const { userId } = useSupabaseAuth()
  const { getSupabaseWithSession } = useSupabaseAuth()
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setSubscriptions(new Set())
      setIsLoading(false)
      return
    }

    let cancelled = false

    const loadSubscriptions = async () => {
      const now = Date.now()
      if (
        subscriptionCache && 
        subscriptionCache.userId === userId && 
        now - subscriptionCache.timestamp < CACHE_TTL
      ) {
        if (cancelled) return
        setSubscriptions(new Set(subscriptionCache.subscriptions))
        setIsLoading(false)
        return
      }

      try {
        const supabaseClient = await getSupabaseWithSession()
        if (cancelled) return

        const data = await executeSupabaseQuery(async () => {
          const { data, error } = await supabaseClient
            .from('user_spaces')
            .select('space_id')
            .eq('clerk_id', userId)

          if (error) throw error
          return data
        }, 5000)

        if (cancelled) return

        const subs = new Set(data?.map(s => s.space_id) || [])
        subscriptionCache = { userId, subscriptions: subs, timestamp: now }
        setSubscriptions(new Set(subs))
      } catch (error) {
        if (!cancelled) {
          setSubscriptions(new Set())
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadSubscriptions()
    return () => {
      cancelled = true
    }
  }, [userId])

  const isSubscribedTo = useCallback((spaceId: string) => {
    return subscriptions.has(spaceId)
  }, [subscriptions])

  const addSubscription = useCallback((spaceId: string) => {
    setSubscriptions(prev => {
      const newSubs = new Set(prev)
      newSubs.add(spaceId)
      if (subscriptionCache && subscriptionCache.userId === userId) {
        subscriptionCache.subscriptions = new Set(newSubs)
        subscriptionCache.timestamp = Date.now()
      }
      return newSubs
    })
  }, [userId])

  const removeSubscription = useCallback((spaceId: string) => {
    setSubscriptions(prev => {
      const newSubs = new Set(prev)
      newSubs.delete(spaceId)
      if (subscriptionCache && subscriptionCache.userId === userId) {
        subscriptionCache.subscriptions = new Set(newSubs)
        subscriptionCache.timestamp = Date.now()
      }
      return newSubs
    })
  }, [userId])

  return { isSubscribedTo, addSubscription, removeSubscription, isLoading }
}
