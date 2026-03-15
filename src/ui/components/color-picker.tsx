import React, { useState, useEffect, useRef } from "react";
import { X, Search, Unlink, Droplet } from "lucide-react";
import { TokenPicker } from "./token-picker";

export interface ColorPickerProps {
  anchorEl: HTMLElement | null;
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

type ColorModel = "hex" | "rgb" | "hsl" | "hsb" | "rgba";

export function ColorPicker({
  anchorEl,
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
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [color, setColor] = useState({ r: 255, g: 0, b: 0, a: 1 });
  const [colorModel, setColorModel] = useState<ColorModel>("hex");
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [pickerPosition, setPickerPosition] = useState({ x: 50, y: 50 });

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
  }, [currentValue, anchorEl]);

  useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const containerWidth = 240;
      const containerHeight = 450;

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
    onSelectColor({ r: newColor.r / 255, g: newColor.g / 255, b: newColor.b / 255, a: newColor.a });
  };

  const handlePickerChange = (x: number, y: number) => {
    setPickerPosition({ x, y });
    const newSat = x;
    const newBright = 100 - y;
    setSaturation(newSat);
    setBrightness(newBright);
    const rgb = hslToRgb(hue, newSat, newBright);
    handleColorChange({ ...rgb, a: color.a });
  };

  const handleHueChange = (newHue: number) => {
    setHue(newHue);
    const rgb = hslToRgb(newHue, saturation, brightness);
    handleColorChange({ ...rgb, a: color.a });
  };

  const handleAlphaChange = (newAlpha: number) => {
    handleColorChange({ ...color, a: newAlpha });
  };

  const getColorValue = () => {
    switch (colorModel) {
      case "hex":
        return rgbToHex(color.r, color.g, color.b) + (color.a < 1 ? Math.round(color.a * 255).toString(16).padStart(2, "0") : "");
      case "rgb":
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
      case "rgba":
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
      case "hsl":
        const hsl = rgbToHsl(color.r, color.g, color.b);
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      case "hsb":
        return `hsb(${hue}, ${saturation}%, ${brightness}%)`;
      default:
        return rgbToHex(color.r, color.g, color.b);
    }
  };

  const handleColorValueChange = (value: string) => {
    if (colorModel === "hex") {
      const hex = value.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      handleColorChange({ r, g, b, a: color.a });
    } else if (colorModel === "rgb" || colorModel === "rgba") {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (match) {
        handleColorChange({
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3]),
          a: match[4] ? parseFloat(match[4]) : color.a
        });
      }
    }
  };

  // Filter by type ONLY - search across ALL collections
  const filteredTokens = tokens.filter(t => {
    const typeMatch = t.type.toLowerCase() === "color";
    const libraryMatch = selectedLibrary === "all" || t.collectionId === selectedLibrary;
    const searchMatch = searchQuery === "" || t.path.toLowerCase().includes(searchQuery.toLowerCase());
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
      className="fixed z-[1000] bg-white rounded-lg shadow-2xl border border-[#e5e5e5] w-[240px] overflow-hidden"
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
        <span className="text-[11px] font-bold text-[#333] pointer-events-none">Color</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="text-[#999] hover:text-[#333] p-0.5 cursor-pointer transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[#e5e5e5]">
        <button
          onClick={() => setActiveTab("custom")}
          className={`flex-1 text-[10px] py-2 transition-colors ${activeTab === "custom" ? "text-[#0d99ff] border-b-2 border-[#0d99ff] font-bold" : "text-[#666] hover:text-[#333]"
            }`}
        >
          Custom
        </button>
        <button
          onClick={() => setActiveTab("tokens")}
          className={`flex-1 text-[10px] py-2 transition-colors ${activeTab === "tokens" ? "text-[#0d99ff] border-b-2 border-[#0d99ff] font-bold" : "text-[#666] hover:text-[#333]"
            }`}
        >
          Tokens
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto p-2">
        {activeTab === "custom" ? (
          <div className="flex flex-col gap-2">
            {/* Color Picker Square */}
            <div className="relative w-full aspect-square rounded border border-[#e5e5e5] cursor-crosshair">
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  handlePickerChange(Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y)));
                }}
              />
              <div
                className="absolute w-3 h-3 border-2 border-white rounded-full shadow-lg pointer-events-none"
                style={{
                  left: `${pickerPosition.x}%`,
                  top: `${pickerPosition.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>

            {/* Eyedropper + Sliders */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => parent.postMessage({ pluginMessage: { type: "request-eyedropper" } }, "*")}
                className="flex items-center justify-center gap-1 text-[9px] text-[#666] bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded px-2 h-[40px] transition-colors"
              >
                <Droplet size={14} />
                Pick
              </button>
              <div className="flex-1 flex flex-col gap-1">
                {/* Hue */}
                <div className="relative h-4 rounded overflow-hidden">
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)" }} />
                  <input type="range" min="0" max="360" value={hue} onChange={(e) => handleHueChange(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="absolute top-0 w-2.5 h-4 border-2 border-white rounded-full shadow pointer-events-none" style={{ left: `${(hue / 360) * 100}%`, transform: "translateX(-50%)" }} />
                </div>
                {/* Alpha */}
                <div className="relative h-4 rounded overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNjY2MiLz48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+PC9zdmc+')]">
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to right, transparent, hsla(${hue}, ${saturation}%, ${brightness}%, 1))` }} />
                  <input type="range" min="0" max="100" value={color.a * 100} onChange={(e) => handleAlphaChange(parseInt(e.target.value) / 100)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="absolute top-0 w-2.5 h-4 border-2 border-white rounded-full shadow pointer-events-none" style={{ left: `${color.a * 100}%`, transform: "translateX(-50%)" }} />
                </div>
              </div>
            </div>

            {/* Model + Value + Alpha */}
            <div className="flex items-center gap-1">
              <select
                value={colorModel}
                onChange={(e) => setColorModel(e.target.value as ColorModel)}
                className="text-[9px] text-[#333] bg-white border border-[#e5e5e5] rounded px-1 py-1 outline-none focus:border-[#0d99ff] shrink-0"
                style={{ width: 52 }}
              >
                <option value="hex">HEX</option>
                <option value="rgb">RGB</option>
                <option value="rgba">RGBA</option>
                <option value="hsl">HSL</option>
                <option value="hsb">HSB</option>
              </select>
              <input
                type="text"
                value={getColorValue()}
                onChange={(e) => handleColorValueChange(e.target.value)}
                className="flex-1 min-w-0 text-[9px] text-[#333] bg-white border border-[#e5e5e5] rounded px-1.5 py-1 outline-none focus:border-[#0d99ff]"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={Math.round(color.a * 100)}
                onChange={(e) => handleAlphaChange(parseInt(e.target.value) / 100)}
                className="w-10 text-[9px] text-[#333] bg-white border border-[#e5e5e5] rounded px-1 py-1 outline-none focus:border-[#0d99ff] shrink-0"
              />
              <span className="text-[9px] text-[#999] shrink-0">%</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Search */}
            <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-md px-2.5 py-1.5">
              <Search size={12} className="text-[#999] shrink-0" />
              <input
                type="text"
                placeholder="Search colors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-[11px] text-[#333] placeholder-[#bbb] outline-none flex-1"
              />
            </div>

            {/* Library & Unlink */}
            <div className="flex items-center justify-between gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowLibraryDropdown(!showLibraryDropdown)}
                  className="flex items-center gap-1.5 text-[10px] font-medium text-[#555] bg-white border border-[#e5e5e5] rounded px-2 py-0.5 hover:bg-[#f5f5f5]"
                >
                  {selectedLibrary === "all" ? "All Libraries" : collections.find(c => c.id === selectedLibrary)?.name}
                </button>
                {showLibraryDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLibraryDropdown(false)} />
                    <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e5e5] rounded-md shadow-xl py-1 z-50 min-w-[140px]">
                      <button onClick={() => { setSelectedLibrary("all"); setShowLibraryDropdown(false); }} className={`w-full text-left px-3 py-1.5 text-[10px] hover:bg-[#f5f5f5] ${selectedLibrary === "all" ? "text-[#0d99ff] font-semibold bg-[#0d99ff]/5" : "text-[#333]"}`}>All Libraries</button>
                      {collections.map(col => (
                        <button key={col.id} onClick={() => { setSelectedLibrary(col.id); setShowLibraryDropdown(false); }} className={`w-full text-left px-3 py-1.5 text-[10px] hover:bg-[#f5f5f5] ${selectedLibrary === col.id ? "text-[#0d99ff] font-semibold bg-[#0d99ff]/5" : "text-[#333]"}`}>{col.name} {col.isRemote && " 📦"}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {onUnlink && currentTokenId && (
                <button onClick={() => { onUnlink(); onClose(); }} className="flex items-center gap-1 text-[10px] font-medium text-[#dc2626] hover:bg-[#fef2f2] px-2 py-1 rounded transition-colors">
                  <Unlink size={10} />
                  Unlink
                </button>
              )}
            </div>

            {/* Token List */}
            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
              {sortedCollections.length === 0 ? (
                <div className="text-center py-6 text-[10px] text-[#999]">No tokens found</div>
              ) : (
                sortedCollections.map(([collectionName, collectionGroups]) => (
                  <div key={collectionName} className="flex flex-col gap-1">
                    {/* Collection Header */}
                    <div className="text-[11px] font-bold text-[#000] px-1.5 py-1 bg-[#f8f8f8] rounded border border-[#f0f0f0] mb-0.5">
                      {collectionName}
                    </div>

                    {Object.entries(collectionGroups).sort((a, b) => {
                      if (a[0] === "Root") return -1;
                      if (b[0] === "Root") return 1;
                      return a[0].localeCompare(b[0]);
                    }).map(([groupPath, groupTokens]) => (
                      <div key={groupPath} className="mb-1 last:mb-0">
                        {groupPath !== "Root" && (
                          <div className="text-[10px] font-semibold text-[#666] px-1.5 py-0.5 flex items-center gap-1.5">
                            <div className="w-1 h-2.5 bg-[#e5e5e5] rounded-full" />
                            {groupPath}
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                          {groupTokens.map(token => (
                            <button
                              key={token.id}
                              onClick={() => { onSelectToken(token.id, token.path); onClose(); }}
                              className={`flex items-center gap-2 px-2 py-1.5 hover:bg-[#f5f5f5] rounded-md transition-all group/token ${currentTokenId === token.id ? "bg-[#0d99ff]/10 text-[#0d99ff]" : "text-[#333]"}`}
                            >
                              <div className="w-3.5 h-3.5 rounded-sm border border-[#000]/10 shadow-sm shrink-0" style={{ backgroundColor: token.colorSwatch }} />
                              <span className="text-[10px] flex-1 truncate text-left font-medium group-hover/token:translate-x-0.5 transition-transform">{token.path}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
