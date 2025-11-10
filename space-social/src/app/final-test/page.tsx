'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

export default function FinalTest() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testUpload = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Create a client with anon key to simulate the issue
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // Create a test file
      const testFile = new File(
        ['This is a final test file'], 
        `final-test-${Date.now()}.txt`, 
        { type: 'text/plain' }
      )
      
      console.log('Attempting final upload test...')
      
      // Try to upload the file
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(`final-test-${Date.now()}.txt`, testFile, {
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

  const testList = async () => {
    setLoading(true)
    setResult(null)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // Try to list files
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

  const testDelete = async () => {
    setLoading(true)
    setResult(null)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // First, list files to get something to delete
      const { data: files, error: listError } = await supabase.storage
        .from('post-images')
        .list('', { limit: 1 })

      if (listError) {
        setResult({ 
          success: false, 
          error: 'List failed: ' + listError.message,
          operation: 'delete'
        })
        return
      }

      if (!files || files.length === 0) {
        setResult({ 
          success: false, 
          error: 'No files to delete',
          operation: 'delete'
        })
        return
      }

      // Try to delete a file
      const { data, error } = await supabase.storage
        .from('post-images')
        .remove([files[0].name])

      if (error) {
        console.error('Delete error:', error)
        setResult({ 
          success: false, 
          error: error.message, 
          details: error,
          operation: 'delete'
        })
        return
      }

      console.log('Delete successful:', data)
      setResult({ 
        success: true, 
        data,
        operation: 'delete',
        message: `Successfully deleted ${files[0].name}`
      })
    } catch (error: any) {
      console.error('Delete failed:', error)
      setResult({ 
        success: false, 
        error: error.message,
        operation: 'delete'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Финальный тест хранилища</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Информация о пользователе</h2>
        <p>Clerk User ID: {user?.id || 'Не вошли в систему'}</p>
        <p>Статус: {user ? 'Вошли' : 'Не вошли'}</p>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={testUpload}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Тест загрузки файла'}
        </button>
        
        <button
          onClick={testList}
          disabled={loading}
          className="w-full px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Получение...' : 'Тест получения списка файлов'}
        </button>
        
        <button
          onClick={testDelete}
          disabled={loading}
          className="w-full px-4 py-3 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? 'Удаление...' : 'Тест удаления файла'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Результат операции: {result.operation}</h2>
          <div className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-medium">
              {result.success ? 'УСПЕХ' : 'ОШИБКА'}: {result.message || result.error}
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
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">Инструкции</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Сначала выполните "Тест загрузки файла"</li>
          <li>Если загрузка успешна, выполните "Тест получения списка файлов"</li>
          <li>Если список получен успешно, выполните "Тест удаления файла"</li>
          <li>Проверьте консоль браузера на наличие ошибок</li>
        </ol>
      </div>
    </div>
  )
}