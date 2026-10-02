// Gallery data model: Album -> Photos.
// Real albums will later come from the database + private storage, filtered to
// published albums for the student's campus. Until then, clearly marked demo
// albums are returned so the page never pretends to show real school content.
import foundersDay from "@/assets/gallery-founders-day-demo.jpg";
import science from "@/assets/gallery-science-exhibition-demo.jpg";
import sports from "@/assets/gallery-sports-day-demo.jpg";
import workshop from "@/assets/gallery-workshop-demo.jpg";

export type GalleryPhoto = { id: string; url: string; caption?: string };
export type GalleryAlbum = {
  id: string;
  title: string;
  date: string; // ISO
  description: string;
  category: "Celebration" | "Academics" | "Sports" | "Workshop" | "Class Activity";
  campus: string | null; // null = all campuses
  published: boolean;
  isDemo: boolean;
  cover: string;
  photos: GalleryPhoto[];
};

const set = (id: string, urls: string[], caption: string): GalleryPhoto[] =>
  urls.map((url, i) => ({ id: `${id}-${i}`, url, caption: `${caption} · ${i + 1}` }));

export const demoAlbums: GalleryAlbum[] = [
  {
    id: "founders-day-2025",
    title: "Founder's Day 2025",
    date: "2025-11-14",
    description: "Cultural performances, the founder's address and house presentations from our annual Founder's Day.",
    category: "Celebration",
    campus: null,
    published: true,
    isDemo: true,
    cover: foundersDay,
    photos: set("fd", [foundersDay, sports, science, workshop], "Founder's Day"),
  },
  {
    id: "science-exhibition-2026",
    title: "Science Exhibition",
    date: "2026-02-05",
    description: "Student models and experiments on renewable energy, robotics and everyday chemistry.",
    category: "Academics",
    campus: null,
    published: true,
    isDemo: true,
    cover: science,
    photos: set("sx", [science, workshop, foundersDay], "Science Exhibition"),
  },
  {
    id: "sports-day-2026",
    title: "Annual Sports Day",
    date: "2026-07-12",
    description: "Track events, inter-house relays and the prize distribution ceremony.",
    category: "Sports",
    campus: null,
    published: true,
    isDemo: true,
    cover: sports,
    photos: set("sd", [sports, foundersDay, science, workshop, sports], "Sports Day"),
  },
  {
    id: "coding-workshop-2026",
    title: "Coding & Robotics Workshop",
    date: "2026-08-21",
    description: "A hands-on workshop for Grades 8–10 on block coding and simple robotics.",
    category: "Workshop",
    campus: null,
    published: true,
    isDemo: true,
    cover: workshop,
    photos: set("cw", [workshop, science], "Workshop"),
  },
];

/** Albums visible to a student: published and for their campus (or all campuses). */
export function getVisibleAlbums(campusName?: string | null): GalleryAlbum[] {
  return demoAlbums
    .filter((a) => a.published && (!a.campus || a.campus === campusName))
    .sort((a, b) => b.date.localeCompare(a.date));
}
