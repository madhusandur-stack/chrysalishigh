import { createFileRoute, Outlet, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal/shell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_portal")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/" });
    // Role gate: student/parent/system_admin can view student portal
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const allowed = ["student", "parent", "system_admin"];
    const ok = (roles ?? []).some((r) => allowed.includes(r.role));
    if (!ok) {
      // Route them to the right portal if they're a teacher/admin
      const isTeacher = (roles ?? []).some((r) => r.role === "teacher");
      const isAdmin = (roles ?? []).some((r) => r.role === "campus_admin");
      if (isTeacher) throw redirect({ to: "/teacher-portal" });
      if (isAdmin) throw redirect({ to: "/staff-portal" });
      throw redirect({ to: "/" });
    }
    return { userId: data.user.id };
  },
  component: PortalLayout,
});

function PortalLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  return (
    <PortalShell>
      <Outlet />
    </PortalShell>
  );
}
