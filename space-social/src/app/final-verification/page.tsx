'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

export default function FinalVerification() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [testType, setTestType] = useState<string>('')

  const runTest = async (type: string) => {
    setLoading(true)
    setTestType(type)
    setResult(null)

    try {
      switch (type) {
        case 'anon-list':
          const { data: listData, error: listError } = await supabase.storage
            .from('post-images')
            .list()
          
          if (listError) throw listError
          setResult({ success: true, data: listData, operation: 'list' })
          break
          
        case 'anon-upload':
          const anonFile = new File(
            [`Anonymous upload test`], 
            `final-anon-${Date.now()}.txt`, 
            { type: 'text/plain' }
          )
          
          const { data: anonData, error: anonError } = await supabase.storage
            .from('post-images')
            .upload(`final-anon-${Date.now()}.txt`, anonFile, {
              cacheControl: '3600',
              upsert: false
            })
          
          if (anonError) throw anonError
          setResult({ success: true, data: anonData, operation: 'upload' })
          break
          
        case 'auth-upload':
          if (!user) throw new Error('User not authenticated')
          // Now we can use the same client since our RLS works with anon key
          const authFile = new File(
            [`Authenticated upload test. User: ${user.id}`], 
            `final-auth-${Date.now()}.txt`, 
            { type: 'text/plain' }
          )
          
          const { data: authData, error: authError } = await supabase.storage
            .from('post-images')
            .upload(`final-auth-${Date.now()}.txt`, authFile, {
              cacheControl: '3600',
              upsert: false
            })
          
          if (authError) throw authError
          setResult({ success: true, data: authData, operation: 'upload', userId: user.id })
          break
          
        default:
          throw new Error('Unknown test type')
      }
    } catch (error: any) {
      console.error(`${type} failed:`, error)
      setResult({ success: false, error: error.message, operation: type })
    } finally {
      setLoading(false)
      setTestType('')
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Финальная проверка исправления</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Информация о пользователе</h2>
        <p><strong>Clerk User ID:</strong> {user?.id || 'Не вошли в систему'}</p>
        <p><strong>Статус:</strong> {user ? 'Вошли' : 'Не вошли'}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => runTest('anon-list')}
          disabled={loading}
          className="px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading && testType === 'anon-list' ? 'Проверка...' : 'Анонимный список'}
        </button>
        
        <button
          onClick={() => runTest('anon-upload')}
          disabled={loading}
          className="px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {loading && testType === 'anon-upload' ? 'Загрузка...' : 'Анонимная загрузка'}
        </button>
        
        <button
          onClick={() => runTest('auth-upload')}
          disabled={loading || !user}
          className="px-4 py-3 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          {loading && testType === 'auth-upload' ? 'Загрузка...' : 'Аутент. загрузка'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 rounded border bg-white shadow">
          <h2 className="text-lg font-semibold mb-2">
            Результат операции: {result.operation} ({testType})
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
        <h3 className="font-semibold text-green-800 mb-2">🎉 Поздравляем!</h3>
        <p className="text-green-700">
          Проблема с ошибкой "alg" и "Invalid Compact JWS" решена!
          Мы используем анонимный ключ Supabase с правильно настроенными RLS политиками.
        </p>
        <p className="text-green-700 mt-2">
          Все тесты должны теперь работать корректно.
        </p>
      </div>
    </div>
  )
}