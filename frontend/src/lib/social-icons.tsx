import React from 'react';

export interface SocialIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function InstagramIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function LinkedInIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76 1.75.79 1.75 1.76-.78 1.76-1.75 1.76m1.4 9.74v-8.37H5.06v8.37h2.8z" />
    </svg>
  );
}

export function XTwitterIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function YouTubeIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function FacebookIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function WhatsAppIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function TelegramIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

export function TikTokIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.36a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.64a6.34 6.34 0 0 0 10.74 4.49 6.29 6.29 0 0 0 1.84-4.49V8.82a8.28 8.28 0 0 0 4.91 1.6V6.97a4.85 4.85 0 0 1-1-.28z" />
    </svg>
  );
}

export function GitHubIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
    </svg>
  );
}

export function BehanceIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M22 7h-7v2h7V7zm1.726 10c-.442 1.297-2.029 3-4.726 3-3.957 0-5.467-3.232-5.467-5.834 0-3.328 1.947-5.916 5.438-5.916 3.996 0 5.068 3.093 4.793 6.004H16.48c0 1.507.729 3.064 2.555 3.064 1.154 0 2.01-.582 2.398-1.318h2.293zM16.5 12.5h4.636c-.085-1.393-.91-2.5-2.28-2.5-1.42 0-2.25 1.066-2.356 2.5zM2 18h5.309c3.082 0 4.691-1.385 4.691-3.666 0-1.447-.841-2.457-2.053-2.82 1.031-.475 1.691-1.373 1.691-2.58C11.638 6.55 9.97 6 7.42 6H2v12zm2.684-9.846h2.47c1.327 0 2.091.493 2.091 1.517 0 1.063-.799 1.597-2.091 1.597H4.684V8.154zm0 5.409h2.645c1.472 0 2.271.558 2.271 1.761 0 1.155-.837 1.838-2.271 1.838H4.684v-3.599z" />
    </svg>
  );
}

export function DribbbleIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm6.65 4.88a8.27 8.27 0 0 1 1.71 5.09 13.9 13.9 0 0 0-4.9-1c-.34 0-.67 0-1 .04a25.33 25.33 0 0 0 4.19-4.13zm-6.65-2.88a8.23 8.23 0 0 1 5.3 1.94 22.94 22.94 0 0 1-3.9 3.82 15.65 15.65 0 0 0-5.63-4.2A8.16 8.16 0 0 1 12 4zm-7.6 3.65a13.62 13.62 0 0 1 5.23 3.91 19.34 19.34 0 0 1-5.75 1.57 8.24 8.24 0 0 1 .52-5.48zm2.46 11.23a8.24 8.24 0 0 1-2.86-4.57 17.5 17.5 0 0 0 5.51-1.42 22.84 22.84 0 0 1 1.91 5.48 8.19 8.19 0 0 1-4.56.51zm6.39-.77a20.89 20.89 0 0 0-1.83-5.2 24.36 24.36 0 0 1 4.54-.44c.4 0 .79 0 1.18.06a8.27 8.27 0 0 1-3.89 5.58zm4.84-7.55a15.82 15.82 0 0 1-1.39-.06 22.75 22.75 0 0 0-4.28.4 20.48 20.48 0 0 0-1.84-3.5 20.87 20.87 0 0 0 3.75-3.6 8.27 8.27 0 0 1 3.76 6.76z" />
    </svg>
  );
}

export function PinterestIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
    </svg>
  );
}

export function SnapchatIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12.003 2c-3.52 0-6.177 2.387-6.177 5.753 0 1.25.433 2.502.949 3.324.165.263.22.463.158.694-.078.29-.364.57-.743.766-.563.29-.982.525-1.033.916-.063.479.35.882.977 1.077.585.182 1.205.158 1.706.07.318-.056.495.034.614.184.288.362.802 1.545 1.758 1.834.673.203 1.229-.074 1.787-.36.438-.225.88-.452 1.41-.452s.972.227 1.41.452c.558.286 1.114.563 1.787.36.956-.289 1.47-1.472 1.758-1.834.119-.15.296-.24.614-.184.501.088 1.121.112 1.706-.07.627-.195 1.04-.598.977-1.077-.051-.391-.47-.626-1.033-.916-.379-.196-.665-.476-.743-.766-.062-.231-.007-.431.158-.694.516-.822.949-2.074.949-3.324C18.18 4.387 15.523 2 12.003 2z" />
    </svg>
  );
}

export function WebsiteIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

/**
 * Returns the matching platform SVG component for any platform identifier.
 */
export function getSocialPlatformIcon(platformId: string, className = 'w-4 h-4', size = 16): React.ReactElement {
  const norm = (typeof platformId === 'string' ? platformId : 'website').toLowerCase().trim();
  switch (norm) {
    case 'instagram':
      return <InstagramIcon className={className} size={size} />;
    case 'linkedin':
      return <LinkedInIcon className={className} size={size} />;
    case 'twitter':
    case 'x':
      return <XTwitterIcon className={className} size={size} />;
    case 'youtube':
      return <YouTubeIcon className={className} size={size} />;
    case 'facebook':
      return <FacebookIcon className={className} size={size} />;
    case 'whatsapp':
      return <WhatsAppIcon className={className} size={size} />;
    case 'telegram':
      return <TelegramIcon className={className} size={size} />;
    case 'tiktok':
      return <TikTokIcon className={className} size={size} />;
    case 'github':
      return <GitHubIcon className={className} size={size} />;
    case 'behance':
      return <BehanceIcon className={className} size={size} />;
    case 'dribbble':
      return <DribbbleIcon className={className} size={size} />;
    case 'pinterest':
      return <PinterestIcon className={className} size={size} />;
    case 'snapchat':
      return <SnapchatIcon className={className} size={size} />;
    case 'website':
    default:
      return <WebsiteIcon className={className} size={size} />;
  }
}
