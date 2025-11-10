'use client'

import { useSession, useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Global supabase client
export const supabaseClient = supabase

export function useSupabaseAuth() {
  const { session } = useSession()
  const { userId } = useAuth()
  
  // Track auth status
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  
  // Return an authenticated client when needed
  const getSupabaseWithSession = async () => {
    console.log('getSupabaseWithSession called, session exists:', !!session);
    // If we have a Clerk session, try to authenticate with Supabase
    if (session) {
      try {
        console.log('getSupabaseWithSession: Authenticating with Supabase');
        setIsAuthenticating(true);
        setAuthError(null);
        
        // Get the Clerk JWT token with timeout
        console.log('getSupabaseWithSession: Getting Clerk JWT token');
        const tokenPromise = session.getToken({ template: 'supabase' });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => {
            console.log('getSupabaseWithSession: Auth timeout triggered');
            reject(new Error('Auth timeout'));
          }, 5000)
        );
        
        const token = await Promise.race([tokenPromise, timeoutPromise]) as string;
        console.log('getSupabaseWithSession: Got token:', token ? 'Token exists' : 'No token');
        console.log('getSupabaseWithSession: Token length:', token ? token.length : 'N/A');
        
        if (token) {
          // Log token info for debugging (don't log actual token for security)
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            try {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('getSupabaseWithSession: Token payload:', {
                sub: payload.sub,
                exp: payload.exp,
                iat: payload.iat,
                // Don't log sensitive info
              });
            } catch (e) {
              console.log('getSupabaseWithSession: Could not parse token payload');
            }
          }
          
          // Set the Supabase auth session
          console.log('getSupabaseWithSession: Setting Supabase session');
          const setResult = await supabase.auth.setSession({
            access_token: token,
            refresh_token: '', // Clerk JWTs are self-contained
          });
          console.log('getSupabaseWithSession: Set session result:', setResult);
          
          // Wait a bit to ensure session is fully established
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          console.log('getSupabaseWithSession: No token received from Clerk');
        }
      } catch (error: any) {
        console.error('Error setting Supabase session:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        setAuthError(error.message || 'Authentication failed');
      } finally {
        console.log('getSupabaseWithSession: Authentication complete');
        setIsAuthenticating(false);
      }
    } else {
      console.log('getSupabaseWithSession: No Clerk session available');
    }
    
    // Check if the session was actually set
    const { data: { session: supabaseSession } } = await supabase.auth.getSession();
    console.log('getSupabaseWithSession: Current Supabase session:', !!supabaseSession);
    if (supabaseSession) {
      console.log('getSupabaseWithSession: Supabase user ID:', supabaseSession.user?.id);
      console.log('getSupabaseWithSession: Supabase user email:', supabaseSession.user?.email);
    }
    
    // Return the client (now potentially authenticated)
    console.log('getSupabaseWithSession: Returning Supabase client');
    return supabase; // This should work since we've set the session above
  }
  
  // Function to check if Supabase is properly authenticated
  const checkSupabaseAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('checkSupabaseAuth: session data:', session);
      if (session) {
        console.log('checkSupabaseAuth: user:', session.user);
      }
      return !!session;
    } catch (error) {
      console.error('Error checking Supabase auth:', error);
      return false;
    }
  };

  return {
    supabase: supabaseClient,
    getSupabaseWithSession,
    session,
    userId,
    isAuthenticating,
    authError,
    checkSupabaseAuth
  }
}

// Function to get Supabase client with proper auth context
export async function getAuthenticatedSupabase() {
  // Return the same client since our RLS is properly configured
  return supabase
}