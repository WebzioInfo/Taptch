import React, { useState } from 'react';
import {
  Home,
  Briefcase,
  MapPin,
  Check,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Star,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { SavedAddress } from '../../types/address';

export interface SavedAddressesListProps {
  addresses: SavedAddress[];
  selectedId: string | null;
  onSelect: (address: SavedAddress) => void;
  onAddNew: () => void;
  isAddingNew?: boolean;
  onEdit?: (address: SavedAddress) => void;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
  maxAddresses?: number;
}

export function SavedAddressesList({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  isAddingNew = false,
  onEdit,
  onDelete,
  onSetDefault,
  isLoading = false,
  error = null,
  onRetry,
  disabled = false,
  maxAddresses = 5,
}: SavedAddressesListProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getLabelIcon = (label: string) => {
    switch (label) {
      case 'Home':
        return <Home className="w-3.5 h-3.5" />;
      case 'Work':
        return <Briefcase className="w-3.5 h-3.5" />;
      default:
        return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 mb-6" aria-label="Loading saved addresses">
        <div className="h-4 w-32 bg-[var(--bg-raised)] rounded animate-pulse mb-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)]/40 animate-pulse space-y-2.5 h-36"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-16 bg-[var(--bg-surface)] rounded" />
                <div className="h-4 w-12 bg-[var(--bg-surface)] rounded-full" />
              </div>
              <div className="h-4 w-28 bg-[var(--bg-surface)] rounded" />
              <div className="h-3 w-40 bg-[var(--bg-surface)] rounded" />
              <div className="h-3 w-24 bg-[var(--bg-surface)] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/25 mb-6 flex items-start justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[var(--danger)]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error || 'Unable to load saved addresses.'}</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-2.5 py-1 rounded bg-[var(--danger)]/20 hover:bg-[var(--danger)]/30 text-[var(--danger)] font-medium transition-colors text-xs shrink-0"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const isAtLimit = addresses.length >= maxAddresses;

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
            Saved Delivery Addresses
          </h3>
          <span className="text-[11px] font-mono text-[var(--ink-muted)]">
            ({addresses.length}/{maxAddresses})
          </span>
        </div>

        {!isAddingNew && !isAtLimit && (
          <button
            type="button"
            onClick={onAddNew}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors py-1 px-2 rounded-[var(--radius-sm)] hover:bg-[var(--bg-raised)] focus:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Address</span>
          </button>
        )}
      </div>

      {isAtLimit && (
        <div className="p-2.5 rounded-lg bg-[var(--bg-raised)] border border-[var(--border)] text-[11px] text-[var(--ink-muted)] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span>
            You have saved the maximum of {maxAddresses} addresses. You can edit an existing address or delete one to add a new address.
          </span>
        </div>
      )}

      {/* Address Cards Grid */}
      <div role="radiogroup" aria-label="Select a delivery address" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {addresses.map((addr) => {
          const isSelected = !isAddingNew && selectedId === addr.id;
          const displayLabel = addr.label === 'Other' && addr.customLabel ? addr.customLabel : addr.label;

          return (
            <div
              key={addr.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onSelect(addr)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onSelect(addr);
                }
              }}
              className={`relative text-left p-3.5 rounded-xl transition-all cursor-pointer border ${isSelected
                  ? 'border-2 border-[var(--accent)] bg-[var(--accent)]/10 shadow-sm'
                  : 'border-[var(--border)] bg-[var(--bg-raised)]/60 hover:bg-[var(--bg-raised)] hover:border-[var(--border-strong)]'
                }`}
            >
              {/* Top Header: Badge, Default Indicator & Overflow Menu */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--ink)]">
                    {getLabelIcon(addr.label)}
                    <span>{displayLabel}</span>
                  </span>

                  {addr.isDefault && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-[var(--accent)] text-[var(--accent)]" />
                      Default
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Radio Indicator */}
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                          : 'border-[var(--border)] bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3] text-white" />}
                  </div>

                  {/* Actions Dropdown Trigger */}
                  {(onEdit || onDelete || onSetDefault) && (
                    <div className="relative">
                      <button
                        type="button"
                        aria-label={`Actions for address ${displayLabel}`}
                        aria-expanded={activeMenuId === addr.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === addr.id ? null : addr.id);
                        }}
                        className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-surface)] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === addr.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[var(--bg-raised)] border border-[var(--border)] shadow-xl z-20 py-1 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onEdit(addr);
                              }}
                              className="w-full px-3 py-2 text-left text-[var(--ink)] hover:bg-[var(--bg-surface)] flex items-center gap-2 min-h-[44px] transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                              <span>Edit Address</span>
                            </button>
                          )}

                          {onSetDefault && !addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onSetDefault(addr.id);
                              }}
                              className="w-full px-3 py-2 text-left text-[var(--ink)] hover:bg-[var(--bg-surface)] flex items-center gap-2 min-h-[44px] transition-colors"
                            >
                              <Star className="w-3.5 h-3.5 text-[var(--accent)]" />
                              <span>Set as Default</span>
                            </button>
                          )}

                          {onDelete && (
                            <button
                              type="button"
                              disabled={deletingId === addr.id}
                              onClick={async () => {
                                setActiveMenuId(null);
                                setDeletingId(addr.id);
                                try {
                                  await onDelete(addr.id);
                                } finally {
                                  setDeletingId(null);
                                }
                              }}
                              className="w-full px-3 py-2 text-left text-[var(--danger)] hover:bg-[var(--danger)]/10 flex items-center gap-2 min-h-[44px] transition-colors"
                            >
                              {deletingId === addr.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Recipient Name & Phone */}
              <div className="mb-1 text-xs font-semibold text-[var(--ink)] flex items-center gap-2">
                <span>{addr.recipientName}</span>
                <span className="font-mono text-[11px] text-[var(--ink-muted)] font-normal">
                  {addr.phone}
                </span>
              </div>

              {/* Address details */}
              <p className="text-[11px] text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
                {addr.addressLine1}
                {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
              </p>
              <p className="text-[11px] font-mono text-[var(--ink-muted)] mt-0.5">
                {addr.city}, {addr.state} - {addr.postalCode}
              </p>
            </div>
          );
        })}

        {/* Option to create a new address if not at limit */}
        {!isAtLimit && (
          <div
            role="button"
            tabIndex={0}
            onClick={onAddNew}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onAddNew();
              }
            }}
            className={`p-3.5 rounded-xl border border-dashed cursor-pointer flex flex-col items-center justify-center text-center transition-all min-h-[120px] ${isAddingNew
                ? 'border-2 border-[var(--accent)] bg-[var(--accent)]/5'
                : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-raised)]/20 hover:bg-[var(--bg-raised)]/50'
              }`}
          >
            <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center mb-2 text-[var(--accent)]">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[var(--ink)]">
              {isAddingNew ? 'Entering New Address' : '+ Add a New Address'}
            </span>
            <span className="text-[11px] text-[var(--ink-muted)] mt-0.5">
              Deliver to a different location
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
