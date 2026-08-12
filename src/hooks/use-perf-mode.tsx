import * as React from "react";

/**
 * Central perf-mode hook. Returns flags derived from device capabilities
 * and user preferences so heavy visual effects (backdrop-filter, layout
 * animations, gradients) can be skipped cheaply on mobile/low-power
 * devices.
 *
 * All flags default to the "safe" (lightweight) value during SSR so the
 * server never ships a chrome-heavy tree that the client has to unwind.
 */
export type PerfMode = {
  /** Coarse pointer / no-hover device. iPhone, Android, iPad in touch mode. */
  isTouch: boolean;
  /** User has requested reduced motion at the OS level. */
  reducedMotion: boolean;
  /** Convenience: skip framer-motion layout/spring animations. */
  disableAnimations: boolean;
  /** Convenience: skip backdrop-filter / heavy shadows. */
  disableGlass: boolean;
};

const DEFAULT: PerfMode = {
  isTouch: false,
  reducedMotion: false,
  disableAnimations: false,
  disableGlass: false,
};

export function usePerfMode(): PerfMode {
  const [mode, setMode] = React.useState<PerfMode>(DEFAULT);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const touchMq = window.matchMedia("(hover: none), (pointer: coarse)");
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const isTouch = touchMq.matches;
      const reducedMotion = motionMq.matches;
      setMode({
        isTouch,
        reducedMotion,
        disableAnimations: reducedMotion || isTouch,
        disableGlass: isTouch,
      });
    };
    update();
    touchMq.addEventListener?.("change", update);
    motionMq.addEventListener?.("change", update);
    return () => {
      touchMq.removeEventListener?.("change", update);
      motionMq.removeEventListener?.("change", update);
    };
  }, []);

  return mode;
}
