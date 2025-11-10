'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientFixTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testClientUpload = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Create a test file
      const testFile = new File(
        ['This is a client test file'], 
        `client-test-${Date.now()}.txt`, 
        { type: 'text/plain' }
      )
      
      console.log('Attempting client upload test...')
      
      // Try to upload the file using the properly configured client
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(`client-test-${Date.now()}.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        setResult({ 
          success: false, 
          error: error.message, 
          details: error,
          operation: 'upload'
        })
        return
      }

      console.log('Upload successful:', data)
      setResult({ 
        success: true, 
        data,
        operation: 'upload'
      })
    } catch (error: any) {
      console.error('Upload failed:', error)
      setResult({ 
        success: false, 
        error: error.message,
        operation: 'upload'
      })
    } finally {
      setLoading(false)
    }
  }

  const testClientList = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Try to list files using the properly configured client
      const { data, error } = await supabase.storage
        .from('post-images')
        .list()

      if (error) {
        console.error('List error:', error)
        setResult({ 
          success: false, 
          error: error.message, 
          details: error,
          operation: 'list'
        })
        return
      }

      console.log('List successful:', data)
      setResult({ 
        success: true, 
        data,
        operation: 'list'
      })
    } catch (error: any) {
      console.error('List failed:', error)
      setResult({ 
        success: false, 
        error: error.message,
        operation: 'list'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Тест исправленного клиентского хранилища</h1>
      
      <div className="space-y-4">
        <button
          onClick={testClientList}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Получение...' : 'Тест списка файлов (клиент)'}
        </button>
        
        <button
          onClick={testClientUpload}
          disabled={loading}
          className="w-full px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Тест загрузки файла (клиент)'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Результат операции: {result.operation}</h2>
          <div className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-medium">
              {result.success ? 'УСПЕХ' : 'ОШИБКА'}: {result.error || 'Operation completed successfully'}
            </p>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-gray-600">Подробности</summary>
            <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded">
        <h3 className="font-semibold text-green-800 mb-2">Информация</h3>
        <p className="text-green-700">
          Этот тест использует исправленную конфигурацию клиентской библиотеки Supabase.
          Если тесты пройдут успешно, это означает, что проблема была в конфигурации клиента.
        </p>
      </div>
    </div>
  )
}