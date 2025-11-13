import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  const { userId, getToken } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get the Supabase token from Clerk
    const supabaseToken = await getToken({ template: 'supabase' });
    
    // Create a new Supabase client with the token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseToken}`
        }
      }
    });
    
    // Parse the request body
    const body = await request.json();
    
    // Подготавливаем данные для вставки, исключая поля, которых может не быть в схеме
    const { 
      name, 
      description, 
      space_type, 
      location, 
      is_public, 
      style, 
      area_m2, 
      avatar_url, 
      cover_url,
      ...rest 
    } = body;
    
    // Получаем правильный UUID для пользователя
    const { data: userIdentity, error: identityError } = await supabase
      .from('user_identities')
      .select('supabase_id')
      .eq('clerk_id', userId)
      .maybeSingle();
    
    if (identityError) {
      console.error('Error fetching user identity:', identityError);
      return NextResponse.json({ error: 'Failed to get user identity' }, { status: 500 });
    }
    
    // Если маппинга нет, создаем его
    let supabaseUserId = userIdentity?.supabase_id;
    if (!supabaseUserId) {
      const newSupabaseId = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from('user_identities')
        .insert({
          clerk_id: userId,
          supabase_id: newSupabaseId
        });
      
      if (insertError) {
        console.error('Error creating user identity:', insertError);
        return NextResponse.json({ error: 'Failed to create user identity' }, { status: 500 });
      }
      
      supabaseUserId = newSupabaseId;
    }
    
    const spaceData = {
      name,
      description,
      space_type,
      location,
      is_public,
      style: style || null,
      area_m2: area_m2 ? parseFloat(area_m2) : null,
      avatar_url: avatar_url || null,
      cover_url: cover_url || null,
      owner_id: supabaseUserId, // Используем правильный UUID
      updated_at: new Date().toISOString()
    };
    
    // Create the space
    const { data, error } = await supabase
      .from('spaces')
      .insert(spaceData)
      .select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error creating space:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}