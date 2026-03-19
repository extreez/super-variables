import React, { useState, useEffect } from "react";
import { X, Type, Search, ChevronDown, Hash, CaseSensitive } from "lucide-react";
import type { Variable } from "./variables-data";

interface CreateTypographyStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: Variable[];
  onCreate: (name: string, config: TypographyConfig) => void;
}

export interface TypographyConfig {
  fontFamilyId?: string;
  fontWeightId?: string;
  fontSizeId?: string;
  lineHeightId?: string;
  letterSpacingId?: string;
}

interface TokenSelectProps {
  label: string;
  icon: React.ReactNode;
  selectedTokenId: string;
  onSelect: (id: string) => void;
  tokens: Variable[];
  placeholder: string;
  typeFilter: "string" | "number";
}

function TokenSelect({ label, icon, selectedTokenId, onSelect, tokens, placeholder, typeFilter }: TokenSelectProps) {
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
              <span className="text-[11px] text-[#333] truncate">{selectedToken.path}</span>
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
                      className={`w-full flex flex-col px-3 py-1.5 hover:bg-[#f5f5f5] rounded-md transition-colors text-left ${selectedTokenId === token.id ? 'bg-[#0d99ff]/5' : ''}`}
                      onClick={() => {
                        onSelect(token.id);
                        setShowDropdown(false);
                      }}
                    >
                      <span className={`text-[11px] truncate font-medium ${selectedTokenId === token.id ? 'text-[#0d99ff]' : 'text-[#333]'}`}>
                        {token.path}
                      </span>
                      <span className="text-[9px] text-[#999] truncate">
                        {token.valuesByMode[Object.keys(token.valuesByMode)[0]]?.value}
                      </span>
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

export function CreateTypographyStyleModal({ isOpen, onClose, tokens, onCreate }: CreateTypographyStyleModalProps) {
  const [styleName, setStyleName] = useState("");
  const [config, setConfig] = useState<TypographyConfig>({});

  useEffect(() => {
    if (isOpen) {
      setStyleName("");
      setConfig({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (styleName.trim()) {
      onCreate(styleName.trim(), config);
      onClose();
    }
  };

  const updateConfig = (key: keyof TypographyConfig, id: string) => {
    setConfig(prev => ({ ...prev, [key]: id }));
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-2xl border border-[#e5e5e5] w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] bg-[#fcfcfc] rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#0d99ff]/10 rounded-md text-[#0d99ff]">
              <Type size={16} />
            </div>
            <h3 className="text-sm font-bold text-[#333]">Create Typography Style</h3>
          </div>
          <button onClick={onClose} className="text-[#999] hover:text-[#333] p-1 rounded-md hover:bg-[#f5f5f5] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#999] uppercase tracking-wider ml-0.5">
              Style Name
            </label>
            <input
              type="text"
              placeholder="e.g. Body / Regular"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              className="w-full bg-[#f5f5f5] border border-transparent focus:border-[#0d99ff] focus:bg-white rounded-md px-3 py-2 text-[12px] text-[#333] outline-none transition-all placeholder:text-[#bbb]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TokenSelect 
              label="Font Family" 
              icon={<CaseSensitive size={12} />}
              selectedTokenId={config.fontFamilyId || ""}
              onSelect={(id) => updateConfig("fontFamilyId", id)}
              tokens={tokens}
              typeFilter="string"
              placeholder="Select family..."
            />
            <TokenSelect 
              label="Font Weight" 
              icon={<CaseSensitive size={12} />}
              selectedTokenId={config.fontWeightId || ""}
              onSelect={(id) => updateConfig("fontWeightId", id)}
              tokens={tokens}
              typeFilter="string"
              placeholder="Select weight..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <TokenSelect 
              label="Size" 
              icon={<Hash size={12} />}
              selectedTokenId={config.fontSizeId || ""}
              onSelect={(id) => updateConfig("fontSizeId", id)}
              tokens={tokens}
              typeFilter="number"
              placeholder="Size..."
            />
            <TokenSelect 
              label="Line Height" 
              icon={<Hash size={12} />}
              selectedTokenId={config.lineHeightId || ""}
              onSelect={(id) => updateConfig("lineHeightId", id)}
              tokens={tokens}
              typeFilter="number"
              placeholder="Auto..."
            />
            <TokenSelect 
              label="Spacing" 
              icon={<Hash size={12} />}
              selectedTokenId={config.letterSpacingId || ""}
              onSelect={(id) => updateConfig("letterSpacingId", id)}
              tokens={tokens}
              typeFilter="number"
              placeholder="0..."
            />
          </div>
        </div>

        <div className="px-5 py-4 bg-[#fcfcfc] border-t border-[#e5e5e5] flex items-center justify-end gap-3 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-[12px] font-medium text-[#666] hover:text-[#333] hover:bg-[#f0f0f0] rounded-md transition-all">
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!styleName.trim()}
            className={`px-4 py-2 text-[12px] font-bold text-white bg-[#0d99ff] rounded-md shadow-sm transition-all ${!styleName.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#0b7fd4] hover:shadow-md active:scale-[0.98]'}`}
          >
            Create Style
          </button>
        </div>
      </div>
    </div>
  );
}
