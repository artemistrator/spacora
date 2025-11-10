import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UserStats {
  space_id: string
  total_points: number
  level: number
  posts_created: number
  likes_received: number
  comments_received: number
  ai_features_used: number
  created_at: string
  updated_at: string
}

export function useUserStats(userId: string) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchUserStats()
    }
  }, [userId])

  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from('space_stats')
        .select('*')
        .eq('space_id', userId)
        .maybeSingle() // Changed from .single() to .maybeSingle()

      if (error) {
        // If no stats found, create initial stats
        await createInitialStats()
        return
      }

      // If data exists, set it
      if (data) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInitialStats = async () => {
    try {
      const { data, error } = await supabase
        .from('space_stats')
        .insert({
          space_id: userId,
          total_points: 0,
          level: 1,
          posts_created: 0,
          likes_received: 0,
          comments_received: 0,
          ai_features_used: 0
        })
        .select()
        .maybeSingle() // Changed from .single() to .maybeSingle()

      if (error) throw error

      if (data) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error creating initial stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return { stats, loading }
}