import React, { useState, useEffect } from "react";
import { PanelRightOpen, PanelRightClose, Copy, Check, Folder, Type, SlidersHorizontal, Hash, ToggleLeft } from "lucide-react";
import { ColorVariableIcon } from "./variable-icon";
import type { Variable } from "./variables-data";
import type { TokenScopes, CodeSyntax } from "../../core/types";

/**
 * Maps Figma's flat array of scopes to the hierarchical TokenScopes object used by the UI.
 */
function figmaScopesToTokenScopes(figmaScopes: string[], type: string): TokenScopes {
  const scopes: any = {
    color: {},
    number: {},
    string: {},
    boolean: {}
  };

  const has = (s: string) => figmaScopes.includes(s) || figmaScopes.includes('ALL_SCOPES');

  if (type === 'color') {
    scopes.color.fill = {
      frame: has('FRAME_FILL') || has('ALL_FILLS'),
      shape: has('SHAPE_FILL') || has('ALL_FILLS'),
      text: has('TEXT_FILL') || has('ALL_FILLS'),
    };
    scopes.color.stroke = has('STROKE_COLOR');
    scopes.color.effects = has('EFFECT_COLOR');
  } else if (type === 'number') {
    scopes.number.cornerRadius = has('CORNER_RADIUS');
    scopes.number.widthHeight = has('WIDTH_HEIGHT');
    scopes.number.gap = has('GAP');
    scopes.number.textContent = has('TEXT_CONTENT');
    scopes.number.stroke = has('STROKE_FLOAT');
    scopes.number.layerOpacity = has('OPACITY');
    scopes.number.fontWeight = has('FONT_WEIGHT');
    scopes.number.fontSize = has('FONT_SIZE');
    scopes.number.lineHeight = has('LINE_HEIGHT');
    scopes.number.letterSpacing = has('LETTER_SPACING');
    scopes.number.paragraphSpacing = has('PARAGRAPH_SPACING');
    scopes.number.paragraphIndent = has('PARAGRAPH_INDENT');
    scopes.number.effects = has('EFFECT_FLOAT');
  } else if (type === 'string') {
    scopes.string.textContent = has('TEXT_CONTENT');
    scopes.string.fontFamily = has('FONT_FAMILY');
    scopes.string.fontWeightOrStyle = has('FONT_WEIGHT') || has('FONT_STYLE');
  }

  return scopes;
}

/**
 * Maps the hierarchical TokenScopes object back to Figma's flat array of scopes.
 */
function tokenScopesToFigmaScopes(tokenScopes: TokenScopes, type: string): string[] {
  const figmaScopes: string[] = [];
  const s = tokenScopes as any;

  if (type === 'color' && s.color) {
    if (s.color.fill) {
      if (s.color.fill.frame && s.color.fill.shape && s.color.fill.text) {
        figmaScopes.push('ALL_FILLS');
      } else {
        if (s.color.fill.frame) figmaScopes.push('FRAME_FILL');
        if (s.color.fill.shape) figmaScopes.push('SHAPE_FILL');
        if (s.color.fill.text) figmaScopes.push('TEXT_FILL');
      }
    }
    if (s.color.stroke) figmaScopes.push('STROKE_COLOR');
    if (s.color.effects) figmaScopes.push('EFFECT_COLOR');
  } else if (type === 'number' && s.number) {
    if (s.number.cornerRadius) figmaScopes.push('CORNER_RADIUS');
    if (s.number.widthHeight) figmaScopes.push('WIDTH_HEIGHT');
    if (s.number.gap) figmaScopes.push('GAP');
    if (s.number.textContent) figmaScopes.push('TEXT_CONTENT');
    if (s.number.stroke) figmaScopes.push('STROKE_FLOAT');
    if (s.number.layerOpacity) figmaScopes.push('OPACITY');
    if (s.number.fontWeight) figmaScopes.push('FONT_WEIGHT');
    if (s.number.fontSize) figmaScopes.push('FONT_SIZE');
    if (s.number.lineHeight) figmaScopes.push('LINE_HEIGHT');
    if (s.number.letterSpacing) figmaScopes.push('LETTER_SPACING');
    if (s.number.paragraphSpacing) figmaScopes.push('PARAGRAPH_SPACING');
    if (s.number.paragraphIndent) figmaScopes.push('PARAGRAPH_INDENT');
    if (s.number.effects) figmaScopes.push('EFFECT_FLOAT');
  } else if (type === 'string' && s.string) {
    if (s.string.textContent) figmaScopes.push('TEXT_CONTENT');
    if (s.string.fontFamily) figmaScopes.push('FONT_FAMILY');
    if (s.string.fontWeightOrStyle) {
      figmaScopes.push('FONT_WEIGHT');
      figmaScopes.push('FONT_STYLE');
    }
  }

  return figmaScopes;
}

import { Language, translations } from "../locales";

interface VariableDetailsProps {
  variable: Variable | null;
  variables: Variable[];
  collections: { id?: string; name: string }[];
  groupName: string;
  collapsed: boolean;
  modes: { modeId: string; name: string }[];
  selectedModeId?: string;
  language?: Language;
  onToggleCollapse: () => void;
  onUpdateDescription?: (variableId: string, description: string) => void;
  onUpdateHidden?: (variableId: string, hidden: boolean) => void;
  onUpdateValue?: (variableId: string, modeId: string, value: string) => void;
  onUpdateCodeSyntax?: (variableId: string, codeSyntax: CodeSyntax) => void;
  onUpdateScopes?: (variableIds: string[], scopes: TokenScopes) => void;
  onUpdateName?: (variableId: string, newName: string) => void;
  activeTab?: TabType;
  onActiveTabChange?: (tab: TabType) => void;
}

type TabType = 'path' | 'details' | 'scope';

export function VariableDetails({
  variable,
  variables,
  collections,
  groupName,
  collapsed,
  modes,
  selectedModeId,
  language = 'en',
  onToggleCollapse,
  onUpdateDescription,
  onUpdateHidden,
  onUpdateValue,
  onUpdateCodeSyntax,
  onUpdateScopes,
  onUpdateName,
  activeTab: externalActiveTab,
  onActiveTabChange,
}: VariableDetailsProps) {
  const t = translations[language];
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [nameHovered, setNameHovered] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState<TabType>('details');
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = (tab: TabType) => {
    if (onActiveTabChange) onActiveTabChange(tab);
    else setInternalActiveTab(tab);
  };
  const [localSelectedModeId, setLocalSelectedModeId] = useState<string | null>(null);

  // Editing states
  const [editingDescription, setEditingDescription] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState("");
  const [editingCodeSyntax, setEditingCodeSyntax] = useState<{ platform: string, field: string } | null>(null);
  const [tempCodeSyntax, setTempCodeSyntax] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  // Scopes states for multi-select
  const [scopesState, setScopesState] = useState<Record<string, any>>({});

  // Accordion states
  const [codeSyntaxExpanded, setCodeSyntaxExpanded] = useState(false);

  const effectiveModeId = selectedModeId || localSelectedModeId || (modes.length > 0 ? modes[0].modeId : null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => { });
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  // Get unique types from selected variables
  const selectedTypes = Array.from(new Set(variables.map(v => v.type)));

  // Sync scopesState when variable selection changes
  useEffect(() => {
    const newState: Record<string, any> = {};
    const typesPresent = Array.from(new Set(variables.map(v => v.type)));
    
    typesPresent.forEach(type => {
      // Find the first token of this type to represent the group
      const representative = variables.find(v => v.type === type);
      if (representative && representative.scopes) {
        const fullScopes = figmaScopesToTokenScopes(representative.scopes, type);
        newState[type] = (fullScopes as any)[type];
      }
    });

    setScopesState(newState);
    
    // Force Scope tab on multi-select
    if (variables.length > 1) {
      setActiveTab('scope');
    }
  }, [variables]);

  const handleNameBlur = () => {
    if (editingName && variable && tempName.trim()) {
      onUpdateName?.(variable.id, tempName.trim());
      setEditingName(null);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameBlur();
    } else if (e.key === "Escape") {
      setEditingName(null);
    }
  };

  const handleDescriptionBlur = () => {
    if (editingDescription && variable) {
      onUpdateDescription?.(variable.id, tempDescription);
      setEditingDescription(null);
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleDescriptionBlur();
    } else if (e.key === "Escape") {
      setEditingDescription(null);
    }
  };

  const handleCodeSyntaxBlur = (platform: string, field: string) => {
    if (editingCodeSyntax && variable) {
      const newCodeSyntax = {
        ...variable.codeSyntax,
        [platform]: {
          ...(variable.codeSyntax?.[platform as keyof CodeSyntax] as any),
          [field]: tempCodeSyntax,
        },
      };
      onUpdateCodeSyntax?.(variable.id, newCodeSyntax as CodeSyntax);
      setEditingCodeSyntax(null);
    }
  };

  const handleScopeChange = (type: string, scopeKey: string, value: boolean, subKey?: string) => {
    const newScopes = { ...scopesState };

    if (!newScopes[type]) {
      newScopes[type] = {};
    }

    if (subKey) {
      if (!newScopes[type][scopeKey]) {
        newScopes[type][scopeKey] = {};
      }
      newScopes[type][scopeKey][subKey] = value;
    } else {
      newScopes[type][scopeKey] = value;
    }

    setScopesState(newScopes);

    setTimeout(() => {
      // Find all variables that match the type being edited
      const matchingVariables = variables.filter(v => v.type === type);
      if (matchingVariables.length === 0) return;
      
      const variableIds = matchingVariables.map(v => v.id);
      // Convert the hierarchical state back to Figma's flat array using the correct type
      const figmaScopes = tokenScopesToFigmaScopes(newScopes as TokenScopes, type);
      onUpdateScopes?.(variableIds, figmaScopes as any);
    }, 500);
  };

  const handleSelectAllScopes = (type: string, checked: boolean) => {
    const newScopes = { ...scopesState };
    const primaryType = variables[0]?.type;
    if (!primaryType) return;

    if (type === 'all') {
      ['color', 'number', 'string', 'boolean'].forEach(t => {
        if (t !== primaryType) return; // Only update for current type
        newScopes[t] = {};
        if (t === 'color') {
          newScopes[t].fill = { frame: checked, shape: checked, text: checked };
          newScopes[t].stroke = checked;
          newScopes[t].effects = checked;
        } else if (t === 'number') {
          newScopes[t].cornerRadius = checked;
          newScopes[t].widthHeight = checked;
          newScopes[t].gap = checked;
          newScopes[t].textContent = checked;
          newScopes[t].stroke = checked;
          newScopes[t].layerOpacity = checked;
          newScopes[t].fontWeight = checked;
          newScopes[t].fontSize = checked;
          newScopes[t].lineHeight = checked;
          newScopes[t].letterSpacing = checked;
          newScopes[t].paragraphSpacing = checked;
          newScopes[t].paragraphIndent = checked;
          newScopes[t].effects = checked;
        } else if (t === 'string') {
          newScopes[t].textContent = checked;
          newScopes[t].fontFamily = checked;
          newScopes[t].fontWeightOrStyle = checked;
        }
      });
    } else {
      newScopes[type] = {};
      if (type === 'color') {
        newScopes[type].fill = { frame: checked, shape: checked, text: checked };
        newScopes[type].stroke = checked;
        newScopes[type].effects = checked;
      } else if (type === 'number') {
        newScopes[type].cornerRadius = checked;
        newScopes[type].widthHeight = checked;
        newScopes[type].gap = checked;
        newScopes[type].textContent = checked;
        newScopes[type].stroke = checked;
        newScopes[type].layerOpacity = checked;
        newScopes[type].fontWeight = checked;
        newScopes[type].fontSize = checked;
        newScopes[type].lineHeight = checked;
        newScopes[type].letterSpacing = checked;
        newScopes[type].paragraphSpacing = checked;
        newScopes[type].paragraphIndent = checked;
        newScopes[type].effects = checked;
      } else if (type === 'string') {
        newScopes[type].textContent = checked;
        newScopes[type].fontFamily = checked;
        newScopes[type].fontWeightOrStyle = checked;
      }
    }

    setScopesState(newScopes);

    // Update variables matching the type(s)
    if (type === 'all') {
      // Update each type group separately
      const typesToUpdate = Array.from(new Set(variables.map(v => v.type)));
      typesToUpdate.forEach(t => {
        const ids = variables.filter(v => v.type === t).map(v => v.id);
        const figmaScopes = tokenScopesToFigmaScopes(newScopes as TokenScopes, t);
        onUpdateScopes?.(ids, figmaScopes as any);
      });
    } else {
      const matchingVariables = variables.filter(v => v.type === type);
      if (matchingVariables.length > 0) {
        const ids = matchingVariables.map(v => v.id);
        const figmaScopes = tokenScopesToFigmaScopes(newScopes as TokenScopes, type);
        onUpdateScopes?.(ids, figmaScopes as any);
      }
    }
  };

  if (collapsed) {
    return (
      <div
        className="flex flex-col h-full border-l border-[#e5e5e5] bg-white shrink-0"
        style={{ width: 40 }}
      >
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

        {variable && (
          <div className="flex items-center justify-center pt-2">
            <button
              onClick={() => handleCopy(variable.path, "name")}
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

  const firstModeId = variable ? (Object.keys(variable.valuesByMode).length > 0 ? Object.keys(variable.valuesByMode)[0] : null) : null;
  const firstModeData = (variable && firstModeId) ? variable.valuesByMode[firstModeId] : null;

  const renderScopeSection = (type: string, label: string, icon: React.ReactNode) => {
    const typeScopes = scopesState[type] || {};
    const isAllChecked = (() => {
      const vals = Object.values(typeScopes);
      if (vals.length === 0) return false;
      return vals.every(v => {
        if (typeof v === 'object' && v !== null) {
          return Object.values(v).every(sv => sv === true);
        }
        return v === true;
      });
    })();

    return (
      <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-[#fafafa] border-b border-[#e5e5e5]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#333]">{label}</span>
          </div>
          <input
            type="checkbox"
            checked={isAllChecked}
            onChange={(e) => handleSelectAllScopes(type, e.target.checked)}
            className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff]"
          />
        </div>
        <div className="p-3 flex flex-col gap-2">
          {type === 'color' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#666] ml-2">Fill</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[11px] text-[#333]">
                    <input
                      type="checkbox"
                      checked={!!typeScopes.fill?.frame}
                      onChange={(e) => handleScopeChange(type, 'fill', e.target.checked, 'frame')}
                      className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff]"
                    />
                    Frame
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-[#333]">
                    <input
                      type="checkbox"
                      checked={!!typeScopes.fill?.shape}
                      onChange={(e) => handleScopeChange(type, 'fill', e.target.checked, 'shape')}
                      className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff]"
                    />
                    Shape
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-[#333]">
                    <input
                      type="checkbox"
                      checked={!!typeScopes.fill?.text}
                      onChange={(e) => handleScopeChange(type, 'fill', e.target.checked, 'text')}
                      className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff]"
                    />
                    Text
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#666] ml-2">Stroke</span>
                <input
                  type="checkbox"
                  checked={!!typeScopes.stroke}
                  onChange={(e) => handleScopeChange(type, 'stroke', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff]"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#666] ml-2">Effects</span>
                <input
                  type="checkbox"
                  checked={!!typeScopes.effects}
                  onChange={(e) => handleScopeChange(type, 'effects', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff]"
                />
              </div>
            </>
          )}

          {type === 'number' && (
            <>
              <div className="border-b border-[#f0f0f0] pb-2 mb-2">
                <span className="text-[10px] font-semibold text-[#999] uppercase tracking-wider">Number Scopes</span>
              </div>
              {[
                { key: 'cornerRadius', label: 'Corner Radius' },
                { key: 'widthHeight', label: 'Width and Height' },
                { key: 'gap', label: 'Gap (Auto Layout)' },
                { key: 'textContent', label: 'Text Content' },
                { key: 'stroke', label: 'Stroke' },
                { key: 'layerOpacity', label: 'Layer Opacity' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-[11px] text-[#666] ml-2">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={!!typeScopes[item.key]}
                    onChange={(e) => handleScopeChange(type, item.key, e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff]"
                  />
                </div>
              ))}

              <div className="border-b border-[#f0f0f0] pb-2 mb-2 mt-3">
                <span className="text-[10px] font-semibold text-[#999] uppercase tracking-wider">Typography</span>
              </div>
              {[
                { key: 'fontWeight', label: 'Font Weight' },
                { key: 'fontSize', label: 'Font Size' },
                { key: 'lineHeight', label: 'Line Height' },
                { key: 'letterSpacing', label: 'Letter Spacing' },
                { key: 'paragraphSpacing', label: 'Paragraph Spacing' },
                { key: 'paragraphIndent', label: 'Paragraph Indent' },
                { key: 'effects', label: 'Effects' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-[11px] text-[#666] ml-2">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={!!typeScopes[item.key]}
                    onChange={(e) => handleScopeChange(type, item.key, e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff]"
                  />
                </div>
              ))}
            </>
          )}

          {type === 'string' && (
            <>
              {[
                { key: 'textContent', label: 'Text Content' },
                { key: 'fontFamily', label: 'Font Family' },
                { key: 'fontWeightOrStyle', label: 'Font Weight or Style' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-[11px] text-[#666] ml-2">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={!!typeScopes[item.key]}
                    onChange={(e) => handleScopeChange(type, item.key, e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff]"
                  />
                </div>
              ))}
            </>
          )}

          {type === 'boolean' && (
            <div className="py-4 text-center text-[11px] text-[#999]">
              No scopes available for Boolean tokens
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-full border-l border-[#e5e5e5] bg-white flex flex-col shrink-0"
      style={{ width: 280 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 border-b border-[#e5e5e5] shrink-0"
        style={{ height: 36 }}
      >
        <span className="text-[11px] text-[#999]">{t.details.title}</span>
        <button
          onClick={onToggleCollapse}
          className="text-[#999] hover:text-[#333] cursor-pointer p-1"
          title={t.sidebar.collapse}
        >
          <PanelRightClose size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[#e5e5e5] shrink-0" style={{ height: 28 }}>
        {variables.length <= 1 && (
          <>
            <button
              onClick={() => setActiveTab('path')}
              className={`flex items-center justify-center gap-1.5 px-1 h-full text-[11px] transition-colors flex-1 ${activeTab === 'path'
                ? "text-[#0d99ff] border-b-2 border-[#0d99ff] font-medium"
                : "text-[#666] hover:text-[#333]"
                }`}
            >
              <Folder size={12} />
              {t.details.path}
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center justify-center gap-1.5 px-1 h-full text-[11px] transition-colors flex-1 ${activeTab === 'details'
                ? "text-[#0d99ff] border-b-2 border-[#0d99ff] font-medium"
                : "text-[#666] hover:text-[#333]"
                }`}
            >
              <Type size={12} />
              {t.details.details}
            </button>
          </>
        )}
        <button
          onClick={() => setActiveTab('scope')}
          className={`flex items-center justify-center gap-1.5 px-1 h-full text-[11px] transition-colors flex-1 ${activeTab === 'scope'
            ? "text-[#0d99ff] border-b-2 border-[#0d99ff] font-medium"
            : "text-[#666] hover:text-[#333]"
            }`}
        >
          <SlidersHorizontal size={12} />
          {t.details.scopes}
        </button>
      </div>

      {/* Content */}
      {(variable || variables.length > 1) ? (
        <div className="flex-1 overflow-y-auto">
          {/* PATH TAB */}
          {activeTab === 'path' && variable && (
            <div className="p-4 flex flex-col gap-3">
              {/* Full Path at top with copy button */}
              <div
                className="flex items-center gap-2 p-2 rounded hover:bg-[#f5f5f5]"
                onMouseEnter={() => setNameHovered(true)}
                onMouseLeave={() => setNameHovered(false)}
              >
                <span
                  className="text-[11px] text-[#333] flex-1 truncate"
                  style={{ direction: 'rtl', textAlign: 'left' }}
                  title={variable.path}
                >
                  <bdo dir="ltr">{variable.path}</bdo>
                </span>
                <button
                  onClick={() => handleCopy(variable.path, "path")}
                  className={`p-1 transition-opacity shrink-0 ${nameHovered ? 'opacity-100' : 'opacity-0'} ${copiedField === "path" ? "text-[#16a34a]" : "text-[#999] hover:text-[#333]"
                    }`}
                  title="Copy path"
                >
                  {copiedField === "path" ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

              {/* Mode Selector */}
              {modes.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#999] shrink-0">{t.table.mode}:</span>
                  <select
                    value={effectiveModeId || ''}
                    onChange={(e) => setLocalSelectedModeId(e.target.value)}
                    className="flex-1 text-[11px] text-[#333] bg-white border border-[#e5e5e5] rounded px-2 py-1.5 outline-none focus:border-[#0d99ff]"
                  >
                    {modes.map(mode => (
                      <option key={mode.modeId} value={mode.modeId}>{mode.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Collection */}
              {variable.collectionId && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#999] shrink-0">{t.sidebar.collections}:</span>
                  <span className="text-[11px] text-[#0d99ff] truncate">
                    {collections.find(c => c.id === variable.collectionId)?.name || variable.collectionId}
                  </span>
                </div>
              )}

              {/* Alias Chain / Value Resolution */}
              <div className="border-t border-[#e5e5e5] pt-3 mt-1">
                <span className="text-[11px] text-[#999] block mb-2">{t.import.executionPlan}</span>
                {(() => {
                  const modeData = effectiveModeId ? variable.valuesByMode[effectiveModeId] : null;
                  if (!modeData) return null;

                  return (
                    <div className="flex flex-col gap-0.5">
                      {/* Current token (the one we're viewing) */}
                      <div className="text-[11px] text-[#333] py-1 truncate" title={variable.path}>
                        {variable.path}
                      </div>

                      {/* Show arrow and next token if there's an alias chain OR if this is a direct value */}
                      {modeData.aliasChain && modeData.aliasChain.length > 0 ? (
                        <>
                          {modeData.aliasChain.map((step, idx) => {
                            const isLast = idx === (modeData.aliasChain?.length || 0) - 1;
                            const isColor = step.startsWith('rgb(') || step.startsWith('#') || step.startsWith('hsba');

                            return (
                              <React.Fragment key={idx}>
                                {/* Arrow before each step */}
                                <div className="flex items-center py-0.5">
                                  <svg width="10" height="10" viewBox="0 0 12 12" className="text-[#999]">
                                    <path d="M6 2V10M6 10L3 7M6 10L9 7" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                                {/* Next token in chain or final value */}
                                <div className="text-[11px] text-[#333] py-1 truncate" title={step}>
                                  {isColor ? (
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded border border-[#e5e5e5] shrink-0"
                                        style={{ backgroundColor: step }}
                                      />
                                      <span className={isLast ? 'font-bold' : ''}>{step}</span>
                                    </div>
                                  ) : (
                                    <span className={isLast ? 'font-bold' : ''}>{step}</span>
                                  )}
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </>
                      ) : (
                        /* No alias chain - show direct value */
                        modeData.value && (
                          <>
                            <div className="flex items-center py-0.5">
                              <svg width="10" height="10" viewBox="0 0 12 12" className="text-[#999]">
                                <path d="M6 2V10M6 10L3 7M6 10L9 7" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="text-[11px] text-[#333] py-1 font-bold">
                              {modeData.colorSwatch ? (
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded border border-[#e5e5e5] shrink-0"
                                    style={{ backgroundColor: modeData.colorSwatch }}
                                  />
                                  {modeData.value}
                                </div>
                              ) : modeData.value}
                            </div>
                          </>
                        )
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* DETAILS TAB */}
          {activeTab === 'details' && variable && (
            <div className="p-3 flex flex-col gap-3">
              {/* Name - Full Path */}
              <div className="flex items-start gap-2">
                <span className="text-[11px] text-[#999] shrink-0 w-16">
                  {t.table.name}
                </span>
                <div className="flex-1 min-w-0">
                  {editingName === variable.id ? (
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={handleNameBlur}
                      onKeyDown={handleNameKeyDown}
                      autoFocus
                      className="w-full text-[11px] text-[#333] bg-white border border-[#0d99ff] outline-none px-2 py-1 rounded"
                    />
                  ) : (
                    <div
                      onClick={() => {
                        setEditingName(variable.id);
                        setTempName(variable.path);
                      }}
                      className="text-[11px] text-[#333] px-2 py-1 rounded hover:bg-[#f5f5f5] cursor-text truncate"
                      title={variable.path}
                      style={{ direction: 'rtl', textAlign: 'left' }}
                    >
                      <bdo dir="ltr">{variable.path || <span className="text-[#ccc]">No path</span>}</bdo>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="flex items-start gap-2">
                <span className="text-[11px] text-[#999] shrink-0 w-16">
                  {t.details.description}
                </span>
                <div className="flex-1 min-w-0">
                  {editingDescription === variable.id ? (
                    <input
                      type="text"
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      onBlur={handleDescriptionBlur}
                      onKeyDown={handleDescriptionKeyDown}
                      autoFocus
                      className="w-full text-[11px] text-[#333] bg-white border border-[#0d99ff] outline-none px-2 py-1 rounded"
                    />
                  ) : (
                    <div
                      onClick={() => {
                        setEditingDescription(variable.id);
                        setTempDescription(variable.description || "");
                      }}
                      className="text-[11px] text-[#333] px-2 py-1 rounded hover:bg-[#f5f5f5] cursor-text truncate"
                      title={variable.description}
                    >
                      {variable.description || <span className="text-[#ccc]">{t.details.addDescription}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Values by Mode */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] text-[#999]">{t.table.mode + 's'}</span>
                {modes.map((mode) => {
                  const modeData = variable.valuesByMode[mode.modeId];

                  return (
                    <div key={mode.modeId} className="flex items-center gap-2">
                      <span className="text-[11px] text-[#999] shrink-0 w-16 truncate" title={mode.name}>
                        {mode.name}
                      </span>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        {modeData?.colorSwatch && (
                          <ColorVariableIcon color={modeData.colorSwatch} />
                        )}
                        <input
                          type="text"
                          value={modeData?.value || ""}
                          onChange={(e) => {
                            onUpdateValue?.(variable.id, mode.modeId, e.target.value);
                          }}
                          className="flex-1 text-[11px] text-[#333] bg-white border border-[#e5e5e5] outline-none px-2 py-1 rounded focus:border-[#0d99ff] truncate"
                          style={{ direction: 'rtl', textAlign: 'left' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Code Syntax - Accordion */}
              <div className="border-t border-[#e5e5e5] pt-3">
                <button
                  onClick={() => setCodeSyntaxExpanded(!codeSyntaxExpanded)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="text-[11px] text-[#999]">Code Syntax</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    className={`text-[#999] transition-transform ${codeSyntaxExpanded ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 8L2 4H10L6 8Z" fill="currentColor" />
                  </svg>
                </button>

                {codeSyntaxExpanded && (
                  <div className="mt-2 flex flex-col gap-2">
                    {['web', 'android', 'ios'].map((platform) => (
                      <div key={platform} className="border border-[#e5e5e5] rounded-lg p-2">
                        <span className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2 block">
                          {platform}
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {['web', 'android', 'ios'].map((field) => {
                            const isEditing = editingCodeSyntax?.platform === platform && editingCodeSyntax?.field === field;
                            const currentValue = (variable.codeSyntax?.[platform as keyof CodeSyntax] as any)?.[field] || '';

                            return (
                              <div key={field} className="flex items-center gap-2">
                                <span className="text-[11px] text-[#666] w-14 capitalize shrink-0">{field}:</span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={tempCodeSyntax}
                                    onChange={(e) => setTempCodeSyntax(e.target.value)}
                                    onBlur={() => handleCodeSyntaxBlur(platform, field)}
                                    autoFocus
                                    className="flex-1 text-[11px] text-[#333] bg-white border border-[#0d99ff] outline-none px-2 py-1 rounded min-w-0"
                                  />
                                ) : (
                                  <div
                                    onClick={() => {
                                      setEditingCodeSyntax({ platform, field });
                                      setTempCodeSyntax(currentValue);
                                    }}
                                    className="flex-1 text-[11px] text-[#333] px-2 py-1 rounded hover:bg-[#f5f5f5] cursor-text truncate min-w-0"
                                    title={currentValue || ''}
                                  >
                                    {currentValue || <span className="text-[#ccc]">Add...</span>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hide from Publishing */}
              <div className="border-t border-[#e5e5e5] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#333]">{t.details.hideFromPublishing}</span>
                  <input
                    type="checkbox"
                    checked={!!variable.hiddenFromPublishing}
                    onChange={(e) => {
                      onUpdateHidden?.(variable.id, e.target.checked);
                    }}
                    className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff] shrink-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SCOPE TAB */}
          {activeTab === 'scope' && (
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#333]">
                  {variables.length > 1
                    ? `Selected: ${variables.length} token(s)`
                    : t.details.scopes}
                </span>
                <button
                  onClick={() => handleSelectAllScopes('all', true)}
                  className="text-[10px] text-[#0d99ff] hover:underline"
                >
                  Select all
                </button>
              </div>

              {selectedTypes.includes('color') && renderScopeSection('color', 'Color', null)}
              {selectedTypes.includes('number') && renderScopeSection('number', 'Number', null)}
              {selectedTypes.includes('string') && renderScopeSection('string', 'String', null)}
              {selectedTypes.includes('boolean') && renderScopeSection('boolean', 'Boolean', null)}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-6 text-[11px] text-[#999] flex-1">
            {t.details.noVariableSelected}
          </div>
          <div
            className="flex items-center px-3 border-t border-[#e5e5e5] shrink-0"
            style={{ height: 44 }}
          />
        </div>
      )}

      {/* Bottom action buttons - full width for Path tab */}
      {variable && activeTab === 'path' && (
        <div
          className="flex items-center gap-2 px-3 border-t border-[#e5e5e5] shrink-0"
          style={{ height: 44 }}
        >
          <button
            onClick={() => {
              const modeData = effectiveModeId ? variable.valuesByMode[effectiveModeId] : null;
              if (modeData?.colorSwatch) {
                const match = modeData.colorSwatch.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (match) {
                  const rgba = `rgba(${match[1]}, ${match[2]}, ${match[3]}, 1)`;
                  handleCopy(rgba, "hard");
                } else {
                  handleCopy(modeData.colorSwatch, "hard");
                }
              } else if (modeData?.resolvedValue) {
                handleCopy(modeData.resolvedValue, "hard");
              } else {
                handleCopy(modeData?.value || "", "hard");
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1 text-[11px] px-2 py-1 rounded transition-colors ${copiedField === "hard"
              ? "bg-[#16a34a]/10 text-[#16a34a]"
              : "bg-[#f5f5f5] text-[#666] hover:bg-[#e5e5e5]"
              }`}
          >
            {copiedField === "hard" ? <Check size={12} /> : <Copy size={12} />}
            {t.details.copyHard}
          </button>
          <button
            onClick={() => {
              const cssVar = `--${variable.path.replace(/\//g, '-')}`;
              handleCopy(cssVar, "token");
            }}
            className={`flex-1 flex items-center justify-center gap-1 text-[11px] px-2 py-1 rounded transition-colors ${copiedField === "token"
              ? "bg-[#16a34a]/10 text-[#16a34a]"
              : "bg-[#f5f5f5] text-[#666] hover:bg-[#e5e5e5]"
              }`}
          >
            {copiedField === "token" ? <Check size={12} /> : <Copy size={12} />}
            {t.details.copyToken}
          </button>
        </div>
      )}
    </div>
  );
}
