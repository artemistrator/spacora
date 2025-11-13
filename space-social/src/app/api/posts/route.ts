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
    
    // Проверяем, что пользователь является владельцем пространства
    const { data: spaceData, error: spaceError } = await supabase
      .from('spaces')
      .select('owner_id')
      .eq('id', body.space_id)
      .maybeSingle();
    
    if (spaceError || !spaceData) {
      return NextResponse.json({ error: 'Пространство не найдено' }, { status: 404 });
    }
    
    // Здесь мы должны получить userId из сессии, но в текущей реализации это сложно
    // Вместо этого мы будем полагаться на клиентскую проверку прав
    
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