import React, { useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Plus, Download, Upload, RefreshCw, ChevronDown, ChevronRight, ChevronsUp, Folder, FolderOpen, Type, Trash2, Layers, Copy, ArrowDownAz } from "lucide-react";
import { Reorder } from "motion/react";
import { EmojiPicker } from "./emoji-picker";
import { SidebarDnDItem } from "./sidebar-dnd-item";
import type { Collection, Group } from "./variables-data";

interface SidebarProps {
  collections: Collection[];
  groups: Group[];
  selectedCollection: string;
  selectedGroup: string;
  selectedGroups?: string[];
  collapsed: boolean;
  collectionEmojis: Record<string, string | null>;
  groupEmojis: Record<string, string | null>;
  onSelectCollection: (name: string) => void;
  onSelectGroup: (fullName: string, multi?: { shift: boolean, ctrl: boolean }) => void;
  onToggleCollapse: () => void;
  onSetCollectionEmoji: (name: string, emoji: string | null) => void;
  onSetGroupEmoji: (name: string, emoji: string | null) => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onRefreshClick?: () => void;
  onRenameCollection?: (collectionId: string, newName: string) => void;
  onDeleteCollection?: (collectionId: string) => void;
  onCreateCollection?: () => void;
  onRenameGroup?: (oldFullName: string, newName: string) => void;
  onDuplicateGroup?: (fullName: string) => void;
  onDeleteGroup?: (fullName: string) => void;
  onUngroupGroup?: (fullName: string) => void;
  onReorderCollections?: (newOrder: string[]) => void;
  onReorderGroups?: (collectionId: string, newOrder: string[]) => void;
  customGroupOrder?: Record<string, string[]>;
  onSortAlpha?: () => void;
  isSortedAlpha?: boolean;
  onMoveGroup?: (sourceFullNames: string[], targetCollectionId: string, targetParentPath: string) => void;
  onMergeCollections?: (sourceCollectionId: string, targetCollectionId: string) => void;
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
  selectedGroups = [],
  onToggleCollapse,
  onSetCollectionEmoji,
  onSetGroupEmoji,
  onImportClick,
  onExportClick,
  onRefreshClick,
  onRenameCollection,
  onDeleteCollection,
  onCreateCollection,
  onRenameGroup,
  onDuplicateGroup,
  onDeleteGroup,
  onUngroupGroup,
  onReorderCollections,
  onReorderGroups,
  customGroupOrder = {},
  onSortAlpha,
  isSortedAlpha,
  onMoveGroup,
  onMergeCollections,
}: SidebarProps) {
  const [sectionsCollapsed, setSectionsCollapsed] = useState({ collections: false, groups: false });
  const [isGroupsSortedAlpha, setIsGroupsSortedAlpha] = useState(false);
  const [dragOverInfo, setDragOverInfo] = useState<{
    id: string,
    type: 'collection' | 'group',
    position: 'top' | 'middle' | 'bottom'
  } | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    // Expand first level by default
    return {};
  });

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    collection?: Collection;
    group?: Group;
  } | null>(null);

  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [tempCollectionName, setTempCollectionName] = useState("");

  const [editingGroupFullName, setEditingGroupFullName] = useState<string | null>(null);
  const [tempGroupName, setTempGroupName] = useState("");

  const toggleFolder = (fullName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [fullName]: !prev[fullName] }));
  };

  const collapseAllGroups = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders({});
  };

  const handleCollectionContextMenu = (e: React.MouseEvent, collection: Collection) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      collection
    });
  };

  const handleGroupContextMenu = (e: React.MouseEvent, group: Group) => {
    if (group.fullName === 'All') return;
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      group
    });
  };

  const handleStartCollectionRename = (collection: Collection) => {
    setEditingCollectionId(collection.id || collection.name);
    setTempCollectionName(collection.name);
    setContextMenu(null);
  };

  const handleStartGroupRename = (group: Group) => {
    setEditingGroupFullName(group.fullName);
    setTempGroupName(group.name);
    setContextMenu(null);
  };

  const handleCollectionRenameBlur = (collection: Collection) => {
    if (editingCollectionId && tempCollectionName.trim() && onRenameCollection) {
      onRenameCollection(collection.id || collection.name, tempCollectionName.trim());
    }
    setEditingCollectionId(null);
  };

  const handleGroupRenameBlur = (group: Group) => {
    if (editingGroupFullName && tempGroupName.trim() && onRenameGroup) {
      onRenameGroup(group.fullName, tempGroupName.trim());
    }
    setEditingGroupFullName(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, type: 'collection' | 'group', item: any) => {
    if (e.key === "Enter") {
      if (type === 'collection') handleCollectionRenameBlur(item);
      else handleGroupRenameBlur(item);
    } else if (e.key === "Escape") {
      if (type === 'collection') setEditingCollectionId(null);
      else setEditingGroupFullName(null);
    }
  };

  if (collapsed) {
    // ... (collapsed view remains similar or updated if needed, 
    // but user focus is on the expanded view mostly)
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
                className={`flex items-center justify-center rounded cursor-pointer transition-colors my-[1px] ${isSelected
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
          {groups.filter(g => g.fullName === 'All').map((grp) => {
            const isSelected = selectedGroup === grp.fullName;
            const emoji = groupEmojis[grp.fullName];
            return (
              <button
                key={grp.fullName}
                onClick={() => onSelectGroup(grp.fullName)}
                title={grp.name}
                className={`flex items-center justify-center rounded cursor-pointer transition-colors my-[1px] ${isSelected
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
    <div className="flex flex-col h-full bg-white" style={{ width: 220 }}>
      {/* Sidebar Header */}
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
          <span className="text-[11px] text-[#333]">Variables</span>
        </div>

        {/* Swapped: Reload is now in the top header */}
        <div className="flex items-center gap-0.5">
          {onRefreshClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onRefreshClick(); }}
              className="text-[#999] hover:text-[#333] p-1 cursor-pointer"
              title="Reload variables"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Collections section label */}
        <div
          className="flex items-center justify-between px-2 border-b border-[#e5e5e5] bg-[#fafafa]"
          style={{ height: 28 }}
        >
          <div
            className="flex items-center gap-1 cursor-pointer flex-1"
            onClick={() => setSectionsCollapsed((s: any) => ({ ...s, collections: !s.collections }))}
          >
            {sectionsCollapsed.collections ? <ChevronRight size={12} className="text-[#999]" /> : <ChevronDown size={12} className="text-[#999]" />}
            <span className="text-[10px] text-[#999] uppercase tracking-wider font-semibold">Collections</span>
          </div>
          <div className="flex items-center gap-0.5">
            {/* Alphabetical sort button */}
            <button
              className={`p-1 rounded hover:bg-[#eee] transition-colors ${isSortedAlpha ? 'text-[#0d99ff] bg-[#0d99ff]/5' : 'text-[#999]'}`}
              onClick={(e) => { e.stopPropagation(); onSortAlpha?.(); }}
              title="Sort alphabetically"
            >
              <ArrowDownAz size={12} />
            </button>
            <button
              className="text-[#999] hover:text-[#333] p-1 cursor-pointer"
              title="Add collection"
              onClick={(e) => { e.stopPropagation(); onCreateCollection?.(); }}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {!sectionsCollapsed.collections && (
          <div className="flex flex-col">
            {collections.map((col) => {
              const isSelected = selectedCollection === col.name;
              const isCollectionEditing = editingCollectionId === (col.id || col.name);

              return (
                <SidebarDnDItem
                  key={col.id || col.name}
                  id={col.id || col.name}
                  type="SIDEBAR_COLLECTION"
                  accept={['SIDEBAR_COLLECTION', 'SIDEBAR_GROUP']}
                  data={{ id: col.id || col.name, type: 'collection' }}
                  draggable={!isCollectionEditing}
                  onDropItem={(data, position) => {
                    if (data.type === 'group') {
                      onMoveGroup?.(data.sources, col.id || col.name, '');
                    } else if (data.type === 'collection') {
                      if (position === 'middle') {
                        onMergeCollections?.(data.id, col.id || col.name);
                      } else if (position) {
                        // Manual reorder
                        const currentOrder = collections.map(c => c.id || c.name);
                        let newOrder = [...currentOrder];
                        newOrder = newOrder.filter(id => id !== data.id);
                        const targetIdx = newOrder.indexOf(col.id || col.name);
                        if (targetIdx !== -1) {
                          const insertIdx = position === 'top' ? targetIdx : targetIdx + 1;
                          newOrder.splice(insertIdx, 0, data.id);
                          onReorderCollections?.(newOrder);
                        }
                      }
                    }
                  }}
                >
                  {({ isDragging, isOver, position, setNodeRef }) => (
                    <div
                      ref={setNodeRef}
                      onClick={() => onSelectCollection(col.name)}
                      onDoubleClick={(e) => { e.stopPropagation(); handleStartCollectionRename(col); }}
                      onContextMenu={(e) => handleCollectionContextMenu(e, col)}
                      className={`flex items-center gap-2 px-3 py-[5px] cursor-pointer transition-colors group/col relative outline-none ${isSelected
                        ? "bg-[#0d99ff]/10 text-[#0d99ff]"
                        : "text-[#333] hover:bg-[#f5f5f5]"
                        } ${isOver && position === 'middle' ? 'ring-1 ring-inset ring-[#0d99ff]' : ''} ${isDragging ? 'opacity-50' : ''}`}
                    >
                      {isOver && position === 'top' && (
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#0d99ff] z-10" />
                      )}
                      {isOver && position === 'bottom' && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0d99ff] z-10" />
                      )}
                      <EmojiPicker
                        currentEmoji={collectionEmojis[col.name] || null}
                        defaultLetter={col.name[0]}
                        onSelect={(emoji) => onSetCollectionEmoji(col.name, emoji)}
                      />
                      {editingCollectionId === (col.id || col.name) ? (
                        <input
                          type="text"
                          autoFocus
                          value={tempCollectionName}
                          onChange={(e) => setTempCollectionName(e.target.value)}
                          onBlur={() => handleCollectionRenameBlur(col)}
                          onKeyDown={(e) => handleRenameKeyDown(e, 'collection', col)}
                          className="text-[11px] bg-white border border-[#0d99ff] outline-none px-1 py-0.5 rounded flex-1 min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-[11px] flex-1 truncate">{col.name}</span>
                      )}
                      <span
                        className={`text-[11px] ${isSelected ? "text-[#0d99ff]/70" : "text-[#999]"
                          }`}
                      >
                        {col.count}
                      </span>
                    </div>
                  )}
                </SidebarDnDItem>
              );
            })}
          </div>
        )}

        {/* Groups section label */}
        <div
          className={`flex items-center justify-between px-2 border-b border-[#e5e5e5] bg-[#fafafa] ${sectionsCollapsed.collections ? "" : "mt-2 border-t"}`}
          style={{ height: 28 }}
        >
          <div
            className="flex items-center gap-1 cursor-pointer flex-1"
            onClick={() => setSectionsCollapsed((s: any) => ({ ...s, groups: !s.groups }))}
          >
            {sectionsCollapsed.groups ? <ChevronRight size={12} className="text-[#999]" /> : <ChevronDown size={12} className="text-[#999]" />}
            <span className="text-[10px] text-[#999] uppercase tracking-wider font-semibold">Groups</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              className={`p-1 rounded hover:bg-[#eee] transition-colors ${isGroupsSortedAlpha ? 'text-[#0d99ff] bg-[#0d99ff]/5' : 'text-[#999]'}`}
              onClick={(e) => { e.stopPropagation(); setIsGroupsSortedAlpha(!isGroupsSortedAlpha); }}
              title="Sort groups alphabetically"
            >
              <ArrowDownAz size={12} />
            </button>
            <button
              onClick={collapseAllGroups}
              className="text-[#999] hover:text-[#333] p-1 cursor-pointer"
              title="Collapse all"
            >
              <ChevronsUp size={12} />
            </button>
          </div>
        </div>

        {/* Group items (Hierarchical) */}
        {!sectionsCollapsed.groups && (
          <div className="flex flex-col">
            {[...groups].sort((a, b) => {
              if (a.fullName === 'All') return -1;
              if (b.fullName === 'All') return 1;

              if (isGroupsSortedAlpha) {
                return a.name.localeCompare(b.name);
              }

              const colId = collections.find(c => c.name === selectedCollection)?.id || selectedCollection;
              const order = customGroupOrder[colId] || [];
              const idxA = order.indexOf(a.fullName);
              const idxB = order.indexOf(b.fullName);

              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              if (idxA !== -1) return -1;
              if (idxB !== -1) return 1;

              return 0;
            }).map((grp) => {
              const isSelected = selectedGroups.includes(grp.fullName);
              const isExpanded = expandedFolders[grp.fullName];
              const emoji = groupEmojis[grp.fullName];

              const pathParts = grp.fullName.split('/');
              const parentPath = pathParts.slice(0, -1).join('/');

              // Only hide if it's not top-level and parent is collapsed
              if (parentPath && parentPath !== 'All' && !expandedFolders[parentPath]) {
                if (grp.fullName !== 'All') return null;
              }

              const isGroupEditing = editingGroupFullName === grp.fullName;

              return (
                <SidebarDnDItem
                  key={grp.fullName}
                  id={grp.fullName}
                  type="SIDEBAR_GROUP"
                  accept={['SIDEBAR_GROUP']}
                  draggable={grp.fullName !== 'All' && !isGroupEditing}
                  data={{ sources: selectedGroups.includes(grp.fullName) ? selectedGroups : [grp.fullName], type: 'group' }}
                  onDropItem={(data, position) => {
                    if (data.type === 'group') {
                      const targetId = grp.fullName;
                      const colId = collections.find(c => c.name === selectedCollection)?.id || selectedCollection;

                      if (position === 'middle') {
                        // Nesting logic: targetParentPath becomes targetId, meaning drop inside the target group
                        let targetParentPath = targetId === 'All' ? '' : targetId;
                        const filteredSources = data.sources.filter((s: string) => s !== targetParentPath && !targetParentPath.startsWith(s + '/'));
                        if (filteredSources.length > 0) {
                          onMoveGroup?.(filteredSources, colId, targetParentPath);
                        }
                      } else if (position) {
                        // Reordering / placing adjacent
                        let targetParentPath = targetId === 'All' ? '' : targetId.split('/').slice(0, -1).join('/');

                        // We must ensure we don't accidentally move a parent into its own child.
                        const isChildOfSource = data.sources.some((s: string) => targetParentPath === s || targetParentPath.startsWith(s + '/'));

                        if (!isChildOfSource) {
                          const filteredSources = data.sources.filter((s: string) => s !== targetParentPath);
                          if (filteredSources.length > 0) {
                            onMoveGroup?.(filteredSources, colId, targetParentPath);
                          }
                        }

                        // Reordering logic
                        const currentOrder = customGroupOrder[colId] || groups.map(g => g.fullName);

                        // Find all sources AND their descendants in the exact order they currently appear
                        const sourcesWithDescendants = currentOrder.filter(id =>
                          data.sources.some((s: string) => id === s || id.startsWith(s + '/'))
                        );

                        // Remove them from the array
                        let newOrder = currentOrder.filter(id => !sourcesWithDescendants.includes(id));

                        // Predict new names if the hierarchy changed
                        const renamedSourcesWithDescendants = sourcesWithDescendants.map(id => {
                          const source = data.sources.find((s: string) => id === s || id.startsWith(s + '/'));
                          if (!source) return id;

                          const sourceParentPath = source.split('/').slice(0, -1).join('/');
                          if (sourceParentPath === targetParentPath) return id; // No parent change

                          const sourceName = source.split('/').pop() || source;
                          const relativePath = id.substring(source.length);
                          return targetParentPath
                            ? `${targetParentPath}/${sourceName}${relativePath}`
                            : `${sourceName}${relativePath}`;
                        });

                        // Insert at target
                        if (position === 'top') {
                          const targetIdx = newOrder.indexOf(targetId);
                          if (targetIdx !== -1) {
                            newOrder.splice(targetIdx, 0, ...renamedSourcesWithDescendants);
                            onReorderGroups?.(colId, newOrder);
                          }
                        } else if (position === 'bottom') {
                          // Find targetId and all its descendants to insert AFTER the entire target subtree
                          const targetSubtree = currentOrder.filter(id => id === targetId || id.startsWith(targetId + '/'));
                          const targetSubtreeInNewOrder = newOrder.filter(id => targetSubtree.includes(id));
                          const lastTargetId = targetSubtreeInNewOrder[targetSubtreeInNewOrder.length - 1] || targetId;

                          const targetIdx = newOrder.indexOf(lastTargetId);
                          if (targetIdx !== -1) {
                            newOrder.splice(targetIdx + 1, 0, ...renamedSourcesWithDescendants);
                            onReorderGroups?.(colId, newOrder);
                          }
                        }
                      }
                    }
                  }}
                >
                  {({ isDragging, isOver, position, setNodeRef }) => (
                    <div
                      ref={setNodeRef}
                      onClick={(e) => {
                        onSelectGroup(grp.fullName, { shift: e.shiftKey, ctrl: e.metaKey || e.ctrlKey });
                      }}
                      onDoubleClick={(e) => {
                        if (grp.fullName !== 'All') {
                          e.stopPropagation();
                          handleStartGroupRename(grp);
                        }
                      }}
                      onContextMenu={(e) => handleGroupContextMenu(e, grp)}
                      className={`flex items-center gap-1.5 py-[5px] cursor-pointer transition-colors group/row select-none relative outline-none ${isSelected
                        ? "bg-[#0d99ff]/10 text-[#0d99ff]"
                        : "text-[#333] hover:bg-[#f5f5f5]"
                        } ${isOver && position === 'middle' ? 'ring-1 ring-inset ring-[#0d99ff]' : ''} ${isDragging ? 'opacity-50' : ''}`}
                      style={{ paddingLeft: (grp.level * 12) + 12, paddingRight: 12 }}
                    >
                      {isOver && position === 'top' && (
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#0d99ff] z-10" />
                      )}
                      {isOver && position === 'bottom' && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0d99ff] z-10" />
                      )}
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {grp.isFolder && (
                          <button
                            onClick={(e) => toggleFolder(grp.fullName, e)}
                            className="text-[#999] hover:text-[#333]"
                          >
                            {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                          </button>
                        )}
                      </div>
                      <div className="shrink-0">
                        <EmojiPicker
                          currentEmoji={groupEmojis[grp.fullName] || null}
                          defaultLetter={grp.isFolder ? undefined : grp.name[0]}
                          onSelect={(emoji) => onSetGroupEmoji(grp.fullName, emoji)}
                          customIcon={grp.isFolder ? (isExpanded ? <FolderOpen size={12} className="text-[#999]" /> : <Folder size={12} className="text-[#999]" />) : undefined}
                        />
                      </div>
                      {editingGroupFullName === grp.fullName ? (
                        <input
                          type="text"
                          autoFocus
                          value={tempGroupName}
                          onChange={(e) => setTempGroupName(e.target.value)}
                          onBlur={() => handleGroupRenameBlur(grp)}
                          onKeyDown={(e) => handleRenameKeyDown(e, 'group', grp)}
                          className="text-[11px] bg-white border border-[#0d99ff] outline-none px-1 py-0.5 rounded flex-1 min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-[11px] flex-1 truncate">{grp.name}</span>
                      )}
                      <span
                        className={`text-[10px] ${isSelected ? "text-[#0d99ff]/70" : "text-[#999]"
                          }`}
                      >
                        {grp.count}
                      </span>
                    </div>
                  )}
                </SidebarDnDItem>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom buttons */}
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

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-[101] bg-white border border-[#e5e5e5] rounded shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.collection && (
              <>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5]"
                  onClick={() => handleStartCollectionRename(contextMenu.collection!)}
                >
                  <Type size={12} className="text-[#999]" />
                  Rename
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5]"
                  onClick={() => {
                    onExportClick();
                    setContextMenu(null);
                  }}
                >
                  <Upload size={12} className="text-[#999]" />
                  Export Modes
                </button>
                <div className="h-[1px] bg-[#e5e5e5] my-1" />
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-red-500 hover:bg-red-50"
                  onClick={() => {
                    if (onDeleteCollection) onDeleteCollection(contextMenu.collection!.id || contextMenu.collection!.name);
                    setContextMenu(null);
                  }}
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </>
            )}

            {contextMenu.group && (
              <>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5]"
                  onClick={() => handleStartGroupRename(contextMenu.group!)}
                >
                  <Type size={12} className="text-[#999]" />
                  Rename
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5]"
                  onClick={() => {
                    if (onUngroupGroup) onUngroupGroup(contextMenu.group!.fullName);
                    setContextMenu(null);
                  }}
                >
                  <Layers size={12} className="text-[#999]" />
                  Ungroup
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-[#333] hover:bg-[#f5f5f5]"
                  onClick={() => {
                    if (onDuplicateGroup) onDuplicateGroup(contextMenu.group!.fullName);
                    setContextMenu(null);
                  }}
                >
                  <Copy size={12} className="text-[#999]" />
                  Duplicate
                </button>
                <div className="h-[1px] bg-[#e5e5e5] my-1" />
                <button
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] text-red-500 hover:bg-red-50"
                  onClick={() => {
                    if (onDeleteGroup) onDeleteGroup(contextMenu.group!.fullName);
                    setContextMenu(null);
                  }}
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}