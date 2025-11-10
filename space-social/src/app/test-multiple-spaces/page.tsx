'use client'

import { useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function TestMultipleSpaces() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [spaceCount, setSpaceCount] = useState(3)
  const router = useRouter()

  const testCreateMultipleSpaces = async () => {
    if (!userId) {
      setResults([{ success: false, error: 'User not authenticated' }])
      return
    }
    
    setLoading(true)
    setResults([])
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Create multiple spaces
      // The database trigger will automatically create the user if needed
      const newResults = [];
      for (let i = 0; i < spaceCount; i++) {
        try {
          const { data, error } = await supabaseClient
            .from('spaces')
            .insert({
              name: `Test Space ${Date.now()}-${i}`,
              description: `Test space #${i} for multiple spaces test`,
              space_type: 'apartment',
              is_public: true,
              owner_id: userId, // Use the Clerk user ID directly
              updated_at: new Date().toISOString()
            })
            .select()
          
          if (error) throw error
          
          newResults.push({ 
            success: true, 
            spaceNumber: i + 1, 
            data: data[0],
            message: `Successfully created space #${i + 1}`
          })
        } catch (error: any) {
          newResults.push({ 
            success: false, 
            spaceNumber: i + 1, 
            error: error.message,
            message: `Failed to create space #${i + 1}`
          })
        }
        
        // Wait a bit between requests
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      setResults(newResults)
    } catch (error: any) {
      console.error('Error in test:', error)
      setResults([{ success: false, error: error.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Multiple Spaces Creation</h1>
      
      {userId ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Number of Spaces to Create</label>
            <input 
              type="number"
              min="1"
              max="10"
              value={spaceCount}
              onChange={(e) => setSpaceCount(parseInt(e.target.value) || 1)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          
          <Button onClick={testCreateMultipleSpaces} disabled={loading}>
            {loading ? 'Creating Spaces...' : `Create ${spaceCount} Spaces`}
          </Button>
        </>
      ) : (
        <div className="p-4 bg-yellow-100 rounded">
          <p>Please log in to test multiple spaces creation.</p>
          <Button onClick={() => router.push('/')} className="mt-2">
            Go to Home
          </Button>
        </div>
      )}
      
      {results.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Results</h2>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded ${
                  result.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">Space #{result.spaceNumber || index + 1}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {result.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
                <p className="text-sm mt-1">{result.message}</p>
                {result.data && (
                  <div className="mt-2 text-xs">
                    <p>ID: {result.data.id}</p>
                    <p>Name: {result.data.name}</p>
                  </div>
                )}
                {result.error && (
                  <p className="text-red-700 text-sm mt-1">Error: {result.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}