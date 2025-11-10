import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Debugging tables structure...');
    
    // Check favorites table structure
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('favorites')
      .select('*')
      .limit(1);
      
    console.log('Favorites table check:', { data: favoritesData, error: favoritesError });
    
    // Check post_reactions table structure
    const { data: reactionsData, error: reactionsError } = await supabase
      .from('post_reactions')
      .select('*')
      .limit(1);
      
    console.log('Post reactions table check:', { data: reactionsData, error: reactionsError });
    
    // Check if we can insert into favorites
    const testFavorite = {
      space_id: 'test_user_id',
      post_id: 'test_post_id'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('favorites')
      .insert(testFavorite)
      .select()
      .single();
      
    console.log('Favorites insert test:', { data: insertData, error: insertError });
    
    // Clean up test record
    if (insertData?.id) {
      await supabase
        .from('favorites')
        .delete()
        .eq('id', insertData.id);
    }
    
    return NextResponse.json({ 
      success: true,
      favorites: { data: favoritesData, error: favoritesError },
      reactions: { data: reactionsData, error: reactionsError },
      insertTest: { data: insertData, error: insertError }
    });
  } catch (error: any) {
    console.error('Error in debug-tables API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}