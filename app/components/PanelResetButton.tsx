"use client";

import { Tooltip } from "./Tooltip";

type Props = {
  onReset: () => void;
};

export function PanelResetButton({ onReset }: Props) {
  return (
    <Tooltip className="dialResetTooltip" content="Reset all controls">
      <button
        className="dialResetButton"
        type="button"
        onClick={onReset}
        aria-label="Reset all shader controls"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
          <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
        </svg>
      </button>
    </Tooltip>
  );
}
