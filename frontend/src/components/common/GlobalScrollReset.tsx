import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Resets window, document, and any marked nested layout scroll containers
 * to top (0, 0) immediately without affecting modal dialogs.
 */
export function resetActiveScrollContainers(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  } catch {
    // Ignore read-only history environments
  }

  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  } catch {
    window.scrollTo(0, 0);
  }

  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;
  }
  if (document.body) {
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
  }

  const nestedContainers = document.querySelectorAll<HTMLElement>('[data-scroll-container="true"]');
  nestedContainers.forEach((container) => {
    container.scrollTop = 0;
    container.scrollLeft = 0;
  });
}

/**
 * Centralized route-level scroll reset.
 * Triggers on initial mount and whenever `location.pathname` changes,
 * while preserving same-page scroll during query/filter/tab/modal updates.
 */
export const GlobalScrollReset: React.FC = () => {
  const { pathname } = useLocation();
  const prevPathnameRef = useRef<string | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      resetActiveScrollContainers();
    }
  }, [pathname]);

  return null;
};
