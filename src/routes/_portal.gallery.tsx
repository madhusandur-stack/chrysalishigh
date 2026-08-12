import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Page, PageHeader } from "@/components/portal/page";
import { gallery } from "@/lib/mock-data";
import { format } from "date-fns";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_portal/gallery")({ component: GalleryPage });

function GalleryPage() {
  const [openAlbum, setOpenAlbum] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(0);

  const album = gallery.find((g) => g.id === openAlbum);
  // fake extra photos per album by shuffling the covers
  const photos = album ? [album.cover, ...gallery.map((g) => g.cover).filter((c) => c !== album.cover)] : [];

  return (
    <Page>
      <PageHeader title="Gallery" subtitle="Moments from Chrysalis High." />

      <div className="[column-count:1] gap-4 sm:[column-count:2] lg:[column-count:3]">
        {gallery.map((g, i) => (
          <motion.button
            key={g.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => { setOpenAlbum(g.id); setLightbox(0); }}
            className="card-surface card-hover mb-4 block w-full break-inside-avoid overflow-hidden text-left"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={g.cover} alt={g.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
            </div>
            <div className="p-4">
              <div className="text-sm font-semibold">{g.title}</div>
              <div className="mono mt-1 text-[11px] text-[color:var(--ink-soft)]">
                {format(new Date(g.date), "d MMM yyyy")} · {g.count} photos
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {album && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-black/85 p-4"
            onClick={() => setOpenAlbum(null)}
          >
            <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white" onClick={() => setOpenAlbum(null)}><X className="h-5 w-5" /></button>
            <button className="absolute left-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white" onClick={(e) => { e.stopPropagation(); setLightbox((l) => (l - 1 + photos.length) % photos.length); }}><ChevronLeft className="h-5 w-5" /></button>
            <button className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white" onClick={(e) => { e.stopPropagation(); setLightbox((l) => (l + 1) % photos.length); }}><ChevronRight className="h-5 w-5" /></button>
            <AnimatePresence mode="wait">
              <motion.img
                key={photos[lightbox]}
                src={photos[lightbox]}
                alt=""
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>
            <div className="mono absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/80">{album.title} · {lightbox + 1}/{photos.length}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
