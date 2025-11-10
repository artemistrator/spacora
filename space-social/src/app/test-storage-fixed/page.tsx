'use client'

import { useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth'

export default function TestStorageFixed() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { supabase, getSupabaseWithSession } = useSupabaseAuth()

  const testUpload = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Получаем аутентифицированный клиент Supabase
      const supabaseClient = await getSupabaseWithSession()
      
      // Создадим тестовый файл
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      
      console.log('Attempting to upload file...')
      
      // Попробуем загрузить файл
      const { data, error } = await supabaseClient.storage
        .from('post-images')
        .upload(`test-${Date.now()}.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        setResult({ success: false, error: error.message })
        return
      }

      console.log('Upload successful:', data)
      setResult({ success: true, data })
    } catch (error: any) {
      console.error('Upload failed:', error)
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testListFiles = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Получаем аутентифицированный клиент Supabase
      const supabaseClient = await getSupabaseWithSession()
      
      // Попробуем получить список файлов
      const { data, error } = await supabaseClient.storage
        .from('post-images')
        .list()

      if (error) {
        console.error('List error:', error)
        setResult({ success: false, error: error.message })
        return
      }

      console.log('List successful:', data)
      setResult({ success: true, data })
    } catch (error: any) {
      console.error('List failed:', error)
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testApiRoute = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Test the API route
      const response = await fetch('/api/test-storage', {
        method: 'POST'
      })
      
      const result = await response.json()
      setResult(result)
    } catch (error: any) {
      console.error('API test failed:', error)
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Тест исправленного хранилища</h1>
      
      <div className="space-y-4">
        <button
          onClick={testUpload}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Тест загрузки файла'}
        </button>
        
        <button
          onClick={testListFiles}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Получение...' : 'Тест получения списка файлов'}
        </button>
        
        <button
          onClick={testApiRoute}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Тест API...' : 'Тест API маршрута'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Результат:</h2>
          <pre className="bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}