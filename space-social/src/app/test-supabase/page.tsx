'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabase() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testSupabase = async () => {
      try {
        // Test a simple query
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .limit(1)

        setTestResult({
          success: !error,
          data,
          error: error ? {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          } : null
        })
      } catch (error: any) {
        setTestResult({
          success: false,
          error: {
            message: error.message,
            stack: error.stack
          }
        })
      } finally {
        setLoading(false)
      }
    }

    testSupabase()
  }, [])

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Supabase Connection</h1>
      
      {loading ? (
        <div className="p-4 bg-blue-100 rounded">Testing Supabase connection...</div>
      ) : (
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Test Results</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}