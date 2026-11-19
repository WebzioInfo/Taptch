/**
 * Central Reactive Zustand Store for Live NFC Card Design Studio
 * Authoritative implementation: 30-step per-side history, independent dual-sided editing,
 * property reflection, and crash recovery.
 */

import { create } from 'zustand';
import { fabric } from 'fabric';
import {
  safeSerializeCanvas,
  safeParseCanvasJson,
  normalizeLiveTextStyle,
} from '../../utils/canvasJson';

export interface SelectedObjectProperties {
  id?: string;
  name?: string;
  type?: string;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  underline?: boolean;
  linethrough?: boolean;
  charSpacing?: number;
  lineHeight?: number;
  opacity?: number;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  rx?: number;
  ry?: number;
  isLocked?: boolean;
  shadow?: any | null;
  shadowConfig?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
    preset?: string;
  };
  assetType?: 'brand' | 'monochrome' | 'shape' | 'text' | 'artwork';
}

export interface EditorStore {
  // Canvas Instances & Side State
  canvas: fabric.Canvas | null;
  activeSide: 'front' | 'back';
  isCanvasLoading: boolean;

  // Serialized Canvas Side States
  frontJson: string;
  backJson: string;
  frontPreview: string | null;
  backPreview: string | null;

  // Selected Object
  selectedObjectId: string | null;
  selectedObjectProps: SelectedObjectProperties | null;

  // Viewport & Guides
  zoom: number;
  showGuides: boolean;

  // 30-step Dual-Sided History Stacks
  frontHistory: string[];
  backHistory: string[];
  frontRedoStack: string[];
  backRedoStack: string[];

  // Dirty State & Persistence
  isDirty: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  designName: string;
  designId: string | null;

  // Contextual Bindings
  activeProduct: any | null;
  selectedVariant: any | null;
  activeTemplateId: string | null;
  draftCache: Record<string, { frontJson: string; backJson: string }>;

  // Store Actions
  setCanvas: (canvas: fabric.Canvas | null) => void;
  setActiveSide: (side: 'front' | 'back') => void;
  loadSideConfigs: (frontJson: string, backJson?: string, templateId?: string) => void;
  syncSelectedProps: () => void;
  updateSelectedProp: (key: string, value: any) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  switchSide: (targetSide?: 'front' | 'back') => void;
  setZoom: (zoom: number) => void;
  setShowGuides: (show: boolean) => void;
  setDesignName: (name: string) => void;
  setContext: (product: any, variant: any, templateId?: string, designId?: string) => void;
  markSaved: (id?: string) => void;
  discardChanges: () => void;
  saveRecoverySnapshot: () => void;
  setPreviews: (front?: string | null, back?: string | null) => void;
}

const HISTORY_LIMIT = 30;

export const useEditorStore = create<EditorStore>((set, get) => ({
  canvas: null,
  activeSide: 'front',
  isCanvasLoading: false,

  frontJson: '',
  backJson: '',
  frontPreview: null,
  backPreview: null,

  selectedObjectId: null,
  selectedObjectProps: null,

  zoom: 1.0,
  showGuides: true,

  frontHistory: [],
  backHistory: [],
  frontRedoStack: [],
  backRedoStack: [],

  isDirty: false,
  saveStatus: 'idle',
  lastSavedAt: null,
  designName: 'Untitled NFC Card',
  designId: null,

  activeProduct: null,
  selectedVariant: null,
  activeTemplateId: null,
  draftCache: {},

  setCanvas: (canvas) => set({ canvas }),

  setActiveSide: (activeSide) => set({ activeSide }),

  loadSideConfigs: (frontJson: string, backJson?: string, templateId?: string) => {
    const fJson = frontJson || '';
    const bJson = backJson || '';

    set({
      frontJson: fJson,
      backJson: bJson,
      activeTemplateId: templateId || get().activeTemplateId,
      frontHistory: fJson ? [fJson] : [],
      backHistory: bJson ? [bJson] : [],
      frontRedoStack: [],
      backRedoStack: [],
      isDirty: false,
      saveStatus: 'idle',
    });
  },

  syncSelectedProps: () => {
    const { canvas } = get();
    if (!canvas) {
      set({ selectedObjectId: null, selectedObjectProps: null });
      return;
    }

    const activeObj = canvas.getActiveObject() as any;
    if (!activeObj) {
      set({ selectedObjectId: null, selectedObjectProps: null });
      return;
    }

    const type = (activeObj.type || '').toLowerCase();
    const props: SelectedObjectProperties = {
      id: activeObj.id,
      name: activeObj.name,
      type,
      fill: typeof activeObj.fill === 'string' ? activeObj.fill : undefined,
      stroke: activeObj.stroke,
      strokeWidth: activeObj.strokeWidth,
      opacity: activeObj.opacity ?? 1,
      left: Math.round(activeObj.left || 0),
      top: Math.round(activeObj.top || 0),
      width: Math.round((activeObj.width || 0) * (activeObj.scaleX || 1)),
      height: Math.round((activeObj.height || 0) * (activeObj.scaleY || 1)),
      scaleX: activeObj.scaleX,
      scaleY: activeObj.scaleY,
      angle: Math.round(activeObj.angle || 0),
      rx: activeObj.rx,
      ry: activeObj.ry,
      isLocked: !!activeObj.isLocked,
      assetType: activeObj.assetType,
      shadow: activeObj.shadow,
      shadowConfig: activeObj.shadowConfig,
    };

    if (type === 'text' || type === 'i-text' || type === 'textbox') {
      props.text = activeObj.text;
      props.fontSize = activeObj.fontSize;
      props.fontFamily = activeObj.fontFamily;
      props.fontWeight = activeObj.fontWeight;
      props.fontStyle = activeObj.fontStyle;
      props.textAlign = activeObj.textAlign;
      props.underline = activeObj.underline;
      props.linethrough = activeObj.linethrough;
      props.charSpacing = activeObj.charSpacing;
      props.lineHeight = activeObj.lineHeight;
    }

    set({
      selectedObjectId: activeObj.id || null,
      selectedObjectProps: props,
    });
  },

  updateSelectedProp: (key: string, value: any) => {
    const { canvas } = get();
    if (!canvas) return;

    const activeObj = canvas.getActiveObject() as any;
    if (!activeObj) return;

    activeObj.set(key, value);
    if (key === 'fontFamily' || key === 'fontSize' || key === 'fontWeight' || key === 'text') {
      activeObj.initDimensions?.();
    }
    activeObj.setCoords();
    canvas.requestRenderAll();

    get().syncSelectedProps();
    get().pushHistory();
  },

  pushHistory: () => {
    const { canvas, activeSide, frontHistory, backHistory } = get();
    if (!canvas || get().isCanvasLoading) return;

    const currentJson = safeSerializeCanvas(canvas);

    if (activeSide === 'front') {
      const lastState = frontHistory[frontHistory.length - 1];
      if (lastState === currentJson) return;

      const newHistory = [...frontHistory, currentJson].slice(-HISTORY_LIMIT);
      set({
        frontHistory: newHistory,
        frontRedoStack: [],
        frontJson: currentJson,
        isDirty: true,
      });
    } else {
      const lastState = backHistory[backHistory.length - 1];
      if (lastState === currentJson) return;

      const newHistory = [...backHistory, currentJson].slice(-HISTORY_LIMIT);
      set({
        backHistory: newHistory,
        backRedoStack: [],
        backJson: currentJson,
        isDirty: true,
      });
    }

    get().saveRecoverySnapshot();
  },

  undo: () => {
    const { canvas, activeSide, frontHistory, backHistory, frontRedoStack, backRedoStack } = get();
    if (!canvas) return;

    if (activeSide === 'front') {
      if (frontHistory.length <= 1) return;
      const historyCopy = [...frontHistory];
      const currentState = historyCopy.pop()!;
      const prevState = historyCopy[historyCopy.length - 1];

      set({
        isCanvasLoading: true,
        frontHistory: historyCopy,
        frontRedoStack: [currentState, ...frontRedoStack],
        frontJson: prevState,
        isDirty: true,
      });

      const parsed = safeParseCanvasJson(prevState);
      canvas.loadFromJSON(parsed.data, () => {
        const objects = canvas.getObjects() || [];
        for (const obj of objects) {
          normalizeLiveTextStyle(obj);
        }
        canvas.renderAll();
        set({ isCanvasLoading: false });
        get().syncSelectedProps();
      });
    } else {
      if (backHistory.length <= 1) return;
      const historyCopy = [...backHistory];
      const currentState = historyCopy.pop()!;
      const prevState = historyCopy[historyCopy.length - 1];

      set({
        isCanvasLoading: true,
        backHistory: historyCopy,
        backRedoStack: [currentState, ...backRedoStack],
        backJson: prevState,
        isDirty: true,
      });

      const parsed = safeParseCanvasJson(prevState);
      canvas.loadFromJSON(parsed.data, () => {
        const objects = canvas.getObjects() || [];
        for (const obj of objects) {
          normalizeLiveTextStyle(obj);
        }
        canvas.renderAll();
        set({ isCanvasLoading: false });
        get().syncSelectedProps();
      });
    }
  },

  redo: () => {
    const { canvas, activeSide, frontHistory, backHistory, frontRedoStack, backRedoStack } = get();
    if (!canvas) return;

    if (activeSide === 'front') {
      if (frontRedoStack.length === 0) return;
      const redoCopy = [...frontRedoStack];
      const nextState = redoCopy.shift()!;

      set({
        isCanvasLoading: true,
        frontHistory: [...frontHistory, nextState],
        frontRedoStack: redoCopy,
        frontJson: nextState,
        isDirty: true,
      });

      const parsed = safeParseCanvasJson(nextState);
      canvas.loadFromJSON(parsed.data, () => {
        const objects = canvas.getObjects() || [];
        for (const obj of objects) {
          normalizeLiveTextStyle(obj);
        }
        canvas.renderAll();
        set({ isCanvasLoading: false });
        get().syncSelectedProps();
      });
    } else {
      if (backRedoStack.length === 0) return;
      const redoCopy = [...backRedoStack];
      const nextState = redoCopy.shift()!;

      set({
        isCanvasLoading: true,
        backHistory: [...backHistory, nextState],
        backRedoStack: redoCopy,
        backJson: nextState,
        isDirty: true,
      });

      const parsed = safeParseCanvasJson(nextState);
      canvas.loadFromJSON(parsed.data, () => {
        const objects = canvas.getObjects() || [];
        for (const obj of objects) {
          normalizeLiveTextStyle(obj);
        }
        canvas.renderAll();
        set({ isCanvasLoading: false });
        get().syncSelectedProps();
      });
    }
  },

  switchSide: (targetSide) => {
    const { canvas, activeSide, frontJson, backJson } = get();
    const nextSide = targetSide || (activeSide === 'front' ? 'back' : 'front');
    if (nextSide === activeSide) return;

    // 1. Snapshot current active side into store
    if (canvas) {
      const serialized = safeSerializeCanvas(canvas);
      if (activeSide === 'front') {
        set({ frontJson: serialized });
      } else {
        set({ backJson: serialized });
      }
    }

    // 2. Clear canvas safely and prepare loading
    set({ activeSide: nextSide, isCanvasLoading: true, selectedObjectId: null, selectedObjectProps: null });

    if (canvas) {
      canvas.clear();
      const targetJson = nextSide === 'front' ? (get().frontJson || frontJson) : (get().backJson || backJson);
      const parsed = safeParseCanvasJson(targetJson);

      canvas.loadFromJSON(parsed.data, () => {
        const objects = canvas.getObjects() || [];
        for (const obj of objects) {
          normalizeLiveTextStyle(obj);
        }
        canvas.renderAll();
        set({ isCanvasLoading: false });
      });
    } else {
      set({ isCanvasLoading: false });
    }
  },

  setZoom: (zoom) => {
    const clamped = Math.max(0.4, Math.min(2.5, zoom));
    set({ zoom: clamped });
  },

  setShowGuides: (showGuides) => set({ showGuides }),

  setDesignName: (designName) => set({ designName, isDirty: true }),

  setContext: (activeProduct, selectedVariant, activeTemplateId, designId) => {
    set({
      activeProduct,
      selectedVariant,
      activeTemplateId: activeTemplateId || null,
      designId: designId || null,
    });
  },

  markSaved: (id) => {
    set({
      isDirty: false,
      saveStatus: 'saved',
      lastSavedAt: new Date(),
      designId: id || get().designId,
    });
  },

  discardChanges: () => {
    set({
      isDirty: false,
      saveStatus: 'idle',
    });
  },

  saveRecoverySnapshot: () => {
    try {
      const { activeProduct, activeTemplateId, frontJson, backJson, designName } = get();
      if (!activeProduct?.id) return;

      const key = `taptch_recovery_${activeProduct.id}_${activeTemplateId || 'custom'}`;
      const snapshot = {
        productId: activeProduct.id,
        templateId: activeTemplateId,
        designName,
        frontJson,
        backJson,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(snapshot));
    } catch (err) {
      console.warn('[useEditorStore] Failed to write recovery snapshot:', err);
    }
  },

  setPreviews: (front, back) => {
    set((state) => ({
      frontPreview: front !== undefined ? front : state.frontPreview,
      backPreview: back !== undefined ? back : state.backPreview,
    }));
  },
}));

