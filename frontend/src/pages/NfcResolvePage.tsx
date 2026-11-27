import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ApiClient } from '../services/api';
import { BrandLogo } from '../components/brand';
import { Wifi, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

interface NfcResolveResponse {
  status: 'active' | 'unconfigured' | 'unavailable' | 'not_found';
  destinationType: 'profile' | 'custom_url' | null;
  destinationUrl: string | null;
}

export interface NfcResolvePageProps {
  expectedProfileType?: 'business' | 'personal';
}

export function NfcResolvePage({ expectedProfileType }: NfcResolvePageProps = {}) {
  const { token, uniqueKey } = useParams<{ token?: string; uniqueKey?: string }>();
  const resolvedKey = uniqueKey || token;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const presetStatus = searchParams.get('status') as NfcResolveResponse['status'] | null;

  const [status, setStatus] = useState<'loading' | 'network_error' | NfcResolveResponse['status']>(
    presetStatus || 'loading',
  );
  const [retryNonce, setRetryNonce] = useState(0);
  const lastFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (presetStatus) {
      setStatus(presetStatus);
      return;
    }
    if (!resolvedKey) {
      setStatus('not_found');
      return;
    }

    const requestKey = `${resolvedKey}:${expectedProfileType || 'any'}:${retryNonce}`;
    if (lastFetchedRef.current === requestKey) return;
    lastFetchedRef.current = requestKey;

    let mounted = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
      if (mounted) setStatus('network_error');
    }, 10000);

    const typeQuery = expectedProfileType ? `?type=${encodeURIComponent(expectedProfileType)}` : '';
    ApiClient.get<NfcResolveResponse>(
      `/api/v1/nfc/${encodeURIComponent(resolvedKey)}/resolve${typeQuery}`,
      { signal: controller.signal },
    )
      .then((res) => {
        window.clearTimeout(timeoutId);
        if (!mounted) return;
        if (res?.status === 'active' && res.destinationUrl) {
          if (res.destinationUrl.startsWith('/')) {
            navigate(res.destinationUrl, { replace: true, state: { fromNfcRedirect: true } });
          } else if (
            typeof window !== 'undefined' &&
            res.destinationUrl.startsWith(window.location.origin)
          ) {
            const rel = res.destinationUrl.slice(window.location.origin.length) || '/';
            navigate(rel, { replace: true, state: { fromNfcRedirect: true } });
          } else {
            window.location.replace(res.destinationUrl);
          }
          return;
        }
        setStatus(res?.status || 'unconfigured');
      })
      .catch((err: unknown) => {
        window.clearTimeout(timeoutId);
        if (!mounted) return;
        const anyErr = err as { statusCode?: number; status?: number; message?: string } | null;
        const statusCode = anyErr?.statusCode ?? anyErr?.status;
        if (statusCode === 404) {
          setStatus('not_found');
        } else {
          setStatus('network_error');
        }
      });

    return () => {
      mounted = false;
      lastFetchedRef.current = null;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [resolvedKey, expectedProfileType, presetStatus, retryNonce, navigate]);

  if (status === 'loading') {
    return (
      <div
        className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-4 font-body"
        aria-busy="true"
        aria-label="Resolving NFC destination"
      >
        <div className="mb-5">
          {/* <BrandLogo variant="symbol" size="md" /> */}
        </div>
        <div className="flex items-center gap-2" role="status" aria-label="Connecting">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] animate-bounce" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#171717] flex flex-col items-center justify-center p-4 font-body">
      <div className="max-w-md w-full bg-white border border-[#E8E8E8] rounded-2xl p-8 text-center shadow-sm space-y-5">
        <div className="flex justify-center">
          <BrandLogo variant="symbol" size="md" asLink href="/" />
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#FFF3E9] border border-[#FF6A00]/20 text-[#FF6A00] flex items-center justify-center mx-auto">
          {status === 'unavailable' || status === 'not_found' ? (
            <AlertCircle className="w-6 h-6" />
          ) : (
            <Wifi className="w-6 h-6" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="font-head text-xl font-semibold text-[#171717]">
            {status === 'network_error'
              ? 'Unable to connect right now.'
              : status === 'unavailable'
                ? 'This NFC card is currently unavailable.'
                : status === 'not_found'
                  ? 'NFC card not recognized.'
                  : "This NFC card hasn't been configured yet."}
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
            {status === 'network_error'
              ? 'Please check your internet connection and tap Retry to open this NFC card.'
              : status === 'unavailable'
                ? 'This card has been deactivated or marked unavailable by its owner.'
                : status === 'not_found'
                  ? 'The scanned NFC identifier does not match an active card.'
                  : 'If you own this card, sign in to your dashboard to connect a digital profile or custom URL.'}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {status === 'network_error' && (
            <button
              type="button"
              onClick={() => {
                setStatus('loading');
                setRetryNonce((n) => n + 1);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
          <Link
            to="/dashboard/my-nfc-cards"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs font-semibold transition-colors"
          >
            <span>Configure My Card</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#E8E8E8] bg-white hover:bg-[#F8F9FB] text-xs font-medium text-[#171717] transition-colors"
          >
            Explore Cards
          </Link>
        </div>
      </div>
    </div>
  );
}
