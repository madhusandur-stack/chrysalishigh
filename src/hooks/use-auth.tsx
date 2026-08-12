import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  campuses?: { id: string; name: string; slug: string } | null;
};
type Role = Database["public"]["Enums"]["app_role"];

export type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: Role[];
  loading: boolean;
  hasRole: (r: Role) => boolean;
  hasAnyRole: (r: Role[]) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SESSION_KEY = ["auth", "session"] as const;
const PROFILE_KEY = (uid: string | null | undefined) => ["auth", "profile", uid ?? "anon"] as const;

async function fetchSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

async function fetchProfileAndRoles(userId: string) {
  const [{ data: prof }, { data: userRoles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*, campuses(id, name, slug)")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  return {
    profile: (prof as Profile) ?? null,
    roles: (userRoles ?? []).map((r) => r.role as Role),
  };
}

/**
 * React-Query backed auth. Profile + roles are cached for 60s and shared
 * across every component that calls useAuth, so a page render with 5
 * consumers hits Supabase once, not 5 times.
 */
export function useAuth(): AuthState {
  const qc = useQueryClient();

  const sessionQ = useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchSession,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const userId = sessionQ.data?.user.id ?? null;

  const profileQ = useQuery({
    queryKey: PROFILE_KEY(userId),
    queryFn: () => fetchProfileAndRoles(userId!),
    enabled: !!userId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        qc.setQueryData(SESSION_KEY, s);
        if (s) qc.invalidateQueries({ queryKey: PROFILE_KEY(s.user.id) });
      } else if (event === "SIGNED_OUT") {
        qc.setQueryData(SESSION_KEY, null);
        qc.removeQueries({ queryKey: ["auth", "profile"] });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: SESSION_KEY });
    if (userId) await qc.invalidateQueries({ queryKey: PROFILE_KEY(userId) });
  }, [qc, userId]);

  const roles = profileQ.data?.roles ?? [];
  const profile = profileQ.data?.profile ?? null;
  const session = sessionQ.data ?? null;

  return {
    session,
    user: session?.user ?? null,
    profile,
    roles,
    loading: sessionQ.isLoading || (!!userId && profileQ.isLoading),
    hasRole: (r) => roles.includes(r),
    hasAnyRole: (rs) => rs.some((r) => roles.includes(r)),
    refresh,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
}
