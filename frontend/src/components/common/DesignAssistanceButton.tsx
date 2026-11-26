import React from 'react';
import { buildWhatsAppChatUrl } from '../../utils/whatsappAssistance';

interface DesignAssistanceButtonProps {
  message: string;
  className?: string;
}

/**
 * Compact, mobile-friendly WhatsApp Click-to-Chat assistance CTA
 * matching the light orange & white storefront theme.
 */
export const DesignAssistanceButton: React.FC<DesignAssistanceButtonProps> = ({
  message,
  className = '',
}) => {
  const href = buildWhatsAppChatUrl(message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#FF6A00]/35 bg-[#FFF8F3] hover:bg-[#FFF0E5] hover:border-[#FF6A00] text-[#171717] text-xs font-semibold px-3.5 py-2.5 min-h-[40px] transition-all active:scale-[0.99] shadow-2xs ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="w-4 h-4 shrink-0 text-[#25D366]"
        fill="currentColor"
      >
        <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.422-.516.078-1.172.109-1.891-.125-.438-.141-1-.328-1.719-.641-3.016-1.297-4.984-4.344-5.141-4.547-.141-.203-1.219-1.625-1.219-3.094 0-1.469.766-2.188 1.047-2.484.266-.297.594-.375.797-.375.203 0 .391.016.563.016.188 0 .422-.078.656.5.25.594.844 2.063.922 2.219.078.156.125.344.031.547-.094.203-.141.328-.297.5-.156.172-.313.391-.453.516-.156.141-.313.297-.141.594.172.297.781 1.281 1.672 2.078 1.156 1.031 2.125 1.344 2.422 1.5.297.141.469.125.641-.078.172-.203.75-.875.953-1.172.203-.297.391-.25.656-.156.266.094 1.719.813 2.016.953.297.156.484.219.563.344.078.125.078.719-.172 1.422z" />
      </svg>
      <span className="truncate">Need Assistance in Design?</span>
    </a>
  );
};
