import React, { useState } from "react";
import { Search, Minimize2, Settings, Plus, History, SlidersHorizontal, Target, Link, Palette, Hash, Type, ToggleLeft, Code, Sparkles, Grid, GitBranch } from "lucide-react";
import { VariableIcon, ColorVariableIcon } from "./variable-icon";
import type { Variable } from "./variables-data";

interface VariablesTableProps {
  variables: Variable[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onGitSyncClick?: () => void;
}

export function VariablesTable({
  variables,
  selectedId,
  onSelect,
  onGitSyncClick,
}: VariablesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [columnHeaders, setColumnHeaders] = useState({
    value: "Value",
  });
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [tempHeaderValue, setTempHeaderValue] = useState("");
  const [showAddTokenMenu, setShowAddTokenMenu] = useState(false);
  const [showCreateStyleMenu, setShowCreateStyleMenu] = useState(false);

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
          <button className="text-[#999] hover:text-[#333] p-1 cursor-pointer" title="Minimize">
            <Minimize2 size={14} />
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="group/header flex border-b border-[#e5e5e5] bg-white sticky top-0 z-10 shrink-0"
        style={{ height: 28 }}
      >
        <div
          className="flex items-center text-[10px] text-[#999] pl-10 pr-4 uppercase tracking-wider shrink-0"
          style={{ width: 220 }}
        >
          Name
        </div>
        <div className="border-l border-[#e5e5e5] flex items-center text-[10px] text-[#999] pl-4 pr-4 uppercase tracking-wider self-stretch shrink-0" style={{ width: 220 }}>
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
        </div>
        <div className="border-l border-[#e5e5e5] self-stretch flex items-center pl-1 shrink-0">
          <button className="opacity-0 group-hover/header:opacity-100 transition-opacity text-[#999] hover:text-[#333] cursor-pointer p-0.5" title="Add mode">
            <Plus size={12} />
          </button>
        </div>
        <div className="flex-1 self-stretch" />
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((variable) => {
          const isSelected = selectedId === variable.id;
          // Check if value is a reference to another token (contains "/" or starts with "{")
          const isReference = variable.value.includes("/") || variable.value.startsWith("{");
          return (
            <div
              key={variable.id}
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
                className="flex items-center gap-2 pl-3 pr-1 self-stretch shrink-0 justify-between"
                style={{ width: 220 }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <VariableIcon
                    className={isSelected ? "text-white/70" : "text-[#999]"}
                    type={variable.type}
                  />
                  <span className="text-[11px] truncate">{variable.name}</span>
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
                } flex items-center gap-2 pl-4 pr-1 self-stretch shrink-0 justify-between`}
                style={{ width: 220 }}
              >
                <div
                  className={`flex items-center gap-1.5 rounded ${
                    isReference
                      ? `px-1.5 py-0.5 ${isSelected ? "bg-white/15" : "bg-[#f5f5f5]"}`
                      : ""
                  }`}
                >
                  {variable.type === "color" && variable.colorSwatch && (
                    <ColorVariableIcon color={variable.colorSwatch} />
                  )}
                  <span className="text-[11px] whitespace-nowrap">
                    {variable.value}
                  </span>
                </div>
                <button
                  className={`opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer p-0.5 shrink-0 ${
                    isSelected ? "text-white/60 hover:text-white" : "text-[#999] hover:text-[#333]"
                  }`}
                  title="Target value"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Target size={12} />
                </button>
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