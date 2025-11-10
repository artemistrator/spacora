'use client'

import { useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function DebugManualAuth() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [testResults, setTestResults] = useState<any[]>([])

  const addResult = (testName: string, success: boolean, data?: any, error?: any) => {
    const result = {
      testName,
      success,
      data: data ? JSON.stringify(data, null, 2) : null,
      error: error ? JSON.stringify(error, null, 2) : null,
      timestamp: new Date().toISOString()
    }
    
    setTestResults(prev => [...prev, result])
    console.log(`Test: ${testName}`, result)
  }

  // Test current auth state
  const testCurrentAuthState = async () => {
    try {
      // Check current session
      const { data: { session } } = await supabase.auth.getSession()
      
      addResult('Current Auth State', true, { 
        hasSession: !!session,
        session: session ? {
          user: session.user?.id,
          expiresAt: session.expires_at
        } : null
      })
      
    } catch (error: any) {
      addResult('Current Auth State', false, null, error)
    }
  }

  // Test manual session setting (if possible)
  const testManualSessionSetting = async () => {
    try {
      // This is just for debugging - we can't actually set a session without a proper JWT
      addResult('Manual Session Setting', true, { 
        message: 'Cannot set session without proper JWT token' 
      })
      
    } catch (error: any) {
      addResult('Manual Session Setting', false, null, error)
    }
  }

  // Test raw insert with anon key
  const testRawInsert = async () => {
    if (!userId) {
      addResult('Raw Insert', false, null, { message: 'No user ID available' })
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('spaces')
        .insert({
          name: `Raw Insert Test ${Date.now()}`,
          description: 'Test with raw anon key client',
          space_type: 'apartment',
          is_public: true,
          owner_id: userId,
          updated_at: new Date().toISOString()
        })
        .select()
      
      addResult('Raw Insert', !error, data, error)
      
    } catch (error: any) {
      addResult('Raw Insert', false, null, error)
    }
  }

  // Test if we can bypass RLS with a special approach
  const testBypassRLS = async () => {
    try {
      // This would require the service role key which we don't have
      addResult('Bypass RLS', true, { 
        message: 'Cannot bypass RLS without service role key' 
      })
      
    } catch (error: any) {
      addResult('Bypass RLS', false, null, error)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Manual Authentication Debug</h1>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button onClick={testCurrentAuthState}>
            Test Current Auth State
          </Button>
          <Button onClick={testManualSessionSetting}>
            Test Manual Session Setting
          </Button>
          <Button onClick={testRawInsert}>
            Test Raw Insert
          </Button>
          <Button onClick={testBypassRLS}>
            Test Bypass RLS
          </Button>
        </div>
        
        <div className="p-4 bg-blue-100 rounded mb-4">
          <h2 className="text-lg font-semibold mb-2">Current User ID</h2>
          <p className="font-mono">{userId || 'Not available'}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Results</h2>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No test results yet. Run some tests above.</p>
        ) : (
          testResults.map((result, index) => (
            <div 
              key={index} 
              className={`p-4 rounded border ${
                result.success ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{result.testName}</h3>
                <span className={`px-2 py-1 rounded text-sm ${
                  result.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {result.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              
              {result.data && (
                <div className="mt-2">
                  <h4 className="font-medium">Data:</h4>
                  <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
                    {result.data}
                  </pre>
                </div>
              )}
              
              {result.error && (
                <div className="mt-2">
                  <h4 className="font-medium text-red-700">Error:</h4>
                  <pre className="text-xs bg-gray-800 text-red-400 p-2 rounded overflow-x-auto">
                    {result.error}
                  </pre>
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-2">
                {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}