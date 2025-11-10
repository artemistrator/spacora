'use client'

import { useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface TestResult {
  name: string
  status: 'running' | 'failed' | 'success'
  result: any
  error: string | null
}

export default function DebugRLSPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)

  const runRLSTests = async () => {
    setLoading(true)
    setTestResults([])
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Test 1: Check if we can access spaces table
      const test1: TestResult = {
        name: 'Spaces table access',
        status: 'running',
        result: null,
        error: null
      }
      
      try {
        const { data, error } = await supabaseClient
          .from('spaces')
          .select('id, name')
          .limit(1)
          
        test1.status = error ? 'failed' : 'success'
        test1.result = data
        test1.error = error?.message || null
      } catch (error: any) {
        test1.status = 'failed'
        test1.error = error.message
      }
      
      setTestResults(prev => [...prev, test1])
      
      // Test 2: Check if we can access user_spaces table
      const test2: TestResult = {
        name: 'User_spaces table access',
        status: 'running',
        result: null,
        error: null
      }
      
      try {
        const { data, error } = await supabaseClient
          .from('user_spaces')
          .select('space_id')
          .limit(1)
          
        test2.status = error ? 'failed' : 'success'
        test2.result = data
        test2.error = error?.message || null
      } catch (error: any) {
        test2.status = 'failed'
        test2.error = error.message
      }
      
      setTestResults(prev => [...prev, test2])
      
      // Test 3: Check if we can access folders table
      const test3: TestResult = {
        name: 'Folders table access',
        status: 'running',
        result: null,
        error: null
      }
      
      try {
        const { data, error } = await supabaseClient
          .from('folders')
          .select('id, name')
          .limit(1)
          
        test3.status = error ? 'failed' : 'success'
        test3.result = data
        test3.error = error?.message || null
      } catch (error: any) {
        test3.status = 'failed'
        test3.error = error.message
      }
      
      setTestResults(prev => [...prev, test3])
      
      // Test 4: Check user identity
      const test4: TestResult = {
        name: 'User identity check',
        status: 'running',
        result: null,
        error: null
      }
      
      try {
        const { data, error } = await supabaseClient
          .from('user_identities')
          .select('supabase_id')
          .eq('clerk_id', userId)
          .single()
          
        test4.status = error ? 'failed' : 'success'
        test4.result = data
        test4.error = error?.message || null
      } catch (error: any) {
        test4.status = 'failed'
        test4.error = error.message
      }
      
      setTestResults(prev => [...prev, test4])
      
    } catch (error: any) {
      setTestResults(prev => [...prev, {
        name: 'General error',
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
          <CardTitle>RLS Debug Page</CardTitle>
          <CardDescription>
            This page helps diagnose Row Level Security issues in Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Button onClick={runRLSTests} disabled={loading}>
              {loading ? 'Running Tests...' : 'Run RLS Tests'}
            </Button>
          </div>
          
          <div className="space-y-4">
            {testResults.map((test, index) => (
              <Card key={index} className={test.status === 'failed' ? 'border-red-200 bg-red-50' : test.status === 'success' ? 'border-green-200 bg-green-50' : ''}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{test.name}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      test.status === 'failed' ? 'bg-red-100 text-red-800' : 
                      test.status === 'success' ? 'bg-green-100 text-green-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
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
                        {JSON.stringify(test.result, null, 2)}
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