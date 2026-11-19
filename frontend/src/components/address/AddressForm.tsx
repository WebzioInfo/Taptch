import React, { useState, useEffect, useRef } from 'react';
import { Check, Home, Briefcase, Tag, AlertCircle } from 'lucide-react';
import { lookupPinCode } from '../../utils/addressLookup';

export interface AddressFormValues {
  fullName: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateName: string;
  postalCode: string;
  country?: string;
  deliveryInstructions: string;
  label?: 'Home' | 'Work' | 'Other';
  customLabel?: string;
  isDefault?: boolean;
  saveForLater?: boolean;
}

export interface AddressFormProps {
  values: AddressFormValues;
  onChange: (field: keyof AddressFormValues, value: any) => void;
  fieldErrors?: Record<string, string>;
  onClearError?: (field: string) => void;
  formId?: string;
  onSubmit?: (e: React.FormEvent) => void;
  disabled?: boolean;
  showSaveOptions?: boolean;
  showInstructionsField?: boolean;
  submitButtonText?: string;
  isSubmitting?: boolean;
}

export function AddressForm({
  values,
  onChange,
  fieldErrors = {},
  onClearError,
  formId = 'delivery-form',
  onSubmit,
  disabled = false,
  showSaveOptions = true,
  showInstructionsField = true,
  submitButtonText,
  isSubmitting = false,
}: AddressFormProps) {
  const [pinLookupSuccess, setPinLookupSuccess] = useState(false);
  const pinTimerRef = useRef<any>(null);

  // Debounced manual PIN code lookup for India Postal Code
  useEffect(() => {
    const cleanPin = (values.postalCode || '').replace(/\D/g, '');
    if (cleanPin.length === 6) {
      if (pinTimerRef.current) clearTimeout(pinTimerRef.current);
      pinTimerRef.current = setTimeout(async () => {
        const result = await lookupPinCode(cleanPin);
        if (result) {
          if (!values.city.trim() || values.city !== result.city) {
            onChange('city', result.city);
            onClearError?.('city');
          }
          if (!values.stateName.trim() || values.stateName !== result.state) {
            onChange('stateName', result.state);
            onClearError?.('stateName');
          }
          setPinLookupSuccess(true);
          setTimeout(() => setPinLookupSuccess(false), 3000);
        }
      }, 300);
    }
    return () => {
      if (pinTimerRef.current) clearTimeout(pinTimerRef.current);
    };
  }, [values.postalCode]);

  const currentLabel = values.label || 'Home';

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        if (onSubmit) {
          onSubmit(e);
        } else {
          e.preventDefault();
        }
      }}
      noValidate
      className="space-y-4 text-xs font-body"
    >
      {/* Name & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${formId}-fullName`} className="font-semibold text-[var(--ink)] block mb-1.5">
            Full Name <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            id={`${formId}-fullName`}
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="e.g. Alexander Vance"
            disabled={disabled}
            value={values.fullName}
            onChange={(e) => {
              onChange('fullName', e.target.value);
              if (fieldErrors.fullName) onClearError?.('fullName');
            }}
            className={`w-full h-12 px-3.5 rounded-xl bg-[var(--bg-raised)] border ${fieldErrors.fullName ? 'border-[var(--danger)]' : 'border-[var(--border)]'
              } text-[var(--ink)] text-base sm:text-sm placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50`}
          />
          {fieldErrors.fullName && (
            <p className="text-[11px] text-[var(--danger)] mt-1">{fieldErrors.fullName}</p>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-phone`} className="font-semibold text-[var(--ink)] block mb-1.5">
            Mobile Number <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            disabled={disabled}
            value={values.phone}
            onChange={(e) => {
              onChange('phone', e.target.value);
              if (fieldErrors.phone) onClearError?.('phone');
            }}
            className={`w-full h-12 px-3.5 rounded-xl bg-[var(--bg-raised)] border ${fieldErrors.phone ? 'border-[var(--danger)]' : 'border-[var(--border)]'
              } text-[var(--ink)] font-mono text-base sm:text-sm placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50`}
          />
          {fieldErrors.phone && (
            <p className="text-[11px] text-[var(--danger)] mt-1">{fieldErrors.phone}</p>
          )}
        </div>
      </div>

      {/* Email & WhatsApp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${formId}-email`} className="font-semibold text-[var(--ink)] block mb-1.5">
            Email <span className="text-[var(--ink-muted)] font-normal">(for order & invoice updates)</span>
          </label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="alexander@taptch.com"
            disabled={disabled}
            value={values.email}
            onChange={(e) => {
              onChange('email', e.target.value);
              if (fieldErrors.email) onClearError?.('email');
            }}
            className={`w-full h-12 px-3.5 rounded-xl bg-[var(--bg-raised)] border ${fieldErrors.email ? 'border-[var(--danger)]' : 'border-[var(--border)]'
              } text-[var(--ink)] text-base sm:text-sm placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50`}
          />
          {fieldErrors.email && (
            <p className="text-[11px] text-[var(--danger)] mt-1">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-whatsappNumber`} className="font-semibold text-[var(--ink)] block mb-1.5">
            WhatsApp Number <span className="text-[var(--ink-muted)] font-normal">(Optional)</span>
          </label>
          <input
            id={`${formId}-whatsappNumber`}
            name="whatsappNumber"
            type="tel"
            inputMode="numeric"
            placeholder="For instant tracking updates"
            disabled={disabled}
            value={values.whatsappNumber}
            onChange={(e) => onChange('whatsappNumber', e.target.value)}
            className="w-full h-12 px-3.5 rounded-xl bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--ink)] font-mono text-base sm:text-sm placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
          />
        </div>
      </div>

      {/* Street Address */}
      <div>
        <label htmlFor={`${formId}-addressLine1`} className="font-semibold text-[var(--ink)] block mb-1.5">
          Street Address / House / Flat No. <span className="text-[var(--accent)]">*</span>
        </label>
        <input
          id={`${formId}-addressLine1`}
          name="addressLine1"
          type="text"
          autoComplete="address-line1"
          placeholder="e.g. Flat 402, Royal Residency, 12th Main Road"
          disabled={disabled}
          value={values.addressLine1}
          onChange={(e) => {
            onChange('addressLine1', e.target.value);
            if (fieldErrors.addressLine1) onClearError?.('addressLine1');
          }}
          className={`w-full h-12 px-3.5 rounded-xl bg-[var(--bg-raised)] border ${fieldErrors.addressLine1 ? 'border-[var(--danger)]' : 'border-[var(--border)]'
            } text-[var(--ink)] text-base sm:text-sm placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50`}
        />
        {fieldErrors.addressLine1 && (
          <p className="text-[11px] text-[var(--danger)] mt-1">{fieldErrors.addressLine1}</p>
        )}
      </div>

      {/* Apartment / Landmark */}
      <div>
        <label htmlFor={`${formId}-addressLine2`} className="font-semibold text-[var(--ink)] block mb-1.5">
          Apartment / Landmark <span className="text-[var(--ink-muted)] font-normal">(Optional)</span>
        </label>
        <input
          id={`${formId}-addressLine2`}
          name="addressLine2"
          type="text"
          autoComplete="address-line2"
          placeholder="e.g. Near Indiranagar Metro Station"
          disabled={disabled}
          value={values.addressLine2}
          onChange={(e) => onChange('addressLine2', e.target.value)}
          className="w-full h-12 px-3.5 rounded-xl bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--ink)] text-base sm:text-sm placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
        />
      </div>

      {/* City, State, PIN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor={`${formId}-city`} className="font-semibold text-[var(--ink)] block mb-1.5">
            City <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            id={`${formId}-city`}
            name="city"
            type="text"
            autoComplete="address-level2"
            placeholder="e.g. Bengaluru"
            disabled={disabled}
            value={values.city}
            onChange={(e) => {
              onChange('city', e.target.value);
              if (fieldErrors.city) onClearError?.('city');
            }}
            className={`w-full h-12 px-3.5 rounded-xl bg-[var(--bg-raised)] border ${fieldErrors.city ? 'border-[var(--danger)]' : 'border-[var(--border)]'
              } text-[var(--ink)] text-base sm:text-sm placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50`}
          />
          {fieldErrors.city && (
            <p className="text-[11px] text-[var(--danger)] mt-1">{fieldErrors.city}</p>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-stateName`} className="font-semibold text-[var(--ink)] block mb-1.5">
            State <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            id={`${formId}-stateName`}
            name="stateName"
            type="text"
            autoComplete="address-level1"
            placeholder="e.g. Karnataka"
            disabled={disabled}
            value={values.stateName}
            onChange={(e) => {
              onChange('stateName', e.target.value);
              if (fieldErrors.stateName) onClearError?.('stateName');
            }}
            className={`w-full h-12 px-3.5 rounded-xl bg-[var(--bg-raised)] border ${fieldErrors.stateName ? 'border-[var(--danger)]' : 'border-[var(--border)]'
              } text-[var(--ink)] text-base sm:text-sm placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50`}
          />
          {fieldErrors.stateName && (
            <p className="text-[11px] text-[var(--danger)] mt-1">{fieldErrors.stateName}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={`${formId}-postalCode`} className="font-semibold text-[var(--ink)]">
              PIN Code <span className="text-[var(--accent)]">*</span>
            </label>
            {pinLookupSuccess && (
              <span className="text-[10px] font-mono text-[var(--accent)] flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>Auto-filled</span>
              </span>
            )}
          </div>
          <input
            id={`${formId}-postalCode`}
            name="postalCode"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="6-digit PIN"
            maxLength={6}
            disabled={disabled}
            value={values.postalCode}
            onChange={(e) => {
              onChange('postalCode', e.target.value);
              if (fieldErrors.postalCode) onClearError?.('postalCode');
            }}
            className={`w-full h-12 px-3.5 rounded-xl bg-[var(--bg-raised)] border ${fieldErrors.postalCode ? 'border-[var(--danger)]' : 'border-[var(--border)]'
              } text-[var(--ink)] font-mono text-base sm:text-sm placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50`}
          />
          {fieldErrors.postalCode && (
            <p className="text-[11px] text-[var(--danger)] mt-1">{fieldErrors.postalCode}</p>
          )}
        </div>
      </div>

      {/* Courier Instructions Optional */}
      {showInstructionsField && (
        <div>
          <label htmlFor={`${formId}-deliveryInstructions`} className="font-semibold text-[var(--ink)] block mb-1.5">
            Courier Instructions <span className="text-[var(--ink-muted)] font-normal">(Optional)</span>
          </label>
          <input
            id={`${formId}-deliveryInstructions`}
            name="deliveryInstructions"
            type="text"
            placeholder="e.g. Leave with security / Call upon arrival"
            disabled={disabled}
            value={values.deliveryInstructions}
            onChange={(e) => onChange('deliveryInstructions', e.target.value)}
            className="w-full h-12 px-3.5 rounded-xl bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--ink)] text-base sm:text-sm placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
          />
        </div>
      )}

      {/* Save for Next Time & Address Type Selection */}
      {showSaveOptions && (
        <div className="pt-2 border-t border-[var(--border)] space-y-3.5">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[var(--ink)] select-none">
            <input
              type="checkbox"
              checked={values.saveForLater !== false}
              onChange={(e) => onChange('saveForLater', e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] bg-[var(--bg-raised)] accent-[var(--accent)] text-[var(--accent)] focus:ring-0 cursor-pointer"
            />
            <span className="font-medium">Save this address for next time</span>
          </label>

          {values.saveForLater !== false && (
            <div className="space-y-3 pl-6">
              {/* Label Selector: Home / Work / Other */}
              <div>
                <span className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider block mb-1.5">
                  Address Label
                </span>
                <div className="flex flex-wrap gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((lbl) => {
                    const isSelected = currentLabel === lbl;
                    return (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => onChange('label', lbl)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isSelected
                          ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-semibold'
                          : 'bg-[var(--bg-raised)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                          }`}
                      >
                        {lbl === 'Home' && <Home className="w-3.5 h-3.5" />}
                        {lbl === 'Work' && <Briefcase className="w-3.5 h-3.5" />}
                        {lbl === 'Other' && <Tag className="w-3.5 h-3.5" />}
                        <span>{lbl}</span>
                      </button>
                    );
                  })}
                </div>

                {currentLabel === 'Other' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="e.g. Studio, Parents' House, Vacation"
                      value={values.customLabel || ''}
                      onChange={(e) => onChange('customLabel', e.target.value)}
                      maxLength={32}
                      className="w-full max-w-xs h-10 px-3 rounded-lg bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                )}
              </div>

              {/* Make Default Address Toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[var(--ink)] select-none">
                <input
                  type="checkbox"
                  checked={Boolean(values.isDefault)}
                  onChange={(e) => onChange('isDefault', e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)] bg-[var(--bg-raised)] accent-[var(--accent)] text-[var(--accent)] focus:ring-0 cursor-pointer"
                />
                <span>Make this my default address</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Optional Submit Button Inside Form (e.g. in Modal/Sheet) */}
      {submitButtonText && (
        <div className="pt-3">
          <button
            type="submit"
            disabled={disabled || isSubmitting}
            className="w-full h-12 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? 'Saving...' : submitButtonText}
          </button>
        </div>
      )}
    </form>
  );
}
