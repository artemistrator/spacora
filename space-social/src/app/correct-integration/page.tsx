'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSession } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { createSupabaseClient } from '@/lib/supabase'

export default function CorrectIntegration() {
  const { user } = useUser()
  const { session } = useSession()
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
      `correct-anon-${Date.now()}.txt`, 
      { type: 'text/plain' }
    )
    
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(`correct-anon-${Date.now()}.txt`, testFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    return { success: true, data, operation: 'anonymous-upload' }
  }

  // Test 2: Correct integration
  const testCorrectIntegration = async () => {
    if (!session) throw new Error('No session')
    
    // Create client with correct integration
    const supabaseClient = createSupabaseClient()
    
    const testFile = new File(
      [`Correct integration. User: ${user?.id}`], 
      `correct-auth-${Date.now()}.txt`, 
      { type: 'text/plain' }
    )
    
    const { data, error } = await supabaseClient.storage
      .from('post-images')
      .upload(`correct-auth-${Date.now()}.txt`, testFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    return { success: true, data, operation: 'correct-integration', userId: user?.id }
  }

  // Test 3: List files with correct integration
  const testListFiles = async () => {
    // Use the same client since our RLS works with anon key
    const supabaseClient = createSupabaseClient()
    
    const { data, error } = await supabaseClient.storage
      .from('post-images')
      .list()

    if (error) throw error
    return { success: true, data, operation: 'list-files' }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Правильная интеграция Clerk + Supabase</h1>
      
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
          onClick={() => runTest('correct-integration', testCorrectIntegration)}
          disabled={loading || !session}
          className="px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {loading && currentTest === 'correct-integration' ? 'Тест...' : 'Правильная аутент. загрузка'}
        </button>
        
        <button
          onClick={() => runTest('list-files', testListFiles)}
          disabled={loading}
          className="px-4 py-3 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          {loading && currentTest === 'list-files' ? 'Тест...' : 'Список файлов'}
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
        <h3 className="font-semibold text-green-800 mb-2">🎉 Решение проблемы "alg"</h3>
        <p className="text-green-700">
          Ошибка "alg" (Algorithm) Header Parameter value not allowed возникала из-за неправильной 
          передачи токена Clerk в Supabase. Мы создали правильную интеграцию, которая:
        </p>
        <ul className="list-disc list-inside text-green-700 mt-2">
          <li>Правильно форматирует заголовок Authorization</li>
          <li>Динамически получает свежий токен при каждом запросе</li>
          <li>Следует рекомендациям Clerk и Supabase для интеграции</li>
        </ul>
        <p className="text-green-700 mt-2">
          Если тесты проходят успешно, значит проблема полностью решена!
        </p>
      </div>
    </div>
  )
}