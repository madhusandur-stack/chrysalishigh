import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, CalendarCheck, FileText, Megaphone, Upload, Utensils, Wallet } from "lucide-react";
import { SoftAurora } from "@/components/portal/aurora";
import { Page, StaggerGrid, StaggerItem } from "@/components/portal/page";
import { BusWidget } from "@/components/portal/bus-widget";
import { CountUp } from "@/components/portal/count-up";
import { student, notices, homework, attendance, reportCards, cafeteria, fees, events } from "@/lib/mock-data";
import { format } from "date-fns";

export const Route = createFileRoute("/_portal/dashboard")({ component: Dashboard });

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const latestNotice = notices[0];
  const pendingHW = homework.filter((h) => h.status === "pending");
  const latestReport = reportCards.find((r) => r.status === "Available");
  const upcoming = events.slice(0, 3);

  return (
    <Page>
      {/* Aurora hero */}
      <div className="relative overflow-hidden rounded-[28px] border border-line">
        <SoftAurora />
        <div className="relative px-6 py-10 sm:px-10 sm:py-14">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="mono inline-flex items-center rounded-full border border-line bg-paper/70 px-3 py-1 text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)] backdrop-blur">
              {format(new Date(), "EEEE, d MMMM")}
            </div>
            <h1 className="mt-4 max-w-2xl text-[34px] font-semibold leading-tight tracking-tight sm:text-[42px]">
              {greeting()}, {student.firstName}
            </h1>
            <p className="mt-3 max-w-xl text-[15px] text-[color:var(--ink-soft)]">
              {student.motto}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bento grid — noticeboard prominent */}
      <StaggerGrid className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-6 lg:gap-5">
        {/* Latest Notice — spans 4 */}
        <StaggerItem className="md:col-span-4">
          <Link to="/noticeboard" className="card-surface card-hover group block h-full p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">
                <Megaphone className="h-3.5 w-3.5" /> Latest notice
              </div>
              {latestNotice.pinned && (
                <span className="mono inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--ember)_15%,transparent)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--ember)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--ember)]" /> Pinned
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold leading-snug tracking-tight">{latestNotice.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--ink-soft)]">{latestNotice.snippet}</p>
            <div className="mt-5 flex items-center justify-between text-xs text-[color:var(--ink-soft)]">
              <div>
                <span className="mono">{latestNotice.postedBy}</span> · <span className="mono">{format(new Date(latestNotice.date), "d MMM")}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[color:var(--signal)] transition group-hover:translate-x-0.5">
                All notices <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        </StaggerItem>

        {/* Bus widget — 2 */}
        <StaggerItem className="md:col-span-2">
          <BusWidget compact />
        </StaggerItem>

        {/* Attendance ring — 2 */}
        <StaggerItem className="md:col-span-2">
          <Link to="/attendance" className="card-surface card-hover group flex h-full items-center gap-5 p-6">
            <AttendanceRing value={attendance.overall} />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">Attendance</div>
              <div className="mono mt-1 text-[28px] font-semibold leading-none">
                <CountUp to={attendance.overall} suffix="%" />
              </div>
              <div className="mt-2 text-xs text-[color:var(--ink-soft)]">This academic year</div>
            </div>
          </Link>
        </StaggerItem>

        {/* Homework due — 2 */}
        <StaggerItem className="md:col-span-2">
          <Link to="/homework" className="card-surface card-hover group flex h-full flex-col justify-between p-6">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">
                <BookOpen className="h-3.5 w-3.5" /> Homework due
              </div>
              <div className="mono mt-3 text-[36px] font-semibold leading-none text-[color:var(--ember)]">
                <CountUp to={pendingHW.length} />
              </div>
            </div>
            <div className="mt-4 truncate text-xs text-[color:var(--ink-soft)]">
              Next: {pendingHW[0]?.subject} — <span className="mono">{format(new Date(pendingHW[0]?.due ?? new Date()), "d MMM")}</span>
            </div>
          </Link>
        </StaggerItem>

        {/* Fee status — 2 */}
        <StaggerItem className="md:col-span-2">
          <Link to="/fees" className="card-surface card-hover group flex h-full flex-col justify-between p-6">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">
                <Wallet className="h-3.5 w-3.5" /> Outstanding
              </div>
              <div className="mono mt-3 text-[28px] font-semibold leading-none">
                ₹<CountUp to={fees.outstanding} />
              </div>
            </div>
            <div className="mt-4 text-xs text-[color:var(--ink-soft)]">
              Paid <span className="mono">₹{fees.paid.toLocaleString("en-IN")}</span> of <span className="mono">₹{fees.total.toLocaleString("en-IN")}</span>
            </div>
          </Link>
        </StaggerItem>

        {/* Report Card — 3 */}
        <StaggerItem className="md:col-span-3">
          <Link to="/academics" className="card-surface card-hover flex h-full items-center gap-5 p-6">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[14px] bg-[color-mix(in_srgb,var(--violet)_15%,transparent)] text-[color:var(--violet)]">
              <FileText className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">Latest report card</div>
              <div className="mt-1 truncate text-base font-semibold">
                {latestReport?.term} · <span className="mono">{latestReport?.year}</span>
              </div>
              <div className="mono mt-1 text-xs text-[color:var(--ink-soft)]">
                Released {latestReport ? format(new Date(latestReport.releaseDate), "d MMM yyyy") : "—"}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[color:var(--ink-soft)]" />
          </Link>
        </StaggerItem>

        {/* Cafeteria — 3 */}
        <StaggerItem className="md:col-span-3">
          <Link to="/cafeteria" className="card-surface card-hover flex h-full items-center gap-5 p-6">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[14px] bg-[color-mix(in_srgb,var(--emerald)_15%,transparent)] text-[color:var(--emerald)]">
              <Utensils className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">Monthly cafeteria menu</div>
              <div className="mt-1 truncate text-base font-semibold">{cafeteria.month}</div>
              <div className="mono mt-1 text-xs text-[color:var(--ink-soft)]">Uploaded {format(new Date(cafeteria.uploaded), "d MMM")}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-[color:var(--ink-soft)]" />
          </Link>
        </StaggerItem>

        {/* Upcoming events — 4 */}
        <StaggerItem className="md:col-span-4">
          <div className="card-surface h-full p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">
                <CalendarCheck className="h-3.5 w-3.5" /> Upcoming events
              </div>
              <Link to="/calendar" className="text-xs text-[color:var(--signal)]">See calendar</Link>
            </div>
            <ul className="space-y-2">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-center gap-4 rounded-[14px] border border-line bg-paper-2 px-4 py-3">
                  <div className="mono grid h-11 w-14 shrink-0 place-items-center rounded-[10px] bg-paper text-center leading-none">
                    <div>
                      <div className="text-[10px] uppercase text-[color:var(--ink-soft)]">{format(new Date(e.date), "MMM")}</div>
                      <div className="text-lg font-semibold">{format(new Date(e.date), "d")}</div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 truncate text-sm font-medium">{e.title}</div>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${e.type === "exam" ? "bg-[color:var(--violet)]" : "bg-[color:var(--signal)]"}`} />
                </li>
              ))}
            </ul>
          </div>
        </StaggerItem>

        {/* Quick links — 2 */}
        <StaggerItem className="md:col-span-2">
          <div className="card-surface h-full p-6">
            <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">Quick links</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Upload, label: "Homework", to: "/homework" },
                { icon: FileText, label: "Report Card", to: "/academics" },
                { icon: Wallet, label: "Pay Fees", to: "/fees" },
                { icon: CalendarCheck, label: "Calendar", to: "/calendar" },
              ].map((q) => (
                <Link key={q.label} to={q.to} className="flex flex-col items-start gap-2 rounded-[14px] border border-line bg-paper-2 p-3 transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]">
                  <q.icon className="h-4 w-4" strokeWidth={1.75} />
                  <div className="text-xs font-medium">{q.label}</div>
                </Link>
              ))}
            </div>
          </div>
        </StaggerItem>
      </StaggerGrid>
    </Page>
  );
}

function AttendanceRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="70" height="70" viewBox="0 0 70 70" className="shrink-0">
      <circle cx="35" cy="35" r={r} strokeWidth="6" className="stroke-[color:var(--line)]" fill="none" />
      <motion.circle
        cx="35" cy="35" r={r} strokeWidth="6" fill="none"
        strokeLinecap="round"
        className="stroke-[color:var(--emerald)]"
        transform="rotate(-90 35 35)"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * value) / 100 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
