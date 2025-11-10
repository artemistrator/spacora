'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { useAuth as useClerkAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugAuthPage() {
  const { getSupabaseWithSession, userId, session } = useSupabaseAuth()
  const { sessionId, orgId, orgRole } = useClerkAuth()
  const [authInfo, setAuthInfo] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAuth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get Supabase client
      const supabaseClient = await getSupabaseWithSession()
      
      // Test Supabase auth status
      const { data: { session: supabaseSession } } = await supabaseClient.auth.getSession()
      
      // Test fetching user data
      let userData = null
      let userError = null
      if (userId) {
        const { data, error } = await supabaseClient
          .from('user_identities')
          .select('*')
          .eq('clerk_id', userId)
          .single()
        
        userData = data
        userError = error
      }
      
      // Test fetching spaces
      let spacesData = null
      let spacesError = null
      if (userId) {
        const { data, error } = await supabaseClient
          .from('spaces')
          .select('id, name, owner_id')
          .eq('owner_id', userId)
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
          session: supabaseSession,
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