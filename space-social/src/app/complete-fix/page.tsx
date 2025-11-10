'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSession } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { useSupabaseAuth } from '@/lib/auth'

export default function CompleteFix() {
  const { user } = useUser()
  const { session } = useSession()
  const { getSupabaseWithSession } = useSupabaseAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [currentTest, setCurrentTest] = useState<string>('')

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(true)
    setCurrentTest(testName)
    setResult(null)

    try {
      const testResult = await testFunction()
      setResult({ ...testResult, testName })
    } catch (error: any) {
      setResult({ 
        success: false, 
        error: error.message,
        testName
      })
    } finally {
      setLoading(false)
      setCurrentTest('')
    }
  }

  // Test 1: Anonymous upload
  const testAnonymousUpload = async () => {
    const testFile = new File(
      [`Anonymous test`], 
      `anon-${Date.now()}.txt`, 
      { type: 'text/plain' }
    )
    
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(`anon-${Date.now()}.txt`, testFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    return { success: true, data, operation: 'anonymous-upload' }
  }

  // Test 2: Authenticated upload (method 1)
  const testAuthUploadMethod1 = async () => {
    if (!session) throw new Error('No session')
    
    const supabaseClient = await getSupabaseWithSession()
    const testFile = new File(
      [`Auth method 1. User: ${user?.id}`], 
      `auth1-${Date.now()}.txt`, 
      { type: 'text/plain' }
    )
    
    const { data, error } = await supabaseClient.storage
      .from('post-images')
      .upload(`auth1-${Date.now()}.txt`, testFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    return { success: true, data, operation: 'auth-upload-method-1', userId: user?.id }
  }

  // Test 3: Manual token approach
  const testManualToken = async () => {
    if (!session) throw new Error('No session')
    
    // Get token manually
    const token = await session.getToken()
    
    // Create client with manual token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const manualClient = (await import('@supabase/supabase-js')).createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
    
    const testFile = new File(
      [`Manual token. User: ${user?.id}`], 
      `manual-${Date.now()}.txt`, 
      { type: 'text/plain' }
    )
    
    const { data, error } = await manualClient.storage
      .from('post-images')
      .upload(`manual-${Date.now()}.txt`, testFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    return { success: true, data, operation: 'manual-token', userId: user?.id, tokenLength: token?.length || 0 }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Полное решение проблемы</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Информация о пользователе</h2>
        <p><strong>Clerk User ID:</strong> {user?.id || 'Не вошли в систему'}</p>
        <p><strong>Статус:</strong> {user ? 'Вошли' : 'Не вошли'}</p>
        <p><strong>Session:</strong> {session ? 'Активна' : 'Нет'}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => runTest('anonymous-upload', testAnonymousUpload)}
          disabled={loading}
          className="px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading && currentTest === 'anonymous-upload' ? 'Тест...' : 'Анонимная загрузка'}
        </button>
        
        <button
          onClick={() => runTest('auth-method-1', testAuthUploadMethod1)}
          disabled={loading || !session}
          className="px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {loading && currentTest === 'auth-method-1' ? 'Тест...' : 'Аутент. загрузка'}
        </button>
        
        <button
          onClick={() => runTest('manual-token', testManualToken)}
          disabled={loading || !session}
          className="px-4 py-3 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 transition-colors"
        >
          {loading && currentTest === 'manual-token' ? 'Тест...' : 'Ручной токен'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 rounded border bg-white shadow">
          <h2 className="text-lg font-semibold mb-2">
            Результат теста: {result.testName}
          </h2>
          <div className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-medium">
              {result.success ? '✅ УСПЕХ' : '❌ ОШИБКА'}: {result.error || 'Operation completed successfully'}
            </p>
            {result.userId && <p className="text-sm mt-1">User ID: {result.userId}</p>}
            {result.tokenLength && <p className="text-sm mt-1">Token length: {result.tokenLength}</p>}
          </div>
          {result.data && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-gray-600">Данные</summary>
              <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto max-h-60">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded">
        <h3 className="font-semibold text-green-800 mb-2">🎉 Решение проблемы</h3>
        <p className="text-green-700">
          Ошибка "alg" (Algorithm) Header Parameter value not allowed возникала из-за несовместимости 
          токена Clerk с ожиданиями Supabase. Мы протестировали несколько подходов к решению этой проблемы.
        </p>
        <p className="text-green-700 mt-2">
          Один из методов должен работать. После определения рабочего метода, 
          мы можем обновить основную логику аутентификации.
        </p>
      </div>
    </div>
  )
}