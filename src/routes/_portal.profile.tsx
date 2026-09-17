import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, Phone, UserRound } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import { ErrorState, LoadingRows, SectionCard } from "@/components/portal/ui-kit";
import { getMyIdentity, qk } from "@/lib/school-api";

export const Route = createFileRoute("/_portal/profile")({
  head: () => ({
    meta: [
      { title: "Student Profile — Chrysalis Connect" },
      { name: "description", content: "Your student and family information held by the school." },
      { property: "og:title", content: "Student Profile — Chrysalis Connect" },
      { property: "og:description", content: "Your student profile and family information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const student = meQ.data?.student ?? null;

  if (meQ.isLoading) return <Page><LoadingRows rows={4} height={100} /></Page>;
  if (meQ.isError) return <Page><ErrorState message={(meQ.error as Error).message} onRetry={() => void meQ.refetch()} /></Page>;
  if (!student) return <Page><ErrorState message="Your account is not linked to a student profile. Please contact the school office." /></Page>;

  const classLabel = student.classes ? `${student.classes.grade}-${student.classes.section}` : "Not linked";
  const campus = student.classes?.campuses?.name ?? "Campus not linked";
  const initials = student.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const details = [
    ["Admission number", student.admission_no], ["Class & section", classLabel], ["Roll number", student.roll_no],
    ["Date of birth", student.dob ? new Date(`${student.dob}T00:00:00`).toLocaleDateString() : null],
    ["Gender", student.gender], ["Blood group", student.blood_group], ["House", student.house], ["Campus", campus],
  ];

  return <Page>
    <PageHeader title="Profile" subtitle="Your student information held by the school." />
    <section className="mb-6 flex flex-col gap-5 rounded-[20px] border border-line bg-paper p-6 sm:flex-row sm:items-center">
      {student.photo_url ? <img src={student.photo_url} alt={`${student.full_name} profile`} className="h-24 w-24 rounded-[18px] object-cover" /> : <div className="grid h-24 w-24 shrink-0 place-items-center rounded-[18px] bg-[color:var(--signal-soft)] text-2xl font-semibold text-[color:var(--signal)]">{initials}</div>}
      <div><h1 className="text-2xl font-semibold">{student.full_name}</h1><p className="mono mt-1 text-xs text-[color:var(--ink-soft)]">{classLabel} · Roll {student.roll_no} · {student.admission_no}</p><p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[color:var(--ink-soft)]"><MapPin className="h-4 w-4" /> {campus}</p></div>
    </section>
    <div className="grid gap-5 lg:grid-cols-2">
      <SectionCard title="Student details" description="School record">
        <dl className="grid gap-4 sm:grid-cols-2">{details.map(([label, value]) => <div key={String(label)}><dt className="text-xs text-[color:var(--ink-soft)]">{label}</dt><dd className="mt-1 text-sm font-medium">{value || "Not provided"}</dd></div>)}</dl>
      </SectionCard>
      <SectionCard title="Family & contact" description="Contact the school office to update these details">
        <div className="space-y-5">
          <Contact name={student.father_name} role="Father" phone={student.father_phone} email={student.father_email} />
          <Contact name={student.mother_name} role="Mother" phone={student.mother_phone} email={student.mother_email} />
          <div className="border-t border-line pt-4"><div className="flex items-center gap-2 text-xs text-[color:var(--ink-soft)]"><MapPin className="h-4 w-4" /> Address</div><p className="mt-1 text-sm">{student.address || "Not provided"}</p></div>
        </div>
      </SectionCard>
    </div>
  </Page>;
}

function Contact({ name, role, phone, email }: { name: string | null; role: string; phone: string | null; email: string | null }) {
  return <div className="rounded-[14px] border border-line bg-paper-2 p-4"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-[color:var(--signal)]" /><div><div className="text-sm font-semibold">{name || "Not provided"}</div><div className="text-xs text-[color:var(--ink-soft)]">{role}</div></div></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[color:var(--ink-soft)]">{phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{phone}</span>}{email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{email}</span>}{!phone && !email && "No contact details provided"}</div></div>;
}