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
  
  const getSupabaseWithSession = async () => {
    return supabase;
  }
  
  const checkSupabaseAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
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