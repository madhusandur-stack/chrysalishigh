import { createFileRoute, redirect } from "@tanstack/react-router";

/** Report cards now live inside Academics; keep the old URL working. */
export const Route = createFileRoute("/_portal/report-cards")({
  beforeLoad: () => {
    throw redirect({ to: "/academics" });
  },
});
