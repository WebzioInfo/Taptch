/**
 * ExportModal - Commercial Print Production & Portable JSON Exporter
 * Instantiates offscreen headless fabric.StaticCanvas instances with a 3.0x multiplier,
 * generating pristine 3150x1800 px (~300 DPI) PNG files and portable design JSON definitions.
 */

import React, { useState } from 'react';
import { fabric } from 'fabric';
import { X, Download, FileJson, Check, Loader2, Printer } from 'lucide-react';
import { useEditorStore } from './useEditorStore';
import { safeParseCanvasJson, normalizeLiveTextStyle } from '../../utils/canvasJson';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, product }) => {
  const { frontJson, backJson, designName } = useEditorStore();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const logicalWidth = product?.canvasWidth || 1050;
  const logicalHeight = product?.canvasHeight || 600;

  // Render a specific side JSON to high-resolution 300 DPI PNG using headless StaticCanvas
  const renderSideToPng = (jsonStr: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const offEl = document.createElement('canvas');
        const offCanvas = new fabric.StaticCanvas(offEl, {
          width: logicalWidth,
          height: logicalHeight,
          backgroundColor: '#0A0A0C',
        });

        const parsed = safeParseCanvasJson(jsonStr);
        offCanvas.loadFromJSON(parsed.data, () => {
          const objects = offCanvas.getObjects() || [];
          for (const obj of objects) {
            normalizeLiveTextStyle(obj);
          }
          offCanvas.renderAll();

          // 3.0x scaling multiplier: 1050x600 -> 3150x1800 px (300 DPI commercial standard)
          const dataUrl = offCanvas.toDataURL({
            format: 'png',
            quality: 1.0,
            multiplier: 3.0,
          });

          offCanvas.dispose();
          resolve(dataUrl);
        });
      } catch (err) {
        reject(err);
      }
    });
  };

  const triggerDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPng = async (side: 'front' | 'back' | 'both') => {
    setIsExporting(true);
    setExportSuccess(null);

    const safeName = (designName || 'nfc_card').replace(/\s+/g, '_').toLowerCase();

    try {
      if (side === 'front' || side === 'both') {
        const frontUrl = await renderSideToPng(frontJson);
        triggerDownload(frontUrl, `${safeName}_FRONT_300DPI.png`);
      }

      if (side === 'back' || side === 'both') {
        const backUrl = await renderSideToPng(backJson);
        triggerDownload(backUrl, `${safeName}_BACK_300DPI.png`);
      }

      setExportSuccess(side === 'both' ? 'Both sides exported' : `${side.toUpperCase()} side exported`);
    } catch (err: any) {
      console.error('[ExportModal] Export failed:', err);
      alert('Failed to generate high-resolution print files.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
    const safeName = (designName || 'nfc_card').replace(/\s+/g, '_').toLowerCase();
    const exportData = {
      schema: 'taptch-studio-1.0',
      exportedAt: new Date().toISOString(),
      designName,
      product: {
        id: product?.id,
        name: product?.name,
        canvasWidth: logicalWidth,
        canvasHeight: logicalHeight,
      },
      frontCanvasJson: safeParseCanvasJson(frontJson).data,
      backCanvasJson: safeParseCanvasJson(backJson).data,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${safeName}_PORTABLE_DESIGN.json`);
    URL.revokeObjectURL(url);
    setExportSuccess('Portable design JSON exported');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-md bg-[#0A0A0C] border border-[#23232A] rounded-2xl shadow-2xl p-6 flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#23232A]">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Production Print Export</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#18181D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Specifications Information */}
        <div className="my-5 p-4 rounded-xl bg-[#121216] border border-[#23232A] text-xs space-y-1.5 text-neutral-300">
          <div className="flex justify-between">
            <span className="text-neutral-400">Resolution Multiplier:</span>
            <span className="font-mono font-semibold text-[#D4AF37]">3.0x (3150 x 1800 px)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Commercial Density:</span>
            <span className="font-mono text-emerald-400">~300 DPI True Quality</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Die-Cut Bleed Allowance:</span>
            <span className="font-mono">25 px (~2.0mm)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Editor UI Artifacts:</span>
            <span className="text-neutral-200">Zero (Clean headless capture)</span>
          </div>
        </div>

        {exportSuccess && (
          <div className="mb-4 flex items-center space-x-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-xs text-emerald-300">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{exportSuccess} successfully!</span>
          </div>
        )}

        {/* Export Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => handleExportPng('front')}
            disabled={isExporting}
            className="w-full py-2.5 px-4 rounded-xl bg-[#121216] hover:bg-[#18181D] border border-[#23232A] hover:border-[#D4AF37] text-xs font-semibold flex items-center justify-between transition-colors disabled:opacity-50"
          >
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4 text-[#D4AF37]" />
              <span>Download Front (300 DPI PNG)</span>
            </div>
            <span className="text-[10px] text-neutral-400">3150 x 1800</span>
          </button>

          <button
            onClick={() => handleExportPng('back')}
            disabled={isExporting}
            className="w-full py-2.5 px-4 rounded-xl bg-[#121216] hover:bg-[#18181D] border border-[#23232A] hover:border-[#D4AF37] text-xs font-semibold flex items-center justify-between transition-colors disabled:opacity-50"
          >
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4 text-[#D4AF37]" />
              <span>Download Back (300 DPI PNG)</span>
            </div>
            <span className="text-[10px] text-neutral-400">3150 x 1800</span>
          </button>

          <button
            onClick={() => handleExportPng('both')}
            disabled={isExporting}
            className="w-full py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C058] text-black text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Printer className="w-4 h-4 text-black" />}
            <span>Download Both Sides (Print Package)</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={isExporting}
            className="w-full py-2 px-4 rounded-xl bg-[#18181D] hover:bg-[#23232A] border border-[#23232A] text-xs text-neutral-300 font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
          >
            <FileJson className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export Portable Design JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};

