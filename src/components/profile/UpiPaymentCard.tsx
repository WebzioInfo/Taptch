'use client';

import * as React from 'react';
import { QrCode, Copy, Check, Download, ExternalLink, IndianRupee, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildUpiPaymentUri, generateUpiQrDataUrl, type UpiPaymentConfig } from '@/lib/upi';

export interface UpiPaymentCardProps {
  config: UpiPaymentConfig;
  className?: string;
  themeStyle?: 'luxury' | 'minimal' | 'creator' | 'corporate' | 'emerald';
}

export function UpiPaymentCard({ config, className = '', themeStyle: _themeStyle = 'luxury' }: UpiPaymentCardProps) {
  const [copied, setCopied] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [showQrModal, setShowQrModal] = React.useState(false);
  const [amountInput, _setAmountInput] = React.useState<string>(
    config.defaultAmount ? String(config.defaultAmount) : ''
  );

  const paymentUri = React.useMemo(() => {
    return buildUpiPaymentUri({
      upiId: config.upiId,
      payeeName: config.payeeName,
      amount: amountInput || undefined,
      note: config.note || config.description || 'Payment via Taptch Profile',
    });
  }, [config, amountInput]);

  React.useEffect(() => {
    let active = true;
    generateUpiQrDataUrl(paymentUri, { width: 360, margin: 2 }).then((url) => {
      if (active) setQrDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [paymentUri]);

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(config.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `UPI-QR-${config.upiId.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold tracking-tight">
              {config.payeeName || 'Direct UPI Payment'}
            </h4>
            <p className="text-[11px] opacity-70">
              {config.description || 'Scan QR or pay directly with any Indian UPI app'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Show UPI QR Code"
        >
          <QrCode className="w-4 h-4" />
          <span className="hidden sm:inline text-[11px]">QR Code</span>
        </button>
      </div>

      {/* VPA Copy Bar */}
      <div className="mt-4 flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/10">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase font-semibold opacity-60 block">UPI ID / VPA</span>
          <span className="font-mono text-xs font-bold truncate block">{config.upiId}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="ml-2 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 flex items-center gap-1 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Direct UPI Intent Button */}
      <div className="mt-3.5 flex items-center gap-2">
        <a
          href={paymentUri}
          className="flex-1 py-2.5 px-4 rounded-xl text-center text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Pay via UPI App</span>
        </a>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowQrModal(true)}
          className="text-xs h-9.5 px-3"
        >
          <QrCode className="w-4 h-4 mr-1" />
          View QR
        </Button>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] opacity-60">
        <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
        <span>GPay, PhonePe, Paytm, BHIM & all bank UPI apps supported.</span>
      </div>

      {/* QR Code Popup Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#121216] p-6 space-y-4 text-white relative shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base">Scan to Pay via UPI</h3>
              <p className="text-xs text-neutral-400">
                {config.payeeName ? `Pay to ${config.payeeName}` : config.upiId}
              </p>
            </div>

            {/* High-Contrast QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-2xl mx-auto max-w-[240px] shadow-inner">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="UPI Payment QR Code" className="w-48 h-48 object-contain" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-black/40 text-xs font-mono">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="text-center">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                {config.upiId}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadQr}
                className="flex-1 text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download QR
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowQrModal(false)}
                className="flex-1 text-xs bg-white text-black hover:bg-neutral-200"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
