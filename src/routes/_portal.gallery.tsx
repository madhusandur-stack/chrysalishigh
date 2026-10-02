import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Images, Search, X } from "lucide-react";
import { Page, PageHeader } from "@/components/portal/page";
import { EmptyState, Select, TextInput } from "@/components/portal/ui-kit";
import { getVisibleAlbums, type GalleryAlbum } from "@/lib/gallery-data";

export const Route = createFileRoute("/_portal/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery · Chrysalis Connect" },
      { name: "description", content: "School event albums and photos from Chrysalis High." },
      { property: "og:title", content: "Gallery · Chrysalis Connect" },
      { property: "og:description", content: "School event albums and photos from Chrysalis High." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GalleryPage,
});

const fmt = (d: string) => format(new Date(d), "d MMM yyyy");

function DemoBadge() {
  return (
    <span className="rounded-full bg-[color:var(--paper)]/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)] shadow-sm">
      Demo
    </span>
  );
}

function GalleryPage() {
  const albums = useMemo(() => getVisibleAlbums(), []);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [category, setCategory] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [photoIdx, setPhotoIdx] = useState<number | null>(null);

  const years = useMemo(() => [...new Set(albums.map((a) => a.date.slice(0, 4)))].sort().reverse(), [albums]);
  const categories = useMemo(() => [...new Set(albums.map((a) => a.category))], [albums]);

  const filtered = albums.filter((a) => {
    const q = query.trim().toLowerCase();
    return (
      (!q || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)) &&
      (year === "all" || a.date.startsWith(year)) &&
      (category === "all" || a.category === category)
    );
  });

  const album = albums.find((a) => a.id === openId) ?? null;
  const hasDemo = albums.some((a) => a.isDemo);

  if (album) {
    return (
      <Page>
        <AlbumView album={album} onBack={() => setOpenId(null)} onOpenPhoto={setPhotoIdx} />
        <Lightbox album={album} index={photoIdx} setIndex={setPhotoIdx} />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title="Gallery" subtitle="Events, celebrations and activities from Chrysalis High." />

      {hasDemo && (
        <div className="mb-4 rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink-soft)]">
          Sample albums are shown for preview. School-uploaded photos will appear here once staff publish albums.
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-soft)]" />
          <TextInput
            aria-label="Search albums"
            placeholder="Search events or albums"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="all">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All events</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No albums found" description="Try a different search or filter." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setOpenId(a.id)}
              className="card-surface card-hover group overflow-hidden text-left"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={a.cover} alt={a.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                <div className="absolute left-3 top-3 flex gap-2">
                  <span className="rounded-full bg-[color:var(--paper)]/90 px-2 py-0.5 text-[11px] font-medium text-[color:var(--ink)] shadow-sm">{a.category}</span>
                  {a.isDemo && <DemoBadge />}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-base font-semibold">{a.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-[color:var(--ink-soft)]">{a.description}</p>
                <div className="mono mt-4 flex items-center gap-4 text-[11px] text-[color:var(--ink-soft)]">
                  <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{fmt(a.date)}</span>
                  <span className="flex items-center gap-1.5"><Images className="h-3.5 w-3.5" />{a.photos.length} photos</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </Page>
  );
}

function AlbumView({ album, onBack, onOpenPhoto }: { album: GalleryAlbum; onBack: () => void; onOpenPhoto: (i: number) => void }) {
  return (
    <>
      <button onClick={onBack} className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]">
        <ArrowLeft className="h-4 w-4" /> All albums
      </button>
      <div className="card-surface mb-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[color:var(--paper-2)] px-2.5 py-0.5 text-[11px] font-medium">{album.category}</span>
          {album.isDemo && <DemoBadge />}
        </div>
        <h2 className="mt-3 text-2xl font-semibold">{album.title}</h2>
        <div className="mono mt-1 flex gap-4 text-xs text-[color:var(--ink-soft)]">
          <span>{fmt(album.date)}</span><span>{album.photos.length} photos</span>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-[color:var(--ink-soft)]">{album.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {album.photos.map((p, i) => (
          <button key={p.id} onClick={() => onOpenPhoto(i)} className="group aspect-square overflow-hidden rounded-2xl border border-[color:var(--line)]">
            <img src={p.url} alt={p.caption ?? album.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          </button>
        ))}
      </div>
    </>
  );
}

function Lightbox({ album, index, setIndex }: { album: GalleryAlbum; index: number | null; setIndex: (i: number | null) => void }) {
  const n = album.photos.length;
  const go = useCallback((d: number) => index !== null && setIndex((index + d + n) % n), [index, n, setIndex]);
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go, setIndex]);

  const photo = index !== null ? album.photos[index] : null;
  const btn = "grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20";
  return (
    <AnimatePresence>
      {photo && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] grid place-items-center bg-black/90 p-4" onClick={() => setIndex(null)}>
          <button aria-label="Close" className={`${btn} absolute right-4 top-4`} onClick={() => setIndex(null)}><X className="h-5 w-5" /></button>
          {n > 1 && <>
            <button aria-label="Previous photo" className={`${btn} absolute left-3 top-1/2 -translate-y-1/2`} onClick={(e) => { e.stopPropagation(); go(-1); }}><ChevronLeft className="h-5 w-5" /></button>
            <button aria-label="Next photo" className={`${btn} absolute right-3 top-1/2 -translate-y-1/2`} onClick={(e) => { e.stopPropagation(); go(1); }}><ChevronRight className="h-5 w-5" /></button>
          </>}
          <motion.img key={photo.id} src={photo.url} alt={photo.caption ?? album.title}
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center text-white/85">
            <div className="text-sm font-medium">{album.title}{album.isDemo ? " · Demo" : ""}</div>
            <div className="mono text-xs text-white/60">{fmt(album.date)} · {(index ?? 0) + 1}/{n}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
