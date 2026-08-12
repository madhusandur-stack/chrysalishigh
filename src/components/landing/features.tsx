import { motion } from "framer-motion";
import {
  Bus,
  BookOpen,
  CalendarCheck,
  FileText,
  Megaphone,
  Utensils,
  type LucideIcon,
} from "lucide-react";

type Feature = { icon: LucideIcon; title: string; body: string; tint: string };

const FEATURES: Feature[] = [
  {
    icon: Megaphone,
    title: "Noticeboard",
    body: "Campus announcements, circulars and PTM invites, sorted newest first.",
    tint: "var(--signal)",
  },
  {
    icon: BookOpen,
    title: "Homework",
    body: "Every subject, every due date — with what's pending always on top.",
    tint: "var(--violet)",
  },
  {
    icon: CalendarCheck,
    title: "Attendance",
    body: "Month-by-month presence with instant clarity on leaves and holidays.",
    tint: "var(--emerald)",
  },
  {
    icon: FileText,
    title: "Report cards",
    body: "Term results and progress history, ready to view or download.",
    tint: "var(--signal)",
  },
  {
    icon: Bus,
    title: "Bus tracking",
    body: "Route, stop and live status so mornings stop being guesswork.",
    tint: "var(--ember)",
  },
  {
    icon: Utensils,
    title: "Cafeteria",
    body: "The week's menu at a glance, including today's special.",
    tint: "var(--emerald)",
  },
];

/** Feature grid — responsive 1 / 2 / 3 columns with hover lift. */
export function LandingFeatures() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24"
    >
      <div className="max-w-2xl">
        <span className="mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--signal)]">
          What's inside
        </span>
        <h2
          id="features-heading"
          className="mt-4 font-display text-[30px] font-bold leading-tight tracking-tight text-foreground sm:text-[40px]"
        >
          One portal for the whole school day.
        </h2>
        <p className="mt-4 text-base leading-7 text-[color:var(--ink-soft)]">
          Built with Chrysalis teachers and parents, so every screen answers a question a family
          actually asks.
        </p>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {FEATURES.map((feature, index) => (
          <motion.li
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: (index % 3) * 0.06 }}
            className="group rounded-[20px] border border-line bg-paper p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
          >
            <span
              className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] transition-transform duration-300 group-hover:scale-105"
              style={{
                backgroundColor: `color-mix(in oklab, ${feature.tint} 14%, transparent)`,
                color: feature.tint,
              }}
              aria-hidden
            >
              <feature.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-foreground">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{feature.body}</p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
