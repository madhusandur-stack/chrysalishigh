import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import {
  Field,
  GhostButton,
  LoadingRows,
  PrimaryButton,
  SectionCard,
  Select,
  StatusPill,
  TextArea,
} from "@/components/portal/ui-kit";
import {
  ACADEMIC_YEAR,
  DEMO_CLASS_ID,
  TERMS,
  getPupa,
  listClasses,
  listStudents,
  qk,
  savePupa,
  type PupaReport,
} from "@/lib/school-api";

export const Route = createFileRoute("/teacher-portal/pupa")({
  head: () => ({
    meta: [
      { title: "PUPA Reports — Chrysalis Teacher Portal" },
      { name: "description", content: "Write, save and submit PUPA progress reports for each student and term." },
    ],
  }),
  component: PupaPage,
});

const FIELDS = [
  { key: "strengths", label: "Student strengths", placeholder: "What is this student doing well this term?" },
  { key: "improvements", label: "Areas for improvement", placeholder: "Where does the student need support?" },
  { key: "observations", label: "Teacher observations", placeholder: "Classroom behaviour, participation, attitude…" },
  { key: "parent_support", label: "Suggested parent support", placeholder: "How can the family help at home?" },
  { key: "remarks", label: "Overall remarks", placeholder: "A closing summary for the parents." },
] as const;

type FormState = Record<(typeof FIELDS)[number]["key"], string>;
const EMPTY: FormState = { strengths: "", improvements: "", observations: "", parent_support: "", remarks: "" };

function PupaPage() {
  const qc = useQueryClient();
  const [classId, setClassId] = useState(DEMO_CLASS_ID);
  const [studentId, setStudentId] = useState<string>("");
  const [term, setTerm] = useState<string>(TERMS[0]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const classesQ = useQuery({ queryKey: qk.classes, queryFn: listClasses, staleTime: 300_000 });
  const studentsQ = useQuery({ queryKey: qk.students, queryFn: listStudents, staleTime: 300_000 });

  const students = useMemo(
    () => (studentsQ.data ?? []).filter((s) => s.class_id === classId),
    [studentsQ.data, classId],
  );

  useEffect(() => {
    if (!studentId && students.length) setStudentId(students[0]!.id);
  }, [students, studentId]);

  const reportQ = useQuery<PupaReport | null>({
    queryKey: [...qk.pupa(studentId), term],
    queryFn: () => getPupa(studentId, term),
    enabled: !!studentId,
  });

  useEffect(() => {
    const r = reportQ.data;
    setErrors({});
    setForm(
      r
        ? {
            strengths: r.strengths ?? "",
            improvements: r.improvements ?? "",
            observations: r.observations ?? "",
            parent_support: r.parent_support ?? "",
            remarks: r.remarks ?? "",
          }
        : EMPTY,
    );
  }, [reportQ.data, studentId, term]);

  const isFinal = reportQ.data?.status === "final";
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => setUnlocked(false), [studentId, term]);
  const readOnly = isFinal && !unlocked;

  const save = useMutation({
    mutationFn: (status: "draft" | "final") =>
      savePupa({
        student_id: studentId,
        class_id: classId,
        term,
        strengths: form.strengths,
        improvements: form.improvements,
        observations: form.observations,
        parent_support: form.parent_support,
        remarks: form.remarks,
        status,
      }),
    onSuccess: (_d, status) => {
      toast.success(status === "final" ? "Final report submitted" : "Draft saved");
      setUnlocked(false);
      void qc.invalidateQueries({ queryKey: qk.pupa(studentId) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the report"),
  });

  function validate(forFinal: boolean) {
    const next: Partial<FormState> = {};
    for (const f of FIELDS) {
      const value = form[f.key].trim();
      if (forFinal && value.length < 20) next[f.key] = "Please write at least a couple of sentences before submitting.";
      else if (!forFinal && value && value.length < 5) next[f.key] = "Too short.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const selectedStudent = students.find((s) => s.id === studentId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PortalPageHeader
        eyebrow="PUPA"
        title="Progress & Understanding Profile"
        description="A narrative profile per student, per term. Save as many drafts as you like — one final report is stored per term."
        actions={reportQ.data ? <StatusPill status={reportQ.data.status} /> : undefined}
      />

      <SectionCard title="Selection" description="Choose the class, student, academic year and term.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Class">
            <Select value={classId} onChange={(e) => { setClassId(e.target.value); setStudentId(""); }}>
              {(classesQ.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  Grade {c.grade} · {c.section}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Student">
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.roll_no}. {s.full_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Academic year">
            <Select value={ACADEMIC_YEAR} disabled>
              <option value={ACADEMIC_YEAR}>{ACADEMIC_YEAR}</option>
            </Select>
          </Field>
          <Field label="Term">
            <Select value={term} onChange={(e) => setTerm(e.target.value)}>
              {TERMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </SectionCard>

      <div className="mt-5">
        <SectionCard
          title={selectedStudent ? `${selectedStudent.full_name} — ${term}` : "Report"}
          description={
            isFinal
              ? `Submitted${reportQ.data?.submitted_at ? ` on ${new Date(reportQ.data.submitted_at).toLocaleDateString()}` : ""}. Unlock to revise.`
              : "Each field accepts full paragraphs. Autosaving is off — use Save draft."
          }
          actions={
            isFinal && !unlocked ? (
              <GhostButton onClick={() => setUnlocked(true)}>
                <FileText className="h-4 w-4" /> Edit entry
              </GhostButton>
            ) : undefined
          }
        >
          {reportQ.isLoading ? (
            <LoadingRows rows={5} height={96} />
          ) : (
            <div className="space-y-5">
              {FIELDS.map((f) => (
                <Field key={f.key} label={f.label} error={errors[f.key]} required>
                  <TextArea
                    value={form[f.key]}
                    placeholder={f.placeholder}
                    readOnly={readOnly}
                    aria-invalid={!!errors[f.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </Field>
              ))}

              {!readOnly && (
                <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                  <GhostButton
                    disabled={save.isPending || !studentId}
                    onClick={() => {
                      if (validate(false)) save.mutate("draft");
                    }}
                  >
                    <Save className="h-4 w-4" /> Save draft
                  </GhostButton>
                  <PrimaryButton
                    loading={save.isPending}
                    disabled={!studentId}
                    onClick={() => {
                      if (validate(true)) save.mutate("final");
                      else toast.error("Complete every section before submitting the final report.");
                    }}
                  >
                    <Send className="h-4 w-4" /> Submit final report
                  </PrimaryButton>
                  {isFinal && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[color:var(--ink-soft)]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--signal)]" />
                      Resubmitting replaces the existing final report for {term}.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
