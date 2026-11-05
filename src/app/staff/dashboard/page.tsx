'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import jsQR from 'jsqr';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession, signOut } from '@/lib/auth/client';
import {
  Camera,
  Upload,
  ArrowRight,
  LogOut,
  History,
  QrCode,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { extractQRToken } from '@/modules/qr/token-parser';

interface RecentAssignment {
  id: string;
  token: string;
  label: string | null;
  manualRedirectUrl: string | null;
  assignedAt: string;
  customerName: string | null;
  customerBusiness: string | null;
}

export default function StaffDashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [manualToken, setManualToken] = React.useState('');
  const [recentAssignments, setRecentAssignments] = React.useState<RecentAssignment[]>([]);
  const [totalConfigured, setTotalConfigured] = React.useState(0);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animFrameRef = React.useRef<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Load staff recent history
  React.useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/admin/staff/${session.user.id}/analytics`)
        .then((res) => res.json())
        .then((res) => {
          if (res.data) {
            setTotalConfigured(res.data.totalConfigured || 0);
            setRecentAssignments(res.data.history?.slice(0, 6) || []);
          }
        })
        .catch(() => {});
    }
  }, [session?.user?.id]);

  // Camera Scanning Loop with jsQR
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(tick);
      }
    } catch {
      setCameraError('Camera access denied or unavailable. You can enter token or upload photo.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setCameraActive(false);
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          const parsedToken = extractQRToken(code.data);
          if (parsedToken) {
            stopCamera();
            router.push(`/staff/assign/${parsedToken}`);
            return;
          }
        }
      }
    }
    animFrameRef.current = requestAnimationFrame(tick);
  };

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    const token = extractQRToken(manualToken);
    router.push(`/staff/assign/${token}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            const token = extractQRToken(code.data);
            router.push(`/staff/assign/${token}`);
          } else {
            alert('No valid QR code found in the selected image.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-foreground flex flex-col pb-12">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-800 bg-[#0A0A0C]/90 px-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <BrandLogo variant="symbol" size="sm" />
          <span className="text-xs font-bold text-white tracking-wide">FIELD PORTAL</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/staff/history">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1 text-neutral-300">
              <History className="h-3.5 w-3.5" />
              <span>History</span>
            </Button>
          </Link>
          <button
            onClick={async () => {
              await signOut();
              router.replace('/staff/login');
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 pt-4 space-y-5">
        {/* Metric summary */}
        <div className="bg-[#121216] border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-neutral-400 font-medium">Activated by you</div>
            <div className="text-xl font-bold text-primary mt-0.5">{totalConfigured} QRs</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Viewfinder / Camera Section */}
        <div className="bg-[#121216] border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Live Camera Scanner</span>
            {cameraActive && (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Scanning
              </span>
            )}
          </div>

          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-neutral-800">
            {cameraActive ? (
              <>
                <video ref={videoRef} className="h-full w-full object-cover" />
                {/* Target overlay reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-56 w-56 border-2 border-primary/80 rounded-2xl relative shadow-2xl">
                    <div className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-primary" />
                    <div className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-primary" />
                    <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-primary" />
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-primary" />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-6 space-y-2">
                <QrCode className="h-12 w-12 text-neutral-600 mx-auto" />
                <p className="text-xs text-neutral-400">Position physical QR inside viewfinder</p>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            {cameraActive ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopCamera}
                className="w-full h-10 text-xs font-semibold"
              >
                Stop Camera
              </Button>
            ) : (
              <Button
                variant="gold"
                size="sm"
                onClick={startCamera}
                className="w-full h-10 text-xs font-semibold gap-1.5"
              >
                <Camera className="h-4 w-4" />
                <span>Open Camera</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-10 text-xs font-medium gap-1.5 border-neutral-700 hover:bg-neutral-800"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Photo</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Manual Token Entry Form */}
        <form onSubmit={handleManualSubmit} className="bg-[#121216] border border-neutral-800 rounded-xl p-4 space-y-2">
          <label className="text-[11px] text-neutral-400 font-medium">Or enter Token / URL manually</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g. c8e3345b or https://.../dq/token"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="h-10 text-xs bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
            />
            <Button type="submit" size="sm" className="h-10 px-4 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Recent Assignments Widget */}
        {recentAssignments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Your Recent Activations</span>
              <Link href="/staff/history" className="text-[11px] text-primary hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-2">
              {recentAssignments.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/staff/assign/${item.token}`)}
                  className="bg-[#121216] border border-neutral-800/80 rounded-xl p-3 flex items-center justify-between hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="text-xs font-semibold text-white truncate">
                      {item.customerBusiness || item.customerName || item.label || item.token}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate flex items-center gap-1">
                      <span>{item.manualRedirectUrl || 'No destination'}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-mono bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded border border-neutral-800">
                    {item.token}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
