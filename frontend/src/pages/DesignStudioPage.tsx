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
import { useIsDesktop } from '../hooks/useMediaQuery';
import { MobileStudioShell } from '../components/editor/mobile/MobileStudioShell';

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
  const { productId, designId: paramDesignId } = useParams<{ productId?: string; designId?: string }>();
  const [searchParams] = useSearchParams();
  const templateSlug = searchParams.get('template');
  const navigate = useNavigate();

  const {
    zoom,
    setZoom,
    loadSideConfigs,
    setDesignName,
    isDirty,
    markSaved,
    activeSide,
  } = useEditorStore();

  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isDesktop = useIsDesktop();

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [recoverySnapshot, setRecoverySnapshot] = useState<RecoverySnapshot | null>(null);

  // Load product, templates, and initial design state
  useEffect(() => {
    let isMounted = true;

    async function loadStudioData() {
      setIsLoading(true);
      try {
        let loadedProduct = DEFAULT_CARD_PRODUCT;
        if (productId) {
          try {
            const prodRes = await ApiClient.get<any>(`/api/v1/products/${productId}`);
            if (prodRes && prodRes.id) {
              loadedProduct = prodRes;
            }
          } catch (e) {
            console.warn('[DesignStudioPage] Remote product fetch failed, fallback to default:', e);
          }
        }

        let loadedTemplates: any[] = [DEFAULT_MASTER_TEMPLATE];
        try {
          const tplRes = await ApiClient.get<any[]>('/api/v1/templates');
          if (Array.isArray(tplRes) && tplRes.length > 0) {
            loadedTemplates = tplRes;
          }
        } catch (e) {
          console.warn('[DesignStudioPage] Remote templates fetch failed, using default master:', e);
        }

        if (!isMounted) return;

        setProduct(loadedProduct);
        setSelectedVariant(loadedProduct.variants?.[0] || null);
        setTemplates(loadedTemplates);

        if (paramDesignId) {
          try {
            const designRes = await ApiClient.get<any>(`/api/v1/designs/${paramDesignId}`);
            if (designRes && isMounted) {
              loadSideConfigs(designRes.frontCanvasJson, designRes.backCanvasJson, designRes.templateId);
              setDesignName(designRes.name || 'Custom NFC Card');
              markSaved(designRes.id);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.warn('[DesignStudioPage] Existing design load error:', e);
          }
        }

        let chosenTemplate = loadedTemplates[0];
        if (templateSlug) {
          const matched = loadedTemplates.find((t) => t.slug === templateSlug || t.id === templateSlug);
          if (matched) chosenTemplate = matched;
        }

        if (chosenTemplate && isMounted) {
          loadSideConfigs(
            chosenTemplate.frontCanvasJson || DEFAULT_MASTER_TEMPLATE.frontCanvasJson,
            chosenTemplate.backCanvasJson || DEFAULT_MASTER_TEMPLATE.backCanvasJson,
            chosenTemplate.id
          );
          setDesignName(chosenTemplate.name || 'Untitled NFC Card');
        }

        const recoveryKey = `taptch_recovery_${loadedProduct.id}_${chosenTemplate?.id || 'custom'}`;
        const rawRecovery = localStorage.getItem(recoveryKey);
        if (rawRecovery && isMounted) {
          try {
            const parsed = JSON.parse(rawRecovery);
            if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
              setRecoverySnapshot(parsed);
            }
          } catch (e) {
            localStorage.removeItem(recoveryKey);
          }
        }
      } catch (err) {
        console.error('[DesignStudioPage] Initialization failed:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStudioData();
    return () => {
      isMounted = false;
    };
  }, [productId, paramDesignId, templateSlug]);

  // Window unload guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Keyboard zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(zoom + 0.1);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setZoom(zoom - 0.1);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1.0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom, setZoom]);

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
      <div
        data-theme="light"
        className="h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-page)] text-[var(--ink)]"
      >
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-3" />
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">Loading NFC Design Studio...</p>
      </div>
    );
  }

  if (!isDesktop) {
    return (
        <div data-theme="light" className="h-dvh w-full overflow-hidden select-none bg-[var(--bg-page)] text-[var(--ink)]">
          {/* Crash Recovery Banner */}
          {recoverySnapshot && (
            <AutoRecoveryBanner
              snapshot={recoverySnapshot}
              onRestore={handleRestoreSnapshot}
              onDismiss={handleDismissSnapshot}
            />
          )}

          <MobileStudioShell
            product={product}
            selectedVariant={selectedVariant}
            templates={templates}
            onOpenPreview={() => setIsPreviewOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
            onResetTemplate={handleResetTemplate}
            onApplyTemplate={handleApplyTemplate}
          />

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
  }

        return (
        <div
          data-theme="light"
          className="h-screen w-full flex flex-col bg-[var(--bg-page)] text-[var(--ink)] font-body overflow-hidden select-none"
        >
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
            <main className="flex-1 relative flex flex-col items-center justify-center bg-[var(--bg-page)] overflow-hidden">
              <CanvasStudio product={product} />

              {/* Floating Zoom & Fit Controls */}
              <div className="absolute bottom-4 right-4 flex items-center bg-[var(--bg-surface)]/90 backdrop-blur-md p-1 rounded-[var(--radius-sm)] border border-[var(--border)] shadow-sm text-[var(--ink)]">
                <button
                  onClick={() => setZoom(zoom - 0.1)}
                  className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-raised)] transition-colors text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs font-medium px-2 min-w-[50px] text-center text-[var(--ink)]">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(zoom + 0.1)}
                  className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-raised)] transition-colors text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />
                <button
                  onClick={() => setZoom(1.0)}
                  className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-raised)] transition-colors text-[var(--ink-muted)] hover:text-[var(--ink)]"
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
