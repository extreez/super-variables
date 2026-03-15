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
  libraryName?: string;
}

// === Scopes Types ===

export interface ColorScopes {
  fill?: { frame?: boolean; shape?: boolean; text?: boolean };
  stroke?: boolean;
  effects?: boolean;
}

export interface NumberScopes {
  cornerRadius?: boolean;
  widthHeight?: boolean;
  gap?: boolean;
  textContent?: boolean;
  stroke?: boolean;
  layerOpacity?: boolean;
  // Typography sub-group
  fontWeight?: boolean;
  fontSize?: boolean;
  lineHeight?: boolean;
  letterSpacing?: boolean;
  paragraphSpacing?: boolean;
  paragraphIndent?: boolean;
  effects?: boolean;
}

export interface StringScopes {
  textContent?: boolean;
  fontFamily?: boolean;
  fontWeightOrStyle?: boolean;
}

export interface BooleanScopes {
  // Boolean scopes are empty per requirements
}

export interface TokenScopes {
  color?: ColorScopes;
  number?: NumberScopes;
  string?: StringScopes;
  boolean?: BooleanScopes;
}

// === Code Syntax Types ===

export interface PlatformSyntax {
  web?: string;
  android?: string;
  ios?: string;
}

export interface CodeSyntax {
  web?: PlatformSyntax;
  android?: PlatformSyntax;
  ios?: PlatformSyntax;
}

// === Variable (Token) ===

export interface TokenData {
  id: string;
  name: string;             // full Figma path, e.g. "color/brand/500"
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, TokenValue>; // modeId -> value
  collectionId: string;
  libraryName?: string;
  scopes: string[];
  description?: string;     // Figma Variable description
  hiddenFromPublishing?: boolean; // Figma Variable hiddenFromPublishing
  codeSyntax?: CodeSyntax;  // Custom code syntax per platform
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
