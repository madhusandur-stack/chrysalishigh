import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { uploadAttachment, type Attachment } from "@/lib/school-api";
import { AttachmentList, GhostButton } from "./ui-kit";

/**
 * Attachment picker used by Homework and Notices. Uploads immediately so the
 * parent form only ever holds resolved { name, url } pairs.
 */
export function FilePicker({
  value,
  onChange,
  folder,
  accept = ".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp",
  label = "Attach files",
}: {
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
  folder?: string;
  accept?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const uploaded: Attachment[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 15 MB`);
          continue;
        }
        uploaded.push(await uploadAttachment(file, folder));
      }
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`${uploaded.length} file${uploaded.length > 1 ? "s" : ""} attached`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <GhostButton type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
        <Paperclip className="h-4 w-4" />
        {busy ? "Uploading…" : label}
      </GhostButton>
      <AttachmentList items={value} onRemove={(i) => onChange(value.filter((_, idx) => idx !== i))} />
    </div>
  );
}
