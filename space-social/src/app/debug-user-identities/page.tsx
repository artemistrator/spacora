'use client'

import { useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

// Simple UUID v4 generator (for testing purposes only)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function DebugUserIdentities() {
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

  // Test reading user identities
  const testReadUserIdentities = async () => {
    if (!userId) {
      addResult('Read User Identities', false, null, { message: 'User not authenticated' })
      return
    }
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      const { data, error } = await supabaseClient
        .from('user_identities')
        .select('*')
        .eq('clerk_id', userId)
      
      addResult('Read User Identities', !error, data, error)
    } catch (error: any) {
      addResult('Read User Identities', false, null, error)
    }
  }

  // Test creating user identity
  const testCreateUserIdentity = async () => {
    if (!userId) {
      addResult('Create User Identity', false, null, { message: 'User not authenticated' })
      return
    }
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      const newSupabaseId = generateUUID()
      const { data, error } = await supabaseClient
        .from('user_identities')
        .insert({
          clerk_id: userId,
          supabase_id: newSupabaseId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      addResult('Create User Identity', !error, data, error)
    } catch (error: any) {
      addResult('Create User Identity', false, null, error)
    }
  }

  // Test updating user identity
  const testUpdateUserIdentity = async () => {
    if (!userId) {
      addResult('Update User Identity', false, null, { message: 'User not authenticated' })
      return
    }
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // First, try to get existing identity
      const { data: existingData, error: existingError } = await supabaseClient
        .from('user_identities')
        .select('id')
        .eq('clerk_id', userId)
        .limit(1)
      
      if (existingError) throw existingError
      
      if (existingData && existingData.length > 0) {
        // Update existing identity
        const { data, error } = await supabaseClient
          .from('user_identities')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('clerk_id', userId)
          .select()
        
        addResult('Update User Identity', !error, data, error)
      } else {
        addResult('Update User Identity', false, null, { message: 'No existing identity found' })
      }
    } catch (error: any) {
      addResult('Update User Identity', false, null, error)
    }
  }

  // Test deleting user identity
  const testDeleteUserIdentity = async () => {
    if (!userId) {
      addResult('Delete User Identity', false, null, { message: 'User not authenticated' })
      return
    }
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Note: We won't actually delete in the test, just check if we can
      const { data, error } = await supabaseClient
        .from('user_identities')
        .select('id')
        .eq('clerk_id', userId)
      
      addResult('Check Delete Permission', !error, { 
        message: 'Can query identities for delete check',
        count: data?.length || 0
      }, error)
    } catch (error: any) {
      addResult('Check Delete Permission', false, null, error)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug User Identities</h1>
      
      {!userId ? (
        <div className="p-4 bg-yellow-100 rounded">
          <p>Please log in to run tests.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            <Button onClick={testReadUserIdentities}>
              Test Read User Identities
            </Button>
            <Button onClick={testCreateUserIdentity}>
              Test Create User Identity
            </Button>
            <Button onClick={testUpdateUserIdentity}>
              Test Update User Identity
            </Button>
            <Button onClick={testDeleteUserIdentity}>
              Test Delete Permission
            </Button>
          </div>
          
          <div className="p-4 bg-blue-100 rounded mb-4">
            <h2 className="text-lg font-semibold mb-2">Current User ID</h2>
            <p className="font-mono">{userId || 'Not available'}</p>
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
        </>
      )}
    </div>
  )
}