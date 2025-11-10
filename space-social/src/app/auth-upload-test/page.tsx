'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSupabaseAuth } from '@/lib/auth'

export default function AuthUploadTest() {
  const { user } = useUser()
  const { supabase, getSupabaseWithSession } = useSupabaseAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testAuthenticatedUpload = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Get authenticated client using the new method
      const supabaseClient = await getSupabaseWithSession()
      
      // Create a test file
      const testFile = new File(
        [`This is an authenticated test file. User: ${user?.id || 'unknown'}`], 
        `auth-test-${Date.now()}.txt`, 
        { type: 'text/plain' }
      )
      
      console.log('Attempting authenticated upload test...')
      
      // Try to upload the file
      const { data, error } = await supabaseClient.storage
        .from('post-images')
        .upload(`auth-test-${Date.now()}.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        setResult({ 
          success: false, 
          error: error.message, 
          details: error,
          operation: 'auth-upload',
          userId: user?.id
        })
        return
      }

      console.log('Upload successful:', data)
      setResult({ 
        success: true, 
        data,
        operation: 'auth-upload',
        userId: user?.id
      })
    } catch (error: any) {
      console.error('Upload failed:', error)
      setResult({ 
        success: false, 
        error: error.message,
        operation: 'auth-upload',
        userId: user?.id
      })
    } finally {
      setLoading(false)
    }
  }

  const testAnonymousUpload = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Use the global client (anon key)
      const supabaseClient = supabase
      
      // Create a test file
      const testFile = new File(
        [`This is an anonymous test file.`], 
        `anon-test-${Date.now()}.txt`, 
        { type: 'text/plain' }
      )
      
      console.log('Attempting anonymous upload test...')
      
      // Try to upload the file
      const { data, error } = await supabaseClient.storage
        .from('post-images')
        .upload(`anon-test-${Date.now()}.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        setResult({ 
          success: false, 
          error: error.message, 
          details: error,
          operation: 'anon-upload'
        })
        return
      }

      console.log('Upload successful:', data)
      setResult({ 
        success: true, 
        data,
        operation: 'anon-upload'
      })
    } catch (error: any) {
      console.error('Upload failed:', error)
      setResult({ 
        success: false, 
        error: error.message,
        operation: 'anon-upload'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Тест аутентифицированной загрузки</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Информация о пользователе</h2>
        <p>Clerk User ID: {user?.id || 'Не вошли в систему'}</p>
        <p>Статус: {user ? 'Вошли' : 'Не вошли'}</p>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={testAnonymousUpload}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Тест анонимной загрузки'}
        </button>
        
        <button
          onClick={testAuthenticatedUpload}
          disabled={loading || !user}
          className="w-full px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Тест аутентифицированной загрузки'}
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
        <h3 className="font-semibold text-yellow-800 mb-2">Инструкции</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
          <li>Сначала попробуйте "Тест анонимной загрузки"</li>
          <li>Затем попробуйте "Тест аутентифицированной загрузки"</li>
          <li>Если оба теста работают, проблема решена!</li>
        </ol>
      </div>
    </div>
  )
}