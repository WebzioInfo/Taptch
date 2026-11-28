import React from 'react';

export interface SocialIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export interface SocialIconOptions {
  branded?: boolean;
}

/**
 * Official brand colors for social platforms.
 * Monochrome brands (X, GitHub, TikTok, Threads, Medium) use `undefined`
 * so they inherit `currentColor` and remain high-contrast on both dark and light themes.
 */
export const SOCIAL_BRAND_COLORS: Record<string, string | undefined> = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  twitter: undefined,
  x: undefined,
  youtube: '#FF0000',
  github: undefined,
  tiktok: undefined,
  snapchat: '#EAB308',
  pinterest: '#BD081C',
  threads: undefined,
  telegram: '#26A5E4',
  twitch: '#9146FF',
  medium: undefined,
  behance: '#1769FF',
  dribbble: '#EA4C89',
  reddit: '#FF4500',
  whatsapp: '#25D366',
  website: undefined,
};

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
      aria-hidden="true"
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
      aria-hidden="true"
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
      aria-hidden="true"
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
      aria-hidden="true"
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
      aria-hidden="true"
      {...props}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/**
 * Official WhatsApp brand icon (Simple Icons silhouette: speech bubble + phone handset).
 */
  export function WhatsAppIcon({ className = 'w-[19px] h-[19px]', size = 19, ...props }: SocialIconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.422-.516.078-1.172.109-1.891-.125-.438-.141-1-.328-1.719-.641-3.031-1.313-5.016-4.375-5.172-4.578-.141-.203-1.234-1.641-1.234-3.125 0-1.484.781-2.219 1.063-2.516.266-.297.594-.375.797-.375.203 0 .391.016.563.016.188.016.438-.078.672.5.25.609.844 2.078.922 2.234.078.156.125.328.016.531-.109.203-.156.328-.313.516-.156.172-.328.391-.469.531-.156.156-.313.328-.141.641.188.313.813 1.344 1.75 2.172 1.203 1.078 2.219 1.406 2.531 1.563.313.156.5.125.688-.078.188-.203.781-.906.984-1.219.203-.313.406-.266.688-.156.281.109 1.797.844 2.109 1s.516.234.594.359c.078.125.078.734-.172 1.438z" />
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
        aria-hidden="true"
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
        aria-hidden="true"
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
        aria-hidden="true"
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
        aria-hidden="true"
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
        aria-hidden="true"
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
        aria-hidden="true"
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
        aria-hidden="true"
        {...props}
      >
        <path d="M12.003 2c-3.52 0-6.177 2.387-6.177 5.753 0 1.25.433 2.502.949 3.324.165.263.22.463.158.694-.078.29-.364.57-.743.766-.563.29-.982.525-1.033.916-.063.479.35.882.977 1.077.585.182 1.205.158 1.706.07.318-.056.495.034.614.184.288.362.802 1.545 1.758 1.834.673.203 1.229-.074 1.787-.36.438-.225.88-.452 1.41-.452s.972.227 1.41.452c.558.286 1.114.563 1.787.36.956-.289 1.47-1.472 1.758-1.834.119-.15.296-.24.614-.184.501.088 1.121.112 1.706-.07.627-.195 1.04-.598.977-1.077-.051-.391-.47-.626-1.033-.916-.379-.196-.665-.476-.743-.766-.062-.231-.007-.431.158-.694.516-.822.949-2.074.949-3.324C18.18 4.387 15.523 2 12.003 2z" />
      </svg>
    );
  }

  export function ThreadsIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.583-1.275-.879-2.266-.881h-.04c-.833 0-1.917.243-2.592 1.195l-1.702-1.174c.96-1.394 2.448-2.138 4.294-2.138h.05c2.999.018 4.863 1.718 5.043 4.559.107.046.212.094.316.144 1.332.642 2.342 1.616 2.912 2.916.774 1.766.85 4.62-1.454 6.875-1.842 1.805-4.091 2.628-7.24 2.65zm-.22-8.282c-.936.053-2.463.368-2.393 1.643.035.635.425 1.195 1.07 1.535.565.298 1.244.428 1.964.39 1.635-.089 2.607-1.111 2.86-3.44a11.79 11.79 0 0 0-3.5-.128z" />
      </svg>
    );
  }

  export function TwitchIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
      </svg>
    );
  }

  export function MediumIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
      </svg>
    );
  }

  export function RedditIcon({ className = 'w-4 h-4', size = 16, ...props }: SocialIconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
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
        aria-hidden="true"
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
  export function getSocialPlatformIcon(
    platformId: string,
    className = 'w-4 h-4',
    size = 16,
    options?: SocialIconOptions,
  ): React.ReactElement {
    const norm = (typeof platformId === 'string' ? platformId : 'website').toLowerCase().trim();
    const brandColor = options?.branded ? SOCIAL_BRAND_COLORS[norm] : undefined;
    const style = brandColor ? { color: brandColor } : undefined;

    switch (norm) {
      case 'instagram':
        return <InstagramIcon className={className} size={size} style={style} />;
      case 'linkedin':
        return <LinkedInIcon className={className} size={size} style={style} />;
      case 'twitter':
      case 'x':
        return <XTwitterIcon className={className} size={size} style={style} />;
      case 'youtube':
        return <YouTubeIcon className={className} size={size} style={style} />;
      case 'facebook':
        return <FacebookIcon className={className} size={size} style={style} />;
      case 'whatsapp':
        return <WhatsAppIcon className={className} size={size} style={style} />;
      case 'telegram':
        return <TelegramIcon className={className} size={size} style={style} />;
      case 'tiktok':
        return <TikTokIcon className={className} size={size} style={style} />;
      case 'github':
        return <GitHubIcon className={className} size={size} style={style} />;
      case 'behance':
        return <BehanceIcon className={className} size={size} style={style} />;
      case 'dribbble':
        return <DribbbleIcon className={className} size={size} style={style} />;
      case 'pinterest':
        return <PinterestIcon className={className} size={size} style={style} />;
      case 'snapchat':
        return <SnapchatIcon className={className} size={size} style={style} />;
      case 'threads':
        return <ThreadsIcon className={className} size={size} style={style} />;
      case 'twitch':
        return <TwitchIcon className={className} size={size} style={style} />;
      case 'medium':
        return <MediumIcon className={className} size={size} style={style} />;
      case 'reddit':
        return <RedditIcon className={className} size={size} style={style} />;
      case 'website':
      default:
        return <WebsiteIcon className={className} size={size} style={style} />;
    }
  }
