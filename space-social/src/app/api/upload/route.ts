import { NextResponse } from 'next/server';
import { getAuthenticatedSupabase } from '@/lib/auth';
import { uploadImage } from '@/lib/upload';

// POST /api/upload - Загрузить изображение
export async function POST(request: Request) {
  try {
    // For file uploads, we need to handle multipart form data
    // This is a simplified version - in production, you might want to use a library like formidable
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer for upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // For this example, we'll just return a mock URL
    // In a real implementation, you would use the uploadImage function
    const mockUrl = `https://example.com/uploads/${Date.now()}-${file.name}`;
    
    return NextResponse.json({ url: mockUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}