import { createFileRoute } from "@tanstack/react-router";
import { SoftAurora } from "@/components/portal/aurora";
import { LandingNav } from "@/components/landing/navbar";
import { LandingHero } from "@/components/landing/hero";
import { LandingFeatures } from "@/components/landing/features";
import { LandingCta } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";

const TITLE = "Chrysalis Connect — Your family's school portal";
const DESCRIPTION =
  "Notices, homework, attendance, PTMs, fees and bus tracking for every child, across every Chrysalis campus. Enter instantly as a guest.";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-dvh bg-canvas transition-colors duration-300">
      {/* Aurora-washed top of the page: nav + hero */}
      <div className="relative overflow-hidden">
        <SoftAurora className="opacity-90" />
        <LandingNav />
        <LandingHero />
      </div>

      <main>
        <LandingFeatures />
        <LandingCta />
      </main>

      <LandingFooter />
    </div>
  );
}
