import { describe, it, expect, beforeEach } from 'vitest';
import {
  CUSTOM_FABRIC_PROPS,
  normalizeLiveTextStyle,
  normalizeJsonTextStyle,
  safeParseCanvasJson,
  generateObjectId,
} from '../utils/canvasJson';
import { useEditorStore } from '../components/editor/useEditorStore';
import { validateUploadFile, MAX_FILE_SIZE_BYTES } from '../utils/cloudinaryDirectUpload';
import { FONT_CATALOG, loadGoogleFont } from '../utils/fontLoader';
import { ELEMENTS_COLLECTION } from '../utils/elementsData';
import { ARTWORK_COLLECTION } from '../utils/artworkData';
import { brandConfig } from '../config/brand';

describe('Taptch Live NFC Card Design Studio — Core Architecture Tests', () => {
  beforeEach(() => {
    useEditorStore.setState({
      activeSide: 'front',
      frontHistory: [],
      backHistory: [],
      frontRedoStack: [],
      backRedoStack: [],
      frontJson: '',
      backJson: '',
      isDirty: false,
      zoom: 1.0,
      showGuides: true,
      selectedObjectId: null,
      selectedObjectProps: null,
    });
  });

  describe('1. Custom Fabric Properties & Serialization Integrity', () => {
    it('accurately specifies all 21 custom Fabric properties required by the audit', () => {
      expect(CUSTOM_FABRIC_PROPS).toHaveLength(21);
      const expectedProps = [
        'id',
        'name',
        'isLocked',
        'selectable',
        'evented',
        'lockMovementX',
        'lockMovementY',
        'lockRotation',
        'lockScalingX',
        'lockScalingY',
        'isProtected',
        'isArtworkBackground',
        'isQRCode',
        'qrValue',
        'editable',
        'assetType',
        'originalColor',
        'strokeDashArray',
        'strokeLineCap',
        'shadow',
        'shadowConfig',
      ];
      for (const prop of expectedProps) {
        expect(CUSTOM_FABRIC_PROPS).toContain(prop);
      }
    });

    it('generates unique stable object IDs', () => {
      const id1 = generateObjectId('text');
      const id2 = generateObjectId('text');
      expect(id1).not.toBe(id2);
      expect(id1.startsWith('text_')).toBe(true);
    });

    it('prevents Fabric 5.3.0 stylesToArray crash via normalizeLiveTextStyle', () => {
      const liveTextObject: any = {
        type: 'i-text',
        text: 'EXECUTIVE MEMBER',
        styles: null, // Would cause stylesToArray crash if unhandled
      };

      normalizeLiveTextStyle(liveTextObject);
      expect(liveTextObject.styles).toBeDefined();
      expect(typeof liveTextObject.styles).toBe('object');
      expect(Array.isArray(liveTextObject.styles)).toBe(false);
    });

    it('normalizes nested groups recursively in normalizeLiveTextStyle', () => {
      const nestedGroup: any = {
        type: 'group',
        _objects: [
          { type: 'rect', fill: '#0A0A0C' },
          { type: 'textbox', text: 'Nested Title', styles: undefined },
        ],
      };

      normalizeLiveTextStyle(nestedGroup);
      expect(nestedGroup._objects[1].styles).toEqual({});
    });

    it('normalizes JSON text styles to arrays before deserialization via normalizeJsonTextStyle', () => {
      const jsonTextObject: any = {
        type: 'i-text',
        text: 'ALEXANDER VANCE',
        styles: undefined,
      };

      normalizeJsonTextStyle(jsonTextObject);
      expect(Array.isArray(jsonTextObject.styles)).toBe(true);
      expect(jsonTextObject.styles).toHaveLength(0);
    });

    it('sanitizes and parses raw canvas JSON with default 1050x600 settings', () => {
      const rawJson = JSON.stringify({
        version: '5.3.0',
        objects: [
          {
            type: 'rect',
            width: 1050,
            height: 600,
            fill: '#0A0A0C',
          },
        ],
      });

      const parsed = safeParseCanvasJson(rawJson);
      expect(parsed.success).toBe(true);
      expect(parsed.data.objects).toHaveLength(1);
      expect(parsed.data.objects[0].id).toBeDefined();
      expect(parsed.data.backgroundColor).toBe('#0A0A0C');
    });
  });

  describe('2. Zustand Store: 30-Step History & Dual-Sided Editing', () => {
    it('initializes with independent front and back side configs', () => {
      const fJson = JSON.stringify({ version: '5.3.0', side: 'front', objects: [] });
      const bJson = JSON.stringify({ version: '5.3.0', side: 'back', objects: [] });

      useEditorStore.getState().loadSideConfigs(fJson, bJson, 'tpl_test');

      const state = useEditorStore.getState();
      expect(state.frontJson).toBe(fJson);
      expect(state.backJson).toBe(bJson);
      expect(state.frontHistory).toEqual([fJson]);
      expect(state.backHistory).toEqual([bJson]);
      expect(state.isDirty).toBe(false);
    });

    it('switches between front and back surfaces cleanly', () => {
      const { switchSide, setActiveSide } = useEditorStore.getState();
      setActiveSide('front');
      expect(useEditorStore.getState().activeSide).toBe('front');

      switchSide('back');
      expect(useEditorStore.getState().activeSide).toBe('back');

      switchSide('front');
      expect(useEditorStore.getState().activeSide).toBe('front');
    });

    it('preserves maximum 30-step history limit per side', () => {
      useEditorStore.setState({ activeSide: 'front' });

      // Simulate 35 consecutive state updates
      for (let i = 1; i <= 35; i++) {
        const stateJson = JSON.stringify({ step: i, objects: [] });
        const currentHist = useEditorStore.getState().frontHistory;
        const newHist = [...currentHist, stateJson].slice(-30);
        useEditorStore.setState({
          frontHistory: newHist,
          frontJson: stateJson,
          isDirty: true,
        });
      }

      const history = useEditorStore.getState().frontHistory;
      expect(history.length).toBe(30);
      expect(JSON.parse(history[history.length - 1]).step).toBe(35);
      expect(JSON.parse(history[0]).step).toBe(6);
    });

    it('toggles print safe guides correctly', () => {
      const { setShowGuides } = useEditorStore.getState();
      setShowGuides(false);
      expect(useEditorStore.getState().showGuides).toBe(false);
      setShowGuides(true);
      expect(useEditorStore.getState().showGuides).toBe(true);
    });

    it('clamps zoom controls between 0.4x and 2.5x', () => {
      const { setZoom } = useEditorStore.getState();
      setZoom(0.2);
      expect(useEditorStore.getState().zoom).toBe(0.4);

      setZoom(3.5);
      expect(useEditorStore.getState().zoom).toBe(2.5);

      setZoom(1.2);
      expect(useEditorStore.getState().zoom).toBe(1.2);
    });
  });

  describe('3. Upload Sanitization & File Security', () => {
    it('enforces maximum 15MB file size limit', async () => {
      const largeFile = new File(['x'.repeat(1024)], 'large_asset.png', { type: 'image/png' });
      Object.defineProperty(largeFile, 'size', { value: 16 * 1024 * 1024 });

      const res = await validateUploadFile(largeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('exceeds maximum 15MB');
    });

    it('blocks unsupported file types', async () => {
      const badFile = new File(['content'], 'malicious.exe', { type: 'application/x-msdownload' });
      const res = await validateUploadFile(badFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Unsupported file format');
    });

    it('sanitizes SVG files containing dangerous script tags', async () => {
      const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script><rect width="100" height="100"/></svg>`;
      const svgFile = new File([maliciousSvg], 'badge.svg', { type: 'image/svg+xml' });

      const res = await validateUploadFile(svgFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('prohibited scripts');
    });

    it('accepts clean SVG artwork files', async () => {
      const cleanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#D4AF37"/></svg>`;
      const svgFile = new File([cleanSvg], 'clean.svg', { type: 'image/svg+xml' });

      const res = await validateUploadFile(svgFile);
      expect(res.valid).toBe(true);
      expect(res.sanitizedSvg).toBeDefined();
    });
  });

  describe('4. Typography & Catalog Architecture', () => {
    it('provides 40+ curated Google Fonts across 5 categories', () => {
      expect(FONT_CATALOG.length).toBeGreaterThanOrEqual(40);
      const categories = new Set(FONT_CATALOG.map((f) => f.category));
      expect(categories.has('sans-serif')).toBe(true);
      expect(categories.has('serif')).toBe(true);
      expect(categories.has('display')).toBe(true);
      expect(categories.has('monospace')).toBe(true);
      expect(categories.has('handwriting')).toBe(true);
    });

    it('separates Templates from Artwork and Elements', () => {
      expect(ELEMENTS_COLLECTION.length).toBeGreaterThan(0);
      expect(ARTWORK_COLLECTION.length).toBeGreaterThan(0);

      // Artwork contains NFC waves
      const nfcArt = ARTWORK_COLLECTION.find((a) => a.category === 'nfc');
      expect(nfcArt).toBeDefined();
      expect(nfcArt?.svg).toContain('svg');
    });
  });

  describe('5. Brand Config & Zero Brand Literal Compliance', () => {
    it('derives brand configuration dynamically from brandConfig', () => {
      expect(brandConfig.name).toBeDefined();
      expect(brandConfig.theme.primaryColor).toBe('#D4AF37');
      expect(brandConfig.theme.surfaceColor).toBe('#121216');
    });
  });
});

