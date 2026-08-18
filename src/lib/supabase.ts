import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://odvwyzwxlvbylpznbjkv.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Guard against missing key while ensuring SPA preview does not crash on boot
if (!supabaseAnonKey) {
  console.warn(
    "[Maxfem Auth] VITE_SUPABASE_ANON_KEY is not configured in environment variables. Real-time Supabase Auth will be active once the key is provided in .env or Settings.",
  );
}

// Client-side singleton instance with session persistence
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy-fallback-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "maxfem-auth-token",
    },
  },
);

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 20,
);
