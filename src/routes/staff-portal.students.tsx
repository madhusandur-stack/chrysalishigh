import { createFileRoute } from "@tanstack/react-router";
import { UserManager } from "@/components/portal/user-manager";

export const Route = createFileRoute("/staff-portal/students")({
  component: () => (
    <UserManager
      role="student"
      eyebrow="Campus Admin"
      title="Students"
      description="Add, search, and manage student accounts for your campus."
    />
  ),
});
