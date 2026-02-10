import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = "https://yibpjemrwzawgxdcnmsw.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYnBqZW1yd3phd2d4ZGNubXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTEzMjMsImV4cCI6MjA4NjE2NzMyM30.06Sfyeq2iGJQ_C9aXvQVgvjUBUuu2yVOFW63jMwG_i8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
