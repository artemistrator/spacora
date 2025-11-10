'use client'

import { useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default function DebugDB() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [testResults, setTestResults] = useState<any[]>([])
  const [customQuery, setCustomQuery] = useState('SELECT * FROM spaces LIMIT 1;')

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

  // Test RLS for spaces
  const testSpacesRLS = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Test SELECT
      const { data: selectData, error: selectError } = await supabaseClient
        .from('spaces')
        .select('*')
        .limit(1)
      
      addResult('Spaces SELECT', !selectError, selectData, selectError)
      
      // Test INSERT
      const { data: insertData, error: insertError } = await supabaseClient
        .from('spaces')
        .insert({
          name: `RLS Test Space ${Date.now()}`,
          description: 'Test RLS policies',
          space_type: 'apartment',
          is_public: true,
          owner_id: userId || 'test-user',
          updated_at: new Date().toISOString()
        })
        .select()
      
      addResult('Spaces INSERT', !insertError, insertData, insertError)
      
    } catch (error: any) {
      addResult('Spaces RLS Test', false, null, error)
    }
  }

  // Test RLS for posts
  const testPostsRLS = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Test SELECT
      const { data: selectData, error: selectError } = await supabaseClient
        .from('posts')
        .select('*')
        .limit(1)
      
      addResult('Posts SELECT', !selectError, selectData, selectError)
      
      // We can't test INSERT without a space ID, so we'll skip that for now
      
    } catch (error: any) {
      addResult('Posts RLS Test', false, null, error)
    }
  }

  // Test RLS for post_reactions
  const testReactionsRLS = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Test SELECT
      const { data: selectData, error: selectError } = await supabaseClient
        .from('post_reactions')
        .select('*')
        .limit(1)
      
      addResult('Reactions SELECT', !selectError, selectData, selectError)
      
    } catch (error: any) {
      addResult('Reactions RLS Test', false, null, error)
    }
  }

  // Test RLS for favorites
  const testFavoritesRLS = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Test SELECT
      const { data: selectData, error: selectError } = await supabaseClient
        .from('favorites')
        .select('*')
        .limit(1)
      
      addResult('Favorites SELECT', !selectError, selectData, selectError)
      
    } catch (error: any) {
      addResult('Favorites RLS Test', false, null, error)
    }
  }

  // Run custom query
  const runCustomQuery = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // This is a bit tricky since we need to parse the query
      // For now, let's just try a simple approach
      let data, error;
      
      if (customQuery.toLowerCase().startsWith('select')) {
        // For SELECT queries
        const { data: result, error: queryError } = await supabaseClient
          .from('spaces') // We'll use spaces as default table for now
          .select('*')
          .limit(1)
        data = result
        error = queryError
      } else {
        // For other queries, we'll need a different approach
        throw new Error('Only SELECT queries supported in this simple test')
      }
      
      addResult('Custom Query', !error, data, error)
    } catch (error: any) {
      addResult('Custom Query', false, null, error)
    }
  }

  // Test auth.uid() function
  const testAuthUidFunction = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Try to get auth.uid() - this might not work directly
      // but let's see what happens
      const { data, error } = await supabaseClient
        .from('spaces')
        .select('id')
        .limit(1)
      
      addResult('Auth UID Test', !error, { 
        data,
        userId,
        hasUserId: !!userId
      }, error)
      
    } catch (error: any) {
      addResult('Auth UID Test', false, null, error)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Database RLS Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Custom Query</label>
          <textarea
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            rows={3}
          />
          <Button onClick={runCustomQuery} className="mt-2">
            Run Custom Query
          </Button>
        </div>
        
        <div className="space-y-2">
          <Button onClick={testSpacesRLS} className="w-full">
            Test Spaces RLS
          </Button>
          <Button onClick={testPostsRLS} className="w-full">
            Test Posts RLS
          </Button>
          <Button onClick={testReactionsRLS} className="w-full">
            Test Reactions RLS
          </Button>
          <Button onClick={testFavoritesRLS} className="w-full">
            Test Favorites RLS
          </Button>
          <Button onClick={testAuthUidFunction} className="w-full">
            Test Auth UID
          </Button>
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