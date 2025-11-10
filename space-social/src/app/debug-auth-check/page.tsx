'use client'

import { useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default function DebugAuthCheck() {
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

  // Test inserting with matching owner_id
  const testInsertWithMatchingOwnerId = async () => {
    if (!userId) {
      addResult('Insert with Matching Owner ID', false, null, { message: 'No user ID available' })
      return
    }
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      const { data, error } = await supabaseClient
        .from('spaces')
        .insert({
          name: `Test Space ${Date.now()}`,
          description: 'Test with matching owner ID',
          space_type: 'apartment',
          is_public: true,
          owner_id: userId, // This should match the authenticated user
          updated_at: new Date().toISOString()
        })
        .select()
      
      addResult('Insert with Matching Owner ID', !error, data, error)
      
    } catch (error: any) {
      addResult('Insert with Matching Owner ID', false, null, error)
    }
  }

  // Test inserting with mismatched owner_id
  const testInsertWithMismatchedOwnerId = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      const { data, error } = await supabaseClient
        .from('spaces')
        .insert({
          name: `Test Space ${Date.now()}`,
          description: 'Test with mismatched owner ID',
          space_type: 'apartment',
          is_public: true,
          owner_id: 'mismatched-user-id',
          updated_at: new Date().toISOString()
        })
        .select()
      
      addResult('Insert with Mismatched Owner ID', !error, data, error)
      
    } catch (error: any) {
      addResult('Insert with Mismatched Owner ID', false, null, error)
    }
  }

  // Test auth.uid() directly in insert
  const testInsertWithAuthUid = async () => {
    if (!userId) {
      addResult('Insert with Auth UID', false, null, { message: 'No user ID available' })
      return
    }
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // This would require a different approach since we can't directly use auth.uid() in client-side code
      addResult('Insert with Auth UID', true, { message: 'Cannot test directly in client - would require server-side function' }, null)
      
    } catch (error: any) {
      addResult('Insert with Auth UID', false, null, error)
    }
  }

  // Check current user data
  const checkCurrentUserData = async () => {
    if (!userId) {
      addResult('Check Current User Data', false, null, { message: 'No user ID available' })
      return
    }
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Check users table
      const { data: usersData, error: usersError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
      
      addResult('Check Users Table', !usersError, usersData, usersError)
      
      // Check user_identities table
      const { data: identitiesData, error: identitiesError } = await supabaseClient
        .from('user_identities')
        .select('*')
        .eq('clerk_id', userId)
      
      addResult('Check User Identities Table', !identitiesError, identitiesData, identitiesError)
      
    } catch (error: any) {
      addResult('Check Current User Data', false, null, error)
    }
  }

  // Test current role
  const testCurrentRole = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Try to call our test function
      const { data, error } = await supabaseClient.rpc('test_current_role')
      
      addResult('Test Current Role', !error, data, error)
      
    } catch (error: any) {
      addResult('Test Current Role', false, null, error)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication Check Debug</h1>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button onClick={testInsertWithMatchingOwnerId}>
            Test Insert with Matching Owner ID
          </Button>
          <Button onClick={testInsertWithMismatchedOwnerId}>
            Test Insert with Mismatched Owner ID
          </Button>
          <Button onClick={testInsertWithAuthUid}>
            Test Insert with Auth UID
          </Button>
          <Button onClick={checkCurrentUserData}>
            Check Current User Data
          </Button>
          <Button onClick={testCurrentRole}>
            Test Current Role
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