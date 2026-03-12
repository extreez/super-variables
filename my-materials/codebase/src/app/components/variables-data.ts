export interface Variable {
  id: string;
  name: string;
  value: string;
  colorSwatch?: string;
  type: "color" | "number" | "string" | "boolean" | "function";
}

export interface Collection {
  name: string;
  count: number;
}

export interface Group {
  name: string;
  count: number;
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
  { name: "All", count: 216 },
  { name: "Primitives", count: 204 },
  { name: "Semantics", count: 12 },
];

export const semanticVariables: Variable[] = [
  // Colors
  { id: "1", name: "primary", value: "Primitives/neutral/950", colorSwatch: "#0a0a0a", type: "color" },
  { id: "2", name: "primary-foreground", value: "Primitives/neutral/50", colorSwatch: "#fafafa", type: "color" },
  { id: "3", name: "success", value: "Primitives/green/600", colorSwatch: "#16a34a", type: "color" },
  { id: "4", name: "success-light", value: "Primitives/green/50", colorSwatch: "#f0fdf4", type: "color" },
  { id: "5", name: "error", value: "Primitives/red/600", colorSwatch: "#dc2626", type: "color" },
  { id: "6", name: "error-light", value: "Primitives/red/50", colorSwatch: "#fef2f2", type: "color" },
  { id: "7", name: "warning", value: "Primitives/amber/500", colorSwatch: "#f59e0b", type: "color" },
  { id: "8", name: "warning-light", value: "Primitives/amber/50", colorSwatch: "#fffbeb", type: "color" },
  { id: "9", name: "info", value: "Primitives/blue/600", colorSwatch: "#2563eb", type: "color" },
  { id: "10", name: "info-light", value: "Primitives/blue/50", colorSwatch: "#eff6ff", type: "color" },
  { id: "11", name: "muted", value: "Primitives/neutral/100", colorSwatch: "#f5f5f5", type: "color" },
  { id: "12", name: "border", value: "Primitives/neutral/200", colorSwatch: "#e5e5e5", type: "color" },
  { id: "13", name: "accent", value: "#0d99ff", colorSwatch: "#0d99ff", type: "color" },
  { id: "14", name: "background", value: "#ffffff", colorSwatch: "#ffffff", type: "color" },
  
  // Numbers
  { id: "15", name: "spacing-sm", value: "8", type: "number" },
  { id: "16", name: "spacing-md", value: "16", type: "number" },
  { id: "17", name: "spacing-lg", value: "24", type: "number" },
  { id: "18", name: "spacing-xl", value: "spacing-lg", type: "number" },
  { id: "19", name: "border-radius", value: "4", type: "number" },
  { id: "20", name: "border-radius-lg", value: "border-radius", type: "number" },
  { id: "21", name: "font-size-base", value: "14", type: "number" },
  { id: "22", name: "font-size-lg", value: "16", type: "number" },
  { id: "23", name: "line-height", value: "1.5", type: "number" },
  
  // Strings
  { id: "24", name: "font-family-base", value: "Inter", type: "string" },
  { id: "25", name: "font-family-mono", value: "SF Mono, Monaco, monospace", type: "string" },
  { id: "26", name: "font-family-heading", value: "font-family-base", type: "string" },
  { id: "27", name: "transition-speed", value: "200ms", type: "string" },
  { id: "28", name: "transition-ease", value: "ease-in-out", type: "string" },
  { id: "29", name: "shadow-sm", value: "0 1px 2px rgba(0,0,0,0.05)", type: "string" },
  { id: "30", name: "shadow-md", value: "0 4px 6px rgba(0,0,0,0.1)", type: "string" },
  
  // Booleans
  { id: "31", name: "enable-animations", value: "true", type: "boolean" },
  { id: "32", name: "enable-shadows", value: "true", type: "boolean" },
  { id: "33", name: "debug-mode", value: "false", type: "boolean" },
  { id: "34", name: "use-gpu-acceleration", value: "enable-animations", type: "boolean" },
  { id: "35", name: "dark-mode", value: "false", type: "boolean" },
  
  // Functions
  { id: "36", name: "scale-linear", value: "lerp(0, 1, t)", type: "function" },
  { id: "37", name: "ease-out-cubic", value: "cubic-bezier(0.33, 1, 0.68, 1)", type: "function" },
  { id: "38", name: "ease-in-out", value: "ease-out-cubic", type: "function" },
  { id: "39", name: "clamp-value", value: "clamp(min, max, value)", type: "function" },
  { id: "40", name: "responsive-size", value: "clamp(12px, 2vw, 16px)", type: "function" },
];