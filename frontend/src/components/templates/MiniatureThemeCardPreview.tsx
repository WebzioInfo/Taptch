import React from 'react';
import type { ThemeColorsConfig } from '../../modules/templates/constants';
import {
  Crown,
  ShieldCheck,
  Download,
  Send,
  ShoppingBag,
  MapPin,
  Flame,
  Briefcase,
  CheckCircle,
  Palette,
} from 'lucide-react';

export interface MiniatureThemeCardPreviewProps {
  templateId: string;
  colors: ThemeColorsConfig;
  displayName?: string;
  headline?: string;
  avatarUrl?: string;
}

export const MiniatureThemeCardPreview = React.memo(function MiniatureThemeCardPreview({
  templateId,
  colors,
  displayName,
  headline,
  avatarUrl,
}: MiniatureThemeCardPreviewProps) {
  const normId = (templateId || 'obsidian-luxury').toLowerCase().trim();
  const name = displayName?.trim() || 'Alexander Vance';
  const role = headline?.trim() || 'Executive Director';
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AV';

  // Compact micro-renderers calibrated for reduced theme card grid (h-20 sm:h-22)
  switch (normId) {
    // 1. Clean Corporate
    case 'clean-corporate':
      return (
        <div
          className="h-20 sm:h-22 w-full p-1.5 flex flex-col justify-between font-sans select-none relative overflow-hidden transition-colors"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          <div className="flex items-center justify-between border-b pb-0.5" style={{ borderColor: colors.border }}>
            <span className="text-[7px] uppercase tracking-wider font-bold" style={{ color: colors.primary }}>
              Enterprises &bull; Advisory
            </span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />
          </div>

          <div className="rounded-md p-1 shadow-xs border flex items-center gap-1.5" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
            <div className="w-5 h-5 rounded flex items-center justify-center font-bold text-[8px] shrink-0 border" style={{ borderColor: colors.primary, backgroundColor: `${colors.primary}15`, color: colors.primary }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-0.5">
                <span className="font-bold text-[10px] leading-tight truncate" style={{ color: colors.heading }}>{name}</span>
                <CheckCircle className="w-2 h-2 shrink-0" style={{ color: colors.primary }} />
              </div>
              <p className="text-[7px] leading-tight truncate opacity-75" style={{ color: colors.text }}>{role}</p>
            </div>
          </div>

          <div
            className="w-full py-0.5 px-1 rounded text-center font-bold text-[7.5px] flex items-center justify-center gap-1 shadow-xs"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
          >
            <Download className="w-2 h-2" />
            <span>Save Contact Card</span>
          </div>
        </div>
      );

    // 2. Dark Premium
    case 'dark-premium':
      return (
        <div
          className="h-20 sm:h-22 w-full p-1.5 flex flex-col justify-between select-none relative overflow-hidden transition-colors"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[6.5px] uppercase tracking-widest font-mono font-bold" style={{ color: colors.primary }}>
              Dark Premium
            </span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />
          </div>

          <div className="flex flex-col items-center text-center my-auto">
            <div className="w-5 h-5 rounded-full border p-0.5 mb-0.5 flex items-center justify-center" style={{ borderColor: colors.primary }}>
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-[8px]" style={{ backgroundColor: colors.cardBackground, color: colors.primary }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            </div>
            <h5 className="font-semibold text-[10px] leading-tight tracking-tight truncate max-w-[120px]" style={{ color: colors.heading }}>
              {name}
            </h5>
            <p className="text-[7px] leading-tight opacity-70 truncate max-w-[110px]" style={{ color: colors.text }}>
              {role}
            </p>
          </div>

          <div
            className="w-full py-0.5 px-1 rounded text-center font-semibold text-[7.5px] flex items-center justify-center gap-1 shadow-sm"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
          >
            <span>Exchange Identity</span>
            <Send className="w-1.5 h-1.5" />
          </div>
        </div>
      );

    // 3. Soft Modern
    case 'soft-modern':
      return (
        <div
          className="h-20 sm:h-22 w-full p-1.5 flex flex-col justify-between font-serif select-none relative overflow-hidden transition-colors"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          <div className="flex justify-between items-center">
            <span className="px-1 py-0.2 rounded-full text-[6.5px] font-sans font-bold uppercase tracking-wider" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
              Soft Editorial
            </span>
            <span className="text-[7px] opacity-60 font-sans">01/04</span>
          </div>

          <div className="rounded-lg p-1 shadow-xs border flex items-center gap-1.5" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0 overflow-hidden shadow-xs border" style={{ borderColor: colors.border, backgroundColor: `${colors.primary}10`, color: colors.primary }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1 font-sans">
              <span className="font-serif font-bold text-[10px] leading-tight truncate block" style={{ color: colors.heading }}>{name}</span>
              <p className="text-[7px] leading-tight truncate opacity-80" style={{ color: colors.text }}>{role}</p>
            </div>
          </div>

          <div
            className="w-full py-0.5 px-1 rounded-full text-center font-sans font-semibold text-[7.5px] flex items-center justify-center gap-1 shadow-xs"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
          >
            <span>Connect &bull; vCard</span>
          </div>
        </div>
      );

    // 4. Bold Editorial
    case 'bold-editorial':
      return (
        <div
          className="h-20 sm:h-22 w-full p-1.5 flex flex-col justify-between font-mono select-none relative overflow-hidden transition-colors rounded-none"
          style={{ backgroundColor: colors.background, color: colors.text, border: `1px solid ${colors.border}` }}
        >
          <div className="border-b pb-0.5 flex justify-between items-center" style={{ borderColor: colors.border }}>
            <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: colors.heading }}>
              DOSSIER // SPEC
            </span>
            <span className="text-[6.5px] font-bold" style={{ color: colors.primary }}>No. 2026</span>
          </div>

          <div className="p-1 border my-auto" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[6.5px] uppercase tracking-wider font-bold">[ VERIFIED ]</span>
              <span className="text-[6.5px]">{initials}</span>
            </div>
            <h5 className="font-black text-[9.5px] leading-tight uppercase tracking-tight truncate" style={{ color: colors.heading }}>
              {name}
            </h5>
            <p className="text-[7px] leading-tight truncate opacity-75">{role}</p>
          </div>

          <div
            className="w-full py-0.5 px-1 rounded-none text-center font-black text-[7.5px] uppercase tracking-wider flex items-center justify-center gap-1"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText, border: `1px solid ${colors.border}` }}
          >
            <span>[ SAVE DOSSIER ]</span>
          </div>
        </div>
      );

    // 5. Industrial & Manufacturing
    case 'industrial-manufacturing':
      return (
        <div
          className="h-20 sm:h-22 w-full p-1.5 flex flex-col justify-between font-sans select-none relative overflow-hidden transition-colors"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          <div className="flex items-center justify-between border-b pb-0.5" style={{ borderColor: `${colors.border}` }}>
            <span className="text-[6.5px] font-mono uppercase font-bold tracking-wider" style={{ color: colors.primary }}>
              PLANT // RFQ PORTAL
            </span>
            <span className="px-1 py-0.2 rounded text-[6.5px] font-bold font-mono" style={{ backgroundColor: `${colors.primary}25`, color: colors.primary }}>
              ISO 9001
            </span>
          </div>

          <div className="rounded-md p-1 border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[8px]" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary, border: `1px solid ${colors.primary}` }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-[10px] leading-tight truncate block" style={{ color: colors.heading }}>{name}</span>
                <span className="text-[7px] leading-tight truncate block opacity-75">{role}</span>
              </div>
            </div>
          </div>

          <div
            className="w-full py-0.5 px-1 rounded text-center font-bold text-[7.5px] uppercase tracking-wider flex items-center justify-center gap-1"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
          >
            <Briefcase className="w-2 h-2" />
            <span>Request Quote</span>
          </div>
        </div>
      );

    // 6. Corporate Business
    case 'corporate-business':
    case 'zenith-corporate':
      return (
        <div
          className="h-20 sm:h-22 w-full p-1.5 flex flex-col justify-between select-none relative overflow-hidden transition-colors"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          <div className="h-4 -mx-1.5 -mt-1.5 relative flex items-end px-1.5 pb-0.5 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b" style={{ borderColor: colors.border }}>
            <span className="text-[6.5px] uppercase tracking-widest font-bold" style={{ color: colors.primary }}>
              HOLDING GROUP
            </span>
          </div>

          <div className="rounded-md p-1 border my-auto shadow-xs" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded flex items-center justify-center font-bold text-[8px]" style={{ backgroundColor: `${colors.primary}30`, color: colors.primary, border: `1px solid ${colors.primary}60` }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-[10px] leading-tight truncate block" style={{ color: colors.heading }}>{name}</span>
                <span className="text-[7px] leading-tight truncate block opacity-75">{role}</span>
              </div>
            </div>
          </div>

          <div
            className="w-full py-0.5 px-1 rounded text-center font-bold text-[7.5px] flex items-center justify-center gap-1 shadow-xs"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
          >
            <Download className="w-2 h-2" />
            <span>Save Contact</span>
          </div>
        </div>
      );

    // 7. Modern Business
    case 'modern-business':
    case 'catalyst-business':
      return (
        <div
          className="h-20 sm:h-22 w-full p-1.5 flex flex-col justify-between select-none relative overflow-hidden transition-colors"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          <div className="flex justify-between items-center border-b pb-0.5" style={{ borderColor: colors.border }}>
            <span className="text-[6.5px] uppercase font-bold tracking-wider" style={{ color: colors.accent }}>
              COMMERCIAL SHOWCASE
            </span>
            <span className="text-[6.5px] px-1 py-0.2 rounded-full font-bold" style={{ backgroundColor: `${colors.primary}30`, color: colors.primary }}>
              Verified
            </span>
          </div>

          <div className="rounded-md p-1 border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
            <div className="flex items-center gap-1 mb-0.5">
              <div className="w-5 h-5 rounded flex items-center justify-center font-bold text-[8px]" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-[10px] leading-tight truncate block" style={{ color: colors.heading }}>{name}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[7px] px-1 py-0.2 rounded bg-black/20">
              <span className="truncate">Service Shelf</span>
              <span className="font-bold" style={{ color: colors.accent }}>₹ 4,999</span>
            </div>
          </div>

          <div
            className="w-full py-0.5 px-1 rounded text-center font-bold text-[7.5px] flex items-center justify-center gap-1"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
          >
            <ShoppingBag className="w-2 h-2" />
            <span>Browse Catalog</span>
          </div>
        </div>
      );

    // 8. Professional Services / Ivory Minimal
    case 'professional-services':
    case 'ivory-minimal':
    case 'ivory-minimalist':
      return (
        <div
          className="h-20 sm:h-22 w-full p-1.5 flex flex-col justify-between font-serif select-none relative overflow-hidden transition-colors"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          <div className="text-center border-b pb-0.5" style={{ borderColor: colors.border }}>
            <span className="text-[6.5px] uppercase tracking-widest font-sans font-semibold opacity-60">
              CHAMBERS &bull; PARTNERS
            </span>
          </div>

          <div className="rounded-md p-1 border text-center shadow-xs my-auto" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
            <div className="w-5 h-5 rounded-full mx-auto mb-0.5 flex items-center justify-center font-sans font-bold text-[8px] border" style={{ borderColor: colors.primary, color: colors.primary, backgroundColor: `${colors.primary}10` }}>
              {initials}
            </div>
            <h5 className="font-bold text-[10px] leading-tight truncate" style={{ color: colors.heading }}>{name}</h5>
            <p className="text-[7px] leading-tight font-sans opacity-70 truncate">{role}</p>
          </div>

          <div
            className="w-full py-0.5 px-1 rounded text-center font-sans font-bold text-[7.5px] flex items-center justify-center gap-1"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
          >
            <span>vCard &bull; Chambers</span>
          </div>
        </div>
      );

    // 9. Retail & Shopping
    case 'retail-shopping':
      return (
        <div
          className="h-20 sm:h-22 w-full p-1.5 flex flex-col justify-between font-sans select-none relative overflow-hidden transition-colors"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          <div className="flex justify-between items-center border-b pb-0.5" style={{ borderColor: colors.border }}>
            <span className="text-[6.5px] uppercase font-bold tracking-wider" style={{ color: colors.primary }}>
              FLAGSHIP STORE
            </span>
            <span className="text-[6.5px] px-1 py-0.2 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
              Open Now
            </span>
          </div>

          <div className="rounded-md p-1 border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-bold text-[10px] leading-tight truncate" style={{ color: colors.heading }}>{name}</span>
              <span className="text-[7px] font-mono font-bold" style={{ color: colors.primary }}>INR</span>
            </div>
            <div className="flex items-center gap-1 text-[7px] opacity-75">
              <MapPin className="w-1.5 h-1.5" />
              <span className="truncate">Retail Boutique / Mall</span>
            </div>
          </div>

          <div
            className="w-full py-0.5 px-1 rounded text-center font-bold text-[7.5px] flex items-center justify-center gap-1"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
          >
            <ShoppingBag className="w-2 h-2" />
            <span>Quick Order</span>
          </div>
        </div>
      );

    // 10. Food & Restaurant
    case 'food-restaurant':
      return (
        <div
          className="h-20 sm:h-22 w-full p-1.5 flex flex-col justify-between font-sans select-none relative overflow-hidden transition-colors"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          <div className="flex justify-between items-center border-b pb-0.5" style={{ borderColor: colors.border }}>
            <span className="text-[6.5px] uppercase font-bold tracking-wider flex items-center gap-0.5" style={{ color: colors.primary }}>
              <Flame className="w-1.5 h-1.5" />
              CULINARY RESERVE
            </span>
            <span className="text-[6.5px] opacity-60">Dinner 7-11 PM</span>
          </div>

          <div className="rounded-md p-1 border text-center my-auto" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
            <span className="font-bold text-[10px] leading-tight truncate block" style={{ color: colors.heading }}>{name}</span>
            <p className="text-[7px] leading-tight opacity-70 truncate mt-0.5">Chef's Tasting Menu</p>
          </div>

          <div
            className="w-full py-0.5 px-1 rounded text-center font-bold text-[7.5px] flex items-center justify-center gap-1"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
          >
            <span>Table Reservation</span>
          </div>
        </div>
      );

    // 11. Creative Agency / Aurora Creator
    case 'creative-agency':
    case 'aurora-creator':
      return (
        <div
          className="h-20 sm:h-22 w-full p-1.5 flex flex-col justify-between select-none relative overflow-hidden transition-colors"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          <div
            className="absolute -top-4 -right-4 w-14 h-14 rounded-full blur-xl opacity-40 pointer-events-none"
            style={{ backgroundColor: colors.accent }}
          />
          <div
            className="absolute -bottom-4 -left-4 w-14 h-14 rounded-full blur-xl opacity-40 pointer-events-none"
            style={{ backgroundColor: colors.primary }}
          />

          <div className="flex justify-between items-center relative z-10 border-b pb-0.5" style={{ borderColor: colors.border }}>
            <span className="text-[6.5px] font-bold uppercase tracking-wider" style={{ color: colors.accent }}>
              AURORA CREATIVE
            </span>
            <Palette className="w-2 h-2" style={{ color: colors.primary }} />
          </div>

          <div className="rounded-md p-1 border relative z-10 backdrop-blur-md shadow-xs" style={{ backgroundColor: `${colors.cardBackground}D0`, borderColor: colors.border }}>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[8px]" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`, color: colors.buttonText }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-[10px] leading-tight truncate block" style={{ color: colors.heading }}>{name}</span>
                <span className="text-[7px] leading-tight truncate block opacity-75">{role}</span>
              </div>
            </div>
          </div>

          <div
            className="w-full py-0.5 px-1 rounded text-center font-bold text-[7.5px] flex items-center justify-center gap-1 shadow-xs relative z-10"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`, color: colors.buttonText }}
          >
            <span>Visual Portfolio</span>
          </div>
        </div>
      );

    // 12. Apex Capital & Wealth
    case 'apex-capital':
      return (
        <div
          className="h-20 sm:h-22 w-full p-1.5 flex flex-col justify-between select-none relative overflow-hidden transition-colors"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          <div className="flex justify-between items-center border-b pb-0.5" style={{ borderColor: colors.border }}>
            <span className="text-[6.5px] uppercase tracking-widest font-bold" style={{ color: colors.primary }}>
              APEX WEALTH
            </span>
            <span className="text-[6.5px] px-1 rounded font-bold" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
              MAX
            </span>
          </div>

          <div className="rounded-md p-1 border text-center shadow-xs my-auto" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
            <Crown className="w-2.5 h-2.5 mx-auto mb-0.5" style={{ color: colors.primary }} />
            <h5 className="font-bold text-[10px] leading-tight tracking-tight truncate" style={{ color: colors.heading }}>{name}</h5>
            <p className="text-[7px] leading-tight opacity-75 truncate">{role}</p>
          </div>

          <div
            className="w-full py-0.5 px-1 rounded text-center font-bold text-[7.5px] flex items-center justify-center gap-1 shadow-xs"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
          >
            <ShieldCheck className="w-2 h-2" />
            <span>Private Mandate</span>
          </div>
        </div>
      );

    // 13. Premium Brand / Obsidian Luxury (Default Flagship)
    case 'premium-brand':
    case 'obsidian-luxury':
    default:
      return (
        <div
          className="h-20 sm:h-22 w-full p-1.5 flex flex-col justify-between select-none relative overflow-hidden transition-colors"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          <div className="flex justify-between items-center border-b pb-0.5" style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-0.5">
              <Crown className="w-1.5 h-1.5" style={{ color: colors.primary }} />
              <span className="text-[6.5px] font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                Obsidian Luxury
              </span>
            </div>
            <ShieldCheck className="w-2 h-2" style={{ color: colors.primary }} />
          </div>

          <div className="rounded-md p-1 border shadow-xs relative overflow-hidden" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded border flex items-center justify-center font-bold text-[8px] shrink-0 shadow-xs" style={{ borderColor: colors.border, backgroundColor: colors.background, color: colors.primary }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-[10px] leading-tight truncate block" style={{ color: colors.heading }}>{name}</span>
                <span className="text-[7px] leading-tight truncate block opacity-75" style={{ color: colors.text }}>{role}</span>
              </div>
            </div>
          </div>

          <div
            className="w-full py-0.5 px-1 rounded text-center font-bold text-[7.5px] flex items-center justify-center gap-1 shadow-xs"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
          >
            <Download className="w-2 h-2" />
            <span>Save Contact Card</span>
          </div>
        </div>
      );
  }
});
