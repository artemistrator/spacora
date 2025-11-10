'use client'

import { useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface TestResult {
  name: string
  description: string
  status: 'running' | 'failed' | 'success' | 'skipped'
  result: any
  error: string | null
}

export default function DebugPoliciesPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)

  const runPolicyTests = async () => {
    setLoading(true)
    setTestResults([])
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // First, let's get a space ID to test with
      let testSpaceId = null
      try {
        const { data: spaces } = await supabaseClient
          .from('spaces')
          .select('id')
          .limit(1)
        
        if (spaces && spaces.length > 0) {
          testSpaceId = spaces[0].id
        }
      } catch (error) {
        console.log('Could not get test space ID:', error)
      }
      
      // Test 1: SELECT on user_spaces with specific conditions
      const test1: TestResult = {
        name: 'SELECT user_spaces (specific record)',
        description: 'Check if we can select a specific user_spaces record',
        status: 'running',
        result: null,
        error: null
      }
      
      if (testSpaceId && userId) {
        try {
          // First, try to insert a test record if it doesn't exist
          const upsertResult = await supabaseClient
            .from('user_spaces')
            .upsert({
              clerk_id: userId,
              space_id: testSpaceId,
              role: 'subscriber'
            }, {
              onConflict: 'clerk_id,space_id'
            })
          
          console.log('Upsert result:', upsertResult)
          
          // Now try to select it with maybeSingle instead of single
          const { data, error } = await supabaseClient
            .from('user_spaces')
            .select('*')
            .eq('clerk_id', userId)
            .eq('space_id', testSpaceId)
            .maybeSingle()
            
          test1.status = error ? 'failed' : 'success'
          test1.result = data || 'No data found'
          test1.error = error?.message || null
        } catch (error: any) {
          test1.status = 'failed'
          test1.error = error.message
          test1.result = 'Exception occurred'
        }
      } else {
        test1.status = 'skipped'
        test1.error = 'No test space or user ID available'
      }
      
      setTestResults(prev => [...prev, test1])
      
      // Test 2: INSERT on user_spaces
      const test2: TestResult = {
        name: 'INSERT user_spaces',
        description: 'Check if we can insert a new user_spaces record',
        status: 'running',
        result: null,
        error: null
      }
      
      if (testSpaceId && userId) {
        try {
          // Try to insert a record
          const { data, error } = await supabaseClient
            .from('user_spaces')
            .insert({
              clerk_id: userId,
              space_id: testSpaceId,
              role: 'subscriber'
            })
            .select()
            
          test2.status = error ? 'failed' : 'success'
          test2.result = data || 'Insert successful'
          test2.error = error?.message || null
        } catch (error: any) {
          test2.status = 'failed'
          test2.error = error.message
        }
      } else {
        test2.status = 'skipped'
        test2.error = 'No test space or user ID available'
      }
      
      setTestResults(prev => [...prev, test2])
      
      // Test 3: DELETE on user_spaces
      const test3: TestResult = {
        name: 'DELETE user_spaces',
        description: 'Check if we can delete a user_spaces record',
        status: 'running',
        result: null,
        error: null
      }
      
      if (testSpaceId && userId) {
        try {
          // Try to delete a record
          const { data, error } = await supabaseClient
            .from('user_spaces')
            .delete()
            .eq('clerk_id', userId)
            .eq('space_id', testSpaceId)
            
          test3.status = error ? 'failed' : 'success'
          test3.result = `Delete operation completed`
          test3.error = error?.message || null
        } catch (error: any) {
          test3.status = 'failed'
          test3.error = error.message
        }
      } else {
        test3.status = 'skipped'
        test3.error = 'No test space or user ID available'
      }
      
      setTestResults(prev => [...prev, test3])
      
      // Test 4: SELECT on user_spaces (all records for user)
      const test4: TestResult = {
        name: 'SELECT user_spaces (all for user)',
        description: 'Check if we can select all user_spaces records for current user',
        status: 'running',
        result: null,
        error: null
      }
      
      if (userId) {
        try {
          const { data, error } = await supabaseClient
            .from('user_spaces')
            .select('*')
            .eq('clerk_id', userId)
            
          test4.status = error ? 'failed' : 'success'
          test4.result = `Found ${Array.isArray(data) ? data.length : 0} records`
          test4.error = error?.message || null
        } catch (error: any) {
          test4.status = 'failed'
          test4.error = error.message
        }
      } else {
        test4.status = 'skipped'
        test4.error = 'No user ID available'
      }
      
      setTestResults(prev => [...prev, test4])
      
      // Test 5: Check if user can access any spaces at all
      const test5: TestResult = {
        name: 'SELECT spaces (owned by user)',
        description: 'Check if user can select spaces they own',
        status: 'running',
        result: null,
        error: null
      }
      
      if (userId) {
        try {
          const { data, error } = await supabaseClient
            .from('spaces')
            .select('id, name')
            .eq('owner_id', userId)
            
          test5.status = error ? 'failed' : 'success'
          test5.result = `Found ${Array.isArray(data) ? data.length : 0} owned spaces`
          test5.error = error?.message || null
        } catch (error: any) {
          test5.status = 'failed'
          test5.error = error.message
        }
      } else {
        test5.status = 'skipped'
        test5.error = 'No user ID available'
      }
      
      setTestResults(prev => [...prev, test5])
      
    } catch (error: any) {
      setTestResults(prev => [...prev, {
        name: 'General error',
        description: 'Unexpected error during testing',
        status: 'failed',
        result: null,
        error: error.message
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Policy Debug Page</CardTitle>
          <CardDescription>
            This page helps diagnose specific policy issues in Supabase tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Button onClick={runPolicyTests} disabled={loading}>
              {loading ? 'Running Tests...' : 'Run Policy Tests'}
            </Button>
          </div>
          
          <div className="space-y-4">
            {testResults.map((test, index) => (
              <Card 
                key={index} 
                className={
                  test.status === 'failed' ? 'border-red-200 bg-red-50' : 
                  test.status === 'success' ? 'border-green-200 bg-green-50' : 
                  test.status === 'skipped' ? 'border-yellow-200 bg-yellow-50' : ''
                }
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div>
                      <span>{test.name}</span>
                      <p className="text-sm font-normal text-gray-600 mt-1">{test.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center ${
                      test.status === 'failed' ? 'bg-red-100 text-red-800' : 
                      test.status === 'success' ? 'bg-green-100 text-green-800' : 
                      test.status === 'skipped' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {test.status === 'failed' ? <XCircle className="h-3 w-3 mr-1" /> :
                       test.status === 'success' ? <CheckCircle className="h-3 w-3 mr-1" /> :
                       test.status === 'skipped' ? <AlertTriangle className="h-3 w-3 mr-1" /> : null}
                      {test.status.toUpperCase()}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {test.error && (
                    <div className="text-red-700 mb-2">
                      <strong>Error:</strong> {test.error}
                    </div>
                  )}
                  {test.result && (
                    <div className="bg-gray-100 p-2 rounded">
                      <pre className="text-sm overflow-x-auto">
                        {typeof test.result === 'string' ? test.result : JSON.stringify(test.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}