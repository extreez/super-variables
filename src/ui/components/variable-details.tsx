import React, { useState } from "react";
import { PanelRightOpen, PanelRightClose, Copy, Check } from "lucide-react";
import { ColorVariableIcon } from "./variable-icon";
import type { Variable } from "./variables-data";

const hsbaMap: Record<string, string> = {
  "#0a0a0a": "hsba(0, 0%, 4%, 1)",
  "#fafafa": "hsba(0, 0%, 98%, 1)",
  "#16a34a": "hsba(142, 86%, 64%, 1)",
  "#f0fdf4": "hsba(138, 4%, 99%, 1)",
  "#dc2626": "hsba(0, 82%, 86%, 1)",
  "#fef2f2": "hsba(0, 4%, 100%, 1)",
  "#f59e0b": "hsba(38, 93%, 96%, 1)",
  "#fffbeb": "hsba(48, 8%, 100%, 1)",
  "#2563eb": "hsba(221, 83%, 92%, 1)",
  "#eff6ff": "hsba(214, 6%, 100%, 1)",
  "#f5f5f5": "hsba(0, 0%, 96%, 1)",
  "#e5e5e5": "hsba(0, 0%, 90%, 1)",
};

interface VariableDetailsProps {
  variable: Variable | null;
  groupName: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function VariableDetails({
  variable,
  groupName,
  collapsed,
  onToggleCollapse,
}: VariableDetailsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [nameHovered, setNameHovered] = useState(false);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  if (collapsed) {
    return (
      <div
        className="flex flex-col h-full border-l border-[#e5e5e5] bg-white shrink-0"
        style={{ width: 40 }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-center border-b border-[#e5e5e5]"
          style={{ height: 36 }}
        >
          <button
            onClick={onToggleCollapse}
            className="text-[#999] hover:text-[#333] p-1 cursor-pointer"
            title="Expand details"
          >
            <PanelRightOpen size={14} />
          </button>
        </div>

        {/* Copy token name button — always visible at top */}
        {variable && (
          <div className="flex items-center justify-center pt-2">
            <button
              onClick={() =>
                handleCopy(`${groupName}/${variable.name}`, "name")
              }
              className="text-[#999] hover:text-[#333] p-1 cursor-pointer"
              title="Copy token name"
            >
              {copiedField === "name" ? (
                <Check size={14} className="text-[#16a34a]" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  const hsba = variable
    ? hsbaMap[variable.colorSwatch] || "hsba(0, 0%, 0%, 1)"
    : "";

  return (
    <div
      className="h-full border-l border-[#e5e5e5] bg-white flex flex-col shrink-0"
      style={{ width: 260 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 border-b border-[#e5e5e5] shrink-0"
        style={{ height: 36 }}
      >
        <span className="text-[11px] text-[#999]">Variable details</span>
        <button
          onClick={onToggleCollapse}
          className="text-[#999] hover:text-[#333] cursor-pointer p-1"
          title="Collapse"
        >
          <PanelRightClose size={14} />
        </button>
      </div>

      {/* Content */}
      {variable ? (
        <div className="flex-1 flex flex-col">
          {/* Token path sub-header — 28px to align with other panels */}
          <div
            className="flex items-center justify-between px-4 border-b border-[#e5e5e5] shrink-0"
            style={{ height: 28 }}
            onMouseEnter={() => setNameHovered(true)}
            onMouseLeave={() => setNameHovered(false)}
          >
            <span className="text-[11px] text-[#333] truncate">
              {groupName}/{variable.name}
            </span>
            {nameHovered && (
              <button
                onClick={() =>
                  handleCopy(`${groupName}/${variable.name}`, "name")
                }
                className="text-[#999] hover:text-[#333] p-0.5 cursor-pointer shrink-0 ml-2 transition-opacity"
                title="Copy name"
              >
                {copiedField === "name" ? (
                  <Check size={12} className="text-[#16a34a]" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            )}
          </div>

          <div className="px-4 py-3 flex flex-col gap-4 flex-1">
            {/* Collection */}
            <div className="flex items-start gap-6">
              <span
                className="text-[11px] text-[#999] shrink-0"
                style={{ width: 64 }}
              >
                Collection
              </span>
              <span className="text-[11px] text-[#0d99ff]">Colors</span>
            </div>

            {/* Value */}
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-6">
                <span
                  className="text-[11px] text-[#999] shrink-0"
                  style={{ width: 64 }}
                >
                  Value
                </span>
                <div className="flex items-center gap-1.5 bg-[#f5f5f5] rounded px-1.5 py-0.5">
                  <ColorVariableIcon color={variable.colorSwatch} />
                  <span className="text-[11px] text-[#333]">
                    {variable.value}
                  </span>
                </div>
              </div>

              {/* Arrow and HSBA */}
              <div className="flex items-start gap-6">
                <div style={{ width: 64 }} className="flex justify-end">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    className="text-[#999]"
                  >
                    <path
                      d="M6 2V10M6 10L3 7M6 10L9 7"
                      stroke="currentColor"
                      strokeWidth="1"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5">
                  <ColorVariableIcon color={variable.colorSwatch} />
                  <span className="text-[11px] text-[#333]">{hsba}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom action buttons */}
          <div
            className="flex items-center gap-2 px-3 border-t border-[#e5e5e5] shrink-0"
            style={{ height: 44 }}
          >
            <button
              onClick={() => handleCopy(hsba, "hard")}
              className="flex items-center gap-1 text-[11px] text-[#666] hover:text-[#333] cursor-pointer px-2 py-1 rounded hover:bg-[#f5f5f5] transition-colors"
            >
              {copiedField === "hard" ? (
                <Check size={12} className="text-[#16a34a]" />
              ) : (
                <Copy size={12} />
              )}
              Copy hard value
            </button>
            <button
              onClick={() =>
                handleCopy(`${groupName}/${variable.name}`, "token")
              }
              className="flex items-center gap-1 text-[11px] text-[#666] hover:text-[#333] cursor-pointer px-2 py-1 rounded hover:bg-[#f5f5f5] transition-colors"
            >
              {copiedField === "token" ? (
                <Check size={12} className="text-[#16a34a]" />
              ) : (
                <Copy size={12} />
              )}
              Copy token
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-6 text-[11px] text-[#999] flex-1">
            Select a variable to see details
          </div>
          <div
            className="flex items-center px-3 border-t border-[#e5e5e5] shrink-0"
            style={{ height: 44 }}
          />
        </div>
      )}
    </div>
  );
}