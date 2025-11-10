import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addVisualTestComments() {
  console.log('Adding visual test comments...');
  
  try {
    // Get a sample post
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
      
    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }
    
    if (!posts || posts.length === 0) {
      console.log('No posts found');
      return;
    }
    
    const post = posts[0];
    console.log('Using post:', post.id);
    
    // Get a sample space
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('*')
      .limit(1);
      
    if (spacesError) {
      console.error('Error fetching spaces:', spacesError);
      return;
    }
    
    if (!spaces || spaces.length === 0) {
      console.log('No spaces found');
      return;
    }
    
    const space = spaces[0];
    console.log('Using space:', space.id);
    
    // Add visually diverse test comments
    const testComments = [
      'Отличный пост! Очень полезная информация, спасибо за分享.',
      'Спасибо за такой подробный обзор. Попробую применить на практике.',
      'А как вам кажется, стоит ли добавить еще несколько деталей в дизайн?',
      'Интересный подход к решению задачи. Поделитесь еще примерами?',
      'Очень вдохновляющий контент! Подписался на ваше пространство.',
      'Есть ли у вас рекомендации по улучшению взаимодействия с пользователями?',
      'Спасибо за качественный контент. Жду новых публикаций!'
    ];
    
    for (let i = 0; i < testComments.length; i++) {
      const { data: commentData, error: insertError } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          space_id: space.id,
          content: testComments[i]
        })
        .select();
        
      if (insertError) {
        console.error(`Error inserting comment ${i + 1}:`, insertError);
      } else {
        console.log(`✅ Comment ${i + 1} inserted:`, commentData[0].id);
      }
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Update the comments count in the post
    const newCount = (post.comments_count || 0) + testComments.length;
    console.log('Updating comments count to:', newCount);
    
    const { error: updateError } = await supabase
      .from('posts')
      .update({ comments_count: newCount })
      .eq('id', post.id);
      
    if (updateError) {
      console.error('Error updating comments count:', updateError);
    } else {
      console.log('✅ Comments count updated successfully');
    }
    
    console.log('\n🎉 Added visual test comments! Refresh your app to see the enhanced design.');
    
  } catch (error) {
    console.error('Error adding visual test comments:', error);
  }
}

// Run the function
addVisualTestComments();