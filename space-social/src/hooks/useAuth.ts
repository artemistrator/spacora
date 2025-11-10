import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth'

export function useAuth() {
  const { userId, sessionId, orgId } = useClerkAuth()
  const { user, isLoaded } = useUser()
  const { getSupabaseWithSession } = useSupabaseAuth()
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSynced, setIsSynced] = useState(false)

  // Синхронизируем пользователя с Supabase при аутентификации
  useEffect(() => {
    if (userId && user && isLoaded && !isSyncing && !isSynced) {
      syncUserWithSupabase()
    }
  }, [userId, user, isLoaded, isSyncing, isSynced])

  const syncUserWithSupabase = async () => {
    if (!user || !isLoaded || isSyncing) return
    
    setIsSyncing(true)
    
    try {
      // Wait a bit to ensure user data is fully loaded
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const userData = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        avatar_url: user.imageUrl || null,
        updated_at: new Date().toISOString()
      }
      
      // Получаем аутентифицированный клиент Supabase
      const supabaseClient = await getSupabaseWithSession()
      
      // Создаем или обновляем пользователя в Supabase
      const { data, error } = await supabaseClient
        .from('users')
        .upsert(userData, {
          onConflict: 'id'
        })
        
      if (error) {
        // Log detailed error information
        console.error('Error syncing user with Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
      } else {
        setIsSynced(true)
      }
    } catch (error: any) {
      // Log detailed error information for unexpected errors
      console.error('Error in syncUserWithSupabase:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Функция для принудительной синхронизации
  const forceSyncUser = async () => {
    if (user && isLoaded) {
      setIsSynced(false)
      await syncUserWithSupabase()
    }
  }

  return {
    userId,
    sessionId,
    orgId,
    isAuthenticated: !!userId,
    isSyncing,
    isSynced,
    isUserLoaded: isLoaded,
    forceSyncUser
  }
}