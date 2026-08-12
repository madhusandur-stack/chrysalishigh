import { useEffect, useState } from "react";

export function CountUp({ to, duration = 900, suffix = "" }: { to: number; duration?: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <span className="mono">
      {value.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
