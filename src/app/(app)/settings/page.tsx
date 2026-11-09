'use client';

import * as React from 'react';
import { useSession, changePassword } from '@/lib/auth/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { ConfirmPasswordInput, PasswordStrengthMeter } from '@/components/ui/confirm-password-input';
import { FormField, FormLabel, FormError, FormSuccess } from '@/components/ui/form-field';
import { LoadingButton } from '@/components/ui/loading-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { toast } from '@/components/ui/use-toast';
import {
  ShieldCheck,
  User,
  KeyRound,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [activeTab, setActiveTab] = React.useState<'profile' | 'security'>('security');

  // Change password states
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [revokeOtherSessions, setRevokeOtherSessions] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validatePasswordChange = (): boolean => {
    const errors: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {};

    if (!currentPassword) {
      errors.currentPassword = 'Please enter your current password.';
    }

    if (!newPassword) {
      errors.newPassword = 'Please enter a new password.';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters.';
    } else if (newPassword === currentPassword) {
      errors.newPassword = 'New password must be different from current password.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validatePasswordChange()) return;

    setLoading(true);

    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });

      if (res.error) {
        setErrorMsg(res.error.message || 'Failed to change password. Please verify your current password.');
      } else {
        setSuccessMsg('Your password has been changed successfully.');
        toast.success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal profile, credentials, and account security
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab('security');
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex items-center gap-2 pb-3 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('profile');
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex items-center gap-2 pb-3 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile Details</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'security' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-100 p-5">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-blue-600" />
                  <span>Change Password</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Update your password regularly to keep your account safe
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5">
                {errorMsg && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 text-red-700 text-xs border border-red-100 mb-4 leading-relaxed">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-emerald-50 text-emerald-700 text-xs border border-emerald-100 mb-4 leading-relaxed">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <FormField>
                    <FormLabel htmlFor="current-pwd" required>
                      Current password
                    </FormLabel>
                    <PasswordInput
                      id="current-pwd"
                      required
                      disabled={loading}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (fieldErrors.currentPassword) {
                          setFieldErrors((prev) => ({ ...prev, currentPassword: undefined }));
                        }
                      }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      error={Boolean(fieldErrors.currentPassword)}
                    />
                    <FormError>{fieldErrors.currentPassword}</FormError>
                  </FormField>

                  <FormField>
                    <div className="flex items-center justify-between">
                      <FormLabel htmlFor="new-pwd" required>
                        New password
                      </FormLabel>
                      <span className="text-[11px] text-slate-400">At least 8 characters</span>
                    </div>
                    <PasswordInput
                      id="new-pwd"
                      required
                      minLength={8}
                      disabled={loading}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (fieldErrors.newPassword) {
                          setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                        }
                      }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      error={Boolean(fieldErrors.newPassword)}
                    />
                    <PasswordStrengthMeter password={newPassword} />
                    <FormError>{fieldErrors.newPassword}</FormError>
                  </FormField>

                  <FormField>
                    <FormLabel htmlFor="confirm-pwd" required>
                      Confirm new password
                    </FormLabel>
                    <ConfirmPasswordInput
                      id="confirm-pwd"
                      required
                      disabled={loading}
                      primaryPassword={newPassword}
                      confirmPassword={confirmPassword}
                      onConfirmChange={(val) => {
                        setConfirmPassword(val);
                        if (fieldErrors.confirmPassword) {
                          setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                        }
                      }}
                      error={Boolean(fieldErrors.confirmPassword)}
                    />
                    <FormError>{fieldErrors.confirmPassword}</FormError>
                  </FormField>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={revokeOtherSessions}
                        onChange={(e) => setRevokeOtherSessions(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-600">
                        Sign out of all other devices and active sessions
                      </span>
                    </label>
                  </div>

                  <LoadingButton
                    type="submit"
                    loading={loading}
                    loadingText="Updating password..."
                    disabled={
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword ||
                      newPassword !== confirmPassword
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 px-4 mt-2"
                  >
                    Save New Password
                  </LoadingButton>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Security Information Sidebar */}
          <div className="space-y-4">
            <Card className="border border-slate-200/90 shadow-2xs rounded-xl bg-white p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Laptop className="h-4 w-4 text-slate-500" />
                <span>Active Session</span>
              </h3>
              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Status</span>
                  <StatusBadge status="active" label="Connected" />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">Signed in as</span>
                  <span className="font-medium text-slate-800 truncate max-w-[150px]">
                    {user?.email}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">Session Cookie</span>
                  <span className="text-[11px] text-emerald-600 font-medium">HttpOnly Secure</span>
                </div>
              </div>
            </Card>

            <Card className="border border-slate-200/90 shadow-2xs rounded-xl bg-white p-4 space-y-2 text-xs text-slate-500">
              <h3 className="font-semibold text-slate-800">Security Recommendation</h3>
              <p className="leading-relaxed">
                Use a password with at least 8 characters, combining uppercase and lowercase letters, numbers, and symbols.
              </p>
            </Card>
          </div>
        </div>
      ) : (
        /* Profile Details Tab */
        <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden bg-white max-w-xl">
          <CardHeader className="border-b border-slate-100 p-5">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Basic account metadata associated with your login
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <FormField>
              <FormLabel>Full Name</FormLabel>
              <Input
                type="text"
                disabled
                value={user?.name || ''}
                className="h-9 text-xs bg-slate-50"
              />
            </FormField>

            <FormField>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                disabled
                value={user?.email || ''}
                className="h-9 text-xs bg-slate-50"
              />
            </FormField>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">Account Role</span>
              <StatusBadge status="active" label="Standard User" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

