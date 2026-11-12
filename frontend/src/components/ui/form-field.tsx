'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function FormField({ className, children, ...props }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5 text-left w-full', className)} {...props}>
      {children}
    </div>
  );
}

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function FormLabel({ className, required, children, ...props }: FormLabelProps) {
  return (
    <label
      className={cn('block text-xs font-medium text-slate-700 select-none', className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
    </label>
  );
}

export interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string;
  children?: React.ReactNode;
}

export function FormError({ className, message, children, ...props }: FormErrorProps) {
  const content = children || message;
  if (!content) return null;

  return (
    <p
      role="alert"
      className={cn('flex items-center gap-1 text-[11px] font-medium text-red-600 mt-1 leading-normal', className)}
      {...props}
    >
      <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{content}</span>
    </p>
  );
}

export interface FormSuccessProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export function FormSuccess({ className, children, ...props }: FormSuccessProps) {
  if (!children) return null;

  return (
    <p
      className={cn('flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1 leading-normal', className)}
      {...props}
    >
      <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export interface FormHelperTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export function FormHelperText({ className, children, ...props }: FormHelperTextProps) {
  if (!children) return null;

  return (
    <p className={cn('text-[11px] text-slate-500 mt-1 leading-normal', className)} {...props}>
      {children}
    </p>
  );
}

