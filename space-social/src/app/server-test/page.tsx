'use client'

import { useState } from 'react'

export default function ServerTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testServerList = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/storage-test', {
        method: 'GET'
      })
      
      const data = await response.json()
      setResult({ 
        operation: 'server-list',
        success: response.ok,
        data,
        error: data.error
      })
    } catch (error: any) {
      setResult({ 
        operation: 'server-list',
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const testServerUpload = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/storage-test', {
        method: 'POST'
      })
      
      const data = await response.json()
      setResult({ 
        operation: 'server-upload',
        success: response.ok,
        data,
        error: data.error
      })
    } catch (error: any) {
      setResult({ 
        operation: 'server-upload',
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Серверный тест хранилища</h1>
      
      <div className="space-y-4">
        <button
          onClick={testServerList}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Получение...' : 'Тест списка файлов (сервер)'}
        </button>
        
        <button
          onClick={testServerUpload}
          disabled={loading}
          className="w-full px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Тест загрузки файла (сервер)'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Результат операции: {result.operation}</h2>
          <div className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-medium">
              {result.success ? 'УСПЕХ' : 'ОШИБКА'}: {result.data?.message || result.error}
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
        <h3 className="font-semibold text-blue-800 mb-2">Информация</h3>
        <p className="text-blue-700">
          Этот тест выполняется на сервере и может использовать сервисный ключ для обхода RLS.
          Если это работает, это означает, что проблема в клиентской части.
        </p>
      </div>
    </div>
  )
}