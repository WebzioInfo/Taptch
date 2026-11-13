import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    // Check if dismissed within the last 7 days
    const dismissedUntil = localStorage.getItem('taptch_pwa_dismissed_until');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      return;
    }

    // Check if already in standalone display mode (installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      return;
    }

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios');
    if (isIosDevice && isSafari) {
      setIsIos(true);
      setShowPrompt(true);
      return;
    }

    // Android / Desktop Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosInstructions(false);
    // Dismiss for 7 days
    localStorage.setItem(
      'taptch_pwa_dismissed_until',
      String(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Non-intrusive bottom banner */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
        <div className="rounded-2xl border border-primary/30 bg-[#121216]/95 backdrop-blur-xl p-4 shadow-2xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold">Install Taptch App</h4>
              <p className="text-[11px] text-muted-foreground">
                Fast, instant NFC identity &amp; offline card access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="gold"
              onClick={handleInstallClick}
              className="text-xs h-8 px-3 font-bold gap-1 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-md text-muted-foreground hover:text-white"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIosInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border/60 bg-[#121216] p-6 text-white space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowIosInstructions(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-2">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base">Install on iPhone / iPad</h3>
              <p className="text-xs text-muted-foreground">
                Install Taptch directly to your iOS Home Screen in 2 simple taps:
              </p>
            </div>

            <div className="space-y-3 bg-[#18181D] p-4 rounded-xl border border-border/40 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Tap the <Share className="w-3.5 h-3.5 inline mx-1 text-primary" /> <strong>Share</strong> button at the bottom of your Safari screen.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Scroll down and select <strong>"Add to Home Screen"</strong> (+ icon).
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="gold"
              onClick={handleDismiss}
              className="w-full text-xs font-bold h-9"
            >
              Got It
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

