import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Award, BookOpen, Bus, FileText, User } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import { BusWidget } from "@/components/portal/bus-widget";
import { student, parents, emergency, transport, academic, achievements, documents } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const Route = createFileRoute("/_portal/profile")({ component: ProfilePage });

const houseColor: Record<string, string> = {
  Challengers: "var(--color-house-challengers)",
  Warriors: "var(--color-house-warriors)",
  Gladiators: "var(--color-house-gladiators)",
  Knights: "var(--color-house-knights)",
};

const tabs = [
  { key: "overview", label: "Overview", icon: User },
  { key: "parents", label: "Parents", icon: User },
  { key: "transport", label: "Transport", icon: Bus },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "academic", label: "Academic", icon: BookOpen },
] as const;

function ProfilePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("overview");
  const hc = houseColor[student.house];

  return (
    <Page>
      {/* Header */}
      <div className="card-surface mb-6 overflow-hidden">
        <div className="relative h-32" style={{ background: `linear-gradient(135deg, ${hc}22, var(--paper-2))` }}>
          <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 20% 50%, ${hc}55, transparent 60%)` }} />
        </div>
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:gap-6">
          <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 300 }} className="-mt-14 shrink-0">
            <div
              className="grid h-28 w-28 place-items-center rounded-[24px] border-4 border-paper text-4xl font-bold text-white shadow-xl"
              style={{ background: `linear-gradient(135deg, ${hc}, color-mix(in srgb, ${hc} 60%, black))` }}
            >
              {student.firstName[0]}{student.name.split(" ")[1][0]}
            </div>
          </motion.div>
          <div className="min-w-0 flex-1 pt-2">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">{student.name}</h1>
            <div className="mono mt-1 flex flex-wrap items-center gap-2 text-xs text-[color:var(--ink-soft)]">
              <span>{student.className}-{student.section}</span>
              <span>·</span>
              <span>Roll {student.rollNo}</span>
              <span>·</span>
              <span>{student.studentId}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ background: hc }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white/80" /> {student.house}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative mb-6 flex gap-1 overflow-x-auto rounded-full border border-line bg-paper p-1">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition",
                active ? "text-white" : "text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]",
              )}
            >
              {active && (
                <motion.span
                  layoutId="profile-tab"
                  className="absolute inset-0 rounded-full bg-[color:var(--signal)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <t.icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === "overview" && <Overview />}
        {tab === "parents" && <Parents />}
        {tab === "transport" && <Transport />}
        {tab === "documents" && <Documents />}
        {tab === "academic" && <Academic />}
      </motion.div>
    </Page>
  );
}

function Overview() {
  const fields = [
    { label: "Full name", value: student.name },
    { label: "Student ID", value: student.studentId, mono: true },
    { label: "Admission #", value: student.admissionNumber, mono: true },
    { label: "Class & Section", value: `${student.className}-${student.section}` },
    { label: "Roll number", value: student.rollNo, mono: true },
    { label: "House", value: student.house },
    { label: "Date of Birth", value: format(new Date(student.dob), "d MMM yyyy"), mono: true },
    { label: "Gender", value: student.gender },
    { label: "Blood group", value: student.bloodGroup, mono: true },
    { label: "Nationality", value: student.nationality },
    { label: "Contact", value: student.contact, mono: true },
    { label: "Email", value: student.email, mono: true },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card-surface p-6 lg:col-span-2">
        <PageHeader title="" subtitle="" />
        <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">Personal details</div>
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {fields.filter((f) => f.value).map((f) => (
            <div key={f.label}>
              <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">{f.label}</div>
              <div className={`mt-0.5 text-sm font-medium ${f.mono ? "mono" : ""}`}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card-surface p-6">
        <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">
          <Award className="h-3.5 w-3.5" /> Achievements
        </div>
        <div className="grid gap-2">
          {achievements.map((a) => (
            <motion.div whileHover={{ rotate: -0.5, y: -2 }} key={a.id} className="rounded-[14px] border border-line bg-paper-2 p-3">
              <div className="text-sm font-medium">{a.title}</div>
              <div className="mono text-[11px] text-[color:var(--ink-soft)]">{a.year}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Parents() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ParentCard title="Mother" p={parents.mother} />
        <ParentCard title="Father" p={{ ...parents.father, employer: "" }} />
      </div>
      <div className="card-surface p-6">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">Home address</div>
        <div className="text-sm">{parents.address}</div>
      </div>
      <div className="card-surface p-6">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">Emergency contact</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name" value={emergency.name} />
          <Field label="Relation" value={emergency.relation} />
          <Field label="Phone" value={emergency.phone} mono />
        </div>
      </div>
    </div>
  );
}

function ParentCard({ title, p }: { title: string; p: typeof parents.mother }) {
  return (
    <div className="card-surface p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--signal-soft)] text-[color:var(--signal)]">
          <User className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">{title}</div>
          <div className="text-base font-semibold">{p.name}</div>
        </div>
      </div>
      <div className="grid gap-3">
        {p.phone && <Field label="Phone" value={p.phone} mono />}
        {p.email && <Field label="Email" value={p.email} mono />}
        {p.occupation && <Field label="Occupation" value={p.occupation} />}
        {"employer" in p && p.employer && <Field label="Employer" value={p.employer as string} />}
      </div>
    </div>
  );
}

function Transport() {
  return (
    <div className="grid gap-4">
      <BusWidget />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card-surface p-6">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">Pickup</div>
          <div className="grid gap-3">
            <Field label="Route" value={transport.route} mono />
            <Field label="Location" value={transport.pickup.location} />
            <Field label="Time" value={transport.pickup.time} mono />
            <Field label="Driver" value={transport.driver} />
            <Field label="Attendant" value={transport.attendant} />
            <Field label="Attendant contact" value={transport.attendantContact} mono />
          </div>
        </div>
        <div className="card-surface p-6">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">Drop</div>
          <div className="grid gap-3">
            <Field label="Route" value={transport.route} mono />
            <Field label="Location" value={transport.drop.location} />
            <Field label="Time" value={transport.drop.time} mono />
            <Field label="Driver" value={transport.driver} />
            <Field label="Attendant" value={transport.attendant} />
            <Field label="Attendant contact" value={transport.attendantContact} mono />
          </div>
        </div>
      </div>
    </div>
  );
}

function Documents() {
  const submitted = ["Aadhaar copy", "Birth certificate", "Previous school TC", "Passport-size photo"];
  const pending = ["Immunisation record", "Medical form 2026"];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card-surface p-6">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">Submitted</div>
        <ul className="grid gap-2">
          {submitted.map((d) => (
            <li key={d} className="flex items-center gap-3 rounded-[12px] border border-line bg-paper-2 px-4 py-2.5">
              <span className="mono rounded-full bg-[color-mix(in_srgb,var(--emerald)_15%,transparent)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--emerald)]">Submitted</span>
              <span className="text-sm">{d}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="card-surface p-6">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">Pending</div>
        <ul className="grid gap-2">
          {pending.map((d) => (
            <li key={d} className="flex items-center gap-3 rounded-[12px] border border-line bg-paper-2 px-4 py-2.5">
              <span className="mono rounded-full bg-[color-mix(in_srgb,var(--ember)_15%,transparent)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--ember)]">Pending</span>
              <span className="text-sm">{d}</span>
            </li>
          ))}
        </ul>
        <div className="mono mt-4 text-[11px] text-[color:var(--ink-soft)]">Total files in portal: {Object.values(documents).flat().length}</div>
      </div>
    </div>
  );
}

function Academic() {
  return (
    <div className="card-surface p-6">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">Academic details</div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="First language" value={academic.firstLanguage} />
        <Field label="Second language" value={academic.secondLanguage} />
        <Field label="Third language" value={academic.thirdLanguage} />
        <Field label="Sports" value={academic.sports} />
        <Field label="Optional" value={academic.optional} />
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-soft)]">{label}</div>
      <div className={`mt-0.5 text-sm font-medium ${mono ? "mono" : ""}`}>{value}</div>
    </div>
  );
}
