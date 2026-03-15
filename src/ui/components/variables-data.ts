import { TokenScopes, CodeSyntax } from "../../core/types";

export interface Variable {
  id: string;
  name: string;
  path: string;
  type: "color" | "number" | "string" | "boolean" | "function";
  valuesByMode: Record<string, {
    value: string;
    resolvedValue?: string;
    colorSwatch?: string;
    isAlias: boolean;
    aliasChain?: string[];
    aliasTargetId?: string;
  }>;
  description?: string;
  scopes?: string[];
  codeSyntax?: CodeSyntax;
  hiddenFromPublishing?: boolean;
  collectionId?: string;
}

export interface Mode {
  modeId: string;
  name: string;
}

export interface Collection {
  id?: string;
  name: string;
  count: number;
  modes?: Mode[];
}

export interface Group {
  name: string;
  fullName: string;
  count: number;
  level: number;
  isFolder: boolean;
}

export const collections: Collection[] = [
  { name: "Colors", count: 216 },
  { name: "Typography", count: 141 },
  { name: "Spacing", count: 39 },
  { name: "Effects", count: 27 },
  { name: "Radius", count: 22 },
  { name: "Components", count: 1 },
  { name: "localhost", count: 109 },
];

export const groups: Group[] = [
  { name: "All", fullName: "All", count: 216, level: 0, isFolder: false },
  { name: "Primitives", fullName: "Primitives", count: 204, level: 0, isFolder: true },
  { name: "Neutral", fullName: "Primitives/Neutral", count: 100, level: 1, isFolder: false },
  { name: "Colors", fullName: "Primitives/Colors", count: 104, level: 1, isFolder: false },
  { name: "Semantics", fullName: "Semantics", count: 12, level: 0, isFolder: false },
];

export const semanticVariables: any[] = [
  // Colors
  { id: "1", name: "primary", path: "Semantics/primary", value: "Primitives/neutral/950", colorSwatch: "#0a0a0a", type: "color", isAlias: true },
  { id: "2", name: "primary-foreground", path: "Semantics/primary-foreground", value: "Primitives/neutral/50", colorSwatch: "#fafafa", type: "color", isAlias: true },
  { id: "3", name: "success", path: "Semantics/success", value: "Primitives/green/600", colorSwatch: "#16a34a", type: "color", isAlias: true },
  { id: "4", name: "success-light", path: "Semantics/success-light", value: "Primitives/green/50", colorSwatch: "#f0fdf4", type: "color", isAlias: true },
  { id: "5", name: "error", path: "Semantics/error", value: "Primitives/red/600", colorSwatch: "#dc2626", type: "color", isAlias: true },
  { id: "6", name: "error-light", path: "Semantics/error-light", value: "Primitives/red/50", colorSwatch: "#fef2f2", type: "color", isAlias: true },
  { id: "7", name: "warning", path: "Semantics/warning", value: "Primitives/amber/500", colorSwatch: "#f59e0b", type: "color", isAlias: true },
  { id: "8", name: "warning-light", path: "Semantics/warning-light", value: "Primitives/amber/50", colorSwatch: "#fffbeb", type: "color", isAlias: true },
  { id: "9", name: "info", path: "Semantics/info", value: "Primitives/blue/600", colorSwatch: "#2563eb", type: "color", isAlias: true },
  { id: "10", name: "info-light", path: "Semantics/info-light", value: "Primitives/blue/50", colorSwatch: "#eff6ff", type: "color", isAlias: true },
  { id: "11", name: "muted", path: "Semantics/muted", value: "Primitives/neutral/100", colorSwatch: "#f5f5f5", type: "color", isAlias: true },
  { id: "12", name: "border", path: "Semantics/border", value: "Primitives/neutral/200", colorSwatch: "#e5e5e5", type: "color", isAlias: true },
  { id: "13", name: "accent", path: "Semantics/accent", value: "#0d99ff", colorSwatch: "#0d99ff", type: "color", isAlias: false },
  { id: "14", name: "background", path: "Semantics/background", value: "#ffffff", colorSwatch: "#ffffff", type: "color", isAlias: false },

  // Numbers
  { id: "15", name: "spacing-sm", path: "Spacing/sm", value: "8", type: "number", isAlias: false },
  { id: "16", name: "spacing-md", path: "Spacing/md", value: "16", type: "number", isAlias: false },
  { id: "17", name: "spacing-lg", path: "Spacing/lg", value: "24", type: "number", isAlias: false },
  { id: "18", name: "spacing-xl", path: "Spacing/xl", value: "spacing-lg", type: "number", isAlias: true },
  { id: "19", name: "border-radius", path: "Radius/base", value: "4", type: "number", isAlias: false },
  { id: "20", name: "border-radius-lg", path: "Radius/lg", value: "border-radius", type: "number", isAlias: true },
  { id: "21", name: "font-size-base", path: "Typography/size-base", value: "14", type: "number", isAlias: false },
  { id: "22", name: "font-size-lg", path: "Typography/size-lg", value: "16", type: "number", isAlias: false },
  { id: "23", name: "line-height", path: "Typography/line-height", value: "1.5", type: "number", isAlias: false },

  // Strings
  { id: "24", name: "font-family-base", path: "Typography/family-base", value: "Inter", type: "string", isAlias: false },
  { id: "25", name: "font-family-mono", path: "Typography/family-mono", value: "SF Mono, Monaco, monospace", type: "string", isAlias: false },
  { id: "26", name: "font-family-heading", path: "Typography/family-heading", value: "font-family-base", type: "string", isAlias: true },
  { id: "27", name: "transition-speed", path: "Effects/transition-speed", value: "200ms", type: "string", isAlias: false },
  { id: "28", name: "transition-ease", path: "Effects/transition-ease", value: "ease-in-out", type: "string", isAlias: false },
  { id: "29", name: "shadow-sm", path: "Effects/shadow-sm", value: "0 1px 2px rgba(0,0,0,0.05)", type: "string", isAlias: false },
  { id: "30", name: "shadow-md", path: "Effects/shadow-md", value: "0 4px 6px rgba(0,0,0,0.1)", type: "string", isAlias: false },

  // Booleans
  { id: "31", name: "enable-animations", path: "All/enable-animations", value: "true", type: "boolean", isAlias: false },
  { id: "32", name: "enable-shadows", path: "All/enable-shadows", value: "true", type: "boolean", isAlias: false },
  { id: "33", name: "debug-mode", path: "All/debug-mode", value: "false", type: "boolean", isAlias: false },
  { id: "34", name: "use-gpu-acceleration", path: "All/use-gpu-acceleration", value: "enable-animations", type: "boolean", isAlias: true },
  { id: "35", name: "dark-mode", path: "All/dark-mode", value: "false", type: "boolean", isAlias: false },

  // Functions
  { id: "36", name: "scale-linear", path: "All/scale-linear", value: "lerp(0, 1, t)", type: "function", isAlias: false },
  { id: "37", name: "ease-out-cubic", path: "All/ease-out-cubic", value: "cubic-bezier(0.33, 1, 0.68, 1)", type: "function", isAlias: false },
  { id: "38", name: "ease-in-out", path: "All/ease-in-out", value: "ease-out-cubic", type: "function", isAlias: true },
  { id: "39", name: "clamp-value", path: "All/clamp-value", value: "clamp(min, max, value)", type: "function", isAlias: false },
  { id: "40", name: "responsive-size", path: "All/responsive-size", value: "clamp(12px, 2vw, 16px)", type: "function", isAlias: false },
];