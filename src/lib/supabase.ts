import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iswgycclurbdxrnrxbvz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzd2d5Y2NsdXJiZHhybnJ4YnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MjAzMDYsImV4cCI6MjA5NjQ5NjMwNn0.M4jd09y_Hzl4osvtJaOq9xBjVQITIQQVMSXjAYs1zM4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
