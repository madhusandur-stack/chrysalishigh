import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const listCampuses = createServerFn({ method: "GET" }).handler(async () => {
  const supa = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supa.from("campuses").select("id, name, slug").order("name");
  if (error) throw error;
  return data ?? [];
});
