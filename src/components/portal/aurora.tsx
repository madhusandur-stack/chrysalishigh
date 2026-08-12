import { motion } from "framer-motion";

/**
 * Soft Aurora — slow drifting blue → emerald → violet blobs.
 * Used ONLY behind the dashboard greeting hero and the login pages.
 */
export function SoftAurora({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-[#EEF3FF] via-[#F0FBF6] to-[#F3EFFF] dark:from-[#101a33] dark:via-[#0e2a24] dark:to-[#1a1330]" />
      <motion.div
        className="aurora-blob absolute -top-24 -left-16 h-[420px] w-[420px] rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(circle at 30% 30%, #2F5FE3 0%, transparent 70%)" }}
        animate={{ x: [0, 40, -20, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="aurora-blob absolute top-20 -right-20 h-[380px] w-[380px] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle at 60% 40%, #12B886 0%, transparent 70%)" }}
        animate={{ x: [0, -30, 20, 0], y: [0, 25, -15, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="aurora-blob absolute -bottom-24 left-1/3 h-[420px] w-[420px] rounded-full opacity-55 blur-3xl"
        style={{ background: "radial-gradient(circle at 50% 50%, #7C5CFC 0%, transparent 70%)" }}
        animate={{ x: [0, 30, -25, 0], y: [0, -20, 15, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
