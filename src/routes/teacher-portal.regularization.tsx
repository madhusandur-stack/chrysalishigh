import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import { FilePicker } from "@/components/portal/file-picker";
import {
  EmptyState,
  ErrorState,
  Field,
  LoadingRows,
  PrimaryButton,
  SectionCard,
  Select,
  StatusPill,
  TextArea,
  TextInput,
} from "@/components/portal/ui-kit";
import {
  buildHrEmail,
  createRegularization,
  getMyIdentity,
  listRegularizations,
  listTeacherAttendance,
  qk,
  type Attachment,
} from "@/lib/school-api";

type Search = { date?: string; reason?: string };

export const Route = createFileRoute("/teacher-portal/regularization")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    date: typeof search['date'] === "string" ? (search['date'] as string) : undefined,
    reason: typeof search['reason'] === "string" ? (search['reason'] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Regularization — Chrysalis Teacher Portal" },
      {
        name: "description",
        content: "Raise attendance regularization requests to HR and track their approval status.",
      },
      { property: "og:title", content: "Regularization — Chrysalis Teacher Portal" },
      { property: "og:description", content: "Submit and track attendance regularization requests." },
    ],
  }),
  component: RegularizationPage,
});

const REASONS = [
  { value: "late", label: "Late arrival" },
  { value: "half_day", label: "Half day" },
  { value: "early_departure", label: "Early departure" },
  { value: "absent", label: "Missing punch / absent" },
  { value: "leave", label: "Approved leave not recorded" },
] as const;

function RegularizationPage() {
  const qc = useQueryClient();
  const search = Route.useSearch();

  const meQ = useQuery({ queryKey: qk.mine, queryFn: getMyIdentity, staleTime: 300_000 });
  const staff = meQ.data?.staff ?? null;
  const staffId = staff?.id;

  const [date, setDate] = useState(search.date ?? new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState<string>(search.reason ?? "late");
  const [explanation, setExplanation] = useState("");
  const [docs, setDocs] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<{ date?: string; explanation?: string }>({});

  useEffect(() => {
    if (search.date) setDate(search.date);
    if (search.reason) setReason(search.reason);
  }, [search.date, search.reason]);

  const attendanceQ = useQuery({
    queryKey: qk.teacherAttendance(staffId),
    queryFn: () => listTeacherAttendance({ staffId }),
    enabled: !!staffId,
  });

  const listQ = useQuery({
    queryKey: [...qk.regularization, staffId ?? "none"],
    queryFn: () => listRegularizations(staffId),
    enabled: !!staffId,
  });

  const reasonLabel = REASONS.find((r) => r.value === reason)?.label ?? reason;

  const emailBody = useMemo(
    () =>
      buildHrEmail({
        teacherName: staff?.full_name ?? "Teacher",
        employeeNo: staff?.employee_no ?? null,
        date,
        reason: reasonLabel,
        explanation: explanation.trim() || "[Add your explanation above and it will appear here.]",
      }),
    [staff, date, reasonLabel, explanation],
  );

  const submit = useMutation({
    mutationFn: async () => {
      const attendanceId = (attendanceQ.data ?? []).find((r) => r.date === date)?.id ?? null;
      await createRegularization({
        staff_id: staffId!,
        attendance_id: attendanceId,
        date,
        reason: reasonLabel,
        explanation: explanation.trim(),
        document_url: docs[0]?.url ?? null,
        email_body: emailBody,
      });
    },
    onSuccess: () => {
      toast.success("Regularization request sent to HR");
      setExplanation("");
      setDocs([]);
      void qc.invalidateQueries({ queryKey: qk.regularization });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not submit the request"),
  });

  function validate() {
    const next: typeof errors = {};
    if (!date) next.date = "Pick the date you want regularized.";
    if (explanation.trim().length < 20) next.explanation = "Please explain in at least a couple of sentences.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const requests = listQ.data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PortalPageHeader
        eyebrow="Regularization"
        title="Attendance regularization"
        description="Raise a formal request when a punch record needs correcting. The HR-addressed note is generated for you."
      />

      <SectionCard title="New request" description="Date, reason and explanation are required. Attach a document if you have one.">
        {meQ.isLoading ? (
          <LoadingRows rows={3} height={72} />
        ) : !staffId ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No staff record linked"
            description="This demo session isn't linked to a staff member yet."
          />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Date" error={errors.date} required>
                <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Reason" required>
                <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Explanation" error={errors.explanation} required>
              <TextArea
                value={explanation}
                placeholder="Explain what happened — traffic, medical appointment, biometric failure…"
                onChange={(e) => setExplanation(e.target.value)}
                aria-invalid={!!errors.explanation}
              />
            </Field>

            <Field label="Supporting document (optional)">
              <FilePicker value={docs} onChange={setDocs} folder="regularization" label="Attach document" />
            </Field>

            <Field label="Request preview (sent to HR)">
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-[14px] border border-line bg-paper-2 p-4 text-xs leading-relaxed text-[color:var(--ink-soft)]">
                {emailBody}
              </pre>
            </Field>

            <div className="border-t border-line pt-4">
              <PrimaryButton
                loading={submit.isPending}
                onClick={() => {
                  if (validate()) submit.mutate();
                  else toast.error("Please complete the required fields.");
                }}
              >
                <Send className="h-4 w-4" /> Submit request
              </PrimaryButton>
            </div>
          </div>
        )}
      </SectionCard>

      <div className="mt-5">
        <SectionCard title="My requests" description="Status updates from HR appear here.">
          {listQ.isLoading ? (
            <LoadingRows rows={3} height={72} />
          ) : listQ.isError ? (
            <ErrorState message={(listQ.error as Error)?.message} onRetry={() => void listQ.refetch()} />
          ) : requests.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No requests yet" description="Submitted requests will be listed here." />
          ) : (
            <ul className="space-y-3">
              {requests.map((r) => (
                <li key={r.id} className="rounded-[16px] border border-line bg-paper p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-sm font-semibold tracking-tight">
                      {new Date(r.date).toLocaleDateString()} · {r.reason}
                    </div>
                    <StatusPill status={r.status} />
                    <span className="mono ml-auto text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                      raised {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{r.explanation}</p>
                  {r.hr_note && (
                    <p className="mt-2 rounded-[12px] border border-line bg-paper-2 p-3 text-xs text-[color:var(--ink-soft)]">
                      <span className="font-semibold">HR note:</span> {r.hr_note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
