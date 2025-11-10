import { supabase } from './supabase';

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        read: false,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

export async function sendPostLikeNotification(
  userId: string,
  postId: string,
  spaceName: string
) {
  return sendNotification(
    userId,
    'Новый лайк',
    `Ваш пост в пространстве "${spaceName}" получил лайк`,
    'info'
  );
}

export async function sendPostReactionNotification(
  userId: string,
  postId: string,
  spaceName: string,
  reactionType: string
) {
  const reactionEmojis: Record<string, string> = {
    'like': '❤️',
    'fire': '🔥',
    'heart': '💖',
    'wow': '😮',
    'cute': '😍'
  };
  
  const reactionLabels: Record<string, string> = {
    'like': 'лайк',
    'fire': 'огонь',
    'heart': 'сердце',
    'wow': 'вау',
    'cute': 'мило'
  };
  
  return sendNotification(
    userId,
    `Новая реакция ${reactionEmojis[reactionType] || '👍'}`,
    `Ваш пост в пространстве "${spaceName}" получил реакцию ${reactionLabels[reactionType] || 'лайк'}`,
    'info'
  );
}

export async function sendPostCommentNotification(
  userId: string,
  postId: string,
  spaceName: string,
  comment: string
) {
  return sendNotification(
    userId,
    'Новый комментарий',
    `Ваш пост в пространстве "${spaceName}" получил комментарий: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`,
    'info'
  );
}

export async function sendAchievementNotification(
  userId: string,
  achievementName: string
) {
  return sendNotification(
    userId,
    'Новое достижение!',
    `Поздравляем! Вы получили достижение "${achievementName}"`,
    'success'
  );
}

export async function sendLevelUpNotification(
  userId: string,
  level: number
) {
  return sendNotification(
    userId,
    'Новый уровень!',
    `Поздравляем! Вы достигли уровня ${level}`,
    'success'
  );
}