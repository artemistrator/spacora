'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSession } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

export default function AlternativeAuth() {
  const { user } = useUser()
  const { session } = useSession()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testManualAuth = async () => {
    setLoading(true)
    setResult(null)

    try {
      if (!session) {
        throw new Error('No session available')
      }

      // Get the token manually
      const token = await session.getToken()
      
      // Create a new Supabase client with the token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const supabaseClient = (await import('@supabase/supabase-js')).createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      })
      
      // Create a test file
      const testFile = new File(
        [`Manual auth test. User: ${user?.id || 'unknown'}`], 
        `manual-auth-${Date.now()}.txt`, 
        { type: 'text/plain' }
      )
      
      console.log('Attempting manual authenticated upload test...')
      
      // Try to upload the file
      const { data, error } = await supabaseClient.storage
        .from('post-images')
        .upload(`manual-auth-${Date.now()}.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        setResult({ 
          success: false, 
          error: error.message, 
          details: error,
          operation: 'manual-auth',
          userId: user?.id,
          tokenLength: token?.length
        })
        return
      }

      console.log('Upload successful:', data)
      setResult({ 
        success: true, 
        data,
        operation: 'manual-auth',
        userId: user?.id,
        tokenLength: token?.length
      })
    } catch (error: any) {
      console.error('Upload failed:', error)
      setResult({ 
        success: false, 
        error: error.message,
        operation: 'manual-auth',
        userId: user?.id
      })
    } finally {
      setLoading(false)
    }
  }

  const testWithoutAuthHeader = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Use the global client (anon key)
      const supabaseClient = supabase
      
      // Create a test file
      const testFile = new File(
        [`No auth header test. User: ${user?.id || 'unknown'}`], 
        `no-auth-${Date.now()}.txt`, 
        { type: 'text/plain' }
      )
      
      console.log('Attempting upload without explicit auth header...')
      
      // Try to upload the file
      const { data, error } = await supabaseClient.storage
        .from('post-images')
        .upload(`no-auth-${Date.now()}.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        setResult({ 
          success: false, 
          error: error.message, 
          details: error,
          operation: 'no-auth',
          userId: user?.id
        })
        return
      }

      console.log('Upload successful:', data)
      setResult({ 
        success: true, 
        data,
        operation: 'no-auth',
        userId: user?.id
      })
    } catch (error: any) {
      console.error('Upload failed:', error)
      setResult({ 
        success: false, 
        error: error.message,
        operation: 'no-auth',
        userId: user?.id
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Альтернативная аутентификация</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Информация о пользователе</h2>
        <p>Clerk User ID: {user?.id || 'Не вошли в систему'}</p>
        <p>Статус: {user ? 'Вошли' : 'Не вошли'}</p>
        <p>Session: {session ? 'Активна' : 'Нет'}</p>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={testManualAuth}
          disabled={loading || !session}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Тест...' : 'Тест с ручной установкой заголовка'}
        </button>
        
        <button
          onClick={testWithoutAuthHeader}
          disabled={loading || !session}
          className="w-full px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Тест...' : 'Тест без явного заголовка аутентификации'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Результат операции: {result.operation}</h2>
          <div className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-medium">
              {result.success ? 'УСПЕХ' : 'ОШИБКА'}: {result.error || 'Operation completed successfully'}
            </p>
            {result.userId && <p className="text-sm mt-1">User ID: {result.userId}</p>}
            {result.tokenLength && <p className="text-sm mt-1">Token length: {result.tokenLength}</p>}
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-gray-600">Подробности</summary>
            <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">Цель тестирования</h3>
        <p className="text-yellow-700">
          Эти тесты проверяют различные подходы к передаче токена Clerk в Supabase.
          Ошибка "alg" может быть связана с тем, как токен передается в заголовке Authorization.
        </p>
      </div>
    </div>
  )
}