import { supabase } from '@/lib/supabase'

/**
 * Get or create a Supabase user ID for a Clerk user
 * @param clerkUserId The Clerk user ID (string)
 * @returns The Supabase user ID (UUID) or null if failed
 */
export async function getOrCreateSupabaseUserId(clerkUserId: string): Promise<string | null> {
  try {
    // First, try to find an existing mapping
    const { data: existingMapping, error: selectError } = await supabase
      .from('user_identities')
      .select('supabase_id')
      .eq('clerk_id', clerkUserId)
      .maybeSingle() // Changed from .single() to .maybeSingle()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error fetching user mapping:', selectError)
      return null
    }

    // If mapping exists, return the Supabase ID
    if (existingMapping) {
      return existingMapping.supabase_id
    }

    // If no mapping exists, create a new one
    const { data: newMapping, error: insertError } = await supabase
      .from('user_identities')
      .insert({
        clerk_id: clerkUserId,
        supabase_id: crypto.randomUUID() // Generate a new UUID for Supabase
      })
      .select('supabase_id')
      .maybeSingle() // Changed from .single() to .maybeSingle()

    if (insertError) {
      console.error('Error creating user mapping:', insertError)
      return null
    }

    return newMapping?.supabase_id || null
  } catch (error) {
    console.error('Unexpected error in user mapping:', error)
    return null
  }
}

/**
 * Get the Supabase user ID for a Clerk user
 * @param clerkUserId The Clerk user ID (string)
 * @returns The Supabase user ID (UUID) or null if not found
 */
export async function getSupabaseUserId(clerkUserId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_identities')
      .select('supabase_id')
      .eq('clerk_id', clerkUserId)
      .maybeSingle() // Changed from .single() to .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user mapping doesn't exist
        return null
      }
      console.error('Error fetching Supabase user ID:', error)
      return null
    }

    return data?.supabase_id || null
  } catch (error) {
    console.error('Unexpected error fetching Supabase user ID:', error)
    return null
  }
}

/**
 * Create a user mapping
 * @param clerkUserId The Clerk user ID (string)
 * @param supabaseUserId The Supabase user ID (UUID)
 * @returns True if successful, false otherwise
 */
export async function createUserMapping(clerkUserId: string, supabaseUserId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_identities')
      .insert({
        clerk_id: clerkUserId,
        supabase_id: supabaseUserId
      })

    if (error) {
      console.error('Error creating user mapping:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error creating user mapping:', error)
    return false
  }
}