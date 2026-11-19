import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Undo2,
  Redo2,
  RotateCw,
  MoreVertical,
  Box,
  Download,
  Save,
  ShoppingCart,
  CreditCard,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { useEditorStore } from '../useEditorStore';
import { ApiClient } from '../../../services/api';
import { safeSerializeCanvas } from '../../../utils/canvasJson';
import { renderSideToPreview } from '../../../utils/canvasRenderer';

interface MobileStudioTopBarProps {
  title?: string;
  product?: any;
  selectedVariant?: any;
  onOpenPreview: () => void;
  onOpenExport: () => void;
  onResetTemplate?: () => void;
}

export const MobileStudioTopBar: React.FC<MobileStudioTopBarProps> = ({
  title,
  product,
  selectedVariant,
  onOpenPreview,
  onOpenExport,
  onResetTemplate,
}) => {
  const navigate = useNavigate();
  const {
    canvas,
    designName: storeDesignName,
    setDesignName,
    activeSide,
    switchSide,
    undo,
    redo,
    frontHistory,
    backHistory,
    frontRedoStack,
    backRedoStack,
    showGuides,
    setShowGuides,
    isDirty,
    markSaved,
    frontJson,
    backJson,
    frontPreview,
    backPreview,
    setPreviews,
    designId,
    activeTemplateId,
  } = useEditorStore();

  const designName = title ?? storeDesignName;

  const [isSaving, setIsSaving] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isOrderingNow, setIsOrderingNow] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const savingPromiseRef = useRef<Promise<string | null> | null>(null);

  const canUndo = activeSide === 'front' ? frontHistory.length > 1 : backHistory.length > 1;
  const canRedo = activeSide === 'front' ? frontRedoStack.length > 0 : backRedoStack.length > 0;

  const handleSaveDesign = async (silent = false): Promise<string | null> => {
      // If a save operation is already in flight, reuse the active promise to prevent race conditions
      if (savingPromiseRef.current) {
        return savingPromiseRef.current;
      }

        const saveExecution = (async (): Promise<string | null> => {
          setIsSaving(true);
          try {
            let fJson = frontJson;
            let bJson = backJson;
            let frontPreviewUrl = frontPreview || '';
            let backPreviewUrl = backPreview || '';

                if (canvas) {
                  const currentSideJson = safeSerializeCanvas(canvas);
                  let currentPreview = '';
                  try {
                    currentPreview = canvas.toDataURL({ format: 'png', multiplier: 0.5 });
                  } catch (e) {
                    console.warn('[MobileStudioTopBar] Canvas toDataURL failed:', e);
                  }

                  if (activeSide === 'front') {
                    fJson = currentSideJson;
                    if (currentPreview) frontPreviewUrl = currentPreview;
                    if (bJson && (!backPreviewUrl || backPreviewUrl === '')) {
                      backPreviewUrl = await renderSideToPreview(bJson);
                    }
                  } else {
                    bJson = currentSideJson;
                    if (currentPreview) backPreviewUrl = currentPreview;
                    if (fJson && (!frontPreviewUrl || frontPreviewUrl === '')) {
                      frontPreviewUrl = await renderSideToPreview(fJson);
                    }
                  }
                } else {
                  if (fJson && !frontPreviewUrl) frontPreviewUrl = await renderSideToPreview(fJson);
                  if (bJson && !backPreviewUrl) backPreviewUrl = await renderSideToPreview(bJson);
                }

              // Synchronize Zustand in-memory previews
              setPreviews(frontPreviewUrl, backPreviewUrl);

                  // Resilient local checkout draft storage
                  try {
                    localStorage.setItem('taptch_checkout_design_draft', JSON.stringify({
                      frontCanvasJson: fJson,
                      backCanvasJson: bJson,
                      previewUrl: frontPreviewUrl,
                      backPreviewUrl: backPreviewUrl,
                      name: designName || 'Custom NFC Card',
                      productId: product?.id,
                      variantId: selectedVariant?.id,
                      templateId: activeTemplateId,
                      savedAt: new Date().toISOString(),
                    }));
                  } catch(storageErr) {
                    console.warn('[MobileStudioTopBar] LocalStorage draft cache write error:', storageErr);
                  }

        const payload = {
                    id: (designId && designId !== 'draft') ? designId : undefined,
                    designId: (designId && designId !== 'draft') ? designId : undefined,
                    name: designName || 'Untitled NFC Card',
                    productId: product?.id || 'prod_classic_pvc',
                    variantId: selectedVariant?.id || undefined,
                    templateId: activeTemplateId || undefined,
                    frontCanvasJson: fJson,
                    backCanvasJson: bJson,
                    previewUrl: frontPreviewUrl,
                    backPreviewUrl: backPreviewUrl,
              };

              const res = await ApiClient.post<any>('/api/v1/designs/draft', payload);
              const savedId = res?.id || designId || 'draft';
              markSaved(savedId);

              // Non-blocking background upload of crisp card previews to Cloudinary
              if (frontPreviewUrl?.startsWith('data:image') || backPreviewUrl?.startsWith('data:image')) {
                ApiClient.post<any>('/api/v1/uploads/card-preview', {
                  frontBase64: frontPreviewUrl,
                  backBase64: backPreviewUrl,
                  designId: savedId !== 'draft' ? savedId : undefined,
                }).then((uploadRes) => {
                  if (uploadRes?.previewFrontUrl || uploadRes?.frontUrl) {
                    const cFront = uploadRes.previewFrontUrl || uploadRes.frontUrl;
                    const cBack = uploadRes.previewBackUrl || uploadRes.backUrl;
                    setPreviews(cFront, cBack);
                    try {
                      const cached = localStorage.getItem('taptch_checkout_design_draft');
                      if (cached) {
                        const parsed = JSON.parse(cached);
                        parsed.previewUrl = cFront;
                        parsed.backPreviewUrl = cBack;
                        parsed.previewFrontUrl = cFront;
                        parsed.previewBackUrl = cBack;
                        localStorage.setItem('taptch_checkout_design_draft', JSON.stringify(parsed));
                      }
                    } catch (_) {}
                  }
                }).catch((upErr) => console.warn('[MobileStudioTopBar] Cloudinary preview upload ignored:', upErr));
              }

              setIsSaving(false);
              return savedId;
            } catch (err: any) {
              console.warn('[MobileStudioTopBar] Save draft failed:', err);
              setIsSaving(false);
              if (!silent) {
                alert('Failed to save design draft. Please check your connection.');
              }
              return null;
            } finally {
              savingPromiseRef.current = null;
            }
          }) ();

        savingPromiseRef.current = saveExecution;
        return saveExecution;
      };

      const handleOrderNow = async () => {
        setIsOrderingNow(true);
        try {
          const savedDesignId = await handleSaveDesign(true);
          if (!savedDesignId) {
            alert('We could not save your design prior to checkout. Please check your network connection and try again.');
            setIsOrderingNow(false);
            return;
          }
          const pId = product?.id || 'prod_classic_pvc';
          const vId = selectedVariant?.id || 'var_matte_black';
          setIsOrderingNow(false);
          navigate(`/checkout?designId=${encodeURIComponent(savedDesignId)}&productId=${encodeURIComponent(pId)}&variantId=${encodeURIComponent(vId)}`);
        } catch (err: any) {
          console.warn('[MobileStudioTopBar] Order now navigate failed:', err);
          setIsOrderingNow(false);
          alert('An unexpected error occurred while preparing your checkout. Please try again.');
        }
      };

      const handleAddToCart = async () => {
        setIsAddingToCart(true);
        try {
          const savedDesignId = await handleSaveDesign(true);

          await ApiClient.post('/api/v1/cart/items', {
            productId: product?.id || 'prod_classic_pvc',
            variantId: selectedVariant?.id || 'var_matte_black',
            designId: savedDesignId,
            quantity: 1,
          });

          setIsAddingToCart(false);
          navigate('/cart');
        } catch (err: any) {
          console.warn('[MobileStudioTopBar] Add to cart fallback:', err);
          setIsAddingToCart(false);
          navigate('/cards');
        }
      };

      return (
        <>
          <header className="h-14 min-h-[56px] border-b border-[var(--border)] bg-[var(--bg-surface)] px-2 sm:px-3 flex items-center justify-between z-30 select-none text-[var(--ink)] sticky top-0 pt-safe">
            {/* Left: Back & Title */}
            <div className="flex items-center space-x-1.5 min-w-0">
              <button
                onClick={() => navigate('/cards')}
                className="w-11 h-11 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--ink-muted)] hover:text-[var(--ink)] active:bg-[var(--bg-raised)] transition-colors"
                title="Back to Cards"
                aria-label="Back to Cards"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Editable / Truncated Title */}
              {isEditingTitle ? (
                <input
                  type="text"
                  autoFocus
                  value={designName}
                  onBlur={() => setIsEditingTitle(false)}
                  onChange={(e) => setDesignName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="bg-[var(--bg-raised)] text-[16px] font-medium text-[var(--ink)] px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--border-strong)] max-w-[130px] sm:max-w-[180px] focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="flex items-center space-x-1.5 text-left min-w-0 max-w-[110px] sm:max-w-[160px] py-1 px-1 rounded hover:bg-[var(--bg-raised)] transition-colors"
                  title="Tap to rename card"
                >
                  <span className="text-xs sm:text-sm font-medium text-[var(--ink)] truncate">
                    {designName || 'Untitled Card'}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSaving
                      ? 'bg-[var(--accent)] animate-pulse'
                      : isDirty
                        ? 'bg-[var(--warning)]'
                        : 'bg-[var(--success)]'
                      }`}
                    title={isSaving ? 'Saving' : isDirty ? 'Unsaved changes' : 'Saved'}
                  />
                </button>
              )}
            </div>

            {/* Center: Side Switcher & Undo/Redo */}
            <div className="flex items-center space-x-1">
              {/* Flip Side Button */}
              <button
                onClick={() => switchSide()}
                className="h-10 px-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] border border-[var(--border)] text-[11px] font-medium text-[var(--ink)] flex items-center space-x-1.5 transition-colors"
                title={`Switch to ${activeSide === 'front' ? 'Back' : 'Front'} Side`}
                aria-label="Switch Card Side"
              >
                <RotateCw className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="font-mono uppercase">{activeSide === 'front' ? 'Front' : 'Back'}</span>
              </button>

              {/* Undo / Redo */}
              <div className="flex items-center bg-[var(--bg-raised)] rounded-[var(--radius-sm)] border border-[var(--border)]">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="w-10 h-10 flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink)] active:bg-[var(--bg-surface)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Undo"
                  aria-label="Undo"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-[var(--border)]" />
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="w-10 h-10 flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink)] active:bg-[var(--bg-surface)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Redo"
                  aria-label="Redo"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Order Now & Overflow Menu Button */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleOrderNow}
                disabled={isOrderingNow || isSaving}
                className="h-9 px-3 flex items-center space-x-1.5 bg-[var(--accent)] active:bg-[var(--accent-hover)] text-[var(--accent-ink)] font-semibold text-xs rounded-[var(--radius-sm)] transition-colors disabled:opacity-50"
                title="Order Now"
                aria-label="Order Now"
              >
                {isOrderingNow ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-ink)]" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5 text-[var(--accent-ink)]" />
                )}
                <span>Order</span>
              </button>

              <button
                onClick={() => setIsMenuOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--ink-muted)] hover:text-[var(--ink)] active:bg-[var(--bg-raised)] transition-colors"
                title="More Options"
                aria-label="More Options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Overflow Menu Action Sheet */}
          {isMenuOpen && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end">
              {/* Backdrop */}
              <div
                onClick={() => setIsMenuOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              />

              {/* Sheet Body */}
              <div className="relative bg-[var(--bg-surface)] border-t border-[var(--border)] rounded-t-2xl p-4 pb-safe space-y-3 z-10 max-h-[85dvh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
                {/* Handle & Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <div className="flex items-center space-x-2">
                    <span className="font-head text-sm font-medium text-[var(--ink)]">Actions & Export</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--bg-raised)] text-[var(--ink-muted)]">
                      {isDirty ? 'Unsaved' : 'Saved'}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="w-11 h-11 flex items-center justify-center rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)] active:bg-[var(--bg-raised)]"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Menu Items */}
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {/* Save Draft */}
                  <button
                    onClick={async () => {
                      await handleSaveDesign(false);
                      setIsMenuOpen(false);
                    }}
                    disabled={isSaving}
                    className="h-12 w-full flex items-center px-4 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] border border-[var(--border)] text-sm font-medium text-[var(--ink)] space-x-3 transition-colors"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 text-[var(--accent)]" />
                    )}
                    <span>Save Design Draft</span>
                  </button>

                  {/* 3D Mockup Preview */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenPreview();
                    }}
                    className="h-12 w-full flex items-center px-4 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] border border-[var(--border)] text-sm font-medium text-[var(--ink)] space-x-3 transition-colors"
                  >
                    <Box className="w-4 h-4 text-[var(--accent)]" />
                    <span>3D Card Mockup Preview</span>
                  </button>

                  {/* Print Export */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenExport();
                    }}
                    className="h-12 w-full flex items-center px-4 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] border border-[var(--border)] text-sm font-medium text-[var(--ink)] space-x-3 transition-colors"
                  >
                    <Download className="w-4 h-4 text-[var(--ink-muted)]" />
                    <span>Export Print-Ready PDF / PNG</span>
                  </button>

                  {/* Toggle Guides */}
                  <button
                    onClick={() => {
                      setShowGuides(!showGuides);
                    }}
                    className="h-12 w-full flex items-center justify-between px-4 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] border border-[var(--border)] text-sm font-medium text-[var(--ink)] transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {showGuides ? (
                        <Eye className="w-4 h-4 text-[var(--accent)]" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-[var(--ink-muted)]" />
                      )}
                      <span>Print Safe Area Guides</span>
                    </div>
                    <span className="font-mono text-xs text-[var(--ink-muted)]">
                      {showGuides ? 'Visible' : 'Hidden'}
                    </span>
                  </button>

                  {/* Reset Template */}
                  {onResetTemplate && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onResetTemplate();
                      }}
                      className="h-12 w-full flex items-center px-4 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] border border-[var(--border)] text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] space-x-3 transition-colors"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Reset to Template Layout</span>
                    </button>
                  )}
                </div>

                {/* Prominent Order Now & Add to Cart Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleOrderNow();
                    }}
                    disabled={isOrderingNow || isSaving}
                    className="h-12 w-full flex items-center justify-center space-x-2 bg-[var(--accent)] active:bg-[var(--accent-hover)] text-[var(--accent-ink)] font-semibold text-sm rounded-[var(--radius-sm)] shadow-none transition-colors active:translate-y-[1px] disabled:opacity-50"
                  >
                    {isOrderingNow ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-ink)]" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-[var(--accent-ink)]" />
                    )}
                    <span>Order Now (Instant Checkout)</span>
                  </button>

                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="h-11 w-full flex items-center justify-center space-x-2 bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--ink)] font-medium text-sm rounded-[var(--radius-sm)] transition-colors active:translate-y-[1px] disabled:opacity-50"
                  >
                    {isAddingToCart ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 text-[var(--ink-muted)]" />
                    )}
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      );
    };
