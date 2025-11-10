'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default function DebugUserMapping() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [testResults, setTestResults] = useState<any[]>([])
  const [mappingInfo, setMappingInfo] = useState<any>(null)

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

  // Check user mapping
  const checkUserMapping = async () => {
    if (!userId) {
      addResult('Check User Mapping', false, null, { message: 'No user ID available' })
      return
    }
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Check if user exists in users table
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
      
      addResult('Check Users Table', !userError, userData, userError)
      
      // Check if user exists in user_identities table
      const { data: identityData, error: identityError } = await supabaseClient
        .from('user_identities')
        .select('*')
        .eq('clerk_id', userId)
      
      addResult('Check User Identities', !identityError, identityData, identityError)
      
      // Store mapping info
      setMappingInfo({
        clerkId: userId,
        usersTable: userData,
        userIdentitiesTable: identityData
      })
      
    } catch (error: any) {
      addResult('Check User Mapping', false, null, error)
    }
  }

  // Test creating user mapping
  const testCreateUserMapping = async () => {
    if (!userId) {
      addResult('Create User Mapping', false, null, { message: 'No user ID available' })
      return
    }
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Try to insert into user_identities
      const { data, error } = await supabaseClient
        .from('user_identities')
        .insert({
          clerk_id: userId,
          supabase_id: userId, // For testing, we'll use the same ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      addResult('Create User Mapping', !error, data, error)
      
    } catch (error: any) {
      addResult('Create User Mapping', false, null, error)
    }
  }

  // Test auth.uid() casting
  const testAuthUidCasting = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Test different casting approaches
      const tests = [
        {
          name: 'Direct auth.uid()',
          query: "SELECT auth.uid() as uid"
        },
        {
          name: 'auth.uid()::text',
          query: "SELECT auth.uid()::text as uid_text"
        },
        {
          name: 'auth.uid() IS NOT NULL',
          query: "SELECT auth.uid() IS NOT NULL as has_uid"
        }
      ]
      
      for (const test of tests) {
        try {
          // These are RPC calls, not table queries
          // We'll need to handle them differently
          addResult(test.name, true, { message: 'Test placeholder - RPC calls not implemented' }, null)
        } catch (error: any) {
          addResult(test.name, false, null, error)
        }
      }
      
    } catch (error: any) {
      addResult('Auth UID Casting Tests', false, null, error)
    }
  }

  // Check table structures
  const checkTableStructures = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Get table info for spaces
      const { data: spacesInfo, error: spacesError } = await supabaseClient
        .from('spaces')
        .select('id, name, owner_id')
        .limit(1)
      
      addResult('Spaces Table Structure', !spacesError, spacesInfo, spacesError)
      
      // Get table info for posts
      const { data: postsInfo, error: postsError } = await supabaseClient
        .from('posts')
        .select('id, space_id, content')
        .limit(1)
      
      addResult('Posts Table Structure', !postsError, postsInfo, postsError)
      
    } catch (error: any) {
      addResult('Check Table Structures', false, null, error)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Mapping Debug</h1>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button onClick={checkUserMapping}>
            Check User Mapping
          </Button>
          <Button onClick={testCreateUserMapping}>
            Test Create User Mapping
          </Button>
          <Button onClick={testAuthUidCasting}>
            Test Auth UID Casting
          </Button>
          <Button onClick={checkTableStructures}>
            Check Table Structures
          </Button>
        </div>
        
        {mappingInfo && (
          <div className="p-4 bg-blue-100 rounded">
            <h2 className="text-lg font-semibold mb-2">User Mapping Info</h2>
            <pre className="text-sm bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
              {JSON.stringify(mappingInfo, null, 2)}
            </pre>
          </div>
        )}
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