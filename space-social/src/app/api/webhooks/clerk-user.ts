import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { type, data } = payload;
    
    console.log('Clerk webhook received:', type, data);
    
    // Обрабатываем события создания и обновления пользователя
    if (type === 'user.created' || type === 'user.updated') {
      const userData = {
        id: data.id, // Clerk user ID
        email: data.email_addresses[0]?.email_address || '',
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        avatar_url: data.image_url || null,
        updated_at: new Date().toISOString()
      };
      
      // Создаем или обновляем пользователя в Supabase
      const { error } = await supabase
        .from('users')
        .upsert(userData, {
          onConflict: 'id'
        });
        
      if (error) {
        console.error('Error upserting user to Supabase:', error);
        return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
      }
      
      console.log('User synced to Supabase:', userData.id);
    }
    
    // Обрабатываем удаление пользователя
    if (type === 'user.deleted') {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', data.id);
        
      if (error) {
        console.error('Error deleting user from Supabase:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
      }
      
      console.log('User deleted from Supabase:', data.id);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Clerk User Webhook Endpoint' });
}