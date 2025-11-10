'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function TestServiceKey() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testServiceKeyUpload = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Try different possible service key environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const possibleServiceKeys = [
        process.env.SUPABASE_SERVICE_KEY,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        process.env.SERVICE_ROLE_KEY
      ]
      
      const supabaseServiceKey = possibleServiceKeys.find(key => key)
      
      if (!supabaseServiceKey) {
        // If no service key is found, let's try to get it from the backend
        try {
          const response = await fetch('/api/get-service-key')
          const { serviceKey } = await response.json()
          
          if (!serviceKey) {
            setResult({ success: false, error: 'Service key not found in any environment variables' })
            return
          }
          
          const supabase = createClient(supabaseUrl, serviceKey)
          
          // Create a test file
          const testFile = new File(
            ['This is a test file uploaded with service key'], 
            `service-key-test-${Date.now()}.txt`, 
            { type: 'text/plain' }
          )
          
          console.log('Attempting to upload with service key...')
          
          // Try to upload the file (this should bypass RLS)
          const { data, error } = await supabase.storage
            .from('post-images')
            .upload(`service-key-test-${Date.now()}.txt`, testFile, {
              cacheControl: '3600',
              upsert: false
            })

          if (error) {
            console.error('Upload error:', error)
            setResult({ success: false, error: error.message, details: error })
            return
          }

          console.log('Upload successful:', data)
          setResult({ success: true, data })
        } catch (apiError: any) {
          console.error('API call failed:', apiError)
          setResult({ success: false, error: 'Failed to get service key from backend: ' + apiError.message })
        }
        return
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      // Create a test file
      const testFile = new File(
        ['This is a test file uploaded with service key'], 
        `service-key-test-${Date.now()}.txt`, 
        { type: 'text/plain' }
      )
      
      console.log('Attempting to upload with service key...')
      
      // Try to upload the file (this should bypass RLS)
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(`service-key-test-${Date.now()}.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        setResult({ success: false, error: error.message, details: error })
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

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Тест загрузки с сервисным ключом</h1>
      
      <div className="space-y-4">
        <button
          onClick={testServiceKeyUpload}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Тест загрузки с сервисным ключом'}
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
      
      <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="font-semibold text-red-800 mb-2">ВАЖНО: Предупреждение о безопасности</h3>
        <p className="text-red-700">
          Этот тест использует сервисный ключ Supabase, который обходит все политики безопасности (RLS).
          Никогда не используйте сервисный ключ в клиентском коде в production!
          Сервисный ключ должен использоваться только на сервере для административных задач.
        </p>
      </div>
    </div>
  )
}