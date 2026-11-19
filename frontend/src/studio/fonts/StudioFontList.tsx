import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import { allFonts, FontDef, useFontReady } from './fontLoader';

interface StudioFontListProps {
  selectedFont: string;
  onSelectFont: (font: FontDef) => void;
  className?: string;
}

const CATEGORIES = ['All', 'Sans-Serif', 'Serif', 'Display', 'Monospace', 'Handwriting'] as const;

interface FontRowProps {
  font: FontDef;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: () => void;
  listRef: React.RefObject<HTMLUListElement | null>;
}

const FontRow: React.FC<FontRowProps> = ({ font, isSelected, isFocused, onSelect, listRef }) => {
  const rowRef = useRef<HTMLLIElement | null>(null);
  const ready = useFontReady(font, rowRef, listRef);

  useEffect(() => {
    if (isFocused && rowRef.current) {
      rowRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isFocused]);

  return (
    <li
      ref={rowRef}
      role="option"
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      onClick={onSelect}
      className={`h-[44px] min-h-[44px] px-3 border-b border-[var(--border)] flex items-center justify-between cursor-pointer select-none transition-colors outline-none ${
        isSelected
          ? 'bg-[var(--bg-raised)] border-l-[3px] border-l-[var(--accent)] text-[var(--accent-text)]'
          : 'hover:bg-[var(--bg-raised)] text-[var(--ink)]'
      } ${isFocused ? 'ring-2 ring-[var(--accent)] ring-inset' : ''}`}
    >
      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
        {isSelected && (
          <Check className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
        )}
        <span
          className={`text-[16px] truncate ${ready ? '' : 'text-[var(--ink-muted)] opacity-70'}`}
          style={{
            fontFamily: ready ? `"${font.family}", var(--font-body)` : 'var(--font-body)',
          }}
        >
          {font.family}
        </span>
        {!ready && (
          <span className="inline-block w-8 h-2 rounded bg-[var(--border-strong)] animate-pulse opacity-40 ml-1.5" />
        )}
      </div>

      <span className="font-mono text-[11px] uppercase text-[var(--ink-muted)] tracking-wider flex-shrink-0">
        {font.category}
      </span>
    </li>
  );
};

export const StudioFontList: React.FC<StudioFontListProps> = ({
  selectedFont,
  onSelectFont,
  className = '',
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const listRef = useRef<HTMLUListElement | null>(null);

  const filteredFonts = useMemo(() => {
    return (allFonts as FontDef[]).filter((f) => {
      const matchesCategory =
        selectedCategory === 'All' || f.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = f.family.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredFonts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredFonts.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredFonts.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredFonts.length) {
        onSelectFont(filteredFonts[focusedIndex]);
      }
    }
  };

  return (
    <div className={`flex flex-col flex-1 min-h-0 w-full ${className}`}>
      {/* Search Header & Result Count */}
      <div className="space-y-1.5 pb-2">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-[var(--ink-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFocusedIndex(-1);
            }}
            placeholder="Search fonts..."
            className="w-full bg-[var(--bg-raised)] text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] rounded-[var(--radius-sm)] pl-8 pr-7 py-2 border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFocusedIndex(-1);
              }}
              className="absolute right-2 p-0.5 rounded text-[var(--ink-muted)] hover:text-[var(--ink)]"
              aria-label="Clear font search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between px-0.5 text-[11px] font-mono text-[var(--ink-muted)]">
          <span>CURATED TYPEFACES</span>
          <span>{filteredFonts.length} fonts</span>
        </div>
      </div>

      {/* Category Chips Bar with Edge Mask */}
      <div className="relative pb-2">
        <div
          className="flex gap-2 overflow-x-auto scrollbar-none py-0.5"
          style={{
            scrollbarWidth: 'none',
            maskImage: 'linear-gradient(to right, black 88%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 88%, transparent 100%)',
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setFocusedIndex(-1);
                }}
                className={`h-8 px-3 rounded-[var(--radius-sm)] text-[11px] font-mono whitespace-nowrap transition-colors flex items-center justify-center ${
                  isActive
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-medium shadow-none'
                    : 'bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--border-strong)]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrolling Font List */}
      <div className="flex-1 min-h-0 relative border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg-surface)] overflow-hidden">
        {filteredFonts.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6 text-center text-xs text-[var(--ink-muted)]">
            No fonts match
          </div>
        ) : (
          <ul
            ref={listRef}
            role="listbox"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label="Curated Typefaces List"
            className="h-full overflow-y-auto slim-scroll divide-y divide-[var(--border)] focus:outline-none"
          >
            {filteredFonts.map((f, idx) => {
              const isSelected = selectedFont.toLowerCase() === f.family.toLowerCase();
              return (
                <FontRow
                  key={f.family}
                  font={f}
                  isSelected={isSelected}
                  isFocused={focusedIndex === idx}
                  onSelect={() => onSelectFont(f)}
                  listRef={listRef}
                />
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
