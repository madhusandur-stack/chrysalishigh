import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { listCampuses } from "@/lib/campuses.functions";
import { CampusSelector, type CampusOption } from "./campus-selector";

export function useCampusesQuery() {
  const listFn = useServerFn(listCampuses);
  return useQuery({
    queryKey: ["campuses"],
    queryFn: async () => {
      try {
        return await listFn();
      } catch (err) {
        if (import.meta.env.DEV) console.error("[campuses] Failed to load:", err);
        throw err;
      }
    },
    retry: 1,
  });
}

export function CampusSelectorField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string) => void;
}) {
  const { data: campuses = [], isLoading, error, refetch, isFetching } = useCampusesQuery();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-[14px] border border-line bg-paper px-4 py-3 text-sm text-[color:var(--ink-soft)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading campuses…
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2 rounded-[14px] border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/5 px-3 py-2.5 text-xs">
        <div className="flex items-start gap-2 text-[color:var(--ember)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <div className="font-medium">Couldn't load campuses.</div>
            <div className="mt-0.5 opacity-80 break-words">
              {error instanceof Error ? error.message : String(error)}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-paper px-3 py-1.5 text-[color:var(--ink)] transition hover:bg-paper-2 disabled:opacity-60"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          Retry
        </button>
      </div>
    );
  }

  if (campuses.length === 0) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-[14px] border border-line bg-paper px-4 py-3 text-sm text-[color:var(--ink-soft)]">
        <span>No campuses available.</span>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 text-xs text-[color:var(--signal)] hover:underline"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          Retry
        </button>
      </div>
    );
  }

  return <CampusSelector campuses={campuses as CampusOption[]} value={value} onChange={onChange} />;
}
