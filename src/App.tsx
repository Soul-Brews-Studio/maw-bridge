import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Board } from "./components/Board";
import { Terminal } from "./components/Terminal";
import { FlapText } from "./components/FlapText";
import { IconBolt, IconClose, IconKey, IconLink, IconSend } from "./components/icons";
import {
  ApiError, backendOrigin, clearBackendOrigin, fetchFleet, mixedContentBlocked,
  operatorToken, send, setBackendOrigin, setOperatorToken, toFleet, wake,
  type Agent, type Fleet, type RawSession,
} from "./lib/api";
import { FleetSocket, type SocketState } from "./lib/socket";

type Link = "connecting" | "live" | "readonly" | "down" | "blocked";

const POLL_MS = 4000;
const STATUS_ORDER = { blocked: 0, working: 1, idle: 2, done: 3, unknown: 4 } as const;

export default function App() {
  const [fleet, setFleet] = useState<Fleet>({ agents: [], sessions: 0 });
  const [link, setLink] = useState<Link>("connecting");
  const [detail, setDetail] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [streaming, setStreaming] = useState<SocketState>("connecting");
  const socketRef = useRef<FleetSocket | null>(null);
  const selectedRef = useRef("");
  const [reconnectKey, setReconnectKey] = useState(0);
  const [terminal, setTerminal] = useState<Agent | null>(null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [panel, setPanel] = useState<"none" | "host" | "token" | "help" | "send">("none");
  const [notice, setNotice] = useState<string | null>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);

  const agents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? fleet.agents.filter(agent => [agent.session, agent.folder, agent.agent, agent.name]
          .filter(Boolean).join(" ").toLowerCase().includes(needle))
      : fleet.agents;
    return [...matched].sort((a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      || (a.folder ?? "").localeCompare(b.folder ?? "")
      || a.session.localeCompare(b.session));
  }, [fleet.agents, query]);

  const selected: Agent | undefined = agents[Math.min(cursor, agents.length - 1)];

  useEffect(() => { setCursor(0); }, [query]);

  const poll = useCallback(async (signal: AbortSignal) => {
    if (mixedContentBlocked()) { setLink("blocked"); return; }
    try {
      setFleet(await fetchFleet(signal));
      setLink(operatorToken() ? "live" : "readonly");
    } catch (error) {
      if (signal.aborted) return;
      setLink(error instanceof ApiError && error.status === 401 ? "readonly" : "down");
    }
  }, []);

  // One HTTP read on mount so the board is populated even where the socket
  // cannot open, then the socket takes over and the poll stops.
  useEffect(() => {
    const controller = new AbortController();
    void poll(controller.signal);
    const id = setInterval(() => {
      if (socketRef.current && streamingRef.current === "open") return;
      void poll(controller.signal);
    }, POLL_MS);
    return () => { controller.abort(); clearInterval(id); };
  }, [poll]);

  const streamingRef = useRef<SocketState>("connecting");
  useEffect(() => { streamingRef.current = streaming; }, [streaming]);

  useEffect(() => {
    if (mixedContentBlocked()) return;
    const socket = new FleetSocket({
      onSessions: (sessions) => {
        setFleet(toFleet(sessions as RawSession[]));
        setLink(operatorToken() ? "live" : "readonly");
      },
      onPreviews: (data) => setPreviews(current => ({ ...current, ...data })),
      onCapture: (target, content) => {
        if (target === selectedRef.current) setDetail(content);
      },
      onState: setStreaming,
      onError: (reason) => {
        // A write refused for want of a token is the expected resting state of
        // a read-only board, not something to shout about.
        if (reason === "operator_token_required_for_writes") setLink("readonly");
      },
    });
    socketRef.current = socket;
    void socket.connect();
    return () => { socket.close(); socketRef.current = null; };
  }, [reconnectKey]);

  // The selected pane streams at 80 lines; the visible rows at 15.
  const streamTarget = terminal?.target ?? selected?.target ?? "";
  useEffect(() => {
    selectedRef.current = streamTarget;
    setDetail(null);
    if (streamTarget) socketRef.current?.select(streamTarget);
  }, [streamTarget]);

  useEffect(() => {
    socketRef.current?.subscribePreviews(agents.slice(0, 16).map(agent => agent.target));
  }, [agents.map(agent => agent.target).join("\u0000")]);

  const flash = useCallback((message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(current => (current === message ? null : current)), 4000);
  }, []);

  const runWake = useCallback(async () => {
    if (!selected) return;
    try { await wake(selected.target); flash(`woke ${selected.target}`); }
    catch (error) {
      flash(error instanceof ApiError && error.status === 401
        ? "writes need an operator token — press t"
        : `wake failed for ${selected.target}`);
    }
  }, [selected, flash]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLInputElement
        || event.target instanceof HTMLTextAreaElement;
      if (event.key === "Escape") {
        if (terminal) { setTerminal(null); return; }
        if (panel !== "none") { setPanel("none"); return; }
        if (typing) { (event.target as HTMLElement).blur(); return; }
        if (query) setQuery("");
        return;
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (terminal) return;
      if (event.key === "Enter") { event.preventDefault(); if (selected) setTerminal(selected); return; }
      if (event.key === "/") { event.preventDefault(); filterRef.current?.focus(); return; }
      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault(); setCursor(c => Math.min(c + 1, agents.length - 1)); return;
      }
      if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault(); setCursor(c => Math.max(c - 1, 0)); return;
      }
      if (event.key === "g") { setCursor(0); return; }
      if (event.key === "G") { setCursor(Math.max(agents.length - 1, 0)); return; }
      if (event.key === "w") { void runWake(); return; }
      if (event.key === "s") { event.preventDefault(); setPanel("send"); return; }
      if (event.key === "h") { setPanel("host"); return; }
      if (event.key === "t") { setPanel("token"); return; }
      if (event.key === "?") { setPanel(p => (p === "help" ? "none" : "help")); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [agents.length, panel, query, runWake, terminal, selected]);

  useEffect(() => {
    if (panel === "send") composeRef.current?.focus();
  }, [panel]);

  useEffect(() => {
    if (!terminal) return;
    const fresh = fleet.agents.find(agent => agent.target === terminal.target);
    if (fresh && fresh.status !== terminal.status) setTerminal(fresh);
  }, [fleet.agents, terminal]);

  const origin = backendOrigin();
  const counts = useMemo(() => ({
    working: fleet.agents.filter(a => a.status === "working").length,
    blocked: fleet.agents.filter(a => a.status === "blocked").length,
  }), [fleet.agents]);

  return (
    <div className="app">
      <header className="masthead">
        <h1>
          <FlapText value="BRIDGE" className="wordmark" />
        </h1>

        <dl className="tally">
          <div><dt>Agents</dt><dd>{fleet.agents.length}</dd></div>
          <div><dt>Sessions</dt><dd>{fleet.sessions}</dd></div>
          <div><dt>Working</dt><dd>{counts.working}</dd></div>
          <div data-alert={counts.blocked > 0 || undefined}>
            <dt>Blocked</dt><dd>{counts.blocked}</dd>
          </div>
        </dl>

        <div className="link" data-link={link}>
          <i className="lamp" aria-hidden="true" />
          <span className="link-state">
            {link === "live" ? "Operator" : link === "readonly" ? "Read only"
              : link === "connecting" ? "Connecting" : link === "blocked" ? "Blocked" : "No signal"}
          </span>
          <span className="link-host">{origin ?? "same origin"}</span>
          <span className="link-stream" data-stream={streaming}>
            {streaming === "open" ? "streaming" : streaming === "connecting" ? "opening" : "polling"}
          </span>
        </div>
      </header>

      <div className="controls">
        <input
          ref={filterRef}
          className="filter"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Filter by folder, session, or engine"
          spellCheck={false}
          autoComplete="off"
          aria-label="Filter agents"
        />
        <button type="button" onClick={() => setPanel("host")}><IconLink /> Host</button>
        <button type="button" onClick={() => setPanel("token")}><IconKey /> Token</button>
        <button type="button" onClick={() => void runWake()} disabled={!selected}><IconBolt /> Wake</button>
        <button type="button" onClick={() => setPanel("send")} disabled={!selected}><IconSend /> Send</button>
      </div>

      {link === "blocked" && (
        <p className="alarm">
          This page is HTTPS and the backend is plain HTTP, so the browser refuses the
          request before it leaves. Open this board over HTTP, or serve the backend over HTTPS.
        </p>
      )}
      {link === "down" && (
        <p className="alarm">
          No answer from {origin ?? "this origin"}. Start it with
          {" "}<code>maw herdr serve --token-file ~/.maw-herdr-token --listen 127.0.0.1:3457</code>
          {" "}then press <kbd>h</kbd> to point the board at it.
        </p>
      )}

      {agents.length === 0 ? (
        <p className="empty">
          {fleet.agents.length === 0
            ? "No agents reported. The fleet is asleep, or the board is pointed somewhere empty."
            : `Nothing matches “${query}”.`}
        </p>
      ) : (
        <Board
          agents={agents}
          cursor={Math.min(cursor, agents.length - 1)}
          onSelect={setCursor}
          previews={previews}
          onOpenTerminal={setTerminal}
        />
      )}


      <footer className="legend">
        <span><kbd>/</kbd> filter</span>
        <span><kbd>j</kbd><kbd>k</kbd> move</span>
        <span><kbd>w</kbd> wake</span>
        <span><kbd>s</kbd> send</span>
        <span><kbd>h</kbd> host</span>
        <span><kbd>t</kbd> token</span>
        <span><kbd>⏎</kbd> terminal</span>
        <span><kbd>?</kbd> keys</span>
        <span className="build" title="build">{__BUILD_ID__}</span>
      </footer>

      {notice && <p className="notice" role="status">{notice}</p>}

      {terminal && (
        <Terminal
          agent={terminal}
          content={detail}
          readOnly={!operatorToken()}
          onClose={() => setTerminal(null)}
          onSend={text => {
            void send(terminal.target, text)
              .then(() => flash(`sent to ${terminal.folder ?? terminal.target}`))
              .catch(error => flash(error instanceof ApiError && error.status === 401
                ? "writes need an operator token — press t" : "send failed"));
          }}
        />
      )}

      {panel !== "none" && (
        <div className="sheet-scrim" onClick={event => { if (event.target === event.currentTarget) setPanel("none"); }}>
          <section className="sheet" role="dialog" aria-modal="true" aria-label={panel}>
            <button type="button" className="sheet-close" onClick={() => setPanel("none")} aria-label="Close">
              <IconClose />
            </button>

            {panel === "host" && (
              <form onSubmit={event => {
                event.preventDefault();
                const value = new FormData(event.currentTarget).get("host");
                if (typeof value === "string" && value.trim()) {
                  try { setBackendOrigin(value); setPanel("none"); setReconnectKey(k => k + 1); flash("host set"); }
                  catch { flash("that is not a reachable address"); }
                } else { clearBackendOrigin(); setPanel("none"); setReconnectKey(k => k + 1); flash("back to same origin"); }
              }}>
                <h2>Backend</h2>
                <p>Where <code>maw herdr serve</code> is listening. Blank goes back to this page's own origin.</p>
                <input name="host" defaultValue={origin ?? ""} placeholder="http://127.0.0.1:3457"
                  spellCheck={false} autoComplete="off" autoFocus aria-label="Backend origin" />
                <button type="submit">Point the board</button>
              </form>
            )}

            {panel === "token" && (
              <form onSubmit={event => {
                event.preventDefault();
                const value = new FormData(event.currentTarget).get("token");
                setOperatorToken(typeof value === "string" ? value : "");
                setPanel("none");
                setReconnectKey(k => k + 1);
                flash(operatorToken() ? "token stored" : "token cleared");
              }}>
                <h2>Operator token</h2>
                <p>
                  Reads work without it. Wake and send do not. It is the contents of your
                  token file, kept in this browser only.
                </p>
                <input name="token" type="password" defaultValue={operatorToken() ?? ""}
                  placeholder="contents of ~/.maw-herdr-token" autoComplete="off" autoFocus
                  aria-label="Operator token" />
                <button type="submit">Store it</button>
              </form>
            )}

            {panel === "send" && selected && (
              <form onSubmit={async event => {
                event.preventDefault();
                const value = new FormData(event.currentTarget).get("text");
                if (typeof value !== "string" || !value.trim()) return;
                setPanel("none");
                try { await send(selected.target, value); flash(`sent to ${selected.folder ?? selected.target}`); }
                catch (error) {
                  flash(error instanceof ApiError && error.status === 401
                    ? "writes need an operator token — press t" : "send failed");
                }
              }}>
                <h2>Send to {selected.folder ?? selected.session}</h2>
                <p>Typed straight into the pane, exactly as if you were at its keyboard.</p>
                <textarea ref={composeRef} name="text" rows={4} placeholder="Message for this agent" />
                <button type="submit">Send</button>
              </form>
            )}

            {panel === "help" && (
              <div>
                <h2>Keys</h2>
                <dl className="keymap">
                  <div><dt><kbd>/</kbd></dt><dd>Filter the board</dd></div>
                  <div><dt><kbd>j</kbd> <kbd>k</kbd></dt><dd>Move the cursor</dd></div>
                  <div><dt><kbd>g</kbd> <kbd>G</kbd></dt><dd>First and last row</dd></div>
                  <div><dt><kbd>w</kbd></dt><dd>Wake the selected agent</dd></div>
                  <div><dt><kbd>s</kbd></dt><dd>Send it a message</dd></div>
                  <div><dt><kbd>h</kbd></dt><dd>Point at another backend</dd></div>
                  <div><dt><kbd>t</kbd></dt><dd>Store the operator token</dd></div>
                  <div><dt><kbd>Esc</kbd></dt><dd>Close, or clear the filter</dd></div>
                </dl>
                <p>
                  Point the board at a fleet from a link with
                  {" "}<code>?host=http://white.local:3457</code>. It is remembered, then
                  dropped from the address bar.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
