import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ComingSoon } from "@/components/portal/coming-soon";

export const Route = createFileRoute("/teacher-portal/students")({
  component: () => <ComingSoon icon={Users} title="Student roster" description="Full per-class roster with profile photos, attendance %, and homework completion — ships next." />,
});
