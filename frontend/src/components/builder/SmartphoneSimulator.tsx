import * as React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { ProfileRenderer, type ProfileRenderData } from '@/components/templates/ProfileRenderer';

interface PreviewErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode; resetKey: string },
  PreviewErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; resetKey: string }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): PreviewErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unable to render profile preview.',
    };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-[#0A0A0B] text-[#EDEBE6] space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <div className="space-y-1">
            <p className="text-xs font-semibold">Preview failed to render</p>
            <p className="text-[11px] text-neutral-400 break-words">{this.state.message}</p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retry Preview</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export interface SmartphoneSimulatorProps {
  profile: ProfileRenderData;
  templateId: string;
}

export function SmartphoneSimulator({ profile, templateId }: SmartphoneSimulatorProps) {
  const previewResetKey = `${templateId}-${profile.displayName}-${profile.avatarUrl || ''}`;

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Subtle Side Hardware Buttons */}
      <div
        className="hidden xl:block absolute -left-[3px] top-[112px] w-[3px] h-7 rounded-l-sm bg-[#3A3A3F]"
        aria-hidden="true"
      />
      <div
        className="hidden xl:block absolute -left-[3px] top-[152px] w-[3px] h-11 rounded-l-sm bg-[#3A3A3F]"
        aria-hidden="true"
      />
      <div
        className="hidden xl:block absolute -left-[3px] top-[204px] w-[3px] h-11 rounded-l-sm bg-[#3A3A3F]"
        aria-hidden="true"
      />
      <div
        className="hidden xl:block absolute -right-[3px] top-[158px] w-[3px] h-16 rounded-r-sm bg-[#3A3A3F]"
        aria-hidden="true"
      />

      {/* Realistic Titanium Smartphone Shell — scales cleanly inside viewport */}
      <div
        className="relative w-[348px] xl:w-[366px] h-[min(716px,calc(100vh-116px))] min-h-[500px] max-w-full rounded-[44px] p-[9px] bg-gradient-to-b from-[#2E2E34] via-[#1B1B1F] to-[#26262B] ring-1 ring-white/15 shadow-[0_24px_60px_-14px_rgba(0,0,0,0.45),0_4px_16px_-4px_rgba(0,0,0,0.3)] flex flex-col"
      >
        {/* Inner Glass Display */}
        <div className="relative w-full h-full rounded-[35px] bg-[#0A0A0B] overflow-hidden flex flex-col ring-1 ring-black">
          {/* Status Bar + Dynamic Island */}
          <div className="h-9 px-5 bg-[#0A0A0B] text-white flex items-center justify-between shrink-0 relative z-30">
            <span className="text-[11px] font-semibold tracking-tight tabular-nums">9:41</span>

            {/* Dynamic Island */}
            <div
              className="w-[88px] h-[22px] rounded-full bg-black border border-white/10 flex items-center justify-end pr-2 shadow-inner"
              aria-hidden="true"
            >
              <span className="w-2 h-2 rounded-full bg-[#111827] ring-1 ring-white/10" />
            </div>

            {/* Signal, Wi-Fi & Battery */}
            <div className="flex items-center gap-1.5 text-white/90" aria-hidden="true">
              {/* Cellular Signal */}
              <svg width="13" height="10" viewBox="0 0 13 10" fill="currentColor">
                <rect x="0" y="7" width="2" height="3" rx="0.5" />
                <rect x="3.5" y="5" width="2" height="5" rx="0.5" />
                <rect x="7" y="2.5" width="2" height="7.5" rx="0.5" />
                <rect x="10.5" y="0" width="2" height="10" rx="0.5" />
              </svg>
              {/* Wi-Fi */}
              <svg width="12" height="10" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M1.5 3.8C5.2 0.7 10.8 0.7 14.5 3.8" />
                <path d="M4.2 6.6C6.4 4.7 9.6 4.7 11.8 6.6" />
                <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
              </svg>
              {/* Battery */}
              <div className="flex items-center gap-[1px]">
                <div className="w-[18px] h-[9px] rounded-[2.5px] border border-white/60 p-[1.5px] flex items-center">
                  <div className="w-full h-full rounded-[1px] bg-white" />
                </div>
                <div className="w-[1.5px] h-[4px] rounded-r-sm bg-white/60" />
              </div>
            </div>
          </div>

          {/* Clipped Scrollable Profile Screen */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-none relative bg-[#0A0A0B]">
            <PreviewErrorBoundary resetKey={previewResetKey}>
              <ProfileRenderer key={templateId} profile={profile} />
            </PreviewErrorBoundary>
          </div>

          {/* Bottom Home Gesture Bar */}
          <div className="h-5 w-full bg-[#0A0A0B] flex items-center justify-center shrink-0 border-t border-white/[0.04]">
            <div className="w-28 h-1 rounded-full bg-white/35" />
          </div>
        </div>
      </div>
    </div>
  );
}
