import React from "react";
import { PanelLeftClose, PanelLeftOpen, Plus, Download, Upload } from "lucide-react";
import { EmojiPicker } from "./emoji-picker";
import type { Collection, Group } from "./variables-data";

interface SidebarProps {
  collections: Collection[];
  groups: Group[];
  selectedCollection: string;
  selectedGroup: string;
  collapsed: boolean;
  collectionEmojis: Record<string, string | null>;
  groupEmojis: Record<string, string | null>;
  onSelectCollection: (name: string) => void;
  onSelectGroup: (name: string) => void;
  onToggleCollapse: () => void;
  onSetCollectionEmoji: (name: string, emoji: string | null) => void;
  onSetGroupEmoji: (name: string, emoji: string | null) => void;
  onImportClick: () => void;
  onExportClick: () => void;
}

const SQUARE_BTN = 28;

export function Sidebar({
  collections,
  groups,
  selectedCollection,
  selectedGroup,
  collapsed,
  collectionEmojis,
  groupEmojis,
  onSelectCollection,
  onSelectGroup,
  onToggleCollapse,
  onSetCollectionEmoji,
  onSetGroupEmoji,
  onImportClick,
  onExportClick,
}: SidebarProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col h-full bg-white" style={{ width: 40 }}>
        {/* Header — expand button */}
        <div
          className="flex items-center justify-center border-b border-[#e5e5e5]"
          style={{ height: 36 }}
        >
          <button
            onClick={onToggleCollapse}
            className="text-[#999] hover:text-[#333] p-1 cursor-pointer"
            title="Expand"
          >
            <PanelLeftOpen size={14} />
          </button>
        </div>

        {/* Collapsed collections */}
        <div className="flex flex-col items-center pt-1">
          {collections.map((col) => {
            const isSelected = selectedCollection === col.name;
            const emoji = collectionEmojis[col.name];
            return (
              <button
                key={col.name}
                onClick={() => onSelectCollection(col.name)}
                title={col.name}
                className={`flex items-center justify-center rounded cursor-pointer transition-colors my-[1px] ${
                  isSelected
                    ? "bg-[#0d99ff]/10 text-[#0d99ff]"
                    : "text-[#666] hover:bg-[#f0f0f0]"
                }`}
                style={{ width: SQUARE_BTN, height: SQUARE_BTN }}
              >
                {emoji ? (
                  <span style={{ fontSize: 12, lineHeight: 1 }}>{emoji}</span>
                ) : (
                  <span className="text-[11px]">{col.name[0]}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="my-2 mx-2 border-t border-[#e5e5e5]" />

        {/* Collapsed groups */}
        <div className="flex flex-col items-center">
          {groups.map((grp) => {
            const isSelected = selectedGroup === grp.name;
            const emoji = groupEmojis[grp.name];
            return (
              <button
                key={grp.name}
                onClick={() => onSelectGroup(grp.name)}
                title={grp.name}
                className={`flex items-center justify-center rounded cursor-pointer transition-colors my-[1px] ${
                  isSelected
                    ? "bg-[#0d99ff]/10 text-[#0d99ff]"
                    : "text-[#666] hover:bg-[#f0f0f0]"
                }`}
                style={{ width: SQUARE_BTN, height: SQUARE_BTN }}
              >
                {emoji ? (
                  <span style={{ fontSize: 12, lineHeight: 1 }}>{emoji}</span>
                ) : (
                  <span className="text-[11px]">{grp.name[0]}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom buttons collapsed — vertical, square */}
        <div className="mt-auto flex flex-col items-center gap-1 px-1 py-2 border-t border-[#e5e5e5] shrink-0">
          <button
            className="flex items-center justify-center text-white bg-[#0d99ff] hover:bg-[#0b7fd4] cursor-pointer rounded transition-colors"
            style={{ width: SQUARE_BTN, height: SQUARE_BTN }}
            title="Import"
            onClick={onImportClick}
          >
            <Download size={14} />
          </button>
          <button
            className="flex items-center justify-center text-white bg-[#0d99ff] hover:bg-[#0b7fd4] cursor-pointer rounded transition-colors"
            style={{ width: SQUARE_BTN, height: SQUARE_BTN }}
            title="Export"
            onClick={onExportClick}
          >
            <Upload size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white" style={{ width: 210 }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-2 border-b border-[#e5e5e5]"
        style={{ height: 36 }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="text-[#999] hover:text-[#333] p-1 cursor-pointer"
            title="Collapse"
          >
            <PanelLeftClose size={14} />
          </button>
          <span className="text-[11px] text-[#333]">Collection</span>
        </div>
        <button className="text-[#999] hover:text-[#333] p-1 cursor-pointer" title="Add collection">
          <Plus size={14} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Collections section label */}
        <div
          className="flex items-center px-3 border-b border-[#e5e5e5]"
          style={{ height: 28 }}
        >
          <span className="text-[10px] text-[#999] uppercase tracking-wider">Collections</span>
        </div>

        {/* Collection items */}
        <div className="flex flex-col">
          {collections.map((col) => {
            const isSelected = selectedCollection === col.name;
            return (
              <div
                key={col.name}
                onClick={() => onSelectCollection(col.name)}
                className={`flex items-center gap-2 px-3 py-[5px] cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#0d99ff]/10 text-[#0d99ff]"
                    : "text-[#333] hover:bg-[#f5f5f5]"
                }`}
              >
                <EmojiPicker
                  currentEmoji={collectionEmojis[col.name] || null}
                  defaultLetter={col.name[0]}
                  onSelect={(emoji) => onSetCollectionEmoji(col.name, emoji)}
                />
                <span className="text-[11px] flex-1">{col.name}</span>
                <span
                  className={`text-[11px] ${
                    isSelected ? "text-[#0d99ff]/70" : "text-[#999]"
                  }`}
                >
                  {col.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Separator */}
        <div className="my-2 mx-3 border-t border-[#e5e5e5]" />

        {/* Groups section label */}
        <div
          className="flex items-center px-3"
          style={{ height: 28 }}
        >
          <span className="text-[10px] text-[#999] uppercase tracking-wider">Groups</span>
        </div>

        {/* Group items */}
        <div className="flex flex-col">
          {groups.map((grp) => {
            const isSelected = selectedGroup === grp.name;
            return (
              <div
                key={grp.name}
                onClick={() => onSelectGroup(grp.name)}
                className={`flex items-center gap-2 px-3 py-[5px] cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#0d99ff]/10 text-[#0d99ff]"
                    : "text-[#333] hover:bg-[#f5f5f5]"
                }`}
              >
                <EmojiPicker
                  currentEmoji={groupEmojis[grp.name] || null}
                  defaultLetter={grp.name[0]}
                  onSelect={(emoji) => onSetGroupEmoji(grp.name, emoji)}
                />
                <span className="text-[11px] flex-1">{grp.name}</span>
                <span
                  className={`text-[11px] ${
                    isSelected ? "text-[#0d99ff]/70" : "text-[#999]"
                  }`}
                >
                  {grp.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom buttons — horizontal, with text */}
      <div className="mt-auto flex items-center gap-2 px-3 py-2 border-t border-[#e5e5e5] shrink-0" style={{ height: 44 }}>
        <button
          className="flex-1 flex items-center justify-center text-white bg-[#0d99ff] hover:bg-[#0b7fd4] cursor-pointer rounded transition-colors gap-1.5 text-[11px]"
          style={{ height: SQUARE_BTN }}
          title="Import"
          onClick={onImportClick}
        >
          <Download size={12} />
          Import
        </button>
        <button
          className="flex-1 flex items-center justify-center text-white bg-[#0d99ff] hover:bg-[#0b7fd4] cursor-pointer rounded transition-colors gap-1.5 text-[11px]"
          style={{ height: SQUARE_BTN }}
          title="Export"
          onClick={onExportClick}
        >
          <Upload size={12} />
          Export
        </button>
      </div>
    </div>
  );
}