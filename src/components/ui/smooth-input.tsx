"use client";

import * as React from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { Eye, EyeOff, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SmoothInputProps = React.ComponentPropsWithoutRef<"input"> & {
  wrapperClassName?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

const PASSWORD_CHAR = typeof navigator !== "undefined" && /firefox|fxios/i.test(navigator.userAgent) ? "●" : "•";

/**
 * Touch devices (phones/tablets) have highly optimized native carets that
 * handle IME, autofill, selection handles and long-press correctly. Trying
 * to sync a custom animated caret with the native one on touch is fragile
 * — so we detect touch/coarse pointers and fall back to the native caret.
 */
function useUseNativeCaret() {
  const [useNative, setUseNative] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setUseNative(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return useNative;
}

function SmoothInputBase(
  {
    className,
    wrapperClassName,
    leftIcon,
    rightSlot,
    value,
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    type = "text",
    placeholder,
    disabled,
    ...props
  }: SmoothInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const [internalValue, setInternalValue] = React.useState(defaultValue?.toString() ?? "");
  const [focused, setFocused] = React.useState(false);
  const caretX = useMotionValue(0);
  const caretOpacity = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const measureRef = React.useRef<HTMLSpanElement | null>(null);
  const isControlled = value !== undefined;
  const inputValue = isControlled ? String(value ?? "") : internalValue;
  const useNativeCaret = useUseNativeCaret() || prefersReducedMotion;
  const springX = useSpring(caretX, prefersReducedMotion ? { stiffness: 10000, damping: 100, mass: 0.1 } : { stiffness: 500, damping: 30, mass: 0.5 });

  React.useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

  const syncMeasure = React.useCallback(() => {
    const input = inputRef.current;
    const measure = measureRef.current;
    if (!input || !measure) return;
    const styles = window.getComputedStyle(input);
    measure.style.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
    measure.style.letterSpacing = styles.letterSpacing;
    measure.style.fontFeatureSettings = styles.fontFeatureSettings;
    measure.style.fontVariationSettings = styles.fontVariationSettings;
  }, []);

  const updateCaret = React.useCallback(() => {
    const input = inputRef.current;
    const measure = measureRef.current;
    if (!input || !measure || document.activeElement !== input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (start !== end) {
      caretOpacity.set(0);
      return;
    }
    syncMeasure();
    measure.textContent = input.type === "password" ? PASSWORD_CHAR.repeat(start) : input.value.slice(0, start);
    const styles = window.getComputedStyle(input);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const absoluteWidth = (measure.offsetWidth || 0) + paddingLeft;
    const maxScroll = Math.max(0, input.scrollWidth - input.clientWidth);
    const visibleRight = input.scrollLeft + input.clientWidth - paddingRight;
    const visibleLeft = input.scrollLeft + paddingLeft;
    if (absoluteWidth > visibleRight) input.scrollLeft = Math.min(absoluteWidth - input.clientWidth + paddingRight, maxScroll);
    if (absoluteWidth < visibleLeft) input.scrollLeft = Math.max(0, absoluteWidth - paddingLeft);
    const x = Math.min(Math.max(absoluteWidth - input.scrollLeft, paddingLeft - 1), input.clientWidth - paddingRight);
    caretX.set(x);
    caretOpacity.set(1);
  }, [caretOpacity, caretX, syncMeasure]);

  React.useEffect(() => {
    if (useNativeCaret) return;
    const input = inputRef.current;
    if (!input) return;
    const onSelection = () => requestAnimationFrame(updateCaret);
    document.addEventListener("selectionchange", onSelection);
    input.addEventListener("scroll", updateCaret, { passive: true });
    window.addEventListener("resize", updateCaret);
    void document.fonts?.ready?.then(updateCaret);
    return () => {
      document.removeEventListener("selectionchange", onSelection);
      input.removeEventListener("scroll", updateCaret);
      window.removeEventListener("resize", updateCaret);
    };
  }, [updateCaret, useNativeCaret]);

  React.useEffect(() => {
    if (useNativeCaret) return;
    requestAnimationFrame(updateCaret);
  }, [inputValue, type, updateCaret, useNativeCaret]);

  return (
    <div
      className={cn(
        "group relative flex min-h-12 w-full items-center gap-2 overflow-hidden rounded-[14px] border border-line bg-paper px-4 py-3 text-sm shadow-sm transition duration-200",
        "focus-within:border-[color:var(--signal)] focus-within:shadow-[0_0_0_4px_var(--signal-soft)]",
        disabled && "cursor-not-allowed opacity-60",
        wrapperClassName,
      )}
    >
      {leftIcon && <span className="grid h-4 w-4 shrink-0 place-items-center text-[color:var(--ink-soft)]">{leftIcon}</span>}
      <div className="relative min-w-0 flex-1">
        <input
          ref={inputRef}
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
            if (!useNativeCaret) requestAnimationFrame(updateCaret);
          }}
          onBlur={(event) => {
            setFocused(false);
            caretOpacity.set(0);
            onBlur?.(event);
          }}
          onChange={(event) => {
            if (!isControlled) setInternalValue(event.target.value);
            onChange?.(event);
            if (!useNativeCaret) requestAnimationFrame(updateCaret);
          }}
          className={cn(
            "relative z-10 w-full bg-transparent text-[color:var(--ink)] outline-none placeholder:text-transparent disabled:cursor-not-allowed",
            useNativeCaret ? "caret-[color:var(--signal)]" : "caret-transparent",
            className,
          )}
          {...props}
        />
        <AnimatePresence initial={false}>
          {!inputValue && placeholder && (
            <motion.span
              initial={false}
              animate={{ opacity: focused ? 0.42 : 0.58 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute inset-y-0 left-0 z-0 flex items-center truncate text-[color:var(--ink-soft)]"
            >
              {placeholder}
            </motion.span>
          )}
        </AnimatePresence>
        {!useNativeCaret && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 z-20 h-[1.25em] w-px -translate-y-1/2 rounded-full bg-[color:var(--signal)]"
            style={{ x: springX, opacity: caretOpacity }}
          />
        )}
        <span ref={measureRef} aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 whitespace-pre" />
      </div>
      {rightSlot}
    </div>
  );
}

export const SmoothInput = React.forwardRef<HTMLInputElement, SmoothInputProps>(SmoothInputBase);
SmoothInput.displayName = "SmoothInput";

export const SmoothNumberInput = React.forwardRef<HTMLInputElement, Omit<SmoothInputProps, "type">>((props, ref) => (
  <SmoothInput ref={ref} type="number" inputMode="numeric" {...props} />
));
SmoothNumberInput.displayName = "SmoothNumberInput";

export const SmoothPasswordInput = React.forwardRef<HTMLInputElement, Omit<SmoothInputProps, "type" | "rightSlot">>((props, ref) => {
  const [visible, setVisible] = React.useState(false);
  return (
    <SmoothInput
      ref={ref}
      type={visible ? "text" : "password"}
      rightSlot={
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-paper-2 hover:text-[color:var(--ink)]"
        >
          <motion.span initial={false} animate={{ rotate: visible ? 0 : -8, scale: visible ? 1 : 0.96 }} transition={{ duration: 0.18 }}>
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </motion.span>
        </button>
      }
      {...props}
    />
  );
});
SmoothPasswordInput.displayName = "SmoothPasswordInput";

export const SmoothSearchInput = React.forwardRef<HTMLInputElement, Omit<SmoothInputProps, "type" | "leftIcon" | "rightSlot"> & { onClear?: () => void; shortcut?: string }>(
  ({ value, onChange, onClear, shortcut, ...props }, ref) => {
    const hasValue = String(value ?? "").length > 0;
    return (
      <SmoothInput
        ref={ref}
        type="search"
        value={value}
        onChange={onChange}
        leftIcon={<Search className="h-4 w-4" />}
        rightSlot={
          <div className="flex shrink-0 items-center gap-2">
            {shortcut && !hasValue && <kbd className="mono hidden rounded-md border border-line bg-paper-2 px-1.5 py-0.5 text-[10px] text-[color:var(--ink-soft)] sm:inline-flex">{shortcut}</kbd>}
            {hasValue && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={onClear}
                className="grid h-6 w-6 place-items-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-paper-2 hover:text-[color:var(--ink)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        }
        {...props}
      />
    );
  },
);
SmoothSearchInput.displayName = "SmoothSearchInput";

export const SmoothTextarea = React.forwardRef<HTMLTextAreaElement, React.ComponentPropsWithoutRef<"textarea"> & { wrapperClassName?: string; autoResize?: boolean }>(
  ({ className, wrapperClassName, value, onChange, onFocus, onBlur, placeholder, autoResize = true, rows = 3, disabled, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [focused, setFocused] = React.useState(false);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);
    const resize = React.useCallback(() => {
      const el = innerRef.current;
      if (!el || !autoResize) return;
      el.style.height = "auto";
      el.style.height = `${Math.max(el.scrollHeight, 92)}px`;
    }, [autoResize]);
    React.useEffect(resize, [value, resize]);
    return (
      <div
        className={cn(
          "group relative w-full overflow-hidden rounded-[14px] border border-line bg-paper px-4 py-3 text-sm shadow-sm transition duration-200",
          "focus-within:border-[color:var(--signal)] focus-within:shadow-[0_0_0_4px_var(--signal-soft)]",
          disabled && "cursor-not-allowed opacity-60",
          wrapperClassName,
        )}
      >
        <textarea
          ref={innerRef}
          value={value}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onChange={(event) => {
            onChange?.(event);
            requestAnimationFrame(resize);
          }}
          className={cn("relative z-10 block w-full resize-none bg-transparent text-[color:var(--ink)] outline-none placeholder:text-transparent disabled:cursor-not-allowed", className)}
          {...props}
        />
        <AnimatePresence initial={false}>
          {!value && placeholder && (
            <motion.span
              initial={false}
              animate={{ opacity: focused ? 0.42 : 0.58 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute left-4 top-3 z-0 text-[color:var(--ink-soft)]"
            >
              {placeholder}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
SmoothTextarea.displayName = "SmoothTextarea";