'use client';

import * as React from 'react';
import { PasswordInput } from '@/components/ui/password-input';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Too weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  hasMinLength: boolean;
  hasNumberOrSymbol: boolean;
  hasUppercase: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasNumberOrSymbol = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);

  let score = 0;
  if (password.length >= 6) score += 1;
  if (hasMinLength) score += 1;
  if (hasNumberOrSymbol) score += 1;
  if (hasUppercase) score += 1;

  const labels: PasswordStrength['label'][] = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

  return {
    score,
    label: labels[score] || 'Too weak',
    color: colors[score] || 'bg-red-500',
    hasMinLength,
    hasNumberOrSymbol,
    hasUppercase,
  };
}

export interface PasswordStrengthMeterProps {
  password?: string;
  className?: string;
}

export function PasswordStrengthMeter({ password = '', className }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const strength = evaluatePasswordStrength(password);

  return (
    <div className={cn('space-y-1.5 pt-1', className)}>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500">Password strength</span>
        <span className={cn('font-medium', {
          'text-red-600': strength.score <= 1,
          'text-amber-600': strength.score === 2,
          'text-blue-600': strength.score === 3,
          'text-emerald-600': strength.score >= 4,
        })}>
          {strength.label}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              'h-full transition-colors duration-200',
              strength.score >= step ? strength.color : 'bg-slate-200'
            )}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-0.5">
        <span className={cn('flex items-center gap-1', strength.hasMinLength ? 'text-emerald-600' : 'text-slate-400')}>
          {strength.hasMinLength ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300 ml-0.5 mr-1" />}
          8+ characters
        </span>
        <span className={cn('flex items-center gap-1', strength.hasNumberOrSymbol ? 'text-emerald-600' : 'text-slate-400')}>
          {strength.hasNumberOrSymbol ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300 ml-0.5 mr-1" />}
          Number or symbol
        </span>
      </div>
    </div>
  );
}

export interface ConfirmPasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  primaryPassword?: string;
  confirmPassword?: string;
  onConfirmChange?: (val: string) => void;
  error?: boolean;
}

export function ConfirmPasswordInput({
  primaryPassword = '',
  confirmPassword = '',
  onConfirmChange,
  className,
  error,
  ...props
}: ConfirmPasswordInputProps) {
  const isMatch = Boolean(confirmPassword && primaryPassword && confirmPassword === primaryPassword);
  const isMismatch = Boolean(confirmPassword && primaryPassword && confirmPassword !== primaryPassword);

  return (
    <div className="space-y-1">
      <PasswordInput
        value={confirmPassword}
        onChange={(e) => onConfirmChange?.(e.target.value)}
        error={error || isMismatch}
        className={className}
        placeholder="Re-enter password"
        autoComplete="new-password"
        {...props}
      />
      {confirmPassword && (
        <div className="flex items-center gap-1 text-[11px]">
          {isMatch ? (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <Check className="h-3 w-3" />
              Passwords match
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <X className="h-3 w-3" />
              Passwords do not match
            </span>
          )}
        </div>
      )}
    </div>
  );
}

