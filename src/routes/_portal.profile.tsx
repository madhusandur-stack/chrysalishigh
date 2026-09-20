import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Bus,
  CalendarDays,
  ContactRound,
  FileText,
  HeartPulse,
  Home,
  IdCard,
  Mail,
  MapPin,
  Phone,
  School,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PrimaryButton,
  SectionCard,
} from "@/components/portal/ui-kit";
import { getMyIdentity, qk, type Student } from "@/lib/school-api";

export const Route = createFileRoute("/_portal/profile")({
  head: () => ({
    meta: [
      { title: "Student Profile — Chrysalis Connect" },
      { name: "description", content: "View your official student, family, and school information." },
      { property: "og:title", content: "Student Profile — Chrysalis Connect" },
      { property: "og:description", content: "View your official student, family, and school information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

const missing = (value: ReactNode) =>
  value === null || value === undefined || value === "" ? "Not provided" : value;

function formatDate(date: string | null) {
  if (!date) return "Not provided";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function initials(name: string | null) {
  if (!name) return "—";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function ProfilePage() {
  const [showUpdateHelp, setShowUpdateHelp] = useState(false);
  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const student = meQ.data?.student ?? null;

  if (meQ.isLoading) {
    return (
      <Page>
        <LoadingRows rows={5} height={112} />
      </Page>
    );
  }

  if (meQ.isError) {
    return (
      <Page>
        <ErrorState message={(meQ.error as Error).message} onRetry={() => void meQ.refetch()} />
      </Page>
    );
  }

  if (!student) {
    return (
      <Page>
        <ErrorState message="Your account is not linked to a student profile. Please contact the school office." />
      </Page>
    );
  }

  const classLabel = student.classes
    ? `${student.classes.grade}-${student.classes.section}`
    : "Not linked";
  const campus = student.classes?.campuses?.name ?? "Not linked";

  return (
    <Page>
      <PageHeader
        title="Student Profile"
        subtitle="Your official school record"
        actions={
          <PrimaryButton type="button" onClick={() => setShowUpdateHelp((visible) => !visible)}>
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Request an update</span>
            <span className="sm:hidden">Update</span>
          </PrimaryButton>
        }
      />

      {showUpdateHelp && (
        <div className="mb-5 flex flex-col gap-3 rounded-[16px] border border-[color:var(--signal)]/25 bg-[color:var(--signal-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--signal)]" />
            <div>
              <p className="text-sm font-semibold">Official records are managed by the school</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--ink-soft)]">
                Contact the school office with supporting documents to request a correction or update.
              </p>
            </div>
          </div>
          <GhostButton type="button" onClick={() => setShowUpdateHelp(false)} className="self-start sm:self-auto">
            Dismiss
          </GhostButton>
        </div>
      )}

      <ProfileBanner student={student} classLabel={classLabel} campus={campus} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
        <div className="space-y-5">
          <SectionCard title="Student details" description="Personal and academic information">
            <InfoGrid>
              <InfoItem icon={IdCard} label="Admission / Student ID" value={student.admission_no} mono />
              <InfoItem icon={UserRound} label="Full name" value={student.full_name} />
              <InfoItem icon={CalendarDays} label="Date of birth" value={formatDate(student.dob)} />
              <InfoItem icon={ContactRound} label="Gender" value={student.gender} />
              <InfoItem icon={HeartPulse} label="Blood group" value={student.blood_group} />
              <InfoItem icon={BookOpen} label="Class & section" value={classLabel} />
              <InfoItem icon={BadgeCheck} label="Roll number" value={student.roll_no} mono />
              <InfoItem icon={School} label="House" value={student.house} />
              <InfoItem icon={Building2} label="Campus" value={campus} />
              <InfoItem icon={ContactRound} label="Nationality" value={null} />
              <InfoItem icon={ContactRound} label="Religion" value={null} />
              <InfoItem icon={ContactRound} label="Caste / Sub-caste" value={null} />
            </InfoGrid>
          </SectionCard>

          <section aria-labelledby="family-heading">
            <div className="mb-3">
              <h2 id="family-heading" className="text-base font-semibold">Family & contact</h2>
              <p className="mt-1 text-xs text-[color:var(--ink-soft)]">Parent details registered with the school</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ParentCard
                role="Mother"
                name={student.mother_name}
                phone={student.mother_phone}
                email={student.mother_email}
                occupation={student.mother_occupation}
              />
              <ParentCard
                role="Father"
                name={student.father_name}
                phone={student.father_phone}
                email={student.father_email}
                occupation={student.father_occupation}
              />
            </div>
          </section>

          <SectionCard title="Address & additional information" description="Registered residential details">
            <div className="flex gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-paper-2 text-[color:var(--signal)]">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-[color:var(--ink-soft)]">Residential address</div>
                <div className="mt-1 whitespace-pre-line text-sm font-medium leading-relaxed">{missing(student.address)}</div>
              </div>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-5">
          <SectionCard title="Guardians" description="Authorized guardian information">
            <EmptyState
              icon={UsersRound}
              title="No guardian record available"
              description="Any separately registered guardian will appear here."
            />
          </SectionCard>

          <SectionCard title="Documents" description="Official documents linked to this profile">
            <EmptyState
              icon={FileText}
              title="No linked documents"
              description="Documents linked by the school will appear here."
            />
          </SectionCard>

          <SectionCard title="Transport" description="Assigned school transport">
            <EmptyState
              icon={Bus}
              title="No transport record available"
              description="Route, stop, and vehicle information will appear when assigned."
            />
          </SectionCard>
        </aside>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 text-xs text-[color:var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[color:var(--signal)]" />
          This is a read-only view of the school’s official record.
        </p>
        <GhostButton type="button" onClick={() => setShowUpdateHelp(true)}>
          <Mail className="h-4 w-4" /> Contact school office
        </GhostButton>
      </div>
    </Page>
  );
}

function ProfileBanner({ student, classLabel, campus }: { student: Student; classLabel: string; campus: string }) {
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-line bg-paper p-5 shadow-card sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-[color:var(--signal)]" />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {student.photo_url ? (
          <img
            src={student.photo_url}
            alt={`${student.full_name} profile`}
            className="h-24 w-24 shrink-0 rounded-[18px] border border-line object-cover sm:h-28 sm:w-28"
          />
        ) : (
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-[18px] bg-[color:var(--signal-soft)] text-2xl font-semibold text-[color:var(--signal)] sm:h-28 sm:w-28 sm:text-3xl">
            {initials(student.full_name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--signal-soft)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--signal)]">
            <BadgeCheck className="h-3.5 w-3.5" /> Active student
          </div>
          <h2 className="break-words text-2xl font-semibold sm:text-3xl">{student.full_name}</h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[color:var(--ink-soft)]">
            <span className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {classLabel}</span>
            <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4" /> Roll {student.roll_no}</span>
            <span className="inline-flex items-center gap-1.5"><IdCard className="h-4 w-4" /> {student.admission_no}</span>
            <span className="inline-flex items-center gap-1.5"><School className="h-4 w-4" /> {missing(student.house)}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {campus}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>;
}

function InfoItem({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof IdCard;
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 border-b border-line pb-4 last:border-b-0 sm:last:border-b">
      <dt className="flex items-center gap-1.5 text-xs text-[color:var(--ink-soft)]">
        <Icon className="h-3.5 w-3.5" /> {label}
      </dt>
      <dd className={`mt-1.5 break-words text-sm font-medium ${mono ? "mono" : ""}`}>{missing(value)}</dd>
    </div>
  );
}

function ParentCard({
  role,
  name,
  phone,
  email,
  occupation,
}: {
  role: "Mother" | "Father";
  name: string | null;
  phone: string | null;
  email: string | null;
  occupation: string | null;
}) {
  return (
    <article className="rounded-[18px] border border-line bg-paper p-5 shadow-card">
      <div className="flex items-center gap-3 border-b border-line pb-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-paper-2 text-sm font-semibold text-[color:var(--signal)]">
          {initials(name)}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-[color:var(--ink-soft)]">{role}</div>
          <h3 className="mt-0.5 break-words text-base font-semibold">{missing(name)}</h3>
        </div>
      </div>
      <dl className="mt-4 space-y-3">
        <ContactLine icon={BriefcaseBusiness} label="Occupation" value={occupation} />
        <ContactLine icon={Phone} label="Phone" value={phone} href={phone ? `tel:${phone}` : undefined} />
        <ContactLine icon={Mail} label="Email" value={email} href={email ? `mailto:${email}` : undefined} />
      </dl>
    </article>
  );
}

function ContactLine({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Phone;
  label: string;
  value: string | null;
  href?: string;
}) {
  const content = href ? (
    <a href={href} className="break-all font-medium text-[color:var(--signal)] hover:underline">
      {value}
    </a>
  ) : (
    <span className="break-words font-medium">{missing(value)}</span>
  );

  return (
    <div className="grid grid-cols-[20px_88px_minmax(0,1fr)] items-start gap-2 text-xs">
      <Icon className="mt-0.5 h-4 w-4 text-[color:var(--ink-soft)]" />
      <dt className="text-[color:var(--ink-soft)]">{label}</dt>
      <dd>{content}</dd>
    </div>
  );
}