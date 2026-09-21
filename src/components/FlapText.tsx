import { useEffect, useRef, useState } from "react";

// A Solari board does not fade between words. Each drum steps through its
// alphabet until the right glyph lands, so a change is heard and seen as
// travel rather than as a swap. Columns settle left to right because the drums
// are mechanically identical and the earlier ones have less distance to cover.

const ALPHABET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-·:/";
const STEP_MS = 42;

function stepsBetween(from: string, to: string): number {
  const a = ALPHABET.indexOf(from);
  const b = ALPHABET.indexOf(to);
  if (a === -1 || b === -1) return 1;
  return (b - a + ALPHABET.length) % ALPHABET.length;
}

interface FlapTextProps {
  value: string;
  /** Pad to a fixed drum count so a row never reflows while it settles. */
  width?: number;
  className?: string;
}

export function FlapText({ value, width, className }: FlapTextProps) {
  const target = (width ? value.padEnd(width) : value).toUpperCase();
  const [shown, setShown] = useState(target);
  const frame = useRef<number | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (shown === target) return;
    // Respect the operator's setting: a board that flickers is worse than one
    // that simply updates.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(target);
      return;
    }

    let current = shown.padEnd(target.length).slice(0, target.length);
    const remaining = Array.from(target).map((char, index) =>
      stepsBetween(current[index] ?? " ", char));

    const tick = () => {
      let moved = false;
      const next = Array.from(current);
      for (let index = 0; index < next.length; index++) {
        if (remaining[index] <= 0) { next[index] = target[index]; continue; }
        const position = ALPHABET.indexOf(next[index]);
        next[index] = position === -1
          ? target[index]
          : ALPHABET[(position + 1) % ALPHABET.length];
        remaining[index] -= 1;
        moved = true;
      }
      current = next.join("");
      setShown(current);
      if (moved) timer.current = setTimeout(() => { frame.current = requestAnimationFrame(tick); }, STEP_MS);
    };

    timer.current = setTimeout(() => { frame.current = requestAnimationFrame(tick); }, STEP_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, shown]);

  const settling = shown !== target;
  return (
    <span className={className} data-settling={settling || undefined} aria-label={value}>
      {Array.from(shown).map((char, index) => (
        <span className="flap" key={index} aria-hidden="true">
          {char === " " ? " " : char}
        </span>
      ))}
    </span>
  );
}
