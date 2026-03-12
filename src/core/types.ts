// Super Variables — Core Types
// Shared data types for communication between plugin code and UI.

// === Variable Value Types ===

export interface ColorValue {
  type: 'color';
  r: number; // 0–1
  g: number;
  b: number;
  a: number;
}

export interface FloatValue {
  type: 'float';
  value: number;
}

export interface StringValue {
  type: 'string';
  value: string;
}

export interface BooleanValue {
  type: 'boolean';
  value: boolean;
}

export interface AliasValue {
  type: 'alias';
  id: string;
  name: string; // resolved name like "Primitives/neutral/950"
}

export type TokenValue = ColorValue | FloatValue | StringValue | BooleanValue | AliasValue;

// === Mode ===

export interface Mode {
  modeId: string;
  name: string;
}

// === Collection ===

export interface CollectionData {
  id: string;
  name: string;
  modes: Mode[];
  variableCount: number;
}

// === Variable (Token) ===

export interface TokenData {
  id: string;
  name: string;             // full Figma path, e.g. "color/brand/500"
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, TokenValue>; // modeId -> value
  collectionId: string;
  scopes: string[];
}

// === Group (derived from variable paths) ===

export interface GroupData {
  name: string;         // e.g. "palette"
  path: string;         // e.g. "palette" or "palette/primary"
  tokenCount: number;   // total tokens in this group and subgroups
}

// === Full data payload sent from plugin to UI ===

export interface VariablesPayload {
  fileName: string;
  collections: CollectionData[];
  tokens: TokenData[];
}
