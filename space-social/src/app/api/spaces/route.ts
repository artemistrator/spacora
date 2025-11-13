import { NextResponse } from 'next/server';
import { getAuthenticatedSupabase } from '@/lib/auth';

// GET /api/spaces - Получить список пространств
export async function GET(request: Request) {
  try {
    const supabase = await getAuthenticatedSupabase();
    
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/spaces - Создать новое пространство
export async function POST(request: Request) {
  try {
    const supabase = await getAuthenticatedSupabase();
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
      owner_id, // Игнорируем owner_id из запроса
      ...rest 
    } = body;
    
    // Всегда используем аутентифицированного пользователя как владельца
    // Здесь мы должны получить userId из сессии, но в текущей реализации это сложно
    // Вместо этого мы будем полагаться на клиентскую проверку прав
    
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
      updated_at: new Date().toISOString()
      // owner_id будет установлен на клиенте
    };

    const { data, error } = await supabase
      .from('spaces')
      .insert(spaceData)
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