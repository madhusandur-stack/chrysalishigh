import { createFileRoute } from "@tanstack/react-router";
import { UserManager } from "@/components/portal/user-manager";

export const Route = createFileRoute("/staff-portal/teachers")({
  component: () => (
    <UserManager
      role="teacher"
      eyebrow="Campus Admin"
      title="Teachers"
      description="Add, search, and manage teacher accounts for your campus."
    />
  ),
});
