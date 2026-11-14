/**
 * DesignStudioPage - Live NFC Card Design Studio Host & Lifecycle Orchestrator
 * Integrates all 11 core components, resolves products and templates, manages cloud drafts,
 * local crash recovery, 3D simulation, print export, and cart submission.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ZoomIn, ZoomOut, Maximize2, Loader2, Sparkles } from 'lucide-react';
import { useEditorStore } from '../components/editor/useEditorStore';
import { CanvasStudio } from '../components/editor/CanvasStudio';
import { EditorTopBar } from '../components/editor/EditorTopBar';
import { EditorLeftSidebar } from '../components/editor/EditorLeftSidebar';
import { EditorRightSidebar } from '../components/editor/EditorRightSidebar';
import { CardMockupPreview } from '../components/editor/CardMockupPreview';
import { ExportModal } from '../components/editor/ExportModal';
import { AutoRecoveryBanner, RecoverySnapshot } from '../components/editor/AutoRecoveryBanner';
import { UnsavedChangesModal } from '../components/editor/UnsavedChangesModal';
import { ApiClient } from '../services/api';

// Default starter card product for fallback
const DEFAULT_CARD_PRODUCT = {
  id: 'prod_matte_pvc_01',
  name: 'Matte Charcoal NFC Card',
  slug: 'matte-charcoal-nfc-card',
  description: 'Precision matte finish PVC smart business card with NTAG213 contactless chip.',
  basePrice: 1499,
  canvasWidth: 1050,
  canvasHeight: 600,
  safeZone: 40,
  bleedZone: 25,
  supportedSides: 'FRONT_AND_BACK',
  variants: [
    { id: 'var_obsidian', name: 'Obsidian Matte', color: '#121216', price: 1499 },
    { id: 'var_gold', name: 'Brushed Gold Accent', color: '#D4AF37', price: 1799 },
  ],
};

// Seeded master layout if database has no templates yet
const DEFAULT_MASTER_TEMPLATE = {
  id: 'tpl_executive_obsidian',
  name: 'Obsidian Executive',
  category: 'luxury',
  previewUrl: '/branding/cards/default-card-preview.png',
  frontCanvasJson: JSON.stringify({
    version: '5.3.0',
    backgroundColor: '#0A0A0C',
    objects: [
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: 1050,
        height: 600,
        fill: '#0A0A0C',
        selectable: false,
        evented: false,
        id: 'bg_plate',
        name: 'Background Plate',
        isLocked: true,
      },
      {
        type: 'i-text',
        left: 80,
        top: 360,
        fill: '#FFFFFF',
        fontFamily: 'Inter',
        fontSize: 36,
        fontWeight: '700',
        charSpacing: 40,
        text: 'ALEXANDER VANCE',
        id: 'text_name',
        name: 'Full Name',
        styles: {},
      },
      {
        type: 'i-text',
        left: 80,
        top: 420,
        fill: '#D4AF37',
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '600',
        charSpacing: 60,
        text: 'MANAGING DIRECTOR',
        id: 'text_role',
        name: 'Job Title',
        styles: {},
      },
    ],
  }),
  backCanvasJson: JSON.stringify({
    version: '5.3.0',
    backgroundColor: '#0A0A0C',
    objects: [
      {
        type: 'rect',
        left: 0,
        top: 0,
        width: 1050,
        height: 600,
        fill: '#0A0A0C',
        selectable: false,
        evented: false,
        id: 'bg_plate_back',
        name: 'Background Plate',
        isLocked: true,
      },
      {
        type: 'i-text',
        left: 1050 / 2 - 140,
        top: 500,
        fill: '#8C8C9A',
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '500',
        charSpacing: 80,
        text: 'TAP PHONE TO CONNECT',
        id: 'text_instructions',
        name: 'Tap Prompt',
        styles: {},
      },
    ],
  }),
};

export const DesignStudioPage: React.FC = () => {
  const { productId: routeProductId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryProductId = searchParams.get('productId');
  const queryTemplateId = searchParams.get('templateId');
  const queryDesignId = searchParams.get('designId');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [product, setProduct] = useState<any>(DEFAULT_CARD_PRODUCT);
  const [selectedVariant, setSelectedVariant] = useState<any>(DEFAULT_CARD_PRODUCT.variants[0]);
  const [templates, setTemplates] = useState<any[]>([DEFAULT_MASTER_TEMPLATE]);

  // Modal states
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [recoverySnapshot, setRecoverySnapshot] = useState<RecoverySnapshot | null>(null);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState<boolean>(false);

  const {
    zoom,
    setZoom,
    loadSideConfigs,
    setContext,
    setDesignName,
    isDirty,
    frontJson,
    backJson,
    activeSide,
    switchSide,
  } = useEditorStore();

  // Studio Lifecycle Initialization
  useEffect(() => {
    let isMounted = true;

    async function initStudio() {
      setIsLoading(true);
      const activePid = routeProductId || queryProductId || DEFAULT_CARD_PRODUCT.id;

      try {
        // 1. Fetch Product
        let resolvedProduct = DEFAULT_CARD_PRODUCT;
        try {
          const p = await ApiClient.get<any>(`/api/v1/products/${activePid}`);
          if (p && p.id) resolvedProduct = p;
        } catch (e) {
          // Use default product
        }

        if (!isMounted) return;
        setProduct(resolvedProduct);
        setSelectedVariant(resolvedProduct.variants?.[0] || DEFAULT_CARD_PRODUCT.variants[0]);

        // 2. Fetch Templates
        let resolvedTemplates = [DEFAULT_MASTER_TEMPLATE];
        try {
          const tpls = await ApiClient.get<any[]>(`/api/v1/products/${resolvedProduct.id}/templates`);
          if (tpls && tpls.length > 0) resolvedTemplates = tpls;
        } catch (e) {
          // fallback to global templates
          try {
            const globalTpls = await ApiClient.get<any[]>('/api/v1/templates');
            if (globalTpls && globalTpls.length > 0) resolvedTemplates = globalTpls;
          } catch (ge) { }
        }

        if (!isMounted) return;
        setTemplates(resolvedTemplates);

        // 3. Resolve Active Template & Draft
        const targetTemplate =
          resolvedTemplates.find((t) => t.id === queryTemplateId) || resolvedTemplates[0];

        let targetFrontJson = targetTemplate.frontCanvasJson || DEFAULT_MASTER_TEMPLATE.frontCanvasJson;
        let targetBackJson = targetTemplate.backCanvasJson || DEFAULT_MASTER_TEMPLATE.backCanvasJson;
        let designTitle = targetTemplate.name || 'Untitled NFC Card';

        // 4. Check for Existing Saved Design if designId passed
        if (queryDesignId) {
          try {
            const savedDesign = await ApiClient.get<any>(`/api/v1/designs/${queryDesignId}`);
            if (savedDesign && savedDesign.frontCanvasJson) {
              targetFrontJson = savedDesign.frontCanvasJson;
              targetBackJson = savedDesign.backCanvasJson || targetBackJson;
              designTitle = savedDesign.name || designTitle;
            }
          } catch (e) { }
        } else {
          // 5. Check Cloud Draft
          try {
            const draft = await ApiClient.get<any>(
              `/api/v1/designs/draft?productId=${resolvedProduct.id}&templateId=${targetTemplate.id}`
            );
            if (draft && draft.frontCanvasJson) {
              targetFrontJson = draft.frontCanvasJson;
              targetBackJson = draft.backCanvasJson || targetBackJson;
              designTitle = draft.name || designTitle;
            }
          } catch (e) { }
        }

        // 6. Check Local Recovery Snapshot in localStorage
        const recoveryKey = `taptch_recovery_${resolvedProduct.id}_${targetTemplate.id || 'custom'}`;
        const localSnapshotStr = localStorage.getItem(recoveryKey);
        if (localSnapshotStr) {
          try {
            const snap = JSON.parse(localSnapshotStr) as RecoverySnapshot;
            if (snap.frontJson && snap.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
              setRecoverySnapshot(snap);
            }
          } catch (se) { }
        }

        // 7. Load into Store
        loadSideConfigs(targetFrontJson, targetBackJson, targetTemplate.id);
        setDesignName(designTitle);
        setContext(resolvedProduct, resolvedProduct.variants?.[0], targetTemplate.id, queryDesignId || undefined);
      } catch (err) {
        console.warn('[DesignStudioPage] Init warning:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initStudio();

    return () => {
      isMounted = false;
    };
  }, [routeProductId, queryProductId, queryTemplateId, queryDesignId]);

  // Apply Template Switch
  const handleApplyTemplate = (tpl: any) => {
    if (!tpl) return;
    loadSideConfigs(tpl.frontCanvasJson, tpl.backCanvasJson, tpl.id);
    setDesignName(tpl.name || 'Untitled NFC Card');
  };

  // Reset to Master Template Layout
  const handleResetTemplate = async () => {
    if (!confirm('Reset canvas to original template layout? Any uncommitted changes will be lost.')) {
      return;
    }
    const currentTpl = templates.find((t) => t.id === useEditorStore.getState().activeTemplateId) || templates[0];
    if (currentTpl) {
      loadSideConfigs(currentTpl.frontCanvasJson, currentTpl.backCanvasJson, currentTpl.id);
    }
  };

  // Restore crash snapshot
  const handleRestoreSnapshot = () => {
    if (!recoverySnapshot) return;
    loadSideConfigs(recoverySnapshot.frontJson, recoverySnapshot.backJson, recoverySnapshot.templateId);
    if (recoverySnapshot.designName) setDesignName(recoverySnapshot.designName);
    setRecoverySnapshot(null);
  };

  const handleDismissSnapshot = () => {
    if (!product?.id) return;
    const key = `taptch_recovery_${product.id}_${recoverySnapshot?.templateId || 'custom'}`;
    localStorage.removeItem(key);
    setRecoverySnapshot(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0A0A0C] text-white">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mb-3" />
        <p className="text-sm font-semibold tracking-wider uppercase">Loading NFC Design Studio...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#0A0A0C] text-white overflow-hidden select-none">
      {/* Top Bar */}
      <EditorTopBar
        product={product}
        selectedVariant={selectedVariant}
        onOpenPreview={() => setIsPreviewOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onResetTemplate={handleResetTemplate}
      />

      {/* Main Studio Body: Left Sidebar, Canvas Stage, Right Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Crash Recovery Banner */}
        {recoverySnapshot && (
          <AutoRecoveryBanner
            snapshot={recoverySnapshot}
            onRestore={handleRestoreSnapshot}
            onDismiss={handleDismissSnapshot}
          />
        )}

        {/* Left Multi-tab Palette */}
        <EditorLeftSidebar
          templates={templates}
          product={product}
          onApplyTemplate={handleApplyTemplate}
        />

        {/* Center Stage (Canvas Studio Viewport) */}
        <main className="flex-1 relative flex flex-col items-center justify-center bg-[#121216] overflow-hidden">
          <CanvasStudio product={product} />

          {/* Floating Zoom & Fit Controls */}
          <div className="absolute bottom-4 right-4 flex items-center bg-[#0A0A0C]/90 backdrop-blur-md p-1 rounded-xl border border-[#23232A] shadow-xl text-neutral-300">
            <button
              onClick={() => setZoom(zoom - 0.1)}
              className="p-1.5 rounded-lg hover:text-white hover:bg-[#18181D] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium px-2 min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(zoom + 0.1)}
              className="p-1.5 rounded-lg hover:text-white hover:bg-[#18181D] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1px] bg-[#23232A] mx-1" />
            <button
              onClick={() => setZoom(1.0)}
              className="p-1.5 rounded-lg hover:text-white hover:bg-[#18181D] transition-colors"
              title="Reset Zoom to 100%"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </main>

        {/* Right Inspector */}
        <EditorRightSidebar />
      </div>

      {/* 3D Mockup Modal */}
      <CardMockupPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        product={product}
        selectedVariant={selectedVariant}
      />

      {/* Print Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        product={product}
      />

      {/* Navigation Guard Modal */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onSaveAndExit={async () => {
          setIsUnsavedModalOpen(false);
          navigate('/cards');
        }}
        onDiscardAndExit={() => {
          setIsUnsavedModalOpen(false);
          navigate('/cards');
        }}
        onCancel={() => setIsUnsavedModalOpen(false)}
      />
    </div>
  );
};
