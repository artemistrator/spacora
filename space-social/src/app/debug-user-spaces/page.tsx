'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DebugStep {
  name: string
  status: 'running' | 'failed' | 'success'
  data: any
  error: string | null
}

interface DebugInfo {
  step1?: DebugStep
  step2?: DebugStep
  step3a?: DebugStep
  step3b?: DebugStep
  generalError?: DebugStep
}

export default function DebugUserSpacesPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({})
  const [loading, setLoading] = useState(false)
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('')

  const runDetailedTest = async () => {
    setLoading(true)
    setDebugInfo({})
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Step 1: Get all spaces owned by user
      const step1: DebugStep = {
        name: 'Get user owned spaces',
        status: 'running',
        data: null,
        error: null
      }
      
      try {
        const { data, error } = await supabaseClient
          .from('spaces')
          .select('id, name, owner_id')
          .eq('owner_id', userId)
          
        step1.status = error ? 'failed' : 'success'
        step1.data = data
        step1.error = error?.message || null
      } catch (error: any) {
        step1.status = 'failed'
        step1.error = error.message
      }
      
      setDebugInfo(prev => ({ ...prev, step1 }))
      
      // Step 2: Get all spaces user is subscribed to
      const step2: DebugStep = {
        name: 'Get user subscriptions',
        status: 'running',
        data: null,
        error: null
      }
      
      try {
        const { data, error } = await supabaseClient
          .from('user_spaces')
          .select(`
            *,
            space:spaces(id, name, owner_id)
          `)
          .eq('clerk_id', userId)
          
        step2.status = error ? 'failed' : 'success'
        step2.data = data
        step2.error = error?.message || null
      } catch (error: any) {
        step2.status = 'failed'
        step2.error = error.message
      }
      
      setDebugInfo(prev => ({ ...prev, step2 }))
      
      // Step 3: If we have a selected space, test specific operations
      if (selectedSpaceId) {
        // Step 3a: Check if subscription exists
        const step3a: DebugStep = {
          name: `Check subscription for space ${selectedSpaceId}`,
          status: 'running',
          data: null,
          error: null
        }
        
        try {
          const { data, error } = await supabaseClient
            .from('user_spaces')
            .select('*')
            .eq('clerk_id', userId)
            .eq('space_id', selectedSpaceId)
            .maybeSingle()
            
          step3a.status = error ? 'failed' : 'success'
          step3a.data = data || 'No subscription found'
          step3a.error = error?.message || null
        } catch (error: any) {
          step3a.status = 'failed'
          step3a.error = error.message
        }
        
        setDebugInfo(prev => ({ ...prev, step3a }))
        
        // Step 3b: Try to create subscription
        const step3b: DebugStep = {
          name: `Create subscription for space ${selectedSpaceId}`,
          status: 'running',
          data: null,
          error: null
        }
        
        try {
          const { data, error } = await supabaseClient
            .from('user_spaces')
            .upsert({
              clerk_id: userId,
              space_id: selectedSpaceId,
              role: 'subscriber'
            }, {
              onConflict: 'clerk_id,space_id'
            })
            .select()
            
          step3b.status = error ? 'failed' : 'success'
          step3b.data = data || 'Upsert completed'
          step3b.error = error?.message || null
        } catch (error: any) {
          step3b.status = 'failed'
          step3b.error = error.message
        }
        
        setDebugInfo(prev => ({ ...prev, step3b }))
      }
      
    } catch (error: any) {
      setDebugInfo(prev => ({
        ...prev,
        generalError: {
          name: 'General error',
          status: 'failed',
          data: null,
          error: error.message
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  // Auto-run test when component mounts
  useEffect(() => {
    if (userId) {
      runDetailedTest()
    }
  }, [userId])

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>User Spaces Debug Page</CardTitle>
          <CardDescription>
            Detailed debugging for user_spaces table issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={selectedSpaceId}
                onChange={(e) => setSelectedSpaceId(e.target.value)}
                placeholder="Enter space ID to test"
                className="flex-1 p-2 border rounded"
              />
              <Button onClick={runDetailedTest} disabled={loading}>
                {loading ? 'Testing...' : 'Run Test'}
              </Button>
            </div>
            
            {debugInfo.step1 && (
              <Card className={debugInfo.step1.status === 'failed' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                <CardHeader>
                  <CardTitle className="text-lg">{debugInfo.step1.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {debugInfo.step1.error && (
                    <div className="text-red-700 mb-2">
                      <strong>Error:</strong> {debugInfo.step1.error}
                    </div>
                  )}
                  {debugInfo.step1.data && (
                    <div className="bg-gray-100 p-2 rounded">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(debugInfo.step1.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {debugInfo.step2 && (
              <Card className={debugInfo.step2.status === 'failed' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                <CardHeader>
                  <CardTitle className="text-lg">{debugInfo.step2.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {debugInfo.step2.error && (
                    <div className="text-red-700 mb-2">
                      <strong>Error:</strong> {debugInfo.step2.error}
                    </div>
                  )}
                  {debugInfo.step2.data && (
                    <div className="bg-gray-100 p-2 rounded">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(debugInfo.step2.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {debugInfo.step3a && (
              <Card className={debugInfo.step3a.status === 'failed' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                <CardHeader>
                  <CardTitle className="text-lg">{debugInfo.step3a.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {debugInfo.step3a.error && (
                    <div className="text-red-700 mb-2">
                      <strong>Error:</strong> {debugInfo.step3a.error}
                    </div>
                  )}
                  {debugInfo.step3a.data && (
                    <div className="bg-gray-100 p-2 rounded">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(debugInfo.step3a.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {debugInfo.step3b && (
              <Card className={debugInfo.step3b.status === 'failed' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                <CardHeader>
                  <CardTitle className="text-lg">{debugInfo.step3b.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {debugInfo.step3b.error && (
                    <div className="text-red-700 mb-2">
                      <strong>Error:</strong> {debugInfo.step3b.error}
                    </div>
                  )}
                  {debugInfo.step3b.data && (
                    <div className="bg-gray-100 p-2 rounded">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(debugInfo.step3b.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {debugInfo.generalError && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-lg">{debugInfo.generalError.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {debugInfo.generalError.error && (
                    <div className="text-red-700 mb-2">
                      <strong>Error:</strong> {debugInfo.generalError.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}