/**
 * EditorTopBar - Studio Navigation & Control Bar
 * Manages design naming, undo/redo, front/back switching, print guide toggling,
 * autosave status pill, 3D mockup preview, print export, and Add-to-Cart workflow.
 */

import React, { useState } from 'react';
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
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useEditorStore } from './useEditorStore';
import { ApiClient } from '../../services/api';
import { brandConfig } from '../../config/brand';
import { safeSerializeCanvas } from '../../utils/canvasJson';

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
    saveStatus,
    markSaved,
    frontJson,
    backJson,
    designId,
    activeTemplateId,
  } = useEditorStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const canUndo = activeSide === 'front' ? frontHistory.length > 1 : backHistory.length > 1;
  const canRedo = activeSide === 'front' ? frontRedoStack.length > 0 : backRedoStack.length > 0;

  // Save design to backend
  const handleSaveDesign = async (silent = false): Promise<string | null> => {
    setIsSaving(true);
    try {
      // Ensure current canvas side is serialized
      let fJson = frontJson;
      let bJson = backJson;
      let previewUrl = '';

      if (canvas) {
        const currentSideJson = safeSerializeCanvas(canvas);
        if (activeSide === 'front') {
          fJson = currentSideJson;
        } else {
          bJson = currentSideJson;
        }
        try {
          previewUrl = canvas.toDataURL({ format: 'png', multiplier: 0.5 });
        } catch (e) {
          // ignore
        }
      }

      const payload = {
        name: designName || 'Untitled NFC Card',
        productId: product?.id,
        variantId: selectedVariant?.id,
        templateId: activeTemplateId,
        frontCanvasJson: fJson,
        backCanvasJson: bJson,
        previewUrl,
      };

      const res = await ApiClient.post<any>('/api/v1/designs/draft', payload);
      const savedId = res?.id || designId || 'draft';
      markSaved(savedId);
      setIsSaving(false);
      return savedId;
    } catch (err: any) {
      console.warn('[EditorTopBar] Save draft failed:', err);
      setIsSaving(false);
      if (!silent) {
        alert('Failed to save design draft. Please check your connection.');
      }
      return null;
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
      // Navigate to cart or cards page
      navigate('/cards');
    }
  };

  return (
    <header className="h-14 border-b border-[#23232A] bg-[#0A0A0C] px-4 flex items-center justify-between z-20 select-none">
      {/* Left: Back & Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/cards')}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#18181D] transition-colors"
          title="Back to Cards"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="h-4 w-[1px] bg-[#23232A]" />

        <input
          type="text"
          value={designName}
          onChange={(e) => setDesignName(e.target.value)}
          placeholder="Untitled Card"
          className="bg-transparent text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 rounded px-2 py-0.5 max-w-[200px] border border-transparent hover:border-[#23232A]"
        />

        {/* Autosave Pill */}
        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-neutral-400 px-2 py-0.5 rounded-full bg-[#121216] border border-[#23232A]">
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 text-[#D4AF37] animate-spin" />
              <span>Saving...</span>
            </>
          ) : isDirty ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Unsaved</span>
            </>
          ) : (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Center: Undo/Redo & Side Switcher */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center bg-[#121216] p-0.5 rounded-lg border border-[#23232A]">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded text-neutral-300 hover:text-white hover:bg-[#18181D] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded text-neutral-300 hover:text-white hover:bg-[#18181D] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[#23232A]" />

        {/* Front / Back Side Switcher */}
        <button
          onClick={() => switchSide()}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#121216] hover:bg-[#18181D] border border-[#23232A] text-xs font-semibold text-white transition-all group"
        >
          <RotateCw className="w-3.5 h-3.5 text-[#D4AF37] group-hover:rotate-180 transition-transform duration-300" />
          <span>Editing {activeSide === 'front' ? 'Front Side' : 'Back Side'}</span>
        </button>

        {/* Print Guides Toggle */}
        <button
          onClick={() => setShowGuides(!showGuides)}
          className={`p-1.5 rounded-lg border transition-colors ${showGuides
              ? 'bg-[#18181D] border-[#D4AF37]/40 text-[#D4AF37]'
              : 'bg-[#121216] border-[#23232A] text-neutral-400 hover:text-white'
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
            className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-[#18181D] rounded-lg transition-colors"
            title="Reset to Template Layout"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}

        <button
          onClick={onOpenPreview}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#121216] hover:bg-[#18181D] border border-[#23232A] rounded-lg text-xs font-medium text-white transition-colors"
        >
          <Box className="w-4 h-4 text-[#D4AF37]" />
          <span className="hidden sm:inline">3D Mockup</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#121216] hover:bg-[#18181D] border border-[#23232A] rounded-lg text-xs font-medium text-white transition-colors"
        >
          <Download className="w-4 h-4 text-neutral-300" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <button
          onClick={() => handleSaveDesign(false)}
          disabled={isSaving}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#18181D] hover:bg-[#23232A] border border-[#23232A] rounded-lg text-xs font-medium text-white transition-colors"
        >
          <Save className="w-4 h-4 text-[#D4AF37]" />
          <span className="hidden md:inline">Save Draft</span>
        </button>

        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#D4AF37] hover:bg-[#E5C058] text-black font-semibold text-xs rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          {isAddingToCart ? (
            <Loader2 className="w-4 h-4 animate-spin text-black" />
          ) : (
            <ShoppingCart className="w-4 h-4 text-black" />
          )}
          <span>Add to Cart</span>
        </button>
      </div>
    </header>
  );
};
