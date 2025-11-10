'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function TestSpaceCreate() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('Test Space')
  const router = useRouter()

  const testCreateSpace = async () => {
    if (!userId) {
      setResult({ success: false, error: 'User not authenticated' })
      return
    }
    
    setLoading(true)
    
    try {
      // Get authenticated Supabase client
      const supabaseClient = await getSupabaseWithSession()
      
      // Try to create a space
      // The database trigger will automatically create the user if needed
      const { data, error } = await supabaseClient
        .from('spaces')
        .insert({
          name,
          description: 'Test space created from test page',
          space_type: 'apartment',
          is_public: true,
          owner_id: userId, // Use the Clerk user ID directly
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      
      setResult({ success: true, data })
    } catch (error: any) {
      console.error('Error creating space:', error)
      setResult({ success: false, error: error.message, details: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Space Creation</h1>
      
      {userId ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Space Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          
          <Button onClick={testCreateSpace} disabled={loading}>
            {loading ? 'Creating...' : 'Test Create Space'}
          </Button>
        </>
      ) : (
        <div className="p-4 bg-yellow-100 rounded">
          <p>Please log in to test space creation.</p>
          <Button onClick={() => router.push('/')} className="mt-2">
            Go to Home
          </Button>
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 rounded bg-gray-100">
          <h2 className="text-lg font-semibold">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}