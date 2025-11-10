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

    const { data, error } = await supabase
      .from('spaces')
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