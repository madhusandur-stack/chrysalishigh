import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { ComingSoon } from "@/components/portal/coming-soon";

export const Route = createFileRoute("/teacher-portal/calendar")({
  component: () => <ComingSoon icon={Calendar} title="Calendar" description="Timetable, PTMs, exams and events — ships next." />,
});
