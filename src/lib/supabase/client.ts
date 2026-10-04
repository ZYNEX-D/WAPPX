import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cnttyvtpdmbbtdkkpjxn.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseAnonKey && typeof window !== "undefined") {
  console.warn("Supabase Anon Key is missing. Check your .env.local file.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
