import { createClient } from "@supabase/supabase-js";

// The URL and anon key are PUBLIC by design (shipped to every browser).
// Your data is protected by Row Level Security in the database.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qhncqnwhodcleiviwyul.supabase.co";
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobmNxbndob2RjbGVpdml3eXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTE4NjMsImV4cCI6MjA5ODM4Nzg2M30.HKZavWpLUmpkEbEc5U1w0wf0DgRPyEStv5PFbQsk_9Q";

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
