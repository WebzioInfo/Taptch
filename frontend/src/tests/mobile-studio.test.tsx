import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MobileStudioTopBar } from '../components/editor/mobile/MobileStudioTopBar';
import { MobileBottomTabBar } from '../components/editor/mobile/MobileBottomTabBar';
import { MobileBottomSheet } from '../components/editor/mobile/MobileBottomSheet';
import { MobileInspectorSheet } from '../components/editor/mobile/MobileInspectorSheet';
import { MobileStudioShell } from '../components/editor/mobile/MobileStudioShell';
import { useEditorStore } from '../components/editor/useEditorStore';

// Mock react-router-dom navigate
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams()],
}));

describe('Mobile NFC Card Design Studio (/studio)', () => {
  beforeEach(() => {
    useEditorStore.setState({
      designName: 'Obsidian Smart Card',
      activeSide: 'front',
      frontHistory: ['state1', 'state2'],
      backHistory: ['state1'],
      frontRedoStack: [],
      backRedoStack: [],
      selectedObjectId: null,
      selectedObjectProps: null,
      showGuides: true,
      zoom: 1.0,
    });
  });

  describe('Compact Mobile Top Bar (56px)', () => {
    it('renders compact sticky top bar with back button, truncated title, undo/redo, side switch, and overflow menu', () => {
      const html = renderToString(
        <MobileStudioTopBar
          title="Obsidian Smart Card"
          onOpenPreview={vi.fn()}
          onOpenExport={vi.fn()}
        />
      );

      // Height constraint: 56px (h-14)
      expect(html).toContain('h-14');
      expect(html).toContain('sticky top-0');

      // Back navigation & Title
      expect(html).toContain('aria-label="Back to Cards"');
      expect(html).toContain('Obsidian Smart Card');

      // Side switcher: Front / Back toggle
      expect(html).toContain('aria-label="Switch Card Side"');
      expect(html).toContain('Front');

      // Undo & Redo buttons
      expect(html).toContain('aria-label="Undo"');
      expect(html).toContain('aria-label="Redo"');

      // Overflow menu button ("...")
      expect(html).toContain('aria-label="More Options"');
    });
  });

  describe('Bottom Tab Bar (64px fixed)', () => {
    it('renders all 7 studio tool tabs with icon + label and safe area padding', () => {
      const html = renderToString(
        <MobileBottomTabBar
          activeTab={null}
          onSelectTab={vi.fn()}
        />
      );

      // Height constraint: 64px (h-16) + pb-safe + fixed bottom
      expect(html).toContain('h-16');
      expect(html).toContain('fixed bottom-0');
      expect(html).toContain('pb-safe');

      // All 7 tool tabs present
      expect(html).toContain('Layouts');
      expect(html).toContain('Text');
      expect(html).toContain('Uploads');
      expect(html).toContain('Colors');
      expect(html).toContain('Shapes');
      expect(html).toContain('Artwork');
      expect(html).toContain('Layers');
    });
  });

  describe('Contextual Inspector Bottom Sheet', () => {
    it('does not render an empty "NO SELECTION" column on mobile when nothing is selected', () => {
      useEditorStore.setState({ selectedObjectId: null, selectedObjectProps: null });

      const html = renderToString(
        <MobileInspectorSheet
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      // Must be empty string
      expect(html).toBe('');
    });

    it('renders comprehensive properties sheet with 16px input font size when a text element is selected', () => {
      const mockSelectedProps = {
        id: 'text_1',
        name: 'Executive Title',
        type: 'i-text',
        text: 'ALEXANDER VANCE',
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: '700',
        fill: '#FFFFFF',
        opacity: 1,
      };

      const html = renderToString(
        <MobileInspectorSheet
          isOpen={true}
          onClose={vi.fn()}
          selectedObjectId="text_1"
          selectedObjectProps={mockSelectedProps}
        />
      );

      // Check text properties
      expect(html).toContain('ALEXANDER VANCE');
      expect(html).toContain('Font Family');
      expect(html).toContain('Inter');
      expect(html).toContain('Bold (700)');

      // Critical mobile rule: 16px font size on inputs to prevent iOS auto-zoom
      expect(html).toContain('text-[16px]');

      // Quick action controls
      expect(html).toContain('aria-label="Bring Forward"');
      expect(html).toContain('aria-label="Send Backward"');
      expect(html).toContain('aria-label="Duplicate Element"');
      expect(html).toContain('aria-label="Delete Element"');
      expect(html).toContain('aria-label="Toggle Lock"');
    });
  });

  describe('Mobile Studio Shell Integration', () => {
    it('displays the auto-scaled canvas stage and tap-to-edit hint when idle', () => {
      useEditorStore.setState({ selectedObjectId: null, selectedObjectProps: null });

      const html = renderToString(
        <MobileStudioShell
          onOpenPreview={vi.fn()}
          onOpenExport={vi.fn()}
        />
      );

      // Canvas stage present
      expect(html).toContain('Tap an element to edit');
      expect(html).toContain('Studio Mobile Tools');
    });
  });
});
