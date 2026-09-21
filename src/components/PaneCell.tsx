import type React from "react";

// The cell is a miniature of the real pane, not a cropped tail of it. The text
// is laid out at true terminal metrics — 80 columns — inside a fixed box, then
// the whole box is scaled down to the square. At that size the words are not
// readable and are not meant to be: what carries is the shape of the output,
// which is how you tell a pane that is building from one that is waiting.
// Click it to read.

const CONTENT_WIDTH = 440; // px, ≈80 columns at the inner font size
const CONTENT_HEIGHT = 300;
const LINES = 24;

export function lastLines(preview: string | undefined, lines = LINES): string {
  if (!preview) return "";
  const all = preview.replace(/\s+$/, "").split("\n");
  return all.slice(Math.max(0, all.length - lines)).join("\n");
}

export function PaneCell({ preview, idle, onOpen, label }: {
  preview: string | undefined;
  idle: boolean;
  onOpen: () => void;
  label: string;
}) {
  const body = lastLines(preview);
  const open = (event: React.MouseEvent | React.KeyboardEvent) => {
    // The row moves the cursor; the cell opens the terminal. Without this the
    // click would do both, and the modal would cover a board that had just
    // scrolled underneath it.
    event.stopPropagation();
    onOpen();
  };

  return (
    <span
      className="pane-cell"
      role="button"
      tabIndex={0}
      aria-label={`Open the full terminal for ${label}`}
      data-empty={body ? undefined : "true"}
      onClick={open}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(event); }
      }}
      style={{
        // Anchored bottom-left so the newest line is always the one against the
        // edge, exactly as in the terminal it mirrors.
        ["--pane-w" as string]: `${CONTENT_WIDTH}px`,
        ["--pane-h" as string]: `${CONTENT_HEIGHT}px`,
      }}
    >
      {body
        ? <span className="pane-scale" aria-hidden="true">{body}</span>
        : <span className="pane-quiet" aria-hidden="true">{idle ? "quiet" : "…"}</span>}
    </span>
  );
}
