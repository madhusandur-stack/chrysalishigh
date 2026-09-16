import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal/shell";

export const Route = createFileRoute("/_portal")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) throw redirect({ to: "/" });
    // Role gate: student and system administrators can view the student portal.
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const allowed = ["student", "system_admin"];
    const ok = (roles ?? []).some((r) => allowed.includes(r.role));
    if (!ok) {
      // Route them to the right portal if they're a teacher/admin
      const isTeacher = (roles ?? []).some((r) => r.role === "teacher");
      const isAdmin = (roles ?? []).some((r) => r.role === "campus_admin");
      if (isTeacher) throw redirect({ to: "/teacher-portal" });
      if (isAdmin) throw redirect({ to: "/staff-portal" });
      throw redirect({ to: "/" });
    }
    return { userId: user.id };
  },
  component: PortalLayout,
});

function PortalLayout() {
  return (
    <PortalShell>
      <Outlet />
    </PortalShell>
  );
}
