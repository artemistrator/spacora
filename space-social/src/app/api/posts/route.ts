import { NextResponse } from 'next/server';
import { getAuthenticatedSupabase } from '@/lib/auth';

// GET /api/posts - Получить список постов
export async function GET(request: Request) {
  try {
    const supabase = await getAuthenticatedSupabase();
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        spaces(name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/posts - Создать новый пост
export async function POST(request: Request) {
  try {
    const supabase = await getAuthenticatedSupabase();
    const body = await request.json();

    const { data, error } = await supabase
      .from('posts')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}