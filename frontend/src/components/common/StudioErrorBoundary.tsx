import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

export interface StudioErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class StudioErrorBoundary extends Component<StudioErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected error occurred in the Profile Studio.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[StudioErrorBoundary] Caught unexpected error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
              <div className="w-full h-full min-h-[300px] flex items-center justify-center p-6 bg-[#F8F9FB] text-[#171717]">
                <div className="max-w-md w-full p-6 rounded-2xl bg-white border border-[#E8E8E8] shadow-xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF6A00] flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#171717] tracking-tight">
                        {this.props.fallbackTitle || 'Studio Preview Encountered an Issue'}
                      </h3>
                        <p className="text-xs text-[#666666] leading-relaxed">
                          {this.props.fallbackMessage ||
                            'A temporary issue occurred while rendering the interactive layout. Your profile form data is safely preserved.'}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={this.handleReset}
                          className="bg-white hover:bg-[#F8F9FB] border border-[#E8E8E8] text-[#171717] text-xs rounded-xl h-9 gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-[#FF6A00]" />
                          <span>Retry Rendering</span>
                        </Button>
                      </div>
                  </div>
                </div>
                );
    }

                return this.props.children;
  }
}

                /**
                 * Route-level error fallback for React Router
                 */
                export function StudioRouteError() {
  return (
                      <div className="min-h-screen bg-[#F8F9FB] text-[#171717] flex items-center justify-center p-6">
                        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-[#E8E8E8] shadow-xl text-center space-y-5">
                          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF6A00] flex items-center justify-center mx-auto">
                            <AlertCircle className="w-7 h-7" />
                          </div>

                          <div className="space-y-2">
                              <h2 className="text-lg font-bold text-[#171717] tracking-tight">
                                Profile Studio Notice
                              </h2>
                                <p className="text-xs text-[#666666] leading-relaxed">
                                  The Profile Builder encountered a configuration issue while loading the workspace. All saved records in your account remain completely intact.
                                </p>
                              </div>

                              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Button
                                  type="button"
                                  onClick={() => window.location.reload()}
                                  className="w-full sm:w-auto bg-[#FF6A00] hover:bg-[#E85D00] text-white font-semibold text-xs rounded-xl h-10 px-5 gap-2"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  <span>Reload Studio</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => window.location.href = '/dashboard'}
                                  className="w-full sm:w-auto bg-white hover:bg-[#F8F9FB] border border-[#E8E8E8] text-[#171717] text-xs rounded-xl h-10 px-5 gap-2"
                                >
                                  <ArrowLeft className="w-4 h-4" />
                                  <span>Return to Dashboard</span>
                                </Button>
                              </div>
                          </div>
                        </div>
                        );
}
