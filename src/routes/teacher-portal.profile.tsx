import { createFileRoute } from "@tanstack/react-router";
import { User } from "lucide-react";
import { ComingSoon } from "@/components/portal/coming-soon";

export const Route = createFileRoute("/teacher-portal/profile")({
  component: () => <ComingSoon icon={User} title="Profile" description="Edit photo, phone, bio, subject and password — ships next." />,
});
