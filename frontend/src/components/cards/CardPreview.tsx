import React, { useState, useEffect } from 'react';
import { Wifi, RefreshCw } from 'lucide-react';
import { renderSideToPreview } from '../../utils/canvasRenderer';

export function getOptimizedCardImageUrl(
  url: string | null | undefined,
  width: 240 | 800 | number = 240
): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  // Cloudinary URL transformation injection
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    // Avoid double transformation injection
    if (url.includes('/f_auto,') || url.includes('/w_')) {
      return url;
    }
    const transform = `f_auto,q_auto,w_${width}`;
    return url.replace('/upload/', `/upload/${transform}/`);
  }
  return url;
}

export interface CardPreviewProps {
  frontUrl?: string | null;
  backUrl?: string | null;
  frontJson?: string | object | null;
  backJson?: string | object | null;
  side?: 'front' | 'back';
  allowFlip?: boolean;
  cloudinaryWidth?: 240 | 800 | number;
  width?: number | string;
  height?: number | string;
  className?: string;
  alt?: string;
  priority?: boolean;
  showFlipHint?: boolean;
  onFlip?: (side: 'front' | 'back') => void;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  frontUrl,
  backUrl,
  frontJson,
  backJson,
  side = 'front',
  allowFlip = false,
  cloudinaryWidth = 240,
  width,
  height,
  className = '',
  alt = 'Taptch NFC Smart Card',
  priority = false,
  showFlipHint = false,
  onFlip,
}) => {
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>(side);
  const [renderedFront, setRenderedFront] = useState<string>(frontUrl || '');
  const [renderedBack, setRenderedBack] = useState<string>(backUrl || '');
  const [frontLoaded, setFrontLoaded] = useState<boolean>(false);
  const [backLoaded, setBackLoaded] = useState<boolean>(false);
  const [frontError, setFrontError] = useState<boolean>(false);
  const [backError, setBackError] = useState<boolean>(false);

  useEffect(() => {
    setCurrentSide(side);
  }, [side]);

  // Synchronize provided image URLs
  useEffect(() => {
    if (frontUrl) {
      setRenderedFront(frontUrl);
      setFrontError(false);
    } else if (frontJson && !renderedFront) {
      renderSideToPreview(frontJson, 1050, 600, 0.45).then((url) => {
        if (url) setRenderedFront(url);
      });
    }
  }, [frontUrl, frontJson]);

  useEffect(() => {
    if (backUrl) {
      setRenderedBack(backUrl);
      setBackError(false);
    } else if (backJson && !renderedBack) {
      renderSideToPreview(backJson, 1050, 600, 0.45).then((url) => {
        if (url) setRenderedBack(url);
      });
    }
  }, [backUrl, backJson]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (!allowFlip) return;
    e.stopPropagation();
    const nextSide = currentSide === 'front' ? 'back' : 'front';
    setCurrentSide(nextSide);
    onFlip?.(nextSide);
  };

  const optimizedFrontUrl = getOptimizedCardImageUrl(renderedFront, cloudinaryWidth);
  const optimizedBackUrl = getOptimizedCardImageUrl(renderedBack, cloudinaryWidth);

  const isFlipped = currentSide === 'back';

  const containerStyle: React.CSSProperties = {
    aspectRatio: '85.6 / 54',
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    perspective: '1000px',
  };

  const isCurrentLoaded = isFlipped ? backLoaded : frontLoaded;

  return (
    <div
      onClick={handleCardClick}
      style={containerStyle}
      className={`relative select-none ${
        allowFlip ? 'cursor-pointer group' : ''
      } ${className}`}
      role={allowFlip ? 'button' : 'img'}
      aria-label={alt}
      title={allowFlip ? 'Click to flip card' : alt}
    >
      {/* 3D Transform Container */}
      <div
        className="w-full h-full relative transition-transform duration-300 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRONT SIDE */}
        <div
          className="absolute inset-0 w-full h-full rounded-[8px] overflow-hidden bg-[#161616] border border-[#E9E9E6] shadow-sm"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {optimizedFrontUrl && !frontError ? (
            <>
              {!frontLoaded && (
                <div className="absolute inset-0 bg-[#EFEFEF] animate-pulse rounded-[8px]" />
              )}
              <img
                src={optimizedFrontUrl}
                alt={`${alt} - Front`}
                loading={priority ? 'eager' : 'lazy'}
                onLoad={() => setFrontLoaded(true)}
                onError={() => {
                  setFrontError(true);
                  setFrontLoaded(true);
                }}
                className={`w-full h-full object-cover rounded-[8px] transition-opacity duration-200 ${
                  frontLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </>
          ) : (
            <FallbackCardPlaceholder label="TAPTCH" side="front" />
          )}
        </div>

        {/* BACK SIDE */}
        <div
          className="absolute inset-0 w-full h-full rounded-[8px] overflow-hidden bg-[#18181B] border border-[#E9E9E6] shadow-sm"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {optimizedBackUrl && !backError ? (
            <>
              {!backLoaded && (
                <div className="absolute inset-0 bg-[#EFEFEF] animate-pulse rounded-[8px]" />
              )}
              <img
                src={optimizedBackUrl}
                alt={`${alt} - Back`}
                loading="lazy"
                onLoad={() => setBackLoaded(true)}
                onError={() => {
                  setBackError(true);
                  setBackLoaded(true);
                }}
                className={`w-full h-full object-cover rounded-[8px] transition-opacity duration-200 ${
                  backLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </>
          ) : (
            <FallbackCardPlaceholder label="TAPTCH NFC" side="back" />
          )}
        </div>
      </div>

      {/* Optional Flip hint overlay */}
      {allowFlip && showFlipHint && (
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 text-[10px] text-white/90 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none">
          <RefreshCw className="w-2.5 h-2.5 animate-spin-reverse" />
          <span>Flip to {isFlipped ? 'front' : 'back'}</span>
        </div>
      )}
    </div>
  );
};

function FallbackCardPlaceholder({ label, side }: { label: string; side: 'front' | 'back' }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#1A1A1E] to-[#0D0D10] text-white p-3 flex flex-col justify-between rounded-[8px] border border-[#2D2D35]">
      <div className="flex items-center justify-between">
        <div className="w-6 h-4 rounded-[3px] bg-gradient-to-r from-[#D4AF37] to-[#E5C058] opacity-80" />
        <Wifi className="w-3.5 h-3.5 text-[#D4AF37]/80 rotate-90" />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-[10px] font-semibold tracking-widest text-[#E9E9E6] uppercase">
          {label}
        </span>
        <span className="text-[8px] tracking-wider text-neutral-400 font-mono">
          {side === 'front' ? 'SMART NFC' : 'TAP TO CONNECT'}
        </span>
      </div>
    </div>
  );
}
