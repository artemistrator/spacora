'use client';

import { useState } from 'react';
import { useSession } from '@clerk/nextjs';

export default function TestClerkTokenPage() {
  const { session } = useSession();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [decodedToken, setDecodedToken] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testToken = async () => {
    if (!session) {
      setError('No Clerk session available');
      return;
    }

    try {
      setError(null);
      setTokenInfo(null);
      setDecodedToken(null);

      // Get the Clerk JWT token
      const token = await session.getToken({ template: 'supabase' });
      
      if (!token) {
        setError('No token received from Clerk');
        return;
      }

      setTokenInfo({
        tokenLength: token.length,
        tokenPreview: token.substring(0, 50) + '...'
      });

      // Decode the token (without verification)
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          setDecodedToken({
            header: JSON.parse(atob(tokenParts[0])),
            payload: payload,
            signature: tokenParts[2].substring(0, 20) + '...'
          });
        } catch (decodeError) {
          setError('Could not decode token: ' + (decodeError as Error).message);
        }
      } else {
        setError('Invalid token format');
      }
    } catch (err: any) {
      setError('Error getting token: ' + err.message);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Clerk Token Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Clerk JWT Token for Supabase</h2>
        <p className="text-sm text-gray-700">
          This page tests the Clerk JWT token that is used for Supabase authentication.
        </p>
      </div>
      
      {/* Session Info */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">Session Information</h2>
        <div className="mb-3">
          <p><strong>Session Status:</strong> {session ? 'Active' : 'None'}</p>
        </div>
        
        {session && (
          <div className="text-sm">
            <p><strong>User ID:</strong> {session.user.id}</p>
            <p><strong>Email:</strong> {session.user.primaryEmailAddress?.emailAddress || 'No email'}</p>
          </div>
        )}
        
        <button 
          onClick={testToken}
          disabled={!session}
          className="mt-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Test Token
        </button>
      </div>
      
      {/* Error */}
      {error && (
        <div className="mb-6 p-4 border rounded-lg bg-red-50 border-red-200">
          <h2 className="text-lg font-semibold mb-2 text-red-800">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* Token Info */}
      {tokenInfo && (
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Token Information</h2>
          <div className="text-sm">
            <p><strong>Token Length:</strong> {tokenInfo.tokenLength} characters</p>
            <p><strong>Token Preview:</strong> {tokenInfo.tokenPreview}</p>
          </div>
        </div>
      )}
      
      {/* Decoded Token */}
      {decodedToken && (
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Decoded Token</h2>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Header</h3>
            <pre className="bg-gray-100 p-3 text-xs overflow-x-auto">
              {JSON.stringify(decodedToken.header, null, 2)}
            </pre>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Payload</h3>
            <pre className="bg-gray-100 p-3 text-xs overflow-x-auto">
              {JSON.stringify(decodedToken.payload, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Signature</h3>
            <p className="text-sm">{decodedToken.signature}</p>
          </div>
        </div>
      )}
    </div>
  );
}