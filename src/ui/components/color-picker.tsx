import React, { useState, useEffect, useRef } from "react";
import { X, Search, Link2, Unlink, Droplet } from "lucide-react";
import { TokenPicker } from "./token-picker";

export interface ColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectColor: (color: { r: number; g: number; b: number; a: number }) => void;
  onSelectToken: (tokenId: string, tokenName: string) => void;
  onUnlink?: () => void;
  currentTokenId?: string | null;
  currentValue?: {
    type: "color" | "alias";
    r?: number;
    g?: number;
    b?: number;
    a?: number;
    id?: string;
    name?: string;
  };
  tokens: {
    id: string;
    name: string;
    path: string;
    type: string;
    collectionId: string;
    collectionName?: string;
    value?: string;
    colorSwatch?: string;
  }[];
  collections: {
    id: string;
    name: string;
    isRemote?: boolean;
  }[];
}

type ColorModel = "hex" | "rgb" | "hsl" | "hsb" | "css";

export function ColorPicker({
  isOpen,
  onClose,
  onSelectColor,
  onSelectToken,
  onUnlink,
  currentTokenId,
  currentValue,
  tokens,
  collections,
}: ColorPickerProps) {
  const [activeTab, setActiveTab] = useState<"custom" | "tokens">("custom");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLibrary, setSelectedLibrary] = useState<string>("all");
  const [showLibraryDropdown, setShowLibraryDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Color state
  const [color, setColor] = useState({ r: 255, g: 0, b: 0, a: 1 });
  const [colorModel, setColorModel] = useState<ColorModel>("hex");
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);

  // Initialize color from current value
  useEffect(() => {
    if (currentValue?.type === "color") {
      const r = Math.round((currentValue.r || 0) * 255);
      const g = Math.round((currentValue.g || 0) * 255);
      const b = Math.round((currentValue.b || 0) * 255);
      const a = currentValue.a || 1;
      setColor({ r, g, b, a });

      const hsl = rgbToHsl(r, g, b);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setBrightness(hsl.l);
    }
  }, [currentValue, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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

  // Color conversion utilities
  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  };

  const handleColorChange = (newColor: { r: number; g: number; b: number; a: number }) => {
    setColor(newColor);
    onSelectColor({
      r: newColor.r / 255,
      g: newColor.g / 255,
      b: newColor.b / 255,
      a: newColor.a,
    });
  };

  const handleHueChange = (newHue: number) => {
    setHue(newHue);
    const rgb = hslToRgb(newHue, saturation, brightness);
    handleColorChange({ ...rgb, a: color.a });
  };

  const handleSaturationChange = (newSat: number) => {
    setSaturation(newSat);
    const rgb = hslToRgb(hue, newSat, brightness);
    handleColorChange({ ...rgb, a: color.a });
  };

  const handleBrightnessChange = (newBright: number) => {
    setBrightness(newBright);
    const rgb = hslToRgb(hue, saturation, newBright);
    handleColorChange({ ...rgb, a: color.a });
  };

  const handleAlphaChange = (newAlpha: number) => {
    handleColorChange({ ...color, a: newAlpha });
  };

  const handleColorModelChange = (model: ColorModel) => {
    setColorModel(model);
  };

  const getColorValue = () => {
    switch (colorModel) {
      case "hex":
        return rgbToHex(color.r, color.g, color.b) + (color.a < 1 ? Math.round(color.a * 255).toString(16).padStart(2, "0") : "");
      case "rgb":
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
      case "hsl":
        const hsl = rgbToHsl(color.r, color.g, color.b);
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      case "hsb":
        return `hsb(${hue}, ${saturation}%, ${brightness}%)`;
      case "css":
        return `var(--color)`;
      default:
        return rgbToHex(color.r, color.g, color.b);
    }
  };

  const handleColorValueChange = (value: string) => {
    // Parse color value based on model
    if (colorModel === "hex") {
      const hex = value.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      handleColorChange({ r, g, b, a: color.a });
    } else if (colorModel === "rgb") {
      const match = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        handleColorChange({
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3]),
          a: color.a,
        });
      }
    }
  };

  // Filter tokens for Tokens tab
  const filteredTokens = tokens.filter(t => {
    const typeMatch = t.type.toLowerCase() === "color";
    const libraryMatch = selectedLibrary === "all" || t.collectionId === selectedLibrary;
    const searchMatch = searchQuery === "" ||
      t.path.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && libraryMatch && searchMatch;
  });

  // Group tokens
  const groupedTokens: Record<string, typeof filteredTokens> = {};
  filteredTokens.forEach(token => {
    const pathParts = token.path.split("/");
    pathParts.pop();
    const groupPath = pathParts.join("/") || "Root";
    if (!groupedTokens[groupPath]) groupedTokens[groupPath] = [];
    groupedTokens[groupPath].push(token);
  });

  const sortedGroups = Object.entries(groupedTokens).sort((a, b) => {
    if (a[0] === "Root") return -1;
    if (b[0] === "Root") return 1;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <div
        ref={containerRef}
        className="relative bg-white rounded-lg shadow-2xl border border-[#e5e5e5] w-[420px] overflow-hidden animate-in fade-in zoom-in duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5]">
          <span className="text-[13px] font-semibold text-[#333]">Choose Color</span>
          <button onClick={onClose} className="text-[#999] hover:text-[#333] p-1 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-[#e5e5e5]">
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex-1 text-[12px] py-2.5 transition-colors ${activeTab === "custom"
              ? "text-[#0d99ff] border-b-2 border-[#0d99ff] font-medium"
              : "text-[#666] hover:text-[#333]"
              }`}
          >
            Custom
          </button>
          <button
            onClick={() => setActiveTab("tokens")}
            className={`flex-1 text-[12px] py-2.5 transition-colors ${activeTab === "tokens"
              ? "text-[#0d99ff] border-b-2 border-[#0d99ff] font-medium"
              : "text-[#666] hover:text-[#333]"
              }`}
          >
            Tokens
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[450px] overflow-y-auto">
          {activeTab === "custom" ? (
            <div className="p-4 flex flex-col gap-4">
              {/* Color Preview */}
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-lg border border-[#e5e5e5] shadow-inner shrink-0"
                  style={{ backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})` }}
                />
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    value={getColorValue()}
                    onChange={(e) => handleColorValueChange(e.target.value)}
                    className="text-[12px] text-[#333] bg-white border border-[#e5e5e5] rounded px-2 py-1.5 outline-none focus:border-[#0d99ff]"
                  />
                  <div className="flex items-center gap-2">
                    {(["hex", "rgb", "hsl", "hsb", "css"] as ColorModel[]).map(model => (
                      <button
                        key={model}
                        onClick={() => handleColorModelChange(model)}
                        className={`text-[10px] px-2 py-1 rounded transition-colors ${colorModel === model
                          ? "bg-[#0d99ff] text-white"
                          : "bg-[#f5f5f5] text-[#666] hover:bg-[#e5e5e5]"
                          }`}
                      >
                        {model.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color Picker - Saturation/Brightness */}
              <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[#e5e5e5] cursor-crosshair">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to top, #000, transparent),
                                 linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
                  }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width;
                    const y = 1 - (e.clientY - rect.top) / rect.height;
                    setSaturation(Math.round(x * 100));
                    setBrightness(Math.round(y * 100));
                    const rgb = hslToRgb(hue, Math.round(x * 100), Math.round(y * 100));
                    handleColorChange({ ...rgb, a: color.a });
                  }}
                />
                <div
                  className="absolute w-3 h-3 border-2 border-white rounded-full shadow-lg pointer-events-none"
                  style={{
                    left: `${saturation}%`,
                    top: `${100 - brightness}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>

              {/* Sliders */}
              <div className="flex flex-col gap-3">
                {/* Hue */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded border border-[#e5e5e5] shrink-0"
                    style={{ backgroundColor: `hsl(${hue}, ${saturation}%, ${brightness}%)` }}
                  />
                  <div className="flex-1 relative h-4 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
                      }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={hue}
                      onChange={(e) => handleHueChange(parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="absolute top-0 w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
                      style={{ left: `${(hue / 360) * 100}%`, transform: "translateX(-50%)", height: "100%" }}
                    />
                  </div>
                </div>

                {/* Alpha */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded border border-[#e5e5e5] shrink-0"
                    style={{
                      background: `linear-gradient(to right, transparent, hsl(${hue}, ${saturation}%, ${brightness}%))`,
                    }}
                  />
                  <div className="flex-1 relative h-4 rounded-full overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNjY2MiLz48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+PC9zdmc+')]">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to right, transparent, hsla(${hue}, ${saturation}%, ${brightness}%, 1))`,
                      }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={color.a * 100}
                      onChange={(e) => handleAlphaChange(parseInt(e.target.value) / 100)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="absolute top-0 w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
                      style={{ left: `${color.a * 100}%`, transform: "translateX(-50%)", height: "100%" }}
                    />
                  </div>
                </div>
              </div>

              {/* Alpha Input */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#999] w-12">Opacity</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(color.a * 100)}
                  onChange={(e) => handleAlphaChange(parseInt(e.target.value) / 100)}
                  className="flex-1 text-[12px] text-[#333] bg-white border border-[#e5e5e5] rounded px-2 py-1.5 outline-none focus:border-[#0d99ff]"
                />
                <span className="text-[11px] text-[#999]">%</span>
              </div>

              {/* Eyedropper */}
              <button
                onClick={() => {
                  parent.postMessage({ pluginMessage: { type: "request-eyedropper" } }, "*");
                }}
                className="flex items-center justify-center gap-2 text-[11px] text-[#666] bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded px-3 py-2 transition-colors"
              >
                <Droplet size={14} />
                Pick from canvas
              </button>
            </div>
          ) : (
            /* Tokens Tab */
            <div className="p-4 flex flex-col gap-3">
              {/* Search */}
              <div className="flex items-center gap-2 bg-[#f5f5f5] rounded px-3 py-2">
                <Search size={14} className="text-[#999] shrink-0" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-[12px] text-[#333] placeholder-[#bbb] outline-none flex-1"
                />
              </div>

              {/* Library & Unlink */}
              <div className="flex items-center justify-between gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowLibraryDropdown(!showLibraryDropdown)}
                    className="flex items-center gap-2 text-[11px] text-[#333] bg-white border border-[#e5e5e5] rounded px-3 py-1.5 hover:bg-[#f5f5f5]"
                  >
                    {selectedLibrary === "all" ? "All Libraries" : collections.find(c => c.id === selectedLibrary)?.name}
                  </button>
                  {showLibraryDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowLibraryDropdown(false)} />
                      <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e5e5] rounded shadow-lg py-1 z-20 min-w-[180px]">
                        <button
                          onClick={() => { setSelectedLibrary("all"); setShowLibraryDropdown(false); }}
                          className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-[#f5f5f5] ${selectedLibrary === "all" ? "text-[#0d99ff]" : "text-[#333]"}`}
                        >
                          All Libraries
                        </button>
                        {collections.map(col => (
                          <button
                            key={col.id}
                            onClick={() => { setSelectedLibrary(col.id); setShowLibraryDropdown(false); }}
                            className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-[#f5f5f5] ${selectedLibrary === col.id ? "text-[#0d99ff]" : "text-[#333]"}`}
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
                    onClick={() => { onUnlink(); onClose(); }}
                    className="flex items-center gap-1.5 text-[11px] text-[#dc2626] hover:bg-[#fef2f2] px-3 py-1.5 rounded"
                  >
                    <Unlink size={12} />
                    Unlink
                  </button>
                )}
              </div>

              {/* Token List */}
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                {sortedGroups.length === 0 ? (
                  <div className="text-center py-8 text-[11px] text-[#999]">No tokens found</div>
                ) : (
                  sortedGroups.map(([groupPath, groupTokens]) => (
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
                            onClick={() => { onSelectToken(token.id, token.path); onClose(); }}
                            className={`flex items-center gap-3 px-3 py-2 hover:bg-[#f5f5f5] rounded transition-colors ${currentTokenId === token.id ? "bg-[#0d99ff]/10" : ""
                              }`}
                          >
                            <div
                              className="w-6 h-6 rounded border border-[#e5e5e5] shrink-0"
                              style={{ backgroundColor: token.colorSwatch }}
                            />
                            <span className="text-[11px] text-[#333] flex-1 truncate text-left">
                              {token.path}
                            </span>
                            {token.collectionName && (
                              <span className="text-[9px] text-[#999] bg-[#f5f5f5] px-1.5 py-0.5 rounded">
                                {token.collectionName}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
