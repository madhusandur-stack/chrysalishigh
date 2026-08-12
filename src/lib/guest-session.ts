/**
 * Guest access layer.
 *
 * The current release ships without a credential form: visitors enter the
 * portal through a shared read-only demo identity that is provisioned on the
 * backend by `seedDemoAccounts`. All backend calls (RLS, server functions)
 * keep working unchanged because a real session is still established.
 *
 * To re-enable proper login later, stop calling `useGuestEntry` from the
 * landing page and route users to `/auth` instead — nothing else needs to
 * change.
 */
import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { seedDemoAccounts } from "@/lib/demo-seed.functions";

/** Shared demo identity used for guest sessions. */
export const GUEST_IDENTITY = {
  email: "student.varthur@demo.chrysalisconnect.in",
  password: "Student@123",
} as const;

export type GuestEntryState = {
  /** Kick off the guest sign-in flow. */
  enter: () => Promise<void>;
  pending: boolean;
  error: string | null;
};

export function useGuestEntry(): GuestEntryState {
  const navigate = useNavigate();
  const provision = useServerFn(seedDemoAccounts);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: GUEST_IDENTITY.email,
      password: GUEST_IDENTITY.password,
    });
    return signInError;
  }, []);

  const enter = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      // Fast path: the demo identity usually already exists.
      let signInError = await signIn();
      if (signInError) {
        // Retry once after provisioning the backend demo data.
        await provision({});
        signInError = await signIn();
      }
      if (signInError) throw signInError;
      toast.success("You're in — exploring as a guest.");
      await navigate({ to: "/dashboard" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start a guest session. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }, [navigate, provision, signIn]);

  return { enter, pending, error };
}
