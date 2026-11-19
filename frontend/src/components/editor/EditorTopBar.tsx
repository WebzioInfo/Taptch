/**
 * EditorTopBar - Studio Navigation & Control Bar
 * Manages design naming, undo/redo, front/back switching, print guide toggling,
 * autosave status pill, 3D mockup preview, print export, and Add-to-Cart workflow.
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Undo2,
  Redo2,
  Layers,
  Eye,
  EyeOff,
  RotateCw,
  Box,
  Download,
  Save,
  ShoppingCart,
  CreditCard,
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useEditorStore } from './useEditorStore';
import { ApiClient } from '../../services/api';
import { safeSerializeCanvas } from '../../utils/canvasJson';
import { renderSideToPreview } from '../../utils/canvasRenderer';

interface EditorTopBarProps {
  product?: any;
  selectedVariant?: any;
  onOpenPreview: () => void;
  onOpenExport: () => void;
  onResetTemplate?: () => void;
}

export const EditorTopBar: React.FC<EditorTopBarProps> = ({
  product,
  selectedVariant,
  onOpenPreview,
  onOpenExport,
  onResetTemplate,
}) => {
  const navigate = useNavigate();
  const {
    canvas,
    designName,
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

  const [isSaving, setIsSaving] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isOrderingNow, setIsOrderingNow] = useState(false);
  const savingPromiseRef = useRef<Promise<string | null> | null>(null);

  const canUndo = activeSide === 'front' ? frontHistory.length > 1 : backHistory.length > 1;
  const canRedo = activeSide === 'front' ? frontRedoStack.length > 0 : backRedoStack.length > 0;

  // Save design to backend (front & back with synchronized previews)
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
                    console.warn('[EditorTopBar] Canvas toDataURL failed:', e);
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

              // Synchronize in-memory Zustand store previews
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
                    console.warn('[EditorTopBar] LocalStorage draft cache write error:', storageErr);
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
                }).catch((upErr) => console.warn('[EditorTopBar] Cloudinary preview upload ignored:', upErr));
              }

              setIsSaving(false);
              return savedId;
            } catch (err: any) {
              console.warn('[EditorTopBar] Save draft failed:', err);
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

      // Direct Checkout Order Now workflow
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
          console.warn('[EditorTopBar] Order now navigate failed:', err);
          setIsOrderingNow(false);
          alert('An unexpected error occurred while preparing your checkout. Please try again.');
        }
      };

      // Add to Cart workflow
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
          console.warn('[EditorTopBar] Add to cart failed, adding with fallback:', err);
          setIsAddingToCart(false);
          navigate('/cards');
        }
      };

      return (
        <header className="h-14 border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 flex items-center justify-between z-20 select-none text-[var(--ink)]">
          {/* Left: Back & Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/cards')}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-raised)] transition-colors"
              title="Back to Cards"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="h-4 w-[1px] bg-[var(--border)]" />

            <input
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Untitled Card"
              className="bg-transparent text-sm font-medium text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded-[var(--radius-sm)] px-2 py-0.5 max-w-[200px] border border-transparent hover:border-[var(--border)]"
            />

            {/* Autosave Pill */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-[var(--ink-muted)] px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] font-mono text-[10px]">
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 text-[var(--accent)] animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isDirty ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
                  <span>Unsaved</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-[var(--success)]" />
                  <span>Saved</span>
                </>
              )}
            </div>
          </div>

          {/* Center: Undo/Redo & Side Switcher */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-[var(--bg-raised)] p-0.5 rounded-[var(--radius-sm)] border border-[var(--border)]">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            <div className="h-4 w-[1px] bg-[var(--border)]" />

            {/* Front / Back Side Switcher */}
            <button
              onClick={() => switchSide()}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-medium text-[var(--ink)] transition-colors group"
            >
              <RotateCw className="w-3.5 h-3.5 text-[var(--accent)] group-hover:rotate-180 transition-transform duration-300" />
              <span>Editing {activeSide === 'front' ? 'Front Side' : 'Back Side'}</span>
            </button>

            {/* Print Guides Toggle */}
            <button
              onClick={() => setShowGuides(!showGuides)}
              className={`p-1.5 rounded-[var(--radius-sm)] border transition-colors ${showGuides
                ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent-text)]'
                : 'bg-[var(--bg-raised)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              title={showGuides ? 'Hide Print Safe Guides' : 'Show Print Safe Guides'}
            >
              {showGuides ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          {/* Right: Preview, Export, Save, Add to Cart */}
          <div className="flex items-center space-x-2">
            {onResetTemplate && (
              <button
                onClick={onResetTemplate}
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-raised)] rounded-[var(--radius-sm)] transition-colors"
                title="Reset to Template Layout"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={onOpenPreview}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[var(--bg-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-xs font-medium text-[var(--ink)] transition-colors"
            >
              <Box className="w-4 h-4 text-[var(--accent)]" />
              <span className="hidden sm:inline">3D Mockup</span>
            </button>

            <button
              onClick={onOpenExport}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[var(--bg-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-xs font-medium text-[var(--ink)] transition-colors"
            >
              <Download className="w-4 h-4 text-[var(--ink-muted)]" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => handleSaveDesign(false)}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[var(--bg-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-xs font-medium text-[var(--ink)] transition-colors"
            >
              <Save className="w-4 h-4 text-[var(--accent)]" />
              <span className="hidden md:inline">Save Draft</span>
            </button>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[var(--bg-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--ink)] font-medium text-xs rounded-[var(--radius-sm)] transition-colors active:translate-y-[1px] disabled:opacity-50"
            >
              {isAddingToCart ? (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
              ) : (
                <ShoppingCart className="w-4 h-4 text-[var(--ink-muted)]" />
              )}
              <span className="hidden sm:inline">Add to Cart</span>
            </button>

            {/* Primary Luxury Order Now Button */}
            <button
              onClick={handleOrderNow}
              disabled={isOrderingNow || isSaving}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] font-semibold text-xs rounded-[var(--radius-sm)] shadow-none transition-colors active:translate-y-[1px] disabled:opacity-50"
            >
              {isOrderingNow ? (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-ink)]" />
              ) : (
                <CreditCard className="w-4 h-4 text-[var(--accent-ink)]" />
              )}
              <span>Order Now</span>
            </button>
          </div>
        </header>
      );
    };
