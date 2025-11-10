'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

export default function DiagnosticsPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [diagnostics, setDiagnostics] = useState<any>(null)

  // Run diagnostics on page load
  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      // Check for service keys
      const serviceKeys = {
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Missing',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
        SERVICE_ROLE_KEY: process.env.SERVICE_ROLE_KEY ? 'Set' : 'Missing',
        NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
      }
      
      // Get environment info
      const envInfo = {
        supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
        anonKey: supabaseAnonKey ? 'Set' : 'Missing',
        serviceKeys
      }
      
      // Get user info
      const userInfo = {
        clerkUserId: user?.id || 'Not logged in',
        hasClerkSession: !!user
      }
      
      setDiagnostics({
        envInfo,
        userInfo
      })
    } catch (error) {
      console.error('Diagnostics failed:', error)
    }
  }

  const testAnonList = async () => {
    setLoading(true)
    setResult(null)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // Try to list files with anon key
      const { data, error } = await supabase.storage
        .from('post-images')
        .list()

      setResult({ 
        operation: 'anon-list',
        success: !error,
        data,
        error: error?.message
      })
    } catch (error: any) {
      setResult({ 
        operation: 'anon-list',
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const testBucketInfo = async () => {
    setLoading(true)
    setResult(null)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // Try to get bucket info
      // Note: This is a workaround since we can't directly query the buckets table
      const testFile = new File(['test'], 'bucket-test.txt', { type: 'text/plain' })
      
      // Try to upload to test if bucket exists and is accessible
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(`bucket-test-${Date.now()}.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        })

      setResult({ 
        operation: 'bucket-info',
        success: !error,
        data,
        error: error?.message
      })
    } catch (error: any) {
      setResult({ 
        operation: 'bucket-info',
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const testClerkAuthUpload = async () => {
    setLoading(true)
    setResult(null)

    try {
      // This would normally use your Clerk-authenticated Supabase client
      // But we'll simulate the issue you're experiencing
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      const testFile = new File(['test'], 'clerk-auth-test.txt', { type: 'text/plain' })
      
      // Try to upload with anon client (this simulates the issue)
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(`clerk-auth-test-${Date.now()}.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        })

      setResult({ 
        operation: 'clerk-auth-upload',
        success: !error,
        data,
        error: error?.message,
        note: 'This test uses anon key instead of Clerk auth - same issue you are experiencing'
      })
    } catch (error: any) {
      setResult({ 
        operation: 'clerk-auth-upload',
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const checkServiceKeyAvailability = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/get-service-key')
      const data = await response.json()
      
      setResult({ 
        operation: 'service-key-check',
        success: response.ok,
        data,
        error: data.error
      })
    } catch (error: any) {
      setResult({ 
        operation: 'service-key-check',
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Диагностика хранилища</h1>
      
      {diagnostics && (
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">Информация о среде</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Переменные окружения</h3>
              <ul className="list-disc list-inside">
                <li>Supabase URL: {diagnostics.envInfo.supabaseUrl}</li>
                <li>Anon Key: {diagnostics.envInfo.anonKey}</li>
                <li>Service Keys:
                  <ul className="list-disc list-inside ml-4">
                    <li>SUPABASE_SERVICE_KEY: {diagnostics.envInfo.serviceKeys.SUPABASE_SERVICE_KEY}</li>
                    <li>SUPABASE_SERVICE_ROLE_KEY: {diagnostics.envInfo.serviceKeys.SUPABASE_SERVICE_ROLE_KEY}</li>
                    <li>SERVICE_ROLE_KEY: {diagnostics.envInfo.serviceKeys.SERVICE_ROLE_KEY}</li>
                    <li>NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: {diagnostics.envInfo.serviceKeys.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}</li>
                  </ul>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium">Пользователь</h3>
              <ul className="list-disc list-inside">
                <li>Clerk User ID: {diagnostics.userInfo.clerkUserId}</li>
                <li>Сессия: {diagnostics.userInfo.hasClerkSession ? 'Активна' : 'Нет'}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testAnonList}
          disabled={loading}
          className="px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Проверка...' : 'Тест списка (Anon)'}
        </button>
        
        <button
          onClick={testBucketInfo}
          disabled={loading}
          className="px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Проверка...' : 'Информация о Bucket'}
        </button>
        
        <button
          onClick={testClerkAuthUpload}
          disabled={loading}
          className="px-4 py-3 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Проверка...' : 'Тест загрузки (Clerk Auth)'}
        </button>
        
        <button
          onClick={checkServiceKeyAvailability}
          disabled={loading}
          className="px-4 py-3 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Проверка...' : 'Проверка Service Key'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 rounded border bg-white shadow">
          <h2 className="text-lg font-semibold mb-2">Результат операции: {result.operation}</h2>
          <div className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-medium">
              {result.success ? 'Успех' : 'Ошибка'}: {result.note || result.error}
            </p>
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

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">Что мы тестируем</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
          <li><strong>Тест списка (Anon)</strong>: Проверяет, можно ли получить список файлов с анонимным ключом</li>
          <li><strong>Информация о Bucket</strong>: Проверяет существование и доступность bucket 'post-images'</li>
          <li><strong>Тест загрузки (Clerk Auth)</strong>: Имитирует проблему с загрузкой файлов через Clerk</li>
          <li><strong>Проверка Service Key</strong>: Проверяет доступность сервисного ключа через backend</li>
        </ul>
      </div>
    </div>
  )
}