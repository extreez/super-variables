import React, { useState, useEffect, useRef } from "react";
import { X, Search, Link2, Unlink, ChevronDown } from "lucide-react";
import { ColorVariableIcon } from "./variable-icon";

export interface TokenPickerProps {
  isOpen: boolean;
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
  isOpen,
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

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter tokens by type
  const typeMap: Record<string, string[]> = {
    color: ["color"],
    number: ["float", "number"],
    string: ["string"],
    boolean: ["boolean"],
  };
  const allowedTypes = typeMap[tokenType] || [tokenType];

  let filteredTokens = tokens.filter(t => {
    const typeMatch = allowedTypes.includes(t.type.toLowerCase());
    const libraryMatch = selectedLibrary === "all" || t.collectionId === selectedLibrary;
    const searchMatch = searchQuery === "" || 
      t.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && libraryMatch && searchMatch;
  });

  // Group tokens by folder (last level before name)
  const groupedTokens: Record<string, typeof filteredTokens> = {};
  filteredTokens.forEach(token => {
    const pathParts = token.path.split("/");
    pathParts.pop(); // Remove token name
    const groupPath = pathParts.join("/") || "Root";
    if (!groupedTokens[groupPath]) {
      groupedTokens[groupPath] = [];
    }
    groupedTokens[groupPath].push(token);
  });

  // Sort groups alphabetically
  const sortedGroups = Object.entries(groupedTokens).sort((a, b) => {
    if (a[0] === "Root") return -1;
    if (b[0] === "Root") return 1;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      
      {/* Modal */}
      <div
        ref={containerRef}
        className="relative bg-white rounded-lg shadow-2xl border border-[#e5e5e5] w-[400px] max-h-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5]">
          <span className="text-[13px] font-semibold text-[#333]">
            {tokenType === "color" ? "Choose Color" : `Select ${tokenType}`}
          </span>
          <button
            onClick={onClose}
            className="text-[#999] hover:text-[#333] p-1 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-2 bg-[#f5f5f5] rounded px-3 py-2">
            <Search size={14} className="text-[#999] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-[12px] text-[#333] placeholder-[#bbb] outline-none flex-1"
            />
          </div>
        </div>

        {/* Library Dropdown & Unlink */}
        <div className="px-4 py-2 border-b border-[#e5e5e5] flex items-center justify-between gap-2">
          <div className="relative">
            <button
              onClick={() => setShowLibraryDropdown(!showLibraryDropdown)}
              className="flex items-center gap-2 text-[11px] text-[#333] bg-white border border-[#e5e5e5] rounded px-3 py-1.5 hover:bg-[#f5f5f5]"
            >
              {selectedLibrary === "all" 
                ? "All Libraries" 
                : collections.find(c => c.id === selectedLibrary)?.name || "Library"}
              <ChevronDown size={12} className={`transition-transform ${showLibraryDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showLibraryDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLibraryDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e5e5] rounded shadow-lg py-1 z-20 min-w-[180px]">
                  <button
                    onClick={() => {
                      setSelectedLibrary("all");
                      setShowLibraryDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-[#f5f5f5] ${
                      selectedLibrary === "all" ? "text-[#0d99ff]" : "text-[#333]"
                    }`}
                  >
                    All Libraries
                  </button>
                  {collections.map(col => (
                    <button
                      key={col.id}
                      onClick={() => {
                        setSelectedLibrary(col.id);
                        setShowLibraryDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-[#f5f5f5] ${
                        selectedLibrary === col.id ? "text-[#0d99ff]" : "text-[#333]"
                      }`}
                    >
                      {col.name} {col.isRemote && "📦"}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {onUnlink && currentTokenId && (
            <button
              onClick={() => {
                onUnlink();
                onClose();
              }}
              className="flex items-center gap-1.5 text-[11px] text-[#dc2626] hover:bg-[#fef2f2] px-3 py-1.5 rounded"
            >
              <Unlink size={12} />
              Unlink
            </button>
          )}
        </div>

        {/* Token List */}
        <div className="flex-1 overflow-y-auto p-2">
          {sortedGroups.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-[#999]">
              No tokens found
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedGroups.map(([groupPath, groupTokens]) => (
                <div key={groupPath}>
                  {groupPath !== "Root" && (
                    <div className="text-[10px] font-semibold text-[#999] uppercase tracking-wider px-2 py-1">
                      {groupPath}
                    </div>
                  )}
                  <div className="flex flex-col">
                    {groupTokens.map(token => (
                      <button
                        key={token.id}
                        onClick={() => {
                          onSelect(token.id, token.path);
                          onClose();
                        }}
                        className={`flex items-center gap-3 px-3 py-2 hover:bg-[#f5f5f5] rounded transition-colors ${
                          currentTokenId === token.id ? "bg-[#0d99ff]/10" : ""
                        }`}
                      >
                        {/* Preview */}
                        {token.type.toLowerCase() === "color" && token.colorSwatch && (
                          <div
                            className="w-5 h-5 rounded border border-[#e5e5e5] shrink-0"
                            style={{ backgroundColor: token.colorSwatch }}
                          />
                        )}
                        {token.type.toLowerCase() === "boolean" && (
                          <div className={`w-5 h-5 rounded border shrink-0 ${
                            token.value === "true" ? "bg-[#16a34a] border-[#16a34a]" : "bg-[#e5e5e5] border-[#ccc]"
                          }`} />
                        )}
                        {(token.type.toLowerCase() === "number" || token.type.toLowerCase() === "float") && (
                          <div className="w-5 h-5 rounded border border-[#e5e5e5] flex items-center justify-center shrink-0">
                            <span className="text-[9px] text-[#666]">#</span>
                          </div>
                        )}
                        {token.type.toLowerCase() === "string" && (
                          <div className="w-5 h-5 rounded border border-[#e5e5e5] flex items-center justify-center shrink-0">
                            <span className="text-[9px] text-[#666]">Aa</span>
                          </div>
                        )}
                        
                        {/* Name */}
                        <span className="text-[11px] text-[#333] flex-1 truncate text-left">
                          {token.path}
                        </span>
                        
                        {/* Collection badge for remote */}
                        {token.collectionName && (
                          <span className="text-[9px] text-[#999] bg-[#f5f5f5] px-1.5 py-0.5 rounded">
                            {token.collectionName}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
