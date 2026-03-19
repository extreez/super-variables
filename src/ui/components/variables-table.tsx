import React, { useState } from "react";
import { Search, Minimize2, Settings, Plus, History, SlidersHorizontal, Target, Link, Palette, Hash, Type, ToggleLeft, Code, Sparkles, Grid, GitBranch, X, Copy, Trash2, ArrowLeft, ArrowRight, Download, Upload, Star, Hexagon } from "lucide-react";
import { VariableIcon, ColorVariableIcon } from "./variable-icon";
import type { Variable } from "./variables-data";
import { useRef, useEffect } from "react";
import { TokenPicker } from "./token-picker";
import { ColorPicker } from "./color-picker";
import { CreateColorStyleModal } from "./create-color-style-modal";
import { CreateTypographyStyleModal, TypographyConfig } from "./create-typography-style-modal";
import { CreateEffectStyleModal, EffectConfig } from "./create-effect-style-modal";
import type { PluginConfig } from "../../core/types";
import { DraggableRow } from "./draggable-row";
import { DroppableGroupHeader } from "./droppable-group-header";
import { Language, translations } from "../locales";

import { Switch } from "./ui/switch";

interface VariablesTableProps {
  variables: Variable[];
  allVariables: Variable[];
  modes: Mode[];
  selectedId: string | null;
  selectedIds: string[];
  collections: { id: string, name: string, libraryName?: string }[];
  pluginConfig?: PluginConfig;
  language?: Language;
  onSelect: (id: string, multi?: { shift: boolean, ctrl: boolean }) => void;
  onGitSyncClick?: () => void;
  onMinimizeClick?: () => void;
  onShowSettings?: () => void;
  onNavigateToTarget?: (targetId: string, fromId: string) => void;
  navigationReturn?: { id: string, name: string } | null;
  onClearNavigationReturn?: () => void;
  onRenameMode?: (modeId: string, newName: string) => void;
  onCreateMode?: () => void;
  onUpdateVariable?: (variableId: string, modeId: string, newValue: string) => void;
  onDuplicateMode?: (modeId: string) => void;
  onDeleteMode?: (modeId: string) => void;
  onReorderModes?: (modeIds: string[]) => void;
  onDuplicateVariables?: (ids: string[]) => void;
  onDeleteVariables?: (ids: string[]) => void;
  onNewGroupWithSelection?: (ids: string[], groupName: string) => void;
  onMoveVariableToVariable?: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
  onMoveVariableToGroup?: (draggedId: string, groupPath: string) => void;
  onEditVariable?: () => void;
  onImportClick?: () => void;
  onExportClick?: () => void;
  onCreateVariable?: (type: "color" | "number" | "string" | "boolean") => void;
}

import { Mode } from "./variables-data";

export function VariablesTable({
  variables,
  allVariables,
  modes,
  selectedId,
  selectedIds,
  collections,
  pluginConfig,
  language = 'en',
  onSelect,
  onGitSyncClick,
  onMinimizeClick,
  onShowSettings,
  onNavigateToTarget,
  navigationReturn,
  onClearNavigationReturn,
  onRenameMode,
  onCreateMode,
  onUpdateVariable,
  onDuplicateMode,
  onDeleteMode,
  onReorderModes,
  onDuplicateVariables,
  onDeleteVariables,
  onNewGroupWithSelection,
  onMoveVariableToVariable,
  onMoveVariableToGroup,
  onEditVariable,
  onImportClick,
  onExportClick,
  onCreateVariable,
}: VariablesTableProps) {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState("");
  const [editingModeId, setEditingModeId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ variableId: string, modeId: string } | null>(null);
  const [tempModeName, setTempModeName] = useState("");
  const [editingTokenNameId, setEditingTokenNameId] = useState<string | null>(null);
  const [tempTokenName, setTempTokenName] = useState("");
  const [tempCellValue, setTempCellValue] = useState("");
  const [showAddTokenMenu, setShowAddTokenMenu] = useState(false);
  const [showCreateStyleMenu, setShowCreateStyleMenu] = useState(false);
  const [showCreateColorStyleModal, setShowCreateColorStyleModal] = useState(false);
  const [showCreateTypographyStyleModal, setShowCreateTypographyStyleModal] = useState(false);
  const [showCreateEffectStyleModal, setShowCreateEffectStyleModal] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeTypeFilters, setActiveTypeFilters] = useState<string[]>(["color", "number", "string", "boolean", "function"]);

  const toggleFilter = (type: string) => {
    setActiveTypeFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    mode: Mode;
  } | null>(null);

  const [tokenContextMenu, setTokenContextMenu] = useState<{
    x: number;
    y: number;
    variableIds: string[];
  } | null>(null);

  const [copiedIds, setCopiedIds] = useState<string[]>([]);

  // Token/Color Picker state
  const [tokenPickerAnchor, setTokenPickerAnchor] = useState<HTMLElement | null>(null);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<HTMLElement | null>(null);
  const [pickerContext, setPickerContext] = useState<{
    variableId: string;
    modeId: string;
    tokenType: "color" | "number" | "string" | "boolean";
    currentAliasId?: string | null;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedId && itemRefs.current[selectedId]) {
      itemRefs.current[selectedId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId]);

  // Column widths state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({ name: 220 });
  const resizingColumn = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  // Initialize mode widths
  useEffect(() => {
    setColumnWidths(prev => {
      const next = { ...prev };
      modes.forEach(m => {
        if (!next[m.modeId]) next[m.modeId] = 220;
      });
      return next;
    });
  }, [modes]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumn.current) return;
      const diff = e.clientX - resizingColumn.current.startX;
      const newWidth = Math.max(100, resizingColumn.current.startWidth + diff);

      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn.current!.key]: newWidth
      }));
    };

    const handleMouseUp = () => {
      resizingColumn.current = null;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startColumnResize = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    resizingColumn.current = {
      key,
      startX: e.clientX,
      startWidth: columnWidths[key] || 220
    };
    document.body.style.cursor = 'col-resize';
  };

  const autoFitColumn = (key: string) => {
    // Calculate optimal width based on content
    const padding = 24; // px padding for content
    const minNameWidth = 120;
    const minModeWidth = 100;

    if (key === 'name') {
      // Find longest variable name
      const maxNameWidth = variables.reduce((max, v) => {
        const textWidth = v.name.length * 7; // Approximate character width
        return Math.max(max, textWidth);
      }, 0);
      setColumnWidths(prev => ({
        ...prev,
        [key]: Math.max(minNameWidth, Math.min(maxNameWidth + padding, 400))
      }));
    } else {
      // For mode columns, find longest value
      const mode = modes.find(m => m.modeId === key);
      if (!mode) return;

      const maxValueWidth = variables.reduce((max, v) => {
        const data = v.valuesByMode[key];
        const textWidth = (data?.value?.length || 0) * 7;
        return Math.max(max, textWidth);
      }, 0);

      // Also consider mode name width
      const modeNameWidth = mode.name.length * 7 + padding;

      setColumnWidths(prev => ({
        ...prev,
        [key]: Math.max(minModeWidth, Math.min(Math.max(maxValueWidth + padding, modeNameWidth), 400))
      }));
    }
  };

  const handleColumnResizerDoubleClick = (key: string) => {
    autoFitColumn(key);
  };

  const handleModeHeaderClick = (mode: Mode) => {
    setEditingModeId(mode.modeId);
    setTempModeName(mode.name);
  };

  const handleModeHeaderBlur = () => {
    if (editingModeId && tempModeName.trim() && onRenameMode) {
      onRenameMode(editingModeId, tempModeName.trim());
    }
    setEditingModeId(null);
  };

  const handleModeHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleModeHeaderBlur();
    } else if (e.key === "Escape") {
      setEditingModeId(null);
    }
  };

  const handleTokenNameBlur = (variableId: string) => {
    if (editingTokenNameId && tempTokenName.trim()) {
      // Send message to Figma
      parent.postMessage({
        pluginMessage: {
          type: 'update-variable-name',
          variableId,
          newName: tempTokenName.trim()
        }
      }, '*');
    }
    setEditingTokenNameId(null);
  };

  const handleTokenNameKeyDown = (e: React.KeyboardEvent, variableId: string) => {
    if (e.key === "Enter") {
      handleTokenNameBlur(variableId);
    } else if (e.key === "Escape") {
      setEditingTokenNameId(null);
    }
  };

  const handleCellClick = (variable: Variable, modeId: string, event: React.MouseEvent) => {
    const data = variable.valuesByMode[modeId];
    if (!data) return;

    // If it's an alias, open token picker
    if (data.isAlias || data.aliasTargetId) {
      setPickerContext({
        variableId: variable.id,
        modeId,
        tokenType: variable.type,
        currentAliasId: data.aliasTargetId || null,
      });
      if (variable.type === "color") {
        setColorPickerAnchor(event.currentTarget as HTMLElement);
      } else {
        setTokenPickerAnchor(event.currentTarget as HTMLElement);
      }
    } else {
      // Otherwise edit cell
      setEditingCell({ variableId: variable.id, modeId });
      setTempCellValue(data.value);
    }
  };

  const handleOpenTokenPicker = (variable: Variable, modeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setPickerContext({
      variableId: variable.id,
      modeId,
      tokenType: variable.type,
      currentAliasId: null,
    });
    if (variable.type === "color") {
      setColorPickerAnchor(event.currentTarget as HTMLElement);
    } else {
      setTokenPickerAnchor(event.currentTarget as HTMLElement);
    }
  };

  const handleTokenSelect = (tokenId: string, tokenName: string) => {
    if (!pickerContext) return;
    // Send message to Figma to set alias
    parent.postMessage({
      pluginMessage: {
        type: 'set-variable-alias',
        variableId: pickerContext.variableId,
        modeId: pickerContext.modeId,
        targetTokenId: tokenId,
        targetTokenName: tokenName,
      }
    }, '*');
  };

  const handleUnlinkToken = () => {
    if (!pickerContext) return;
    // Send message to Figma to remove alias
    parent.postMessage({
      pluginMessage: {
        type: 'remove-variable-alias',
        variableId: pickerContext.variableId,
        modeId: pickerContext.modeId,
      }
    }, '*');
  };

  const handleColorSelect = (color: { r: number; g: number; b: number; a: number }) => {
    if (!pickerContext || !onUpdateVariable) return;
    onUpdateVariable(pickerContext.variableId, pickerContext.modeId, `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`);
  };

  const handleCellBlur = () => {
    if (editingCell && onUpdateVariable) {
      onUpdateVariable(editingCell.variableId, editingCell.modeId, tempCellValue);
    }
    setEditingCell(null);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellBlur();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const handleModeContextMenu = (e: React.MouseEvent, mode: Mode) => {
    e.preventDefault();
    setTokenContextMenu(null);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      mode
    });
  };

  const handleTokenContextMenu = (e: React.MouseEvent, variableId: string) => {
    e.preventDefault();
    setContextMenu(null);

    let ids = [...selectedIds];
    if (!ids.includes(variableId)) {
      onSelect(variableId);
      ids = [variableId];
    }

    setTokenContextMenu({
      x: e.clientX,
      y: e.clientY,
      variableIds: ids
    });
  };

  const handleMoveMode = (direction: 'left' | 'right') => {
    if (!contextMenu || !onReorderModes) return;
    const modeIds = modes.map(m => m.modeId);
    const index = modeIds.indexOf(contextMenu.mode.modeId);
    if (direction === 'left' && index > 0) {
      [modeIds[index - 1], modeIds[index]] = [modeIds[index], modeIds[index - 1]];
    } else if (direction === 'right' && index < modeIds.length - 1) {
      [modeIds[index], modeIds[index + 1]] = [modeIds[index + 1], modeIds[index]];
    }
    onReorderModes(modeIds);
    setContextMenu(null);
  };

  const handleSetDefaultMode = () => {
    if (!contextMenu || !onReorderModes) return;
    const modeIds = modes.map(m => m.modeId);
    const index = modeIds.indexOf(contextMenu.mode.modeId);
    const newItems = [modeIds[index], ...modeIds.filter((_, i) => i !== index)];
    onReorderModes(newItems);
    setContextMenu(null);
  };

  const handleAddToken = (type: "color" | "number" | "string" | "boolean" | "function") => {
    if (type !== "function" && onCreateVariable) {
      onCreateVariable(type);
    }
    setShowAddTokenMenu(false);
  };

  const handleCreateStyle = (type: "color" | "typography" | "effect" | "grid") => {
    console.log("Creating style of type:", type);
    setShowCreateStyleMenu(false);
    if (type === "color") {
      setShowCreateColorStyleModal(true);
    } else if (type === "typography") {
      setShowCreateTypographyStyleModal(true);
    } else if (type === "effect") {
      setShowCreateEffectStyleModal(true);
    }
  };

  const filtered = variables.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeTypeFilters.includes(v.type);
    return matchesSearch && matchesFilter;
  });

  const handleSelectAllFilters = () => {
    setActiveTypeFilters(["color", "number", "string", "boolean", "function"]);
  };

  const handleCreateGroup = () => {
    if (!tokenContextMenu) return;
    const name = prompt("Enter group name:", "New Group");
    if (name && onNewGroupWithSelection) {
      onNewGroupWithSelection(tokenContextMenu.variableIds, name);
    }
    setTokenContextMenu(null);
  };

  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-3 border-b border-[#e5e5e5] bg-white shrink-0"
        style={{ height: 36 }}
      >
        {/* Search */}
        <div className="flex items-center gap-1.5 bg-[#f5f5f5] rounded px-2 py-[5px] flex-1 max-w-[280px] relative">
          <Search size={12} className="text-[#999] shrink-0" />
          <input
            type="text"
            placeholder={t.topbar.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[11px] text-[#333] placeholder-[#bbb] outline-none w-full border-none p-0 m-0"
          />
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`p-1 rounded hover:bg-white/50 transition-colors ${activeTypeFilters.length < 5 ? "text-[#0d99ff]" : "text-[#999]"}`}
            title="Filter by type"
          >
            <SlidersHorizontal size={12} />
          </button>

          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute top-[calc(100%+4px)] right-0 bg-white border border-[#e5e5e5] rounded-lg shadow-xl py-1 z-50 min-w-[140px] animate-in fade-in zoom-in duration-150">
                <div className="px-3 py-2 border-b border-[#f5f5f5]">
                  <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider">Token Classes</span>
                </div>
                {[
                  { id: 'color', label: 'Colors', icon: <Palette size={12} /> },
                  { id: 'number', label: 'Numbers', icon: <Hash size={12} /> },
                  { id: 'string', label: 'Strings', icon: <Type size={12} /> },
                  { id: 'boolean', label: 'Booleans', icon: <ToggleLeft size={12} /> },
                  { id: 'function', label: 'Functions', icon: <Sparkles size={12} /> },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => toggleFilter(f.id)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#f5f5f5] text-[11px] text-[#333] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#999]">{f.icon}</span>
                      <span>{f.label}</span>
                    </div>
                    {activeTypeFilters.includes(f.id) && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0d99ff]" />
                    )}
                  </button>
                ))}
                <div className="px-1 py-1 mt-1 border-t border-[#f5f5f5]">
                  <button
                    onClick={() => setActiveTypeFilters(["color", "number", "string", "boolean", "function"])}
                    className="w-full text-center py-1 text-[10px] text-[#0d99ff] hover:underline"
                  >
                    Reset all
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Collapse / minimize icon */}
        <div className="flex items-center gap-0.5">
          {onGitSyncClick && (
            <button
              onClick={onGitSyncClick}
              className="text-[#999] hover:text-[#333] p-1 cursor-pointer"
              title={t.topbar.git}
            >
              <GitBranch size={14} />
            </button>
          )}
          <button className="text-[#999] hover:text-[#333] p-1 cursor-pointer" title={t.topbar.history}>
            <History size={14} />
          </button>
          <button onClick={onShowSettings} className="text-[#999] hover:text-[#333] p-1 cursor-pointer" title={t.topbar.settings}>
            <Settings size={14} />
          </button>
          <button onClick={onMinimizeClick} className="text-[#999] hover:text-[#333] p-1 cursor-pointer" title={t.topbar.minimize}>
            <Minimize2 size={14} />
          </button>
        </div>
      </div>

      {/* Scrollable Container for Headers and Rows */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-white relative"
      >
        <div className="min-w-max min-h-full flex flex-col">
          <div
            className="group/header flex border-b border-[#e5e5e5] bg-white sticky top-0 z-10 shrink-0"
            style={{ height: 28 }}
          >
            {/* Variable Name Column Header */}
            <div
              className="flex items-center text-[10px] text-[#999] pl-10 pr-4 tracking-wider shrink-0 relative"
              style={{ width: columnWidths.name }}
            >
              {t.table.name}
              <div
                onMouseDown={(e) => startColumnResize('name', e)}
                onDoubleClick={() => handleColumnResizerDoubleClick('name')}
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#0d99ff] opacity-0 hover:opacity-100 transition-opacity z-20"
              />
            </div>

            {/* Dynamic Mode Headers */}
            {modes.map(mode => (
              <div
                key={mode.modeId}
                className="border-l border-[#e5e5e5] flex items-center text-[10px] text-[#999] tracking-wider self-stretch shrink-0 relative"
                style={{ width: columnWidths[mode.modeId] || 220 }}
              >
                {editingModeId === mode.modeId ? (
                  <input
                    type="text"
                    value={tempModeName}
                    onChange={(e) => setTempModeName(e.target.value)}
                    onBlur={handleModeHeaderBlur}
                    onKeyDown={handleModeHeaderKeyDown}
                    className="bg-transparent text-[10px] text-[#333] font-bold tracking-wider outline-none w-full border-none px-4 m-0 h-full"
                    autoFocus
                  />
                ) : (
                  <div
                    className="cursor-pointer hover:bg-[#f5f5f5] px-4 w-full h-full flex items-center"
                    onClick={() => handleModeHeaderClick(mode)}
                    onContextMenu={(e) => handleModeContextMenu(e, mode)}
                  >
                    {mode.name}
                  </div>
                )}
                <div
                  onMouseDown={(e) => startColumnResize(mode.modeId, e)}
                  onDoubleClick={() => handleColumnResizerDoubleClick(mode.modeId)}
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#0d99ff] opacity-0 hover:opacity-100 transition-opacity z-20"
                />
              </div>
            ))}

            {/* Add Mode Button in Header */}
            <div className="border-l border-[#e5e5e5] self-stretch flex items-center px-2 shrink-0">
              <button
                onClick={onCreateMode}
                className="opacity-0 group-hover/header:opacity-100 transition-opacity text-[#999] hover:text-[#0d99ff] cursor-pointer p-0.5"
                title={t.table.addMode}
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex-1 self-stretch" />
          </div>

          {/* Rows Grouped by Path */}
          <div className="flex-1 select-none">
            {(() => {
              // Grouping logic - show ALL tokens, not just filtered
              const groups: Record<string, Variable[]> = {};
              variables.forEach(v => {
                const pathParts = v.path.split('/');
                pathParts.pop(); // Remove variable name
                const groupPath = pathParts.join('/') || 'Root';
                if (!groups[groupPath]) groups[groupPath] = [];
                groups[groupPath].push(v);
              });

              return Object.entries(groups)
                .sort((a, b) => {
                  if (a[0] === 'Root') return -1;
                  if (b[0] === 'Root') return 1;
                  return a[0].localeCompare(b[0]);
                })
                .map(([path, groupVars]) => (
                  <div key={path} className="flex flex-col">
                    {/* Group Path Header */}
                    <DroppableGroupHeader
                      groupPath={path}
                      acceptType="VARIABLE_ROW"
                      onDropToGroup={(draggedId) => {
                        onMoveVariableToGroup?.(draggedId, path);
                      }}
                      className="flex items-center px-4 py-2 border-b border-[#f0f0f0] bg-white sticky z-[5] cursor-pointer hover:bg-[#f5f5f5]"
                      style={{ top: 28 }}
                    >
                      <span className="text-[10px] font-bold text-[#bbb] tracking-wider">
                        {path}
                      </span>
                    </DroppableGroupHeader>

                    {(() => {
                      const order = pluginConfig?.tokenOrder?.[path] || [];
                      const sortedVars = order.length > 0
                        ? [...groupVars].sort((a, b) => {
                          const idxA = order.indexOf(a.id);
                          const idxB = order.indexOf(b.id);
                          if (idxA === -1 && idxB === -1) return 0;
                          if (idxA === -1) return 1;
                          if (idxB === -1) return -1;
                          return idxA - idxB;
                        })
                        : groupVars;

                      return sortedVars.map((variable) => {
                        const isSelected = selectedIds.includes(variable.id);
                        return (
                          <DraggableRow
                            key={variable.id}
                            id={variable.id}
                            type="VARIABLE_ROW"
                            index={groupVars.findIndex(v => v.id === variable.id)}
                            groupPath={path}
                            isEditing={editingTokenNameId === variable.id}
                            onMove={(draggedId, targetId, position) => {
                              onMoveVariableToVariable?.(draggedId, targetId, position);
                            }}
                            innerRef={(el) => { itemRefs.current[variable.id] = el; }}
                            onClick={(e) => onSelect(variable.id, { shift: e.shiftKey, ctrl: e.metaKey || e.ctrlKey })}
                            className={`group/row flex cursor-pointer border-b border-[#f0f0f0] transition-colors ${isSelected
                              ? "bg-[#0d99ff] text-white"
                              : "hover:bg-[#f8f8f8] text-[#333]"
                              }`}
                            style={{ height: 36 }}
                          >
                            {/* Variable icon + name */}
                            <div
                              className="flex items-center gap-2 pl-3 pr-1 self-stretch shrink-0 justify-between group/name"
                              style={{ width: columnWidths.name }}
                              title={variable.name}
                            >
                              <div
                                className="flex items-center gap-2 min-w-0 flex-1"
                                onContextMenu={(e) => handleTokenContextMenu(e, variable.id)}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTokenNameId(variable.id);
                                  setTempTokenName(variable.path);
                                }}
                              >
                                <VariableIcon
                                  className={isSelected ? "text-white/70" : "text-[#999]"}
                                  type={variable.type}
                                />
                                {editingTokenNameId === variable.id ? (
                                  <input
                                    type="text"
                                    value={tempTokenName}
                                    onChange={(e) => setTempTokenName(e.target.value)}
                                    onBlur={() => handleTokenNameBlur(variable.id)}
                                    onKeyDown={(e) => handleTokenNameKeyDown(e, variable.id)}
                                    className={`text-[11px] outline-none w-full border-none p-0 m-0 bg-transparent ${isSelected ? "text-white" : "text-[#333]"
                                      }`}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span
                                    className="text-[11px] truncate flex-1 overflow-hidden"
                                    style={{ direction: 'rtl', textAlign: 'left' }}
                                  >
                                    <bdo dir="ltr">{variable.name}</bdo>
                                  </span>
                                )}
                              </div>
                              <div
                                className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                onContextMenu={(e) => handleTokenContextMenu(e, variable.id)}
                              >
                                <button
                                  className={`cursor-pointer p-0.5 shrink-0 ${isSelected ? "text-white/60 hover:text-white" : "text-[#999] hover:text-[#333]"
                                    }`}
                                  title="Link variable"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Mode Value Cells */}
                            {modes.map(mode => {
                              const data = variable.valuesByMode[mode.modeId];
                              const isEditing = editingCell?.variableId === variable.id && editingCell?.modeId === mode.modeId;

                              return (
                                <div
                                  key={mode.modeId}
                                  className={`border-l ${isSelected ? "border-white/20" : "border-[#e5e5e5]"
                                    } flex items-center gap-2 pl-4 pr-1 self-stretch shrink-0 justify-between group/value`}
                                  style={{ width: columnWidths[mode.modeId] || 220 }}
                                  title={data?.resolvedValue || data?.value}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (data) handleCellClick(variable, mode.modeId, e);
                                  }}
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={tempCellValue}
                                      onChange={(e) => setTempCellValue(e.target.value)}
                                      onBlur={handleCellBlur}
                                      onKeyDown={handleCellKeyDown}
                                      className={`text-[11px] outline-none w-full border-none p-0 m-0 bg-transparent ${isSelected ? "text-white placeholder-white/50" : "text-[#333] placeholder-[#ccc]"
                                        }`}
                                      autoFocus
                                    />
                                  ) : (
                                    <>
                                      <div
                                        className={`inline-flex items-center gap-1.5 rounded-[6px] min-w-0 max-w-full overflow-hidden ${data?.isAlias
                                          ? `pl-1 pr-2 py-0.5 border ${isSelected ? "border-white/40 bg-white/10 text-white" : "border-[#e5e5e5] bg-transparent text-[#333]"}`
                                          : ""
                                          }`}
                                      >
                                        {data?.colorSwatch && (
                                          <ColorVariableIcon color={data.colorSwatch} />
                                        )}

                                        {variable.type === 'boolean' && !data?.isAlias ? (
                                          <div className="flex items-center py-1">
                                            <Switch
                                              checked={data?.value === 'true' || data?.value === true}
                                              onCheckedChange={(checked) => {
                                                if (onUpdateVariable) {
                                                  onUpdateVariable(variable.id, mode.modeId, String(checked));
                                                }
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                              className={isSelected ? "data-[state=unchecked]:bg-white/20" : ""}
                                            />
                                          </div>
                                        ) : (
                                          <span
                                            className="text-[11px] whitespace-nowrap truncate overflow-hidden"
                                            style={{ direction: 'rtl', textAlign: 'left' }}
                                          >
                                            <bdo dir="ltr">{data?.value || ""}</bdo>
                                          </span>
                                        )}
                                      </div>
                                      {data?.isAlias ? (
                                        <button
                                          className={`opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer p-0.5 shrink-0 ${isSelected ? "text-white/60 hover:text-white" : "text-[#999] hover:text-[#333]"
                                            }`}
                                          title="Go to alias"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (data.aliasTargetId && onNavigateToTarget) {
                                              onNavigateToTarget(data.aliasTargetId, variable.id);
                                            } else if (data.aliasTargetId) {
                                              onSelect(data.aliasTargetId);
                                            }
                                          }}
                                        >
                                          <Target size={12} />
                                        </button>
                                      ) : (
                                        <button
                                          className={`opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer p-0.5 shrink-0 ${isSelected ? "text-white/60 hover:text-white" : "text-[#999] hover:text-[#333]"
                                            }`}
                                          title="Link to token"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenTokenPicker(variable, mode.modeId, e);
                                          }}
                                        >
                                          <Hexagon size={12} />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })}

                            {/* Empty area after value — with border */}
                            <div
                              className={`border-l ${isSelected ? "border-white/20" : "border-[#e5e5e5]"
                                } self-stretch flex-1`}
                            />

                            {/* Sliders icon on hover — right edge */}
                            <div
                              className="self-stretch shrink-0 flex items-center justify-center"
                              style={{ width: 28 }}
                            >
                              <button
                                className={`opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer p-0.5 ${isSelected ? "text-white/60 hover:text-white" : "text-[#ccc] hover:text-[#999]"
                                  }`}
                                title="Settings"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SlidersHorizontal size={12} />
                              </button>
                            </div>
                          </DraggableRow>
                        );
                      });
                    })()}
                  </div>
                ));
            })()}
          </div>
        </div>
      </div>

      {/* Mode Context Menu */}
      {
        contextMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setContextMenu(null)} />
            <div
              className="fixed z-[101] bg-white border border-[#e5e5e5] rounded-lg shadow-xl py-1 min-w-[160px] animate-in fade-in zoom-in duration-100"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold text-[#999] uppercase tracking-wider border-b border-[#f5f5f5] mb-1">
                Mode: {contextMenu.mode.name}
              </div>
              <button
                onClick={() => handleMoveMode('left')}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f5] text-[11px] text-[#333] transition-colors"
              >
                <ArrowLeft size={12} className="text-[#999]" />
                Move Left
              </button>
              <button
                onClick={() => handleMoveMode('right')}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f5] text-[11px] text-[#333] transition-colors"
              >
                <ArrowRight size={12} className="text-[#999]" />
                Move Right
              </button>
              <div className="h-[1px] bg-[#f5f5f5] my-1" />
              <button
                onClick={handleSetDefaultMode}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f5] text-[11px] text-[#333] transition-colors"
              >
                <Star size={12} className="text-[#999]" />
                Set as Default
              </button>
              <div className="h-[1px] bg-[#f5f5f5] my-1" />
              <button
                onClick={() => {
                  if (onDeleteMode) onDeleteMode(contextMenu.mode.modeId);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#fff1f2] text-[11px] text-[#e11d48] transition-colors"
              >
                <Trash2 size={12} />
                Delete Mode
              </button>
            </div>
          </>
        )
      }

      {/* Token Context Menu */}
      {
        tokenContextMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onMouseDown={() => setTokenContextMenu(null)} />
            <div
              className="fixed z-[101] bg-white border border-[#e5e5e5] rounded-lg shadow-xl py-1 min-w-[180px] animate-in fade-in zoom-in duration-100"
              style={{ left: tokenContextMenu.x, top: tokenContextMenu.y }}
            >
              <button
                onClick={() => {
                  setCopiedIds(tokenContextMenu.variableIds);
                  setTokenContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f5] text-[11px] text-[#333] transition-colors text-left"
              >
                <Copy size={12} className="text-[#999]" />
                Copy
              </button>
              <button
                onClick={() => {
                  if (copiedIds.length > 0 && onDuplicateVariables) {
                    onDuplicateVariables(copiedIds);
                  }
                  setTokenContextMenu(null);
                }}
                disabled={copiedIds.length === 0}
                className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f5] text-[11px] transition-colors text-left ${copiedIds.length === 0 ? "text-[#ccc] cursor-not-allowed" : "text-[#333]"}`}
              >
                <Download size={12} className={copiedIds.length === 0 ? "text-[#eee]" : "text-[#999]"} />
                Paste
              </button>

              <div className="h-[1px] bg-[#f5f5f5] my-1" />

              <button
                onClick={handleCreateGroup}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f5] text-[11px] text-[#333] transition-colors text-left"
              >
                <Grid size={12} className="text-[#999]" />
                New group with selection
              </button>
              <button
                onClick={() => {
                  if (onEditVariable) onEditVariable();
                  setTokenContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f5] text-[11px] text-[#333] transition-colors text-left"
              >
                <Code size={12} className="text-[#999]" />
                Edit variable
              </button>
              <button
                onClick={() => {
                  if (onDuplicateVariables) onDuplicateVariables(tokenContextMenu.variableIds);
                  setTokenContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f5] text-[11px] text-[#333] transition-colors text-left"
              >
                <Copy size={12} className="text-[#999]" />
                Duplicate variable
              </button>

              <div className="h-[1px] bg-[#f5f5f5] my-1" />

              <button
                onClick={() => {
                  if (onDeleteVariables) onDeleteVariables(tokenContextMenu.variableIds);
                  setTokenContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#fff1f2] text-[11px] text-[#e11d48] transition-colors text-left"
              >
                <Trash2 size={12} />
                Delete variable
              </button>
            </div>
          </>
        )
      }

      {/* Navigation Return Banner */}
      {
        navigationReturn && (
          <div className="mx-2 mb-2 bg-[#f0f9ff] border border-[#0d99ff]/20 rounded-md py-2 px-3 flex items-center justify-between shadow-sm animate-in slide-in-from-bottom-1 duration-200">
            <div className="flex items-center gap-2">
              <div className="bg-[#0d99ff]/10 p-1 rounded">
                <Target size={12} className="text-[#0d99ff]" />
              </div>
              <span className="text-[11px] text-[#333]">
                Navigated to <span className="font-semibold">{variables.find(v => v.id === selectedId)?.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToTarget?.(navigationReturn.id, '')}
                className="text-[11px] bg-[#0d99ff] text-white px-2.5 py-1 rounded hover:bg-[#0b7fd4] transition-colors cursor-pointer font-medium"
              >
                Return to "{navigationReturn.name}"
              </button>
              <button
                onClick={onClearNavigationReturn}
                className="text-[#999] hover:text-[#333] p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )
      }

      {/* Bottom action bar */}
      <div className="flex items-center gap-3 px-3 border-t border-[#e5e5e5] shrink-0 relative" style={{ height: 44 }}>
        <div className="relative">
          <button
            className="flex items-center gap-1 text-[11px] text-[#666] hover:text-[#333] cursor-pointer"
            onClick={() => setShowAddTokenMenu(!showAddTokenMenu)}
          >
            <Plus size={12} />
            {t.table.addNewToken}
          </button>

          {/* Add token type menu */}
          {showAddTokenMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowAddTokenMenu(false)}
              />

              {/* Menu popup */}
              <div
                className="absolute bottom-full left-0 mb-1 bg-white border border-[#e5e5e5] rounded shadow-lg py-1 z-20"
                style={{ minWidth: 140 }}
              >
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5] cursor-pointer"
                  onClick={() => handleAddToken("color")}
                >
                  <Palette size={12} className="text-[#999]" />
                  Color
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5] cursor-pointer"
                  onClick={() => handleAddToken("number")}
                >
                  <Hash size={12} className="text-[#999]" />
                  Number
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5] cursor-pointer"
                  onClick={() => handleAddToken("string")}
                >
                  <Type size={12} className="text-[#999]" />
                  String
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5] cursor-pointer"
                  onClick={() => handleAddToken("boolean")}
                >
                  <ToggleLeft size={12} className="text-[#999]" />
                  Boolean
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5] cursor-pointer"
                  onClick={() => handleAddToken("function")}
                >
                  <Code size={12} className="text-[#999]" />
                  Function
                </button>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            className="flex items-center gap-1 text-[11px] text-[#666] hover:text-[#333] cursor-pointer"
            onClick={() => setShowCreateStyleMenu(!showCreateStyleMenu)}
          >
            <Plus size={12} />
            {t.table.createStyle}
          </button>

          {/* Create style menu */}
          {showCreateStyleMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowCreateStyleMenu(false)}
              />

              {/* Menu popup */}
              <div
                className="absolute bottom-full left-0 mb-1 bg-white border border-[#e5e5e5] rounded shadow-lg py-1 z-20"
                style={{ minWidth: 140 }}
              >
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5] cursor-pointer"
                  onClick={() => handleCreateStyle("color")}
                >
                  <Palette size={12} className="text-[#999]" />
                  Color
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5] cursor-pointer"
                  onClick={() => handleCreateStyle("typography")}
                >
                  <Type size={12} className="text-[#999]" />
                  Typography
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5] cursor-pointer"
                  onClick={() => handleCreateStyle("effect")}
                >
                  <Sparkles size={12} className="text-[#999]" />
                  Effect
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5] cursor-pointer"
                  onClick={() => handleCreateStyle("grid")}
                >
                  <Grid size={12} className="text-[#999]" />
                  Grid
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mode Context Menu */}
      {
        contextMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setContextMenu(null)} />
            <div
              className="fixed z-[101] bg-white border border-[#e5e5e5] rounded shadow-lg py-1 min-w-[160px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5]"
                onClick={() => {
                  onDuplicateMode?.(contextMenu.mode.modeId);
                  setContextMenu(null);
                }}
              >
                <Copy size={12} className="text-[#999]" />
                Duplicate mode
              </button>
              <button
                className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5]"
                onClick={handleSetDefaultMode}
              >
                <Star size={12} className="text-[#999]" />
                Set as default
              </button>
              <button
                className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5]"
                onClick={() => handleMoveMode('left')}
              >
                <ArrowLeft size={12} className="text-[#999]" />
                Move left
              </button>
              <button
                className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5]"
                onClick={() => handleMoveMode('right')}
              >
                <ArrowRight size={12} className="text-[#999]" />
                Move right
              </button>
              <button
                className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5]"
                onClick={() => {
                  handleModeHeaderClick(contextMenu.mode);
                  setContextMenu(null);
                }}
              >
                <Type size={12} className="text-[#999]" />
                Rename mode
              </button>

              <div className="h-[1px] bg-[#e5e5e5] my-1" />

              <button
                className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5]"
                onClick={() => {
                  onImportClick?.();
                  setContextMenu(null);
                }}
              >
                <Download size={12} className="text-[#999]" />
                Import mode
              </button>
              <button
                className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5]"
                onClick={() => {
                  onExportClick?.();
                  setContextMenu(null);
                }}
              >
                <Upload size={12} className="text-[#999]" />
                Export mode
              </button>

              <div className="h-[1px] bg-[#e5e5e5] my-1" />

              <button
                className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-red-500 hover:bg-red-50"
                onClick={() => {
                  onDeleteMode?.(contextMenu.mode.modeId);
                  setContextMenu(null);
                }}
              >
                <Trash2 size={12} />
                Delete mode
              </button>
            </div>
          </>
        )
      }

      {/* Token Picker Popover */}
      <TokenPicker
        anchorEl={tokenPickerAnchor}
        onClose={() => {
          setTokenPickerAnchor(null);
          setPickerContext(null);
        }}
        onSelect={handleTokenSelect}
        onUnlink={handleUnlinkToken}
        currentTokenId={pickerContext?.currentAliasId}
        tokenType={pickerContext?.tokenType || "number"}
        tokens={allVariables.map(v => ({
          id: v.id,
          name: v.name,
          path: v.path,
          type: v.type,
          collectionId: v.libraryName || "Local",
          collectionName: collections.find(c => c.id === v.collectionId)?.name || v.collectionId,
          value: v.valuesByMode[Object.keys(v.valuesByMode)[0]]?.value,
          colorSwatch: v.valuesByMode[Object.keys(v.valuesByMode)[0]]?.colorSwatch,
        }))}
        collections={Array.from(new Set(allVariables.map(v => v.libraryName || "Local"))).map(lib => ({ id: lib, name: lib }))}
      />

      {/* Color Picker Popover */}
      <ColorPicker
        anchorEl={colorPickerAnchor}
        onClose={() => {
          setColorPickerAnchor(null);
          setPickerContext(null);
        }}
        onSelectColor={handleColorSelect}
        onSelectToken={handleTokenSelect}
        onUnlink={handleUnlinkToken}
        currentTokenId={pickerContext?.currentAliasId}
        currentValue={pickerContext && allVariables.find(v => v.id === pickerContext.variableId)?.valuesByMode[pickerContext.modeId]}
        tokens={allVariables.filter(v => v.type === "color").map(v => ({
          id: v.id,
          name: v.name,
          path: v.path,
          type: v.type,
          collectionId: v.libraryName || "Local",
          collectionName: collections.find(c => c.id === v.collectionId)?.name || v.collectionId,
          colorSwatch: v.valuesByMode[Object.keys(v.valuesByMode)[0]]?.colorSwatch,
        }))}
        collections={Array.from(new Set(allVariables.map(v => v.libraryName || "Local"))).map(lib => ({ id: lib, name: lib }))}
      />

      <CreateColorStyleModal
        isOpen={showCreateColorStyleModal}
        onClose={() => setShowCreateColorStyleModal(false)}
        tokens={allVariables}
        onCreate={(name, tokenId) => {
          parent.postMessage({
            pluginMessage: {
              type: "create-color-style",
              name,
              variableId: tokenId
            }
          }, "*");
        }}
      />
      <CreateTypographyStyleModal
        isOpen={showCreateTypographyStyleModal}
        onClose={() => setShowCreateTypographyStyleModal(false)}
        tokens={allVariables}
        onCreate={(name, config) => {
          parent.postMessage({
            pluginMessage: {
              type: "create-typography-style",
              name,
              config
            }
          }, "*");
        }}
      />
      <CreateEffectStyleModal
        isOpen={showCreateEffectStyleModal}
        onClose={() => setShowCreateEffectStyleModal(false)}
        tokens={allVariables}
        onCreate={(name, config) => {
          parent.postMessage({
            pluginMessage: {
              type: "create-effect-style",
              name,
              config
            }
          }, "*");
        }}
      />
    </div >
  );
}