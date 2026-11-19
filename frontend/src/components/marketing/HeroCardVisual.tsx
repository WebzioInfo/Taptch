import React, { useState, useRef, useEffect, useCallback } from 'react';
import { brandConfig } from '../../config/brand';

/**
 * HeroCardVisual - Premium Matte Black Taptch NFC Card Stack
 * 
 * Features:
 * - High-resolution photorealistic transparent PNG product render (`/card-matte.png`)
 * - Aspect-ratio locked (1672 / 941 ≈ 16:9) to prevent layout shifts or cropping
 * - Nested architecture separating keyframe vertical float from 3D cursor tilt (zero CSS transform collisions)
 * - Ultra-subtle Apple-style 3D perspective tilt reacting smoothly to mouse position
 * - Smooth hardware-accelerated float animation (6s cycle, 8px travel)
 * - Automatic graceful degradation on touch devices and prefers-reduced-motion
 * - Dynamic brand name from config (zero hardcoded brand literals)
 */
export const HeroCardVisual: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [canTilt, setCanTilt] = useState(false);

  // Enable tilt only on devices with fine pointer (mouse) and no reduced-motion preference
  useEffect(() => {
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setCanTilt(hasFinePointer && !prefersReducedMotion);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canTilt || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalized coordinates from -0.5 to +0.5
    const normX = (x / rect.width) - 0.5;
    const normY = (y / rect.height) - 0.5;

    // Strict, subtle rotation limits (max 3 deg for pristine elegance)
    const rotateY = Number((normX * 6).toFixed(2));
    const rotateX = Number((-normY * 6).toFixed(2));

    setTilt({ rotateX, rotateY });
  }, [canTilt]);

  const handleMouseEnter = useCallback(() => {
    if (canTilt) setIsHovered(true);
  }, [canTilt]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[340px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[560px] xl:max-w-[620px] mx-auto select-none [perspective:1200px]"
    >
      {/* Outer Floating Container (Pure Vertical Float Animation) */}
      <div className="w-full animate-hero-card-float will-change-transform">
        {/* Inner Interactive Tilt Container (3D Perspective reacting to cursor) */}
        <div
          className="w-full transition-transform duration-500 ease-out will-change-transform"
          style={{
            transform: canTilt && isHovered
              ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.02, 1.02, 1.02)`
              : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="relative aspect-[1672/941] w-full flex items-center justify-center">
            <img
              src="/card-matte.png"
              alt={`${brandConfig.name} Premium Matte Black Contactless NFC Card Stack`}
              width={1672}
              height={941}
              loading="eager"
              decoding="async"
              className="w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_32px_rgba(0,0,0,0.12)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
