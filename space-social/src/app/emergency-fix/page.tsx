'use client'

import { useState } from 'react'

export default function EmergencyFix() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testDirectApiCall = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Get environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables')
      }

      // Create a test file as ArrayBuffer
      const testContent = 'Direct API test file content'
      const encoder = new TextEncoder()
      const fileData = encoder.encode(testContent)
      
      // Create headers
      const headers = new Headers()
      headers.append('Authorization', `Bearer ${supabaseAnonKey}`)
      headers.append('Content-Type', 'text/plain')
      headers.append('Cache-Control', '3600')
      
      // Make direct API call to Supabase Storage
      const fileName = `direct-api-test-${Date.now()}.txt`
      const bucketName = 'post-images'
      
      const response = await fetch(
        `${supabaseUrl}/storage/v1/object/${bucketName}/${fileName}`,
        {
          method: 'POST',
          headers: headers,
          body: fileData
        }
      )
      
      const data = await response.json()
      
      setResult({ 
        operation: 'direct-api-call',
        success: response.ok,
        status: response.status,
        data,
        error: data.error || (response.ok ? null : 'Request failed')
      })
    } catch (error: any) {
      setResult({ 
        operation: 'direct-api-call',
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Аварийное исправление - Прямой API вызов</h1>
      
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <p className="font-bold">ВАЖНО!</p>
        <p>Этот тест обходит клиентскую библиотеку Supabase и делает прямые HTTP вызовы к API.</p>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={testDirectApiCall}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Тестирование...' : 'Прямой API вызов к Storage'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Результат операции: {result.operation}</h2>
          <div className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-medium">
              {result.success ? 'УСПЕХ' : 'ОШИБКА'}: {result.error || result.data?.Key || result.data?.message || 'Completed'}
            </p>
            <p className="text-sm mt-1">Статус: {result.status || 'N/A'}</p>
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
        <h3 className="font-semibold text-yellow-800 mb-2">Что это проверяет</h3>
        <p className="text-yellow-700">
          Этот тест полностью обходит клиентскую библиотеку Supabase и делает прямые HTTP вызовы к Storage API.
          Если это работает, это означает, что проблема в клиентской библиотеке или её настройке.
          Если это не работает, проблема на уровне проекта Supabase или сетевая.
        </p>
      </div>
    </div>
  )
}