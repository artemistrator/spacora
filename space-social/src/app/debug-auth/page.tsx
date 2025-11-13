'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { useAuth as useClerkAuth } from '@clerk/nextjs'
import { getOrCreateSupabaseUserId } from '@/lib/user-mapping'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugAuthPage() {
  const { getSupabaseWithSession, userId, session } = useSupabaseAuth()
  const { sessionId, orgId, orgRole } = useClerkAuth()
  const [authInfo, setAuthInfo] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAuth = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabaseClient = await getSupabaseWithSession()
      
      // Test fetching user data
      let userData = null
      let userError = null
      if (supabaseClient) {
        const { data, error } = await supabaseClient
          .from('user_identities')
          .select('*')
          .limit(1)
        
        userData = data
        userError = error
      }
      
      // Test fetching spaces
      let spacesData = null
      let spacesError = null
      if (supabaseClient && userId) {
        // Получаем правильный UUID для пользователя
        const supabaseUserId = await getOrCreateSupabaseUserId(userId)
        
        const { data, error } = await supabaseClient
          .from('spaces')
          .select('id, name, owner_id')
          .or(`owner_id.eq.${userId},owner_id.eq.${supabaseUserId}`) // Ищем по обоим форматам
          .limit(3)
        
        spacesData = data
        spacesError = error
      }
      
      setAuthInfo({
        clerk: {
          userId,
          sessionId,
          orgId,
          orgRole
        },
        supabase: {
          session: session,
          userData,
          userError: userError?.message,
          spacesData,
          spacesError: spacesError?.message
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testAuth()
  }, [])

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Диагностика аутентификации</CardTitle>
          <CardDescription>
            Эта страница помогает диагностировать проблемы с аутентификацией Clerk и Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button onClick={testAuth} disabled={loading}>
              {loading ? 'Проверка...' : 'Обновить данные'}
            </Button>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md">
                <h3 className="font-bold mb-2">Ошибка:</h3>
                <p>{error}</p>
              </div>
            )}
            
            {authInfo.clerk && (
              <div className="p-4 bg-blue-50 rounded-md">
                <h3 className="font-bold mb-2 text-blue-800">Clerk Auth Info:</h3>
                <pre className="text-sm bg-white p-3 rounded overflow-x-auto">
                  {JSON.stringify(authInfo.clerk, null, 2)}
                </pre>
              </div>
            )}
            
            {authInfo.supabase && (
              <div className="p-4 bg-green-50 rounded-md">
                <h3 className="font-bold mb-2 text-green-800">Supabase Auth Info:</h3>
                <pre className="text-sm bg-white p-3 rounded overflow-x-auto">
                  {JSON.stringify(authInfo.supabase, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
