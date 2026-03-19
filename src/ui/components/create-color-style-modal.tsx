import React, { useState, useEffect } from "react";
import { X, Palette, Search, ChevronDown } from "lucide-react";
import type { Variable } from "./variables-data";

interface CreateColorStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: Variable[];
  onCreate: (name: string, tokenId: string) => void;
}

export function CreateColorStyleModal({ isOpen, onClose, tokens, onCreate }: CreateColorStyleModalProps) {
  const [styleName, setStyleName] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStyleName("");
      setSelectedTokenId("");
      setSearchQuery("");
      setShowDropdown(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const colorTokens = tokens.filter(t => t.type === "color");
  const filteredTokens = colorTokens.filter(t => 
    t.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedToken = colorTokens.find(t => t.id === selectedTokenId);

  const handleCreate = () => {
    if (styleName.trim() && selectedTokenId) {
      onCreate(styleName.trim(), selectedTokenId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px]" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl border border-[#e5e5e5] w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] bg-[#fcfcfc] rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#0d99ff]/10 rounded-md text-[#0d99ff]">
              <Palette size={16} />
            </div>
            <h3 className="text-sm font-bold text-[#333]">Create Color Style</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-[#999] hover:text-[#333] p-1 rounded-md hover:bg-[#f5f5f5] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5">
          {/* Style Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider ml-0.5">
              Style Name
            </label>
            <input
              type="text"
              placeholder="e.g. Brand / Primary"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              className="w-full bg-[#f5f5f5] border border-transparent focus:border-[#0d99ff] focus:bg-white rounded-md px-3 py-2 text-[12px] text-[#333] outline-none transition-all placeholder:text-[#bbb]"
              autoFocus
            />
          </div>

          {/* Token Selector (Dropdown + Input) */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider ml-0.5">
              Select Color Token
            </label>
            
            <div className="relative">
              <div 
                className={`w-full bg-[#f5f5f5] border rounded-md px-3 py-2 flex items-center justify-between cursor-pointer transition-all ${showDropdown ? 'border-[#0d99ff] bg-white ring-2 ring-[#0d99ff]/10' : 'border-transparent hover:bg-[#eee]'}`}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {selectedToken ? (
                    <>
                      <div 
                        className="w-3.5 h-3.5 rounded-sm border border-black/10 shrink-0" 
                        style={{ backgroundColor: selectedToken.valuesByMode[Object.keys(selectedToken.valuesByMode)[0]]?.colorSwatch || '#eee' }}
                      />
                      <span className="text-[12px] text-[#333] truncate">{selectedToken.path}</span>
                    </>
                  ) : (
                    <span className="text-[12px] text-[#bbb]">Choose a token...</span>
                  )}
                </div>
                <ChevronDown size={14} className={`text-[#999] transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </div>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e5e5e5] rounded-lg shadow-xl z-[1100] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Search inside dropdown */}
                    <div className="p-2 border-b border-[#f5f5f5] bg-[#fafafa]">
                      <div className="flex items-center gap-2 bg-white border border-[#e5e5e5] rounded px-2.5 py-1.5 focus-within:border-[#0d99ff] transition-colors">
                        <Search size={12} className="text-[#999]" />
                        <input
                          type="text"
                          placeholder="Search tokens..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-transparent text-[11px] outline-none border-none p-0"
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Token List */}
                    <div className="max-h-[220px] overflow-y-auto p-1">
                      {filteredTokens.length === 0 ? (
                        <div className="py-6 text-center text-[#999] text-[11px]">No tokens found</div>
                      ) : (
                        filteredTokens.map(token => (
                          <button
                            key={token.id}
                            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-[#f5f5f5] rounded-md transition-colors text-left ${selectedTokenId === token.id ? 'bg-[#0d99ff]/5' : ''}`}
                            onClick={() => {
                              setSelectedTokenId(token.id);
                              if (!styleName) setStyleName(token.name);
                              setShowDropdown(false);
                            }}
                          >
                            <div 
                              className="w-3.5 h-3.5 rounded-sm border border-black/10 shrink-0" 
                              style={{ backgroundColor: token.valuesByMode[Object.keys(token.valuesByMode)[0]]?.colorSwatch || '#eee' }}
                            />
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
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-[#fcfcfc] border-t border-[#e5e5e5] flex items-center justify-end gap-3 rounded-b-lg">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[12px] font-medium text-[#666] hover:text-[#333] hover:bg-[#f0f0f0] rounded-md transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!styleName.trim() || !selectedTokenId}
            className={`px-4 py-2 text-[12px] font-bold text-white bg-[#0d99ff] rounded-md shadow-sm transition-all ${(!styleName.trim() || !selectedTokenId) ? 'opacity-50 cursor-not-allowed grayscale-[0.5]' : 'hover:bg-[#0b7fd4] hover:shadow-md active:scale-[0.98]'}`}
          >
            Create Style
          </button>
        </div>
      </div>
    </div>
  );
}
