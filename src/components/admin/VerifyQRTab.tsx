'use client';

import * as React from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Camera, Volume2, CheckCircle2, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { extractQRToken } from '@/modules/qr/token-parser';

interface ScanLogEntry {
  id: string;
  token: string;
  timestamp: string;
  status: 'unique' | 'duplicate' | 'invalid';
}

export function VerifyQRTab() {
  const [cameraActive, setCameraActive] = React.useState(false);
  const [flashColor, setFlashColor] = React.useState<'none' | 'green' | 'red'>('none');
  const [uniqueScans, setUniqueScans] = React.useState<Set<string>>(new Set());
  const [duplicateCount, setDuplicateCount] = React.useState(0);
  const [scanLogs, setScanLogs] = React.useState<ScanLogEntry[]>([]);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animFrameRef = React.useRef<number | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const lastScannedTokenRef = React.useRef<string | null>(null);
  const lastScanTimeRef = React.useRef<number>(0);

  // Initialize Web Audio API
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // 880 Hz Sine Wave for Unique Success
  const playSuccessTone = () => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // 200 Hz Sawtooth Buzz for Duplicate Warning
  const playWarningBuzz = () => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime); // 200 Hz warning buzz
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio context might be restricted
    }
  };

  const handleDetectedToken = (rawToken: string) => {
    const token = rawToken.toLowerCase().trim();
    const now = Date.now();

    // Debounce identical scans within 800ms
    if (lastScannedTokenRef.current === token && now - lastScanTimeRef.current < 800) {
      return;
    }
    lastScannedTokenRef.current = token;
    lastScanTimeRef.current = now;

    const timeStr = new Date().toLocaleTimeString();

    setUniqueScans((prev) => {
      if (prev.has(token)) {
        // DUPLICATE SCAN
        setDuplicateCount((d) => d + 1);
        playWarningBuzz();
        setFlashColor('red');
        setTimeout(() => setFlashColor('none'), 300);

        setScanLogs((logs) => [
          { id: `${now}_${token}`, token, timestamp: timeStr, status: 'duplicate' },
          ...logs.slice(0, 49),
        ]);
        return prev;
      } else {
        // UNIQUE SCAN
        const next = new Set(prev);
        next.add(token);
        playSuccessTone();
        setFlashColor('green');
        setTimeout(() => setFlashColor('none'), 300);

        setScanLogs((logs) => [
          { id: `${now}_${token}`, token, timestamp: timeStr, status: 'unique' },
          ...logs.slice(0, 49),
        ]);
        return next;
      }
    });
  };

  const startScanning = async () => {
    try {
      getAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(processFrame);
      }
    } catch {
      alert('Camera access denied or unavailable.');
    }
  };

  const stopScanning = () => {
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

  const processFrame = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          const token = extractQRToken(code.data);
          if (token) {
            handleDetectedToken(token);
          }
        }
      }
    }
    animFrameRef.current = requestAnimationFrame(processFrame);
  };

  React.useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Counters & Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121216] border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-400 font-medium">Unique Verified QRs</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{uniqueScans.size}</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#121216] border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-400 font-medium">Duplicate Scans</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">{duplicateCount}</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#121216] border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-400 font-medium">Web Audio Feedback</div>
            <div className="text-xs font-semibold text-white mt-1">880 Hz Sine / 200 Hz Buzz</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Volume2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scanner Viewport */}
        <div className="lg:col-span-7 bg-[#121216] border border-neutral-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">60 FPS Production Scanner</span>
            <div className="flex gap-2">
              {cameraActive ? (
                <Button variant="destructive" size="sm" onClick={stopScanning} className="h-8 text-xs font-semibold">
                  Stop Scanner
                </Button>
              ) : (
                <Button variant="gold" size="sm" onClick={startScanning} className="h-8 text-xs font-semibold gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Start QA Camera</span>
                </Button>
              )}
            </div>
          </div>

          <div
            className={`relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center transition-all duration-200 border-4 ${
              flashColor === 'green'
                ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                : flashColor === 'red'
                ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.5)]'
                : 'border-neutral-800'
            }`}
          >
            {cameraActive ? (
              <video ref={videoRef} className="h-full w-full object-cover" />
            ) : (
              <div className="text-center p-6 text-neutral-500 space-y-2">
                <Camera className="h-10 w-10 mx-auto text-neutral-600" />
                <p className="text-xs">Click Start QA Camera to verify manufactured batch stickers</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Session Log */}
        <div className="lg:col-span-5 bg-[#121216] border border-neutral-800 rounded-2xl p-4 flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Session Scan Feed</span>
            <button
              onClick={() => {
                setUniqueScans(new Set());
                setDuplicateCount(0);
                setScanLogs([]);
              }}
              className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pt-2 space-y-1.5 text-xs font-mono">
            {scanLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-500 text-xs font-sans">
                Awaiting scans...
              </div>
            ) : (
              scanLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded-lg flex items-center justify-between border ${
                    log.status === 'unique'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {log.status === 'unique' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="font-bold">{log.token}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                    <span className="uppercase">{log.status}</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
