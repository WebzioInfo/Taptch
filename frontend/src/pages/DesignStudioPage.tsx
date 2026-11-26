/**
 * DesignStudioPage - Live NFC Card Design Studio Host & Lifecycle Orchestrator
 * Integrates all 11 core components, resolves products and templates, manages cloud drafts,
 * local crash recovery, 3D simulation, print export, and cart submission.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ZoomIn, ZoomOut, Maximize2, Loader2, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useEditorStore } from '../components/editor/useEditorStore';
import { CanvasStudio } from '../components/editor/CanvasStudio';
import { EditorTopBar } from '../components/editor/EditorTopBar';
import { EditorLeftSidebar } from '../components/editor/EditorLeftSidebar';
import { EditorRightSidebar } from '../components/editor/EditorRightSidebar';
import { CardMockupPreview } from '../components/editor/CardMockupPreview';
import { ExportModal } from '../components/editor/ExportModal';
import { AutoRecoveryBanner, RecoverySnapshot } from '../components/editor/AutoRecoveryBanner';
import { UnsavedChangesModal } from '../components/editor/UnsavedChangesModal';
import { SimpleCardStudio } from '../components/editor/SimpleCardStudio';
import { ApiClient } from '../services/api';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { MobileStudioShell } from '../components/editor/mobile/MobileStudioShell';
import { getPendingPurchaseIntent, savePendingPurchaseIntent } from '../hooks/usePurchaseJourney';

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
  const { productId: paramProductId, designId: paramDesignId } = useParams<{ productId?: string; designId?: string }>();
  const [searchParams] = useSearchParams();
  const pendingIntent = getPendingPurchaseIntent();
  const productId = paramProductId || searchParams.get('productId') || pendingIntent?.selectedProductId || undefined;
  const queryVariantId = searchParams.get('variantId') || pendingIntent?.selectedVariantId || undefined;
  const resolvedQuantity = Math.max(
    1,
    Number(searchParams.get('qty') || searchParams.get('quantity') || pendingIntent?.quantity || 1) || 1,
  );
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
  const [productError, setProductError] = useState<string | null>(null);
  const [loadNonce, setLoadNonce] = useState(0);
  const isDesktop = useIsDesktop();

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [recoverySnapshot, setRecoverySnapshot] = useState<RecoverySnapshot | null>(null);
  const [studioMode, setStudioMode] = useState<'simple' | 'advanced'>(
    searchParams.get('mode') === 'advanced' ? 'advanced' : 'simple'
  );

  // Load product, templates, and initial design state
  useEffect(() => {
    let isMounted = true;

    async function loadStudioData() {
      setIsLoading(true);
      setProductError(null);
      setProduct(null);
      setSelectedVariant(null);

      try {
        let existingDesign: any = null;
        if (paramDesignId) {
          existingDesign = await ApiClient.get<any>(`/api/v1/designs/${encodeURIComponent(paramDesignId)}`);
        }

        const targetProductId = productId || existingDesign?.productId;
        if (!targetProductId) {
          if (isMounted) {
            setProductError('No NFC card product was selected. Please choose a product from the catalog.');
            setIsLoading(false);
          }
          return;
        }

        const prodRes = await ApiClient.get<any>(`/api/v1/products/${encodeURIComponent(targetProductId)}`);
        if (!prodRes || !prodRes.id || prodRes.isActive === false) {
          if (isMounted) {
            setProductError('The selected NFC card product could not be found or is currently unavailable.');
            setIsLoading(false);
          }
          return;
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

        setProduct(prodRes);
        const matchedVariant =
          (queryVariantId && prodRes.variants?.find((v: any) => v.id === queryVariantId)) ||
          prodRes.variants?.[0] ||
          null;
        setSelectedVariant(matchedVariant);
        savePendingPurchaseIntent({
          selectedProductId: prodRes.id,
          selectedVariantId: matchedVariant?.id || null,
          quantity: resolvedQuantity,
          source: 'studio',
        });
        setTemplates(loadedTemplates);

        if (existingDesign && isMounted) {
          loadSideConfigs(existingDesign.frontCanvasJson, existingDesign.backCanvasJson, existingDesign.templateId);
          setDesignName(existingDesign.name || prodRes.name || 'Custom NFC Card');
          markSaved(existingDesign.id);
          setIsLoading(false);
          return;
        }

        // Only populate advanced Fabric canvas store when in advanced mode
        if (studioMode === 'advanced') {
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

          const recoveryKey = `taptch_recovery_${prodRes.id}_${chosenTemplate?.id || 'custom'}`;
          const rawRecovery = localStorage.getItem(recoveryKey);
          if (rawRecovery && isMounted) {
            try {
              const parsed = JSON.parse(rawRecovery);
              if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                setRecoverySnapshot(parsed);
              }
            } catch {
              localStorage.removeItem(recoveryKey);
            }
          }
        }
      } catch (err: any) {
        console.error('[DesignStudioPage] Product initialization failed:', err);
        if (isMounted) {
          setProductError(err?.message || 'Unable to load the selected NFC card product. Please try again.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStudioData();
    return () => {
      isMounted = false;
    };
  }, [productId, paramDesignId, templateSlug, studioMode, loadNonce]);

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
        className="min-h-screen w-full bg-[#F8F9FA] text-[#1E293B] flex flex-col"
        aria-busy="true"
        aria-label="Loading NFC Card Design Studio"
      >
        <div className="h-14 sm:h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between">
          <div className="h-5 w-40 rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-8 w-24 rounded-lg bg-slate-200 animate-pulse" />
        </div>
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col items-center space-y-4">
            <div className="w-full max-w-[440px] aspect-[1.586/1] rounded-2xl bg-slate-200 animate-pulse border border-slate-300/70 p-6 flex flex-col justify-between">
              <div className="flex justify-end">
                <div className="w-7 h-7 rounded-full bg-slate-300 animate-pulse" />
              </div>
              <div className="space-y-2.5">
                <div className="h-5 w-44 rounded bg-slate-300 animate-pulse" />
                <div className="h-3.5 w-32 rounded bg-slate-300 animate-pulse" />
              </div>
            </div>
            <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="h-4 w-36 rounded bg-slate-200 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-slate-200 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div
        data-theme="light"
        className="min-h-screen w-full bg-[#F8F9FA] text-[#1E293B] flex flex-col items-center justify-center p-4 text-center"
      >
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Unable to Load Product</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {productError || 'The selected NFC card product could not be loaded.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setLoadNonce((n) => n + 1)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/nfc-cards')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Catalog</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (studioMode === 'simple') {
    return (
      <SimpleCardStudio
        product={product}
        selectedVariant={selectedVariant}
        initialQuantity={resolvedQuantity}
        onSwitchToAdvanced={() => setStudioMode('advanced')}
      />
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
