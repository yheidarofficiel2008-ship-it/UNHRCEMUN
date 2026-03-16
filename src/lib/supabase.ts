import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uuetvjbwozeqwxdftope.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Hg5hH9A5H3AkO6Z3H8KSmQ_iGva9rjt';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);