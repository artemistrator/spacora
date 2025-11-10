import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Эта функция будет работать только в среде разработки
export async function GET() {
  try {
    // Возвращаем инструкции по настройке политик
    const policies = {
      "post-images": {
        description: "Политики для бакета post-images",
        insert_policy: `
CREATE POLICY "Users can upload images" 
ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'post-images');
        `,
        select_policy: `
CREATE POLICY "Public can view images" 
ON storage.objects 
FOR SELECT USING (bucket_id = 'post-images');
        `,
        update_policy: `
CREATE POLICY "Users can update their images" 
ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'post-images' AND owner = auth.uid());
        `,
        delete_policy: `
CREATE POLICY "Users can delete their images" 
ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'post-images' AND owner = auth.uid());
        `
      },
      setup_instructions: `
1. Перейдите в Supabase Dashboard
2. Storage → Buckets → post-images
3. Перейдите на вкладку Policies
4. Создайте или обновите следующие политики:

INSERT POLICY:
${`
CREATE POLICY "Users can upload images" 
ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'post-images');
`}

SELECT POLICY:
${`
CREATE POLICY "Public can view images" 
ON storage.objects 
FOR SELECT USING (bucket_id = 'post-images');
`}

UPDATE POLICY:
${`
CREATE POLICY "Users can update their images" 
ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'post-images' AND owner = auth.uid());
`}

DELETE POLICY:
${`
CREATE POLICY "Users can delete their images" 
ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'post-images' AND owner = auth.uid());
`}
      `
    };

    return NextResponse.json({ policies });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get policies' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ 
    message: "Для настройки политик доступа к хранилищу следуйте инструкциям из GET запроса",
    note: "Эта операция должна выполняться через Supabase Dashboard"
  });
}