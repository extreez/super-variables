import React, { useState, useEffect } from "react";
import { X, Sparkles, Hash, Palette } from "lucide-react";
import type { Variable } from "./variables-data";
import { TokenSelectField } from "./token-select-field";

type EffectType = "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";

interface CreateEffectStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: Variable[];
  onCreate: (name: string, config: EffectConfig) => void;
}

export interface EffectConfig {
  type: EffectType;
  colorId?: string;
  offsetXId?: string;
  offsetYId?: string;
  radiusId?: string;
  spreadId?: string;
}

export function CreateEffectStyleModal({ isOpen, onClose, tokens, onCreate }: CreateEffectStyleModalProps) {
  const [styleName, setStyleName] = useState("");
  const [effectType, setEffectType] = useState<EffectType>("DROP_SHADOW");
  const [config, setConfig] = useState<Omit<EffectConfig, 'type'>>({});

  useEffect(() => {
    if (isOpen) {
      setStyleName("");
      setEffectType("DROP_SHADOW");
      setConfig({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (styleName.trim()) {
      onCreate(styleName.trim(), { ...config, type: effectType });
      onClose();
    }
  };

  const updateConfig = (key: keyof Omit<EffectConfig, 'type'>, id: string) => {
    setConfig(prev => ({ ...prev, [key]: id }));
  };

  const isShadow = effectType === "DROP_SHADOW" || effectType === "INNER_SHADOW";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-2xl border border-[#e5e5e5] w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] bg-[#fcfcfc] rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#0d99ff]/10 rounded-md text-[#0d99ff]">
              <Sparkles size={16} />
            </div>
            <h3 className="text-sm font-bold text-[#333]">Create Effect Style</h3>
          </div>
          <button onClick={onClose} className="text-[#999] hover:text-[#333] p-1 rounded-md hover:bg-[#f5f5f5] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Style Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#999] uppercase tracking-wider ml-0.5">
              Style Name
            </label>
            <input
              type="text"
              placeholder="e.g. Elevation / High"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              className="w-full bg-[#f5f5f5] border border-transparent focus:border-[#0d99ff] focus:bg-white rounded-md px-3 py-2 text-[12px] text-[#333] outline-none transition-all placeholder:text-[#bbb]"
              autoFocus
            />
          </div>

          {/* Effect Type Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#999] uppercase tracking-wider ml-0.5">
              Effect Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["DROP_SHADOW", "INNER_SHADOW", "LAYER_BLUR", "BACKGROUND_BLUR"] as EffectType[]).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setEffectType(type);
                    setConfig({}); // Reset config when type changes
                  }}
                  className={`px-3 py-2 text-[10px] font-medium rounded-md border transition-all text-center ${effectType === type ? 'bg-[#0d99ff] border-[#0d99ff] text-white' : 'bg-white border-[#e5e5e5] text-[#666] hover:border-[#ccc]'}`}
                >
                  {type.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {isShadow ? (
            <>
              <TokenSelectField 
                label="Shadow Color" 
                icon={<Palette size={12} />}
                selectedTokenId={config.colorId || ""}
                onSelect={(id) => updateConfig("colorId", id)}
                tokens={tokens}
                typeFilter="color"
                placeholder="Select color..."
              />
              <div className="grid grid-cols-2 gap-4">
                <TokenSelectField 
                  label="X Offset" 
                  icon={<Hash size={12} />}
                  selectedTokenId={config.offsetXId || ""}
                  onSelect={(id) => updateConfig("offsetXId", id)}
                  tokens={tokens}
                  typeFilter="number"
                  placeholder="0"
                />
                <TokenSelectField 
                  label="Y Offset" 
                  icon={<Hash size={12} />}
                  selectedTokenId={config.offsetYId || ""}
                  onSelect={(id) => updateConfig("offsetYId", id)}
                  tokens={tokens}
                  typeFilter="number"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <TokenSelectField 
                  label="Blur" 
                  icon={<Hash size={12} />}
                  selectedTokenId={config.radiusId || ""}
                  onSelect={(id) => updateConfig("radiusId", id)}
                  tokens={tokens}
                  typeFilter="number"
                  placeholder="0"
                />
                <TokenSelectField 
                  label="Spread" 
                  icon={<Hash size={12} />}
                  selectedTokenId={config.spreadId || ""}
                  onSelect={(id) => updateConfig("spreadId", id)}
                  tokens={tokens}
                  typeFilter="number"
                  placeholder="0"
                />
              </div>
            </>
          ) : (
            <TokenSelectField 
              label="Blur Radius" 
              icon={<Hash size={12} />}
              selectedTokenId={config.radiusId || ""}
              onSelect={(id) => updateConfig("radiusId", id)}
              tokens={tokens}
              typeFilter="number"
              placeholder="0"
            />
          )}
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
