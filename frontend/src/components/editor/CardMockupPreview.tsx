/**
 * CardMockupPreview - In-Studio Physical NFC Card 3D Perspective Simulator
 * Authoritative implementation: Pure hardware-accelerated CSS 3D transforms,
 * dynamic mouse tilt tracking (+/- 15 deg), specular sheen glare, and dual-side flipping.
 */

import React, { useState, useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { X, RotateCw, Wifi, Check, Sparkles } from 'lucide-react';
import { useEditorStore } from './useEditorStore';
import { safeParseCanvasJson, normalizeLiveTextStyle } from '../../utils/canvasJson';

interface CardMockupPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
  selectedVariant?: any;
}

export const CardMockupPreview: React.FC<CardMockupPreviewProps> = ({
  isOpen,
  onClose,
  product,
  selectedVariant,
}) => {
  const { canvas, activeSide, frontJson, backJson } = useEditorStore();

  const [previewSide, setPreviewSide] = useState<'front' | 'back'>(activeSide);
  const [frontDataUrl, setFrontDataUrl] = useState<string>('');
  const [backDataUrl, setBackDataUrl] = useState<string>('');
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFlipped, setIsFlipped] = useState<boolean>(activeSide === 'back');

  const cardRef = useRef<HTMLDivElement>(null);

  // Generate real artwork previews on modal open
  useEffect(() => {
    if (!isOpen) return;

    setPreviewSide(activeSide);
    setIsFlipped(activeSide === 'back');

    // 1. Capture current active canvas
    if (canvas) {
      try {
        const liveUrl = canvas.toDataURL({ format: 'png', multiplier: 1.0 });
        if (activeSide === 'front') {
          setFrontDataUrl(liveUrl);
        } else {
          setBackDataUrl(liveUrl);
        }
      } catch (err) {
        console.warn('[CardMockupPreview] Active side capture error:', err);
      }
    }

    // 2. Headless StaticCanvas render for the opposite side
    const targetOppositeJson = activeSide === 'front' ? backJson : frontJson;
    if (targetOppositeJson) {
      try {
        const offEl = document.createElement('canvas');
        const offCanvas = new fabric.StaticCanvas(offEl, {
          width: product?.canvasWidth || 1050,
          height: product?.canvasHeight || 600,
          backgroundColor: '#0A0A0C',
        });

        const parsed = safeParseCanvasJson(targetOppositeJson);
        offCanvas.loadFromJSON(parsed.data, () => {
          const objects = offCanvas.getObjects() || [];
          for (const obj of objects) {
            normalizeLiveTextStyle(obj);
          }
          offCanvas.renderAll();
          const offUrl = offCanvas.toDataURL({ format: 'png', multiplier: 1.0 });
          if (activeSide === 'front') {
            setBackDataUrl(offUrl);
          } else {
            setFrontDataUrl(offUrl);
          }
          offCanvas.dispose();
        });
      } catch (err) {
        console.warn('[CardMockupPreview] Opposite side capture error:', err);
      }
    }
  }, [isOpen, activeSide, frontJson, backJson]);

  if (!isOpen) return null;

  // Mouse tilt tracking (-15 deg to +15 deg)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normalizedX = (x / rect.width - 0.5) * 2; // -1 to 1
    const normalizedY = (y / rect.height - 0.5) * 2; // -1 to 1

    setTilt({
      x: normalizedX * 15,
      y: -normalizedY * 15,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setPreviewSide(isFlipped ? 'front' : 'back');
  };

  const currentArtwork = isFlipped ? (backDataUrl || frontDataUrl) : (frontDataUrl || backDataUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-2xl bg-[#0A0A0C] border border-[#23232A] rounded-2xl shadow-2xl p-6 flex flex-col items-center">
        {/* Modal Top Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-[#23232A]">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Live NFC Card 3D Simulation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#18181D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Perspective Stage */}
        <div
          className="w-full py-12 flex items-center justify-center"
          style={{ perspective: '1000px' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Physical CR80 Card Shell */}
          <div
            ref={cardRef}
            className="relative w-[460px] h-[270px] rounded-[22px] shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing transition-transform duration-100 ease-out border border-[#33333E]"
            style={{
              transform: `rotateY(${tilt.x + (isFlipped ? 180 : 0)}deg) rotateX(${tilt.y}deg)`,
              transformStyle: 'preserve-3d',
              backgroundColor: '#0A0A0C',
            }}
          >
            {/* Live Artwork Surface Texture */}
            {currentArtwork ? (
              <img
                src={currentArtwork}
                alt="Live NFC Card Preview"
                className={`w-full h-full object-cover select-none pointer-events-none ${
                  isFlipped ? 'scale-x-[-1]' : ''
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">
                Generating card artwork...
              </div>
            )}

            {/* Contactless Chip Emblem */}
            <div
              className={`absolute top-4 right-4 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[9px] font-mono tracking-widest text-[#D4AF37] ${
                isFlipped ? 'scale-x-[-1]' : ''
              }`}
            >
              <Wifi className="w-3 h-3 rotate-90" />
              <span>NFC</span>
            </div>

            {/* Dynamic Specular Sheen / Reflection Overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(${125 + tilt.x * 2}deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 60%)`,
              }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="w-full flex items-center justify-between pt-4 border-t border-[#23232A]">
          <div className="text-xs text-neutral-400">
            <span>Viewing </span>
            <span className="font-semibold text-white capitalize">{isFlipped ? 'Back' : 'Front'} Surface</span>
            <span className="text-[10px] text-neutral-500 ml-2">(Move pointer to tilt)</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleFlip}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#121216] hover:bg-[#18181D] border border-[#23232A] text-xs font-semibold text-white transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Flip to {isFlipped ? 'Front' : 'Back'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C058] text-black text-xs font-bold transition-all shadow-sm"
            >
              Continue Editing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

