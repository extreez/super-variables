import React, { useState, useEffect, useRef } from "react";
import { X, Search, Unlink, ChevronDown } from "lucide-react";

export interface TokenPickerProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (tokenId: string, tokenName: string) => void;
  onUnlink?: () => void;
  currentTokenId?: string | null;
  tokenType: "color" | "number" | "string" | "boolean";
  tokens: {
    id: string;
    name: string;
    path: string;
    type: string;
    collectionId: string;
    collectionName?: string;
    value?: string;
    colorSwatch?: string;
    isAlias?: boolean;
  }[];
  collections: {
    id: string;
    name: string;
    isRemote?: boolean;
  }[];
}

export function TokenPicker({
  anchorEl,
  onClose,
  onSelect,
  onUnlink,
  currentTokenId,
  tokenType,
  tokens,
  collections,
}: TokenPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLibrary, setSelectedLibrary] = useState<string>("all");
  const [showLibraryDropdown, setShowLibraryDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (anchorEl && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [anchorEl]);

  useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const containerWidth = 220; // Slightly wider for better readability
      const containerHeight = 400;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = rect.left;
      let top = rect.bottom + 6;

      // Ensure it doesn't go off the right edge
      if (left + containerWidth > viewportWidth) {
        left = Math.max(10, viewportWidth - containerWidth - 10);
      }

      // Ensure it doesn't go off the bottom edge
      if (top + containerHeight > viewportHeight) {
        top = Math.max(10, rect.top - containerHeight - 6);
      }
      
      // Ensure it doesn't go off the top edge
      if (top < 10) top = 10;
      // Ensure it doesn't go off the left edge
      if (left < 10) left = 10;

      setPosition({ top, left });
      setDragOffset({ x: 0, y: 0 }); // Reset drag offset on re-open
    }
  }, [anchorEl]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX - dragOffset.x;
    const startY = e.clientY - dragOffset.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setDragOffset({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) &&
        !anchorEl?.contains(e.target as Node)) {
        onClose();
      }
    };
    if (!isDragging) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, anchorEl, isDragging]);

  // Filter by type ONLY - search across ALL collections/libraries
  const typeMap: Record<string, string[]> = {
    color: ["color"],
    number: ["float", "number"],
    string: ["string"],
    boolean: ["boolean"],
  };
  const allowedTypes = typeMap[tokenType] || [tokenType];

  let filteredTokens = tokens.filter(t => {
    const typeMatch = allowedTypes.includes(t.type.toLowerCase());
    // Only filter by library if specific one selected
    const libraryMatch = selectedLibrary === "all" || t.collectionId === selectedLibrary;
    const searchMatch = searchQuery === "" ||
      t.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && libraryMatch && searchMatch;
  });

  // Group by collection first, then by folder
  const groupedByCollection: Record<string, Record<string, typeof filteredTokens>> = {};

  filteredTokens.forEach(token => {
    const collectionName = token.collectionName || "Local";
    if (!groupedByCollection[collectionName]) {
      groupedByCollection[collectionName] = {};
    }

    const pathParts = token.path.split("/");
    pathParts.pop();
    const groupPath = pathParts.join("/") || "Root";
    if (!groupedByCollection[collectionName][groupPath]) {
      groupedByCollection[collectionName][groupPath] = [];
    }
    groupedByCollection[collectionName][groupPath].push(token);
  });

  const sortedCollections = Object.entries(groupedByCollection).sort((a, b) => {
    if (a[0] === "Local") return -1;
    if (b[0] === "Local") return 1;
    return a[0].localeCompare(b[0]);
  });

  if (!anchorEl) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[1000] bg-white rounded-lg shadow-2xl border border-[#e5e5e5] w-[220px] max-h-[400px] flex flex-col overflow-hidden"
      style={{ 
        top: position.top + dragOffset.y, 
        left: position.left + dragOffset.x,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2.5 border-b border-[#e5e5e5] bg-white cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <span className="text-[11px] font-bold text-[#333] pointer-events-none">
          {tokenType === "color" ? "Select Color Token" : `Select ${tokenType.charAt(0).toUpperCase() + tokenType.slice(1)} Token`}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="text-[#999] hover:text-[#333] p-0.5 cursor-pointer transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-md px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-[#0d99ff]/30 transition-shadow">
          <Search size={12} className="text-[#999] shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search variables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[11px] text-[#333] placeholder-[#bbb] outline-none flex-1"
          />
        </div>
      </div>

      {/* Library Dropdown & Unlink */}
      <div className="px-2 py-1.5 border-b border-[#e5e5e5] bg-[#fafafa] flex items-center justify-between gap-2">
        <div className="relative">
          <button
            onClick={() => setShowLibraryDropdown(!showLibraryDropdown)}
            className="flex items-center gap-1.5 text-[10px] font-medium text-[#555] bg-white border border-[#e5e5e5] rounded px-2 py-1 hover:border-[#ccc] hover:bg-[#fff] transition-all"
          >
            {selectedLibrary === "all" ? "All Libraries" : collections.find(c => c.id === selectedLibrary)?.name || "Library"}
            <ChevronDown size={10} className={`text-[#999] transition-transform ${showLibraryDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showLibraryDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLibraryDropdown(false)} />
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e5e5] rounded-md shadow-xl py-1 z-50 min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  onClick={() => { setSelectedLibrary("all"); setShowLibraryDropdown(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[10px] hover:bg-[#f5f5f5] transition-colors ${selectedLibrary === "all" ? "text-[#0d99ff] font-semibold bg-[#0d99ff]/5" : "text-[#333]"}`}
                >
                  All Libraries
                </button>
                {collections.map(col => (
                  <button
                    key={col.id}
                    onClick={() => { setSelectedLibrary(col.id); setShowLibraryDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] hover:bg-[#f5f5f5] transition-colors ${selectedLibrary === col.id ? "text-[#0d99ff] font-semibold bg-[#0d99ff]/5" : "text-[#333]"}`}
                  >
                    {col.name} {col.isRemote && " 📦"}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {onUnlink && currentTokenId && (
          <button
            onClick={() => { onUnlink(); onClose(); }}
            className="flex items-center gap-1 text-[10px] font-medium text-[#dc2626] hover:bg-[#fef2f2] px-2 py-1 rounded transition-colors"
          >
            <Unlink size={10} />
            Unlink
          </button>
        )}
      </div>

      {/* Token List */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {sortedCollections.length === 0 ? (
          <div className="text-center py-8 flex flex-col items-center gap-2">
             <Search size={24} className="text-[#eee]" />
             <span className="text-[11px] text-[#999]">No tokens found</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedCollections.map(([collectionName, collectionGroups]) => (
              <div key={collectionName} className="flex flex-col gap-1">
                {/* Collection Header */}
                <div className="text-[11px] font-bold text-[#000] px-1.5 py-1 bg-[#f8f8f8] rounded border border-[#f0f0f0] mb-1">
                  {collectionName}
                </div>

                {/* Groups within collection */}
                {Object.entries(collectionGroups).sort((a, b) => {
                  if (a[0] === "Root") return -1;
                  if (b[0] === "Root") return 1;
                  return a[0].localeCompare(b[0]);
                }).map(([groupPath, groupTokens]) => (
                  <div key={groupPath} className="mb-1 last:mb-0">
                    {groupPath !== "Root" && (
                      <div className="text-[10px] font-semibold text-[#666] px-1.5 py-1 flex items-center gap-1.5">
                        <div className="w-1 h-3 bg-[#e5e5e5] rounded-full" />
                        {groupPath}
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {groupTokens.map(token => (
                        <button
                          key={token.id}
                          onClick={() => { onSelect(token.id, token.path); onClose(); }}
                          className={`flex items-center gap-2 px-2 py-1.5 hover:bg-[#f5f5f5] rounded-md transition-all group/token ${currentTokenId === token.id ? "bg-[#0d99ff]/10 text-[#0d99ff]" : "text-[#333]"
                            }`}
                        >
                          {/* Preview Icons */}
                          <div className="shrink-0">
                            {token.type.toLowerCase() === "color" && token.colorSwatch ? (
                              <div className="w-3.5 h-3.5 rounded-sm border border-[#000]/10 shadow-sm" style={{ backgroundColor: token.colorSwatch }} />
                            ) : token.type.toLowerCase() === "boolean" ? (
                              <div className={`w-3.5 h-3.5 rounded-sm border shadow-sm ${token.value === "true" ? "bg-[#16a34a] border-[#16a34a]" : "bg-[#e5e5e5] border-[#ccc]"}`} />
                            ) : (token.type.toLowerCase() === "number" || token.type.toLowerCase() === "float") ? (
                              <div className="w-3.5 h-3.5 rounded-sm bg-[#f0f0f0] border border-[#e5e5e5] flex items-center justify-center">
                                <span className="text-[8px] font-bold text-[#999]">#</span>
                              </div>
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-sm bg-[#f0f0f0] border border-[#e5e5e5] flex items-center justify-center">
                                <span className="text-[8px] font-bold text-[#999]">Aa</span>
                              </div>
                            )}
                          </div>

                          <span className="text-[10px] flex-1 truncate text-left font-medium group-hover/token:translate-x-0.5 transition-transform">{token.path}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
