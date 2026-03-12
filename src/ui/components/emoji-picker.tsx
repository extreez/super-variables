import React, { useState, useRef, useEffect } from "react";

const EMOJI_LIST = [
  "🎨", "🔤", "📏", "✨", "🔘", "🧩", "🌐",
  "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪",
  "📦", "🎯", "💎", "🔥", "⭐", "💡", "🚀",
  "📐", "🖌️", "🎭", "🧪", "📊", "🏷️", "🗂️",
  "❤️", "💚", "💙", "💛", "💜", "🤍", "🖤",
  "🌈", "☀️", "🌙", "🍃", "💧", "🌸", "🪄",
];

interface EmojiPickerProps {
  currentEmoji: string | null;
  defaultLetter: string;
  onSelect: (emoji: string | null) => void;
}

export function EmojiPicker({ currentEmoji, defaultLetter, onSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center justify-center rounded bg-[#f0f0f0] hover:bg-[#e5e5e5] cursor-pointer transition-colors shrink-0"
        style={{ width: 20, height: 20 }}
        title="Change icon"
      >
        {currentEmoji ? (
          <span style={{ fontSize: 12, lineHeight: 1 }}>{currentEmoji}</span>
        ) : (
          <span className="text-[10px] text-[#999]">{defaultLetter}</span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#e5e5e5] p-2"
          style={{ width: 208 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-7 gap-0.5">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelect(emoji);
                  setIsOpen(false);
                }}
                className="flex items-center justify-center rounded hover:bg-[#f0f0f0] cursor-pointer transition-colors"
                style={{ width: 26, height: 26 }}
              >
                <span style={{ fontSize: 14 }}>{emoji}</span>
              </button>
            ))}
          </div>
          {currentEmoji && (
            <div className="border-t border-[#e5e5e5] mt-1.5 pt-1.5">
              <button
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="text-[10px] text-[#999] hover:text-[#333] cursor-pointer w-full text-center py-0.5"
              >
                Reset to default
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
