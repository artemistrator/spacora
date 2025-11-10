'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, WifiOff, RefreshCw, Clock } from 'lucide-react'

export default function DebugSupabasePage() {
  const { getSupabaseWithSession, userId, session } = useSupabaseAuth()
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('checking')

  // Check network status
  useEffect(() => {
    const checkNetwork = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline')
    }
    
    checkNetwork()
    
    window.addEventListener('online', checkNetwork)
    window.addEventListener('offline', checkNetwork)
    
    return () => {
      window.removeEventListener('online', checkNetwork)
      window.removeEventListener('offline', checkNetwork)
    }
  }, [])

  const testConnection = async () => {
    setLoading(true)
    setTestResult('Testing...')
    
    try {
      // Test 1: Network status
      setTestResult(prev => prev + '\n✓ Network status: ' + (navigator.onLine ? 'Online' : 'Offline'))
      
      if (!navigator.onLine) {
        setTestResult(prev => prev + '\n⚠ Warning: No internet connection')
        setLoading(false)
        return
      }
      
      // Test 2: Check if we can access the client
      const supabaseClient = await getSupabaseWithSession()
      setTestResult(prev => prev + '\n✓ Supabase client created successfully')
      
      // Test 3: Check authentication status with timeout
      try {
        const authPromise = supabaseClient.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        )
        
        const { data: { session: supabaseSession } } = await Promise.race([authPromise, timeoutPromise]) as any
        setTestResult(prev => prev + `\n✓ Supabase auth session: ${supabaseSession ? 'Active' : 'None'}`)
      } catch (authError: any) {
        setTestResult(prev => prev + `\n✗ Error checking auth: ${authError.message || 'Timeout'}`)
      }
      
      // Test 4: Try to fetch some data with timeout
      try {
        const fetchPromise = supabaseClient
          .from('spaces')
          .select('id, name')
          .limit(1)
          
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Data fetch timeout')), 10000)
        )
        
        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any
        
        if (error) {
          setTestResult(prev => prev + `\n✗ Error fetching data: ${error.message}`)
        } else {
          setTestResult(prev => prev + `\n✓ Data fetch successful. Found ${data?.length || 0} spaces`)
        }
      } catch (fetchError: any) {
        setTestResult(prev => prev + `\n✗ Error fetching data: ${fetchError.message || 'Timeout'}`)
      }
      
      // Test 5: Check user info
      setTestResult(prev => prev + `\n✓ Clerk user ID: ${userId || 'None'}`)
      setTestResult(prev => prev + `\n✓ Clerk session: ${session ? 'Active' : 'None'}`)
      
    } catch (error: any) {
      setTestResult(prev => prev + `\n✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Debug Page</CardTitle>
          <CardDescription>
            Диагностика подключения к Supabase и аутентификации
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Network Status</h3>
            <div className="flex items-center p-3 rounded-md bg-gray-50">
              {networkStatus === 'checking' ? (
                <Clock className="h-5 w-5 text-yellow-500 mr-2" />
              ) : networkStatus === 'online' ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500 mr-2" />
              )}
              <span>
                {networkStatus === 'checking' ? 'Checking...' : 
                 networkStatus === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="mb-6">
            <Button onClick={testConnection} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Run Connection Test'
              )}
            </Button>
          </div>
          
          {testResult && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Test Results:</h3>
              <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-3 rounded max-h-96 overflow-y-auto">
                {testResult}
              </pre>
            </div>
          )}
          
          {testResult.includes('Timeout') && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <h4 className="font-medium text-yellow-800">Timeout Issues Detected</h4>
              </div>
              <p className="mt-2 text-yellow-700 text-sm">
                This may indicate network connectivity issues or Supabase service problems. 
                Try refreshing the page or check your internet connection.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}