import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cnttyvtpdmbbtdkkpjxn.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNudHR5dnRwZG1iYnRka2twanhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMzE0NzYsImV4cCI6MjEwNjYwNzQ3Nn0.8X8evNCgMm9qbKtow5SmTaFFNXM1GmP2i-iOAkt6qPs";

if (!supabaseAnonKey && typeof window !== "undefined") {
  console.warn("Supabase Anon Key is missing. Check your .env.local file.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
