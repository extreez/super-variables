import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import type { Variable } from "./variables-data";

interface TokenSelectFieldProps {
  label: string;
  icon?: React.ReactNode;
  selectedTokenId: string;
  onSelect: (id: string) => void;
  tokens: Variable[];
  placeholder: string;
  typeFilter: "color" | "number" | "string" | "boolean";
}

export function TokenSelectField({ label, icon, selectedTokenId, onSelect, tokens, placeholder, typeFilter }: TokenSelectFieldProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTokens = tokens.filter(t => 
    t.type === typeFilter && 
    (t.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
     t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedToken = tokens.find(t => t.id === selectedTokenId);

  return (
    <div className="flex flex-col gap-1.5 relative">
      <label className="text-[10px] font-bold text-[#999] uppercase tracking-wider ml-0.5 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      
      <div className="relative">
        <div 
          className={`w-full bg-[#f5f5f5] border rounded-md px-3 py-1.5 flex items-center justify-between cursor-pointer transition-all ${showDropdown ? 'border-[#0d99ff] bg-white ring-2 ring-[#0d99ff]/10' : 'border-transparent hover:bg-[#eee]'}`}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="flex items-center gap-2 min-w-0">
            {selectedToken ? (
              <>
                {typeFilter === 'color' && (
                  <div 
                    className="w-3 h-3 rounded-sm border border-black/10 shrink-0" 
                    style={{ backgroundColor: selectedToken.valuesByMode[Object.keys(selectedToken.valuesByMode)[0]]?.colorSwatch || '#eee' }}
                  />
                )}
                <span className="text-[11px] text-[#333] truncate">{selectedToken.path}</span>
              </>
            ) : (
              <span className="text-[11px] text-[#bbb]">{placeholder}</span>
            )}
          </div>
          <ChevronDown size={12} className={`text-[#999] transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
        </div>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-[1100]" onClick={() => setShowDropdown(false)} />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e5e5e5] rounded-lg shadow-xl z-[1200] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-2 border-b border-[#f5f5f5] bg-[#fafafa]">
                <div className="flex items-center gap-2 bg-white border border-[#e5e5e5] rounded px-2 py-1 focus-within:border-[#0d99ff] transition-colors">
                  <Search size={10} className="text-[#999]" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-[11px] outline-none border-none p-0"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-[160px] overflow-y-auto p-1">
                {filteredTokens.length === 0 ? (
                  <div className="py-4 text-center text-[#999] text-[10px]">No tokens found</div>
                ) : (
                  filteredTokens.map(token => (
                    <button
                      key={token.id}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f5] rounded-md transition-colors text-left ${selectedTokenId === token.id ? 'bg-[#0d99ff]/5' : ''}`}
                      onClick={() => {
                        onSelect(token.id);
                        setShowDropdown(false);
                      }}
                    >
                      {typeFilter === 'color' && (
                        <div 
                          className="w-3 h-3 rounded-sm border border-black/10 shrink-0" 
                          style={{ backgroundColor: token.valuesByMode[Object.keys(token.valuesByMode)[0]]?.colorSwatch || '#eee' }}
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[11px] truncate font-medium ${selectedTokenId === token.id ? 'text-[#0d99ff]' : 'text-[#333]'}`}>
                          {token.path}
                        </span>
                        <span className="text-[9px] text-[#999] truncate">
                          {token.valuesByMode[Object.keys(token.valuesByMode)[0]]?.value}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
