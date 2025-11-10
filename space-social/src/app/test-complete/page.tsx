'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSupabaseAuth } from '@/lib/auth'

export default function CompleteTest() {
  const { user } = useUser()
  const { supabase, session, userId } = useSupabaseAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [authStatus, setAuthStatus] = useState<any>(null)

  // Check authentication status on load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Get current user from Supabase
        const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser()
        
        // Get session from Supabase
        const { data: { session: supabaseSession }, error: sessionError } = await supabase.auth.getSession()
        
        setAuthStatus({
          clerkUser: user,
          clerkUserId: userId,
          clerkSession: session,
          supabaseUser,
          supabaseSession,
          userError: userError?.message,
          sessionError: sessionError?.message
        })
      } catch (error) {
        console.error('Auth check error:', error)
      }
    }
    
    checkAuthStatus()
  }, [user, session, userId, supabase])

  const testUpload = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Create a test file
      const testFile = new File(
        ['This is a test file for storage upload verification'], 
        `test-file-${Date.now()}.txt`, 
        { type: 'text/plain' }
      )
      
      console.log('Attempting to upload file...')
      
      // Try to upload the file
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(`test/${Date.now()}/test-file.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        setResult({ 
          success: false, 
          operation: 'upload',
          error: error.message,
          details: error
        })
        return
      }

      console.log('Upload successful:', data)
      setResult({ 
        success: true, 
        operation: 'upload',
        data 
      })
    } catch (error: any) {
      console.error('Upload failed:', error)
      setResult({ 
        success: false, 
        operation: 'upload',
        error: error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  const testListFiles = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Try to list files
      const { data, error } = await supabase.storage
        .from('post-images')
        .list('test/', {
          limit: 10,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) {
        console.error('List error:', error)
        setResult({ 
          success: false, 
          operation: 'list',
          error: error.message,
          details: error
        })
        return
      }

      console.log('List successful:', data)
      setResult({ 
        success: true, 
        operation: 'list',
        data 
      })
    } catch (error: any) {
      console.error('List failed:', error)
      setResult({ 
        success: false, 
        operation: 'list',
        error: error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  const testDeleteFile = async () => {
    setLoading(true)
    setResult(null)

    try {
      // First, list files to get a file to delete
      const { data: files, error: listError } = await supabase.storage
        .from('post-images')
        .list('test/', {
          limit: 1,
          offset: 0
        })

      if (listError) {
        setResult({ 
          success: false, 
          operation: 'delete',
          error: 'Failed to list files: ' + listError.message
        })
        return
      }

      if (!files || files.length === 0) {
        setResult({ 
          success: false, 
          operation: 'delete',
          error: 'No files found to delete'
        })
        return
      }

      const fileName = files[0].name
      console.log('Attempting to delete file:', fileName)
      
      // Try to delete the file
      const { data, error } = await supabase.storage
        .from('post-images')
        .remove([fileName])

      if (error) {
        console.error('Delete error:', error)
        setResult({ 
          success: false, 
          operation: 'delete',
          error: error.message,
          details: error
        })
        return
      }

      console.log('Delete successful:', data)
      setResult({ 
        success: true, 
        operation: 'delete',
        data,
        message: `Successfully deleted ${fileName}`
      })
    } catch (error: any) {
      console.error('Delete failed:', error)
      setResult({ 
        success: false, 
        operation: 'delete',
        error: error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Полный тест хранилища</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Статус аутентификации</h2>
        {authStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Clerk</h3>
              <p>User ID: {authStatus.clerkUserId || 'N/A'}</p>
              <p>Session: {authStatus.clerkSession ? 'Active' : 'None'}</p>
            </div>
            <div>
              <h3 className="font-medium">Supabase</h3>
              <p>User: {authStatus.supabaseUser ? 'Authenticated' : 'Not authenticated'}</p>
              <p>Session: {authStatus.supabaseSession ? 'Active' : 'None'}</p>
            </div>
            {(authStatus.userError || authStatus.sessionError) && (
              <div className="md:col-span-2 text-red-600">
                <p>Errors: {authStatus.userError} {authStatus.sessionError}</p>
              </div>
            )}
          </div>
        ) : (
          <p>Проверка статуса...</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testUpload}
          disabled={loading}
          className="px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Загрузка...' : 'Тест загрузки'}
        </button>
        
        <button
          onClick={testListFiles}
          disabled={loading}
          className="px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Получение...' : 'Тест списка файлов'}
        </button>
        
        <button
          onClick={testDeleteFile}
          disabled={loading}
          className="px-4 py-3 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Удаление...' : 'Тест удаления'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 rounded border bg-white shadow">
          <h2 className="text-lg font-semibold mb-2">Результат операции: {result.operation}</h2>
          <div className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-medium">
              {result.success ? 'Успех' : 'Ошибка'}: {result.message || result.error}
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

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">Инструкции по тестированию</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
          <li>Убедитесь, что вы вошли в систему через Clerk</li>
          <li>Нажмите "Тест загрузки" для проверки возможности загрузки файлов</li>
          <li>После успешной загрузки нажмите "Тест списка файлов"</li>
          <li>Нажмите "Тест удаления" для проверки возможности удаления файлов</li>
          <li>Проверьте консоль браузера на наличие ошибок</li>
        </ol>
      </div>
    </div>
  )
}