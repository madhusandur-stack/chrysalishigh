import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal/shell";
import { staffNav, staffDockNav } from "@/components/portal/nav-config";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/staff-portal")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/staff" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const ok = (roles ?? []).some((r) => r.role === "campus_admin" || r.role === "system_admin");
    if (!ok) throw redirect({ to: "/staff" });
    return {};
  },
  component: StaffLayout,
});

function StaffLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !session) navigate({ to: "/staff" });
  }, [loading, session, navigate]);
  return (
    <PortalShell nav={staffNav} dock={staffDockNav} label="Staff Portal">
      <Outlet />
    </PortalShell>
  );
}
