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

// === Export Settings & Results ===

export type ExportPlatform = 'web' | 'ios' | 'android' | 'flutter' | 'style-dictionary' | 'dtcg' | 'json';
export type ExportFormat = 'css' | 'scss' | 'less' | 'sass' | 'json' | 'swift' | 'xml' | 'dart' | 'tailwind';
export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl';
export type UnitSystem = 'px' | 'rem';
export type AliasStrategy = 'reference' | 'resolve';
export type ModeStrategy = 'selectors' | 'separate-files' | 'root-comments' | 'nested';

export interface ExportSettings {
  platform: ExportPlatform;
  format: ExportFormat;
  colorFormat: ColorFormat;
  unitSystem: UnitSystem;
  baseFontSize: number;
  aliasStrategy: AliasStrategy;
  modeStrategy: ModeStrategy;
  groupDivider: string;
  includeIds: boolean;
  includeScopes: boolean;
  selectedCollectionIds: string[];
  selectedModeIds: Record<string, string[]>; // collectionId -> array of modeIds
  selectorTemplate?: string; // e.g. ".{modeName}" or "[data-theme='{modeName}']"
}

export interface ExportFile {
  name: string;
  content: string;
  type: 'text' | 'json' | 'binary';
}

export interface ExportResult {
  files: ExportFile[];
}

// === Import Settings & Results ===

export interface ImportToken {
  name: string;
  value: string;
  type?: string;
  collection?: string;
  mode?: string;
  isAlias?: boolean;
}

export interface ImportSettings {
  strategy: 'auto' | 'manual';
  importMode: 'create' | 'update';
  format: 'css' | 'json' | 'scss';
  targetCollectionId?: string; // used if strategy is manual
  targetModeId?: string;       // used if strategy is manual
  groupDivider: string;
  baseFontSize: number;
}

export interface ImportChanges {
  renames?: Record<string, string>;
  deletions?: string[];
}

export interface ImportPayload {
  tokens: ImportToken[];
  scopes?: Record<string, any>;
  changes?: ImportChanges;
  settings: ImportSettings;
}

export interface ImportLog {
  added: string[];
  updated: string[];
  deleted: string[];
  renames: Record<string, string>;
  errors: string[];
}

// === Plugin Config for persistent storage ===

export interface PluginConfig {
  // Порядок коллекций (массив ID)
  collectionOrder: string[];

  // Порядок групп внутри каждой коллекции (collectionId -> group paths)
  groupOrder: Record<string, string[]>;

  // Порядок токенов внутри каждой группы (groupPath -> token IDs)
  tokenOrder: Record<string, string[]>;
}
