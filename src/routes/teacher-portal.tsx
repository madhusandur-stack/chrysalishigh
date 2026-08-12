import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal/shell";
import { teacherNav, teacherDockNav } from "@/components/portal/nav-config";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/teacher-portal")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/teacher" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const ok = (roles ?? []).some((r) => r.role === "teacher" || r.role === "system_admin");
    if (!ok) throw redirect({ to: "/teacher" });
    return {};
  },
  component: TeacherLayout,
});

function TeacherLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !session) navigate({ to: "/teacher" });
  }, [loading, session, navigate]);

  return (
    <PortalShell nav={teacherNav} dock={teacherDockNav} label="Teacher Portal">
      <Outlet />
    </PortalShell>
  );
}
