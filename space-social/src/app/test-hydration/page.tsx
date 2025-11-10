'use client'

import { useState, useEffect } from 'react'

export default function TestHydration() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Hydration</h1>
      <p>Is client: {isClient ? 'Yes' : 'No'}</p>
      {isClient && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p>This content is only rendered on the client</p>
        </div>
      )}
    </div>
  )
}