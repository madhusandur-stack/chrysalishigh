import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { PortalPageHeader } from "@/components/portal/coming-soon";
import {
  GhostButton,
  PrimaryButton,
  SectionCard,
  StatCard,
  TableWrap,
  Td,
  Th,
} from "@/components/portal/ui-kit";
import { importStudentMasterData, type ImportOutcome, type MasterRow } from "@/lib/master-data.functions";
import { qk } from "@/lib/school-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff-portal/master-data")({
  component: MasterDataPage,
  head: () => ({
    meta: [
      { title: "Student Master Data | Chrysalis Connect" },
      {
        name: "description",
        content: "Upload the school's student master data spreadsheet to create and update student profiles.",
      },
      { property: "og:title", content: "Student Master Data | Chrysalis Connect" },
      { property: "og:description", content: "Import student records from Excel into Chrysalis Connect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

/** Header aliases → canonical student field. Keeps the Excel format forgiving. */
const FIELD_ALIASES: Record<string, string[]> = {
  full_name: ["full name", "student name", "name", "student"],
  admission_no: ["admission no", "admission number", "admission", "student id", "studentid", "adm no", "adm"],
  grade: ["grade", "class", "std", "standard"],
  section: ["section", "sec", "division"],
  roll_no: ["roll no", "roll number", "roll", "rollno"],
  dob: ["dob", "date of birth", "birth date", "birthdate"],
  gender: ["gender", "sex"],
  blood_group: ["blood group", "blood"],
  house: ["house"],
  father_name: ["father name", "father", "father's name", "guardian name", "parent name"],
  father_phone: ["father phone", "father mobile", "father contact", "contact", "phone", "mobile", "parent phone"],
  father_email: ["father email", "email", "parent email", "guardian email"],
  father_occupation: ["father occupation"],
  mother_name: ["mother name", "mother", "mother's name"],
  mother_phone: ["mother phone", "mother mobile", "mother contact"],
  mother_email: ["mother email"],
  mother_occupation: ["mother occupation"],
  address: ["address", "residential address", "home address"],
};

const REQUIRED = ["full_name", "grade", "section"] as const;

function norm(s: string) {
  return s.trim().toLowerCase().replace(/[._-]+/g, " ").replace(/\s+/g, " ");
}

function mapHeaders(headers: string[]) {
  const map: Record<string, string> = {};
  for (const header of headers) {
    const n = norm(header);
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (map[field]) continue;
      if (n === norm(field) || aliases.some((a) => n === a)) {
        map[field] = header;
        break;
      }
    }
  }
  return map;
}

/** "10-C", "X C", "10 C" → grade + section when there is no dedicated column. */
function splitClass(value: string) {
  const m = value.trim().match(/^([A-Za-z0-9]+)\s*[-/ ]\s*([A-Za-z0-9]+)$/);
  return m ? { grade: m[1], section: m[2] } : { grade: value.trim(), section: "" };
}

function toStr(v: unknown) {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

type ParsedRow = { row: MasterRow; errors: string[] };

function MasterDataPage() {
  const qc = useQueryClient();
  const runImport = useServerFn(importStudentMasterData);
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<{
    processed: number;
    created: number;
    updated: number;
    review: number;
    errors: number;
    outcomes: ImportOutcome[];
  } | null>(null);

  const valid = useMemo(() => parsed.filter((p) => !p.errors.length), [parsed]);
  const invalid = useMemo(() => parsed.filter((p) => p.errors.length), [parsed]);

  async function handleFile(file: File) {
    setSummary(null);
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]!];
      if (!sheet) throw new Error("The workbook has no sheets.");
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (!json.length) throw new Error("No rows found in the first sheet.");

      const cols = Object.keys(json[0]!);
      const map = mapHeaders(cols);
      setHeaders(cols);
      setMapping(map);

      const rows: ParsedRow[] = json.map((raw, i) => {
        const get = (field: string) => (map[field] ? toStr(raw[map[field]!]) : "");
        let grade = get("grade");
        let section = get("section");
        if (grade && !section) {
          const split = splitClass(grade);
          grade = split.grade;
          section = split.section;
        }
        const rollRaw = get("roll_no");
        const roll = rollRaw ? Number(rollRaw.replace(/\D/g, "")) : null;

        const row: MasterRow = {
          rowNumber: i + 2,
          full_name: get("full_name"),
          admission_no: get("admission_no") || null,
          grade,
          section,
          roll_no: Number.isFinite(roll) && roll !== null ? roll : null,
          dob: get("dob") ? normaliseDate(get("dob")) : null,
          gender: get("gender") || null,
          blood_group: get("blood_group") || null,
          house: get("house") || null,
          father_name: get("father_name") || null,
          father_phone: get("father_phone") || null,
          father_email: get("father_email") || null,
          father_occupation: get("father_occupation") || null,
          mother_name: get("mother_name") || null,
          mother_phone: get("mother_phone") || null,
          mother_email: get("mother_email") || null,
          mother_occupation: get("mother_occupation") || null,
          address: get("address") || null,
        };

        const errors: string[] = [];
        for (const field of REQUIRED) {
          if (!row[field]) errors.push(`Missing ${field.replace("_", " ")}`);
        }
        if (row.dob && !/^\d{4}-\d{2}-\d{2}$/.test(row.dob)) errors.push("Date of birth must be a valid date");
        if (row.father_email && !row.father_email.includes("@")) errors.push("Invalid parent email");
        return { row, errors };
      });

      setParsed(rows);
    } catch (err) {
      setParsed([]);
      setHeaders([]);
      toast.error(err instanceof Error ? err.message : "Could not read that file");
    }
  }

  async function confirmImport() {
    if (!valid.length) return;
    setBusy(true);
    try {
      const res = await runImport({ data: { rows: valid.map((v) => v.row) } });
      setSummary(res);
      toast.success(`${res.created} created · ${res.updated} updated`);
      qc.invalidateQueries({ queryKey: qk.students });
      qc.invalidateQueries({ queryKey: qk.classes });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadReport() {
    if (!summary) return;
    const ws = XLSX.utils.json_to_sheet(summary.outcomes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Import report");
    XLSX.writeFile(wb, `master-data-import-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Student Name": "Aarav Sharma",
        "Admission No": "CHV-S00099",
        Grade: "X",
        Section: "C",
        "Roll No": 18,
        DOB: "2010-04-12",
        Gender: "Male",
        House: "Challengers",
        "Father Name": "Rohit Sharma",
        "Father Phone": "9876543210",
        "Father Email": "rohit@example.com",
        "Mother Name": "Neha Sharma",
        Address: "Varthur, Bengaluru",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student-master-data-template.xlsx");
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PortalPageHeader
        eyebrow="Campus Admin"
        title="Student Master Data"
        description="Upload the school's master spreadsheet. Existing students are matched and updated, new students are created automatically."
        actions={
          <GhostButton onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Template
          </GhostButton>
        }
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          "rounded-[20px] border-2 border-dashed p-10 text-center transition",
          dragging ? "border-[color:var(--signal)] bg-[color:var(--signal-soft)]" : "border-line bg-paper",
        )}
      >
        <FileSpreadsheet className="mx-auto mb-3 h-7 w-7 text-[color:var(--ink-soft)]" />
        <div className="text-sm font-medium">Drop an .xlsx or .xls file here</div>
        <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
          The first sheet is used. Column names are detected automatically.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <div className="mt-4">
          <PrimaryButton onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Choose file
          </PrimaryButton>
        </div>
        {fileName && (
          <div className="mono mt-3 text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
            {fileName}
          </div>
        )}
      </div>

      {parsed.length > 0 && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Records detected" value={String(parsed.length)} />
            <StatCard label="Ready to import" value={String(valid.length)} />
            <StatCard label="Validation errors" value={String(invalid.length)} />
          </div>

          <SectionCard title="Detected columns" description="How your spreadsheet columns map to student fields.">
            <div className="flex flex-wrap gap-2">
              {headers.map((h) => {
                const field = Object.entries(mapping).find(([, col]) => col === h)?.[0];
                return (
                  <span
                    key={h}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs",
                      field
                        ? "border-[color:var(--signal)] text-[color:var(--signal)]"
                        : "border-line text-[color:var(--ink-soft)]",
                    )}
                  >
                    {h}
                    {field ? ` → ${field}` : " → ignored"}
                  </span>
                );
              })}
            </div>
          </SectionCard>

          {invalid.length > 0 && (
            <SectionCard title="Rows needing attention" description="These rows are skipped until fixed.">
              <ul className="space-y-2 text-sm">
                {invalid.slice(0, 25).map((p) => (
                  <li key={p.row.rowNumber} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ember)]" />
                    <span>
                      Row {p.row.rowNumber} — {p.row.full_name || "(no name)"}: {p.errors.join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <SectionCard title="Preview" description="First 20 rows as they will be imported.">
            <TableWrap>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <Th>Row</Th>
                    <Th>Name</Th>
                    <Th>Admission</Th>
                    <Th>Class</Th>
                    <Th>Roll</Th>
                    <Th>Parent contact</Th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 20).map((p) => (
                    <tr key={p.row.rowNumber}>
                      <Td>{p.row.rowNumber}</Td>
                      <Td>{p.row.full_name || "—"}</Td>
                      <Td>{p.row.admission_no ?? "—"}</Td>
                      <Td>
                        {p.row.grade || "?"}-{p.row.section || "?"}
                      </Td>
                      <Td>{p.row.roll_no ?? "—"}</Td>
                      <Td>{p.row.father_phone ?? p.row.mother_phone ?? p.row.father_email ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <div className="mt-4 flex justify-end gap-2">
              <GhostButton
                onClick={() => {
                  setParsed([]);
                  setHeaders([]);
                  setFileName(null);
                  setSummary(null);
                }}
              >
                Clear
              </GhostButton>
              <PrimaryButton onClick={() => void confirmImport()} disabled={busy || !valid.length}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirm import ({valid.length})
              </PrimaryButton>
            </div>
          </SectionCard>
        </div>
      )}

      {summary && (
        <div className="mt-6">
          <SectionCard
            title="Import results"
            description="Master data is now live everywhere students appear."
            actions={
              <GhostButton onClick={downloadReport}>
                <Download className="h-4 w-4" /> Report
              </GhostButton>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Processed" value={String(summary.processed)} />
              <StatCard label="Created" value={String(summary.created)} />
              <StatCard label="Updated" value={String(summary.updated)} />
              <StatCard label="Needs review" value={String(summary.review)} />
              <StatCard label="Errors" value={String(summary.errors)} />
            </div>
            <ul className="mt-4 max-h-64 space-y-1.5 overflow-auto text-sm">
              {summary.outcomes.map((o) => (
                <li key={o.rowNumber} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mono mt-0.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                      o.result === "created" || o.result === "updated"
                        ? "border-[color:var(--signal)] text-[color:var(--signal)]"
                        : "border-[color:var(--ember)] text-[color:var(--ember)]",
                    )}
                  >
                    {o.result}
                  </span>
                  <span>
                    Row {o.rowNumber} — {o.name}: {o.detail}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

function normaliseDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const dmy = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]!.padStart(2, "0")}-${dmy[1]!.padStart(2, "0")}`;
  const parsedDate = new Date(value);
  return Number.isNaN(+parsedDate) ? value : parsedDate.toISOString().slice(0, 10);
}
