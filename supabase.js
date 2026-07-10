const SUPABASE_URL = 'https://ervhqbfelryohfvyuaok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVydmhxYmZlbHJ5b2hmdnl1YW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMTA5MTQsImV4cCI6MjA5ODg4NjkxNH0.z-FdF47zHB3ai0f1VylUgVbxWUwBZF7I0oY8NAwh2gw';  // 替换成你自己的
const mySupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
