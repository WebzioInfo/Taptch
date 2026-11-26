import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { env } from '../../config/env';
import { validateUsernameFormat } from '../../config/reservedUsernames';
import { CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';

export interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  originalUsername?: string;
  isLocked?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
  onAvailabilityChange?: (available: boolean) => void;
}

export function UsernameInput({
  value,
  onChange,
  originalUsername,
  isLocked = false,
  label = 'Public Username *',
  placeholder = 'john',
  required = true,
  onAvailabilityChange,
}: UsernameInputProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);

  const cleanValue = value.toLowerCase().trim();
  const baseUrl = env.nfcPublicBaseUrl || 'https://taptch.com';
  const publicUrl = cleanValue ? `${baseUrl}/${cleanValue}` : `${baseUrl}/username`;

  useEffect(() => {
    if (isLocked) {
      setStatus('available');
      setFeedback('Username is locked because an NFC card is linked to this profile.');
      onAvailabilityChange?.(true);
      return;
    }

    if (!cleanValue) {
      setStatus('idle');
      setFeedback(null);
      onAvailabilityChange?.(false);
      return;
    }

    // If editing and unchanged from original username, it is valid for this profile
    if (originalUsername && cleanValue === originalUsername.toLowerCase().trim()) {
      setStatus('available');
      setFeedback('Your current profile username');
      onAvailabilityChange?.(true);
      return;
    }

    const formatErr = validateUsernameFormat(cleanValue);
    if (formatErr) {
      setStatus('unavailable');
      setFeedback(formatErr);
      onAvailabilityChange?.(false);
      return;
    }

    setStatus('checking');
    setFeedback('Checking availability...');
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        const res = await ApiClient.get<{
          available: boolean;
          username: string;
          reason?: string;
        }>(`/api/v1/profiles/check-username/${encodeURIComponent(cleanValue)}`);
        if (cancelled) return;
        if (res?.available) {
          setStatus('available');
          setFeedback('Username is available');
          onAvailabilityChange?.(true);
        } else {
          setStatus('unavailable');
          setFeedback(res?.reason || 'Username is already taken.');
          onAvailabilityChange?.(false);
        }
      } catch {
        if (cancelled) return;
        // Fallback: format is valid, backend will re-validate on submit
        setStatus('idle');
        setFeedback(null);
        onAvailabilityChange?.(true);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cleanValue, originalUsername, isLocked, onAvailabilityChange]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-medium text-[#171717]">
          {label}
        </label>
        {isLocked && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Lock className="w-2.5 h-2.5" />
            <span>NFC Locked</span>
          </span>
        )}
      </div>

      <div
        className={`flex rounded-lg overflow-hidden border transition-colors ${
          isLocked
            ? 'border-[#E8E8E8] bg-[#F8F9FB] opacity-80'
            : status === 'unavailable'
              ? 'border-rose-400 bg-white'
              : status === 'available'
                ? 'border-emerald-400 bg-white'
                : 'border-[#E8E8E8] bg-white focus-within:border-[#FF6A00]'
        }`}
      >
        <span className="px-3 py-2 text-xs text-[#666666] bg-[#F8F9FB] border-r border-[#E8E8E8] font-mono select-none shrink-0">
          taptch.com/
        </span>
        <input
          type="text"
          value={value}
          disabled={isLocked}
          required={required}
          maxLength={32}
          onChange={(e) => {
            const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            onChange(sanitized);
          }}
          placeholder={placeholder}
          aria-label="Profile Username"
          className="w-full px-3 py-2 text-xs sm:text-sm font-mono text-[#171717] bg-transparent focus:outline-none disabled:cursor-not-allowed"
        />
        <div className="flex items-center pr-2.5">
          {status === 'checking' && <Loader2 className="w-4 h-4 text-[#929292] animate-spin" />}
          {status === 'available' && !isLocked && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {status === 'unavailable' && <AlertCircle className="w-4 h-4 text-rose-600" />}
          {isLocked && <Lock className="w-4 h-4 text-amber-600" />}
        </div>
      </div>

      {/* Live Public URL Preview */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="font-mono text-[#666666] truncate">
          Public URL: <strong className="text-[#171717]">{publicUrl}</strong>
        </span>
        {feedback && (
          <span
            className={
              status === 'unavailable'
                ? 'text-rose-600 font-medium'
                : status === 'available'
                  ? 'text-emerald-700 font-medium'
                  : 'text-[#666666]'
            }
          >
            {feedback}
          </span>
        )}
      </div>
    </div>
  );
}
