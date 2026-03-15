import React from "react";
import { Hash, Type, ToggleLeft, Code, Palette } from "lucide-react";

export function VariableIcon({ className = "", type }: { className?: string; type?: "color" | "number" | "string" | "boolean" | "function" }) {
  // If type-specific icon is requested
  if (type === "number") {
    return <Hash size={16} className={className} />;
  }
  if (type === "string") {
    return <Type size={16} className={className} />;
  }
  if (type === "boolean") {
    return <ToggleLeft size={16} className={className} />;
  }
  if (type === "function") {
    return <Code size={16} className={className} />;
  }
  if (type === "color") {
    return <Palette size={16} className={className} />;
  }

  // Default generic variable icon
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M4.5 3C3.67157 3 3 3.67157 3 4.5V11.5C3 12.3284 3.67157 13 4.5 13H11.5C12.3284 13 13 12.3284 13 11.5V4.5C13 3.67157 12.3284 3 11.5 3H4.5Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M6 6.5C6 6.5 6.5 10 8 10C9.5 10 10 6 10 6"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ColorVariableIcon({ color }: { color: string }) {
  return (
    <span
      className="inline-block rounded-[4px] border border-black/5 shrink-0"
      style={{
        width: 13,
        height: 13,
        backgroundColor: color,
      }}
    />
  );
}

export function SortIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 5H13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M5 8H11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M7 11H9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}