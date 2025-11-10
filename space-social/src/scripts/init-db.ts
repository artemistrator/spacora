// Скрипт для инициализации базы данных
import { createClient } from '@supabase/supabase-js';

// Получаем переменные окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Создаем клиент Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function initDatabase() {
  console.log('Initializing database...');
  
  try {
    // Создаем таблицу users
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email VARCHAR(255) UNIQUE,
          name VARCHAR(255),
          avatar_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (usersError) {
      console.error('Error creating users table:', usersError);
    } else {
      console.log('Users table created successfully');
    }
    
    // Создаем таблицу notifications
    const { error: notificationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
          user_id TEXT REFERENCES users(id),
          title VARCHAR(255),
          message TEXT,
          type VARCHAR(20) DEFAULT 'info',
          read BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (notificationsError) {
      console.error('Error creating notifications table:', notificationsError);
    } else {
      console.log('Notifications table created successfully');
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Запускаем инициализацию
initDatabase();