'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function TestAnonUpload() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testAnonUpload = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Create a client with the anon key
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // Create a test file
      const testFile = new File(
        ['This is a test file uploaded with anon key'], 
        `anon-test-${Date.now()}.txt`, 
        { type: 'text/plain' }
      )
      
      console.log('Attempting to upload with anon key...')
      
      // Try to upload the file
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(`anon-test-${Date.now()}.txt`, testFile, {
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
      <h1 className="text-2xl font-bold mb-6">Тест загрузки с анонимным ключом</h1>
      
      <div className="space-y-4">
        <button
          onClick={testAnonUpload}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Тест загрузки с anon ключом'}
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
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">Информация</h3>
        <p className="text-yellow-700">
          Этот тест использует анонимный ключ Supabase для загрузки файлов. 
          Если bucket настроен как публичный, это должно работать.
        </p>
      </div>
    </div>
  )
}