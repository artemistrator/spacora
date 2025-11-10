'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'

export default function TestUserSync() {
  const { userId, isSynced, isSyncing, forceSyncUser, isUserLoaded } = useAuth()

  useEffect(() => {
    if (userId && isUserLoaded && !isSynced) {
      console.log('Triggering user sync...')
      forceSyncUser()
    }
  }, [userId, isUserLoaded, isSynced, forceSyncUser])

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test User Sync</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">User Sync Status</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-medium">User ID:</span>
            <span>{userId || 'Not authenticated'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">User Loaded:</span>
            <span>{isUserLoaded ? 'Yes' : 'No'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Sync Status:</span>
            <span>
              {isSyncing ? 'Syncing...' : isSynced ? 'Synced' : 'Not synced'}
            </span>
          </div>
        </div>
        
        <button 
          onClick={forceSyncUser}
          disabled={!userId || isSyncing}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Force Sync User
        </button>
      </div>
    </div>
  )
}