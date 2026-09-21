import { useEffect, useRef } from "react";
import { IconClose } from "./icons";
import type { Agent } from "../lib/api";

/**
 * The full pane, streaming. The board's cells carry four lines; this carries
 * whatever the server sends for the selected target (80 lines) and keeps
 * itself pinned to the bottom the way a terminal does, unless the reader has
 * scrolled up to look at something.
 */
export function Terminal({ agent, content, readOnly, onClose, onSend }: {
  agent: Agent;
  content: string | null;
  readOnly: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
}) {
  const scroller = useRef<HTMLPreElement>(null);
  const pinned = useRef(true);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { input.current?.focus(); }, []);

  useEffect(() => {
    const node = scroller.current;
    if (node && pinned.current) node.scrollTop = node.scrollHeight;
  }, [content]);

  return (
    <div className="terminal-scrim" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="terminal" role="dialog" aria-modal="true" aria-label={`Terminal for ${agent.folder ?? agent.session}`}>
        <header className="terminal-head">
          <span className="terminal-title">{agent.folder ?? agent.session}</span>
          <span className="terminal-meta">{agent.agent ?? "no engine"}</span>
          <span className="terminal-meta terminal-path">{agent.cwd ?? agent.target}</span>
          <span className="terminal-status" data-status={agent.status}>
            <i className="lamp" aria-hidden="true" />
            {agent.status}
          </span>
          <button type="button" className="terminal-close" onClick={onClose} aria-label="Close terminal">
            <IconClose />
          </button>
        </header>

        <pre
          className="terminal-body"
          ref={scroller}
          tabIndex={0}
          onScroll={event => {
            const node = event.currentTarget;
            pinned.current = node.scrollHeight - node.scrollTop - node.clientHeight < 24;
          }}
        >
          {content ?? "waiting for output…"}
        </pre>

        <form
          className="terminal-compose"
          onSubmit={event => {
            event.preventDefault();
            const field = input.current;
            if (!field?.value.trim()) return;
            onSend(field.value);
            field.value = "";
          }}
        >
          <input
            ref={input}
            name="text"
            placeholder={readOnly ? "Read only — press t to add an operator token" : `Type into ${agent.folder ?? agent.session}`}
            disabled={readOnly}
            autoComplete="off"
            spellCheck={false}
            aria-label="Send to this pane"
          />
          <button type="submit" disabled={readOnly}>Send</button>
        </form>
      </section>
    </div>
  );
}
