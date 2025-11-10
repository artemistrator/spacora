import { NextResponse } from 'next/server';

// POST /api/webhooks/n8n - Обработка вебхуков от N8N
export async function POST(request: Request) {
  try {
    const { event, data } = await request.json();
    
    switch (event) {
      case 'image_processed':
        // Обновить пост с обработанным изображением
        console.log('Image processed:', data);
        break;
      case 'ai_replacement_complete':
        // Сохранить результат AI замены
        console.log('AI replacement complete:', data);
        break;
      case 'gamification_update':
        // Обновить очки и достижения пользователя
        console.log('Gamification update:', data);
        break;
      default:
        console.log('Unknown event:', event);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}