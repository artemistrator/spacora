'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  read: boolean;
}

export function NotificationToast() {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      setupRealtimeSubscription();
    }
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      // Пока отключим уведомления, так как у нас нет таблицы notifications
      // В будущем можно будет создать таблицу и включить эту функциональность
      /*
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data.length > 0) {
        setNotifications(data);
        setVisible(true);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setVisible(false);
        }, 5000);
      }
      */
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    // Пока отключим realtime уведомления
    /*
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotification = payload.new as Notification;
          if (newNotification.user_id === userId) {
            setNotifications(prev => [newNotification, ...prev].slice(0, 5));
            setVisible(true);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
              setVisible(false);
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    */
  };

  const markAsRead = async (id: string) => {
    try {
      // Пока отключим функциональность отметки как прочитанное
      /*
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      */
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Пока отключим функциональность отметки всех как прочитанные
      /*
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notifications.map(n => n.id));
      
      setNotifications([]);
      setVisible(false);
      */
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Пока отключим отображение уведомлений
  return null;

  /*
  if (!visible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-white border rounded-lg shadow-lg">
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Уведомления</h3>
            <button 
              onClick={markAllAsRead}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              Отметить все как прочитанные
            </button>
          </div>
          
          <div className="space-y-2">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-3 rounded-md ${
                  notification.type === 'success' ? 'bg-green-50 border-green-200' :
                  notification.type === 'error' ? 'bg-red-50 border-red-200' :
                  notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex justify-between">
                  <h4 className="font-medium">{notification.title}</h4>
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.created_at).toLocaleTimeString('ru-RU')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  */
}