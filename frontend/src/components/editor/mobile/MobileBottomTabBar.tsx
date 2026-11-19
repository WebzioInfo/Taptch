import React, { useRef, useState, useEffect } from 'react';
import {
  LayoutTemplate,
  Type,
  Upload,
  Palette,
  Shapes,
  Sparkles,
  Layers,
} from 'lucide-react';

export type MobileTabId = 'templates' | 'text' | 'uploads' | 'background' | 'elements' | 'artwork' | 'layers';

interface MobileBottomTabBarProps {
  activeTab: MobileTabId | null;
  onSelectTab: (tab: MobileTabId) => void;
}

const TABS: { id: MobileTabId; label: string; icon: React.ElementType }[] = [
  { id: 'templates', label: 'Layouts', icon: LayoutTemplate },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'background', label: 'Colors', icon: Palette },
  { id: 'elements', label: 'Shapes', icon: Shapes },
  { id: 'artwork', label: 'Artwork', icon: Sparkles },
  { id: 'layers', label: 'Layers', icon: Layers },
];

export const MobileBottomTabBar: React.FC<MobileBottomTabBarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--bg-surface)] border-t border-[var(--border)] pb-safe select-none"
      role="navigation"
      aria-label="Studio Mobile Tools"
    >
      <div className="relative h-16 min-h-[64px] flex items-center">
        {/* Left Fade Hint */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[var(--bg-surface)] to-transparent pointer-events-none z-10" />
        )}

        {/* Scrollable Tab Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="w-full h-full flex items-center overflow-x-auto no-scrollbar snap-x snap-mandatory px-1 sm:px-2 divide-x divide-transparent"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`snap-center flex-shrink-0 min-w-[62px] sm:min-w-[70px] flex-1 h-full flex flex-col items-center justify-center py-1 px-1 transition-all outline-none ${
                  isActive
                    ? 'text-[var(--accent-text)] bg-[var(--bg-raised)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)] active:bg-[var(--bg-raised)]/50'
                }`}
                title={tab.label}
                aria-selected={isActive}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 mb-0.5" />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                  )}
                </div>
                <span className="font-mono text-[10px] tracking-tight truncate max-w-full">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Fade Hint */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[var(--bg-surface)] to-transparent pointer-events-none z-10" />
        )}
      </div>
    </nav>
  );
};
