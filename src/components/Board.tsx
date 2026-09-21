import { FlapText } from "./FlapText";
import { PaneCell } from "./PaneCell";
import type { Agent, PaneStatus } from "../lib/api";

const STATUS_LABEL: Record<PaneStatus, string> = {
  working: "WORKING",
  blocked: "BLOCKED",
  idle: "IDLE",
  done: "DONE",
  unknown: "-",
};

interface BoardProps {
  agents: Agent[];
  cursor: number;
  onSelect: (index: number) => void;
  previews: Record<string, string>;
  onOpenTerminal: (agent: Agent) => void;
}

export function Board({ agents, cursor, onSelect, previews, onOpenTerminal }: BoardProps) {
  return (
    <div className="board" role="grid" aria-label="Fleet agents">
      <div className="board-head" role="row">
        <span role="columnheader">Pane</span>
        <span role="columnheader">Folder</span>
        <span role="columnheader">Engine</span>
        <span role="columnheader" className="col-status">Status</span>
      </div>

      {agents.map((agent, index) => (
        <button
          type="button"
          role="row"
          key={agent.target}
          className="row"
          data-status={agent.status}
          data-cursor={index === cursor || undefined}
          aria-selected={index === cursor}
          onClick={() => onSelect(index)}
        >
          <span role="gridcell" className="cell-pane">
            <PaneCell
              preview={previews[agent.target]}
              idle={agent.status === "idle"}
              label={agent.folder ?? agent.session}
              onOpen={() => onOpenTerminal(agent)}
            />
          </span>
          {/* The folder leads the text columns because it is the only part an operator
              recognises: herdr encodes session names, so the id below is
              base64url and identifies nothing to a human reading the board. */}
          <span role="gridcell" className="cell-folder">
            <FlapText value={agent.folder ?? agent.session} width={26} />
          </span>
          <span role="gridcell" className="cell-engine">
            <FlapText value={agent.agent ?? "·"} width={8} />
          </span>
          <span role="gridcell" className="cell-status col-status">
            <i className="lamp" aria-hidden="true" />
            <FlapText value={STATUS_LABEL[agent.status]} width={7} />
          </span>
        </button>
      ))}
    </div>
  );
}
