import React, { useState } from "react";
import { Search, Minimize2, Settings, Plus, History, SlidersHorizontal, Target, Link, Palette, Hash, Type, ToggleLeft, Code, Sparkles, Grid, GitBranch, X } from "lucide-react";
import { VariableIcon, ColorVariableIcon } from "./variable-icon";
import type { Variable } from "./variables-data";
import { useRef, useEffect } from "react";

interface VariablesTableProps {
  variables: Variable[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onGitSyncClick?: () => void;
  onMinimizeClick?: () => void;
  onNavigateToTarget?: (targetId: string, fromId: string) => void;
  navigationReturn?: { id: string, name: string } | null;
  onClearNavigationReturn?: () => void;
}

export function VariablesTable({
  variables,
  selectedId,
  onSelect,
  onGitSyncClick,
  onMinimizeClick,
  onNavigateToTarget,
  navigationReturn,
  onClearNavigationReturn,
}: VariablesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [columnHeaders, setColumnHeaders] = useState({
    value: "Value",
  });
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [tempHeaderValue, setTempHeaderValue] = useState("");
  const [showAddTokenMenu, setShowAddTokenMenu] = useState(false);
  const [showCreateStyleMenu, setShowCreateStyleMenu] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedId && itemRefs.current[selectedId]) {
      itemRefs.current[selectedId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId]);
  
  // Column widths state
  const [columnWidths, setColumnWidths] = useState({ name: 220, value: 220 });
  const resizingColumn = useRef<{ key: 'name' | 'value'; startX: number; startWidth: number } | null>(null);

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

  const startColumnResize = (key: 'name' | 'value', e: React.MouseEvent) => {
    e.preventDefault();
    resizingColumn.current = {
      key,
      startX: e.clientX,
      startWidth: columnWidths[key]
    };
    document.body.style.cursor = 'col-resize';
  };

  const handleHeaderClick = (columnKey: string) => {
    if (columnKey === "name") return; // Name column is not editable
    setEditingColumn(columnKey);
    setTempHeaderValue(columnHeaders[columnKey as keyof typeof columnHeaders] || "");
  };

  const handleHeaderBlur = () => {
    if (editingColumn && tempHeaderValue.trim()) {
      setColumnHeaders((prev) => ({
        ...prev,
        [editingColumn]: tempHeaderValue.trim(),
      }));
    }
    setEditingColumn(null);
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleHeaderBlur();
    } else if (e.key === "Escape") {
      setEditingColumn(null);
    }
  };

  const handleAddToken = (type: "color" | "number" | "string" | "boolean" | "function") => {
    console.log("Adding token of type:", type);
    setShowAddTokenMenu(false);
    // TODO: Implement token creation logic
  };

  const handleCreateStyle = (type: "color" | "typography" | "effect" | "grid") => {
    console.log("Creating style of type:", type);
    setShowCreateStyleMenu(false);
    // TODO: Implement style creation logic
  };

  const filtered = searchQuery
    ? variables.filter((v) =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : variables;

  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-3 border-b border-[#e5e5e5] bg-white shrink-0"
        style={{ height: 36 }}
      >
        {/* Search */}
        <div className="flex items-center gap-1.5 bg-[#f5f5f5] rounded px-2 py-[5px] flex-1 max-w-[240px]">
          <Search size={12} className="text-[#999] shrink-0" />
          <input
            type="text"
            placeholder="Search variables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[11px] text-[#333] placeholder-[#bbb] outline-none w-full border-none p-0 m-0"
          />
        </div>

        {/* Collapse / minimize icon */}
        <div className="flex items-center gap-0.5">
          {onGitSyncClick && (
            <button
              onClick={onGitSyncClick}
              className="text-[#999] hover:text-[#333] p-1 cursor-pointer"
              title="Git Sync"
            >
              <GitBranch size={14} />
            </button>
          )}
          <button className="text-[#999] hover:text-[#333] p-1 cursor-pointer" title="History">
            <History size={14} />
          </button>
          <button className="text-[#999] hover:text-[#333] p-1 cursor-pointer" title="Settings">
            <Settings size={14} />
          </button>
          <button onClick={onMinimizeClick} className="text-[#999] hover:text-[#333] p-1 cursor-pointer" title="Minimize">
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
          {/* Column headers */}
          <div
            className="group/header flex border-b border-[#e5e5e5] bg-white sticky top-0 z-10 shrink-0"
            style={{ height: 28 }}
          >
        <div
          className="flex items-center text-[10px] text-[#999] pl-10 pr-4 uppercase tracking-wider shrink-0 relative"
          style={{ width: columnWidths.name }}
        >
          Name
          <div 
            onMouseDown={(e) => startColumnResize('name', e)}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#0d99ff] opacity-0 hover:opacity-100 transition-opacity z-20"
          />
        </div>
        <div 
          className="border-l border-[#e5e5e5] flex items-center text-[10px] text-[#999] pl-4 pr-4 uppercase tracking-wider self-stretch shrink-0 relative" 
          style={{ width: columnWidths.value }}
        >
          {editingColumn === "value" ? (
            <input
              type="text"
              value={tempHeaderValue}
              onChange={(e) => setTempHeaderValue(e.target.value)}
              onBlur={handleHeaderBlur}
              onKeyDown={handleHeaderKeyDown}
              className="bg-transparent text-[10px] text-[#999] uppercase tracking-wider outline-none w-full border-none p-0 m-0"
              autoFocus
            />
          ) : (
            <div
              className="cursor-pointer hover:bg-[#f5f5f5] rounded px-1 py-0.5 -mx-1 -my-0.5"
              onClick={() => handleHeaderClick("value")}
            >
              {columnHeaders.value}
            </div>
          )}
          <div 
            onMouseDown={(e) => startColumnResize('value', e)}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#0d99ff] opacity-0 hover:opacity-100 transition-opacity z-20"
          />
        </div>
        <div className="border-l border-[#e5e5e5] self-stretch flex items-center pl-1 shrink-0">
          <button className="opacity-0 group-hover/header:opacity-100 transition-opacity text-[#999] hover:text-[#333] cursor-pointer p-0.5" title="Add mode">
            <Plus size={12} />
          </button>
        </div>
        <div className="flex-1 self-stretch" />
      </div>

      {/* Rows Grouped by Path */}
      <div className="flex-1">
        {(() => {
          // Grouping logic
          const groups: Record<string, Variable[]> = {};
          filtered.forEach(v => {
            const pathParts = v.path.split('/');
            pathParts.pop(); // Remove variable name
            const groupPath = pathParts.join('/') || 'Root';
            if (!groups[groupPath]) groups[groupPath] = [];
            groups[groupPath].push(v);
          });

          return Object.entries(groups).map(([path, groupVars]) => (
            <div key={path} className="flex flex-col">
              {/* Group Path Header */}
              <div 
                className="flex items-center px-4 py-2 border-b border-[#f0f0f0] bg-white sticky z-[5]"
                style={{ top: 28 }} // Sticky below main headers
              >
                <span className="text-[10px] font-bold text-[#bbb] uppercase tracking-wider">
                  {path}
                </span>
              </div>

              {groupVars.map((variable) => {
                const isSelected = selectedId === variable.id;
                return (
                  <div
                    key={variable.id}
                    ref={(el) => { itemRefs.current[variable.id] = el; }}
                    onClick={() => onSelect(variable.id)}
                    className={`group/row flex cursor-pointer border-b border-[#f0f0f0] transition-colors ${
                      isSelected
                        ? "bg-[#0d99ff] text-white"
                        : "hover:bg-[#f8f8f8] text-[#333]"
                    }`}
                    style={{ height: 36 }}
                  >
                    {/* Variable icon + name */}
                    <div
                      className="flex items-center gap-2 pl-3 pr-1 self-stretch shrink-0 justify-between group/name"
                      style={{ width: columnWidths.name }}
                      title={variable.resolvedValue || variable.value}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <VariableIcon
                          className={isSelected ? "text-white/70" : "text-[#999]"}
                          type={variable.type}
                        />
                        <span 
                          className="text-[11px] truncate flex-1 overflow-hidden" 
                          style={{ direction: 'rtl', textAlign: 'left' }}
                        >
                          <bdo dir="ltr">{variable.name}</bdo>
                        </span>
                      </div>
                      <button
                        className={`opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer p-0.5 shrink-0 ${
                          isSelected ? "text-white/60 hover:text-white" : "text-[#999] hover:text-[#333]"
                        }`}
                        title="Link variable"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link size={12} />
                      </button>
                    </div>

                    {/* Value cell */}
                    <div
                      className={`border-l ${
                        isSelected ? "border-white/20" : "border-[#e5e5e5]"
                      } flex items-center gap-2 pl-4 pr-1 self-stretch shrink-0 justify-between group/value`}
                      style={{ width: columnWidths.value }}
                      title={variable.resolvedValue || variable.value}
                    >
                      <div
                        className={`flex items-center gap-1.5 rounded min-w-0 flex-1 overflow-hidden ${
                          variable.isAlias
                            ? `px-1.5 py-0.5 ${isSelected ? "bg-white/15" : "bg-[#f5f5f5]"}`
                            : ""
                        }`}
                      >
                        {variable.colorSwatch && (
                          <ColorVariableIcon color={variable.colorSwatch} />
                        )}
                        <span 
                          className="text-[11px] whitespace-nowrap truncate flex-1 overflow-hidden"
                          style={{ direction: 'rtl', textAlign: 'left' }}
                        >
                          <bdo dir="ltr">{variable.value}</bdo>
                        </span>
                      </div>
                      {variable.isAlias && (
                        <button
                          className={`opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer p-0.5 shrink-0 ${
                            isSelected ? "text-white/60 hover:text-white" : "text-[#999] hover:text-[#333]"
                          }`}
                          title="Go to alias"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (variable.aliasTargetId && onNavigateToTarget) {
                              onNavigateToTarget(variable.aliasTargetId, variable.id);
                            } else if (variable.aliasTargetId) {
                              onSelect(variable.aliasTargetId);
                            }
                          }}
                        >
                          <Target size={12} />
                        </button>
                      )}
                    </div>

                    {/* Empty area after value — with border */}
                    <div
                      className={`border-l ${
                        isSelected ? "border-white/20" : "border-[#e5e5e5]"
                      } self-stretch flex-1`}
                    />

                    {/* Sliders icon on hover — right edge */}
                    <div
                      className="self-stretch shrink-0 flex items-center justify-center"
                      style={{ width: 28 }}
                    >
                      <button
                        className={`opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer p-0.5 ${
                          isSelected ? "text-white/60 hover:text-white" : "text-[#ccc] hover:text-[#999]"
                        }`}
                        title="Settings"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SlidersHorizontal size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </div>
    </div>
  </div>

    {/* Navigation Return Banner */}
    {navigationReturn && (
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
    )}

    {/* Bottom action bar */}
      <div className="flex items-center gap-3 px-3 border-t border-[#e5e5e5] shrink-0 relative" style={{ height: 44 }}>
        <div className="relative">
          <button
            className="flex items-center gap-1 text-[11px] text-[#666] hover:text-[#333] cursor-pointer"
            onClick={() => setShowAddTokenMenu(!showAddTokenMenu)}
          >
            <Plus size={12} />
            Add new token
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
            Create style
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
    </div>
  );
}