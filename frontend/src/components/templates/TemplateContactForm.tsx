import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, CheckCircle2, AlertCircle, Loader2, Mail, Phone, Building2 } from 'lucide-react';
import { ApiClient } from '@/services/api';

export interface TemplateContactFormProps {
  profileId: string;
  profileName: string;
  themeStyle?: {
    accentColor?: string;
    cardBg?: string;
    borderColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    inputBg?: string;
  };
  isBusiness?: boolean;
  className?: string;
}

export function TemplateContactForm({
  profileId,
  profileName,
  themeStyle = {},
  isBusiness = false,
  className = '',
}: TemplateContactFormProps) {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [companyName, setCompanyName] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  // Honeypot spam defense
  const [honeypot, setHoneypot] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Styles fallback to Luxury Obsidian Gold if not specified
  const accent = themeStyle.accentColor || '#D4AF37';
  const cardBg = themeStyle.cardBg || 'rgba(18, 18, 22, 0.85)';
  const border = themeStyle.borderColor || 'rgba(255, 255, 255, 0.12)';
  const text = themeStyle.textColor || '#FFFFFF';
  const btnBg = themeStyle.buttonColor || accent;
  const btnText = themeStyle.buttonTextColor || '#0A0A0C';
  const inputBg = themeStyle.inputBg || 'rgba(255, 255, 255, 0.05)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // Silent reject bot

    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError('Please provide either an email or phone number.');
      return;
    }
    if (!message.trim()) {
      setError('Please write a short message or enquiry.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ApiClient.post('/api/v1/leads', {
        profileId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase() || null,
        phone: phone.trim() || null,
        companyName: companyName.trim() || null,
        subject: subject.trim() || (isBusiness ? 'Business Enquiry' : 'Networking Message'),
        message: message.trim(),
        source: 'contact_form',
      });

      setSuccess(true);
      setFullName('');
      setEmail('');
      setPhone('');
      setCompanyName('');
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-7 backdrop-blur-md transition-all shadow-xl ${className}`}
      style={{
        backgroundColor: cardBg,
        borderColor: border,
        color: text,
      }}
    >
      <div className="mb-5 text-center sm:text-left">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: text }}>
          {isBusiness ? 'Send an Enquiry' : 'Get in Touch'}
        </h3>
        <p className="text-xs sm:text-sm opacity-70 mt-1">
          {isBusiness
            ? `Connect directly with ${profileName} for quotes, consultations, and partnerships.`
            : `Send a direct message or share your contact details with ${profileName}.`}
        </p>
      </div>

      {success ? (
        <div className="rounded-xl p-5 border text-center space-y-3 bg-emerald-950/40 border-emerald-500/30 text-emerald-300">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 animate-in zoom-in-75 duration-300" />
          <h4 className="font-bold text-sm">Message Delivered!</h4>
          <p className="text-xs opacity-90 leading-relaxed">
            Thank you! Your message and contact details have been delivered to {profileName}.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSuccess(false)}
            className="text-xs mt-2 border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/30"
          >
            Send Another Message
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg p-3 text-xs flex items-center gap-2 border bg-red-950/40 border-red-500/30 text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Honeypot field (hidden from human visitors) */}
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              name="website_hp"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold opacity-90">
                Full Name <span className="text-red-400">*</span>
              </Label>
              <Input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="text-xs h-9 border-white/10"
                style={{ backgroundColor: inputBg, color: text }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold opacity-90">
                Email Address <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 opacity-40" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs h-9 pl-9 border-white/10"
                  style={{ backgroundColor: inputBg, color: text }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold opacity-90">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 opacity-40" />
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs h-9 pl-9 border-white/10"
                  style={{ backgroundColor: inputBg, color: text }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold opacity-90">
                {isBusiness ? 'Company / Organization' : 'Company (Optional)'}
              </Label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 opacity-40" />
                <Input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="text-xs h-9 pl-9 border-white/10"
                  style={{ backgroundColor: inputBg, color: text }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold opacity-90">Subject (Optional)</Label>
            <Input
              type="text"
              placeholder={isBusiness ? 'e.g. Product Pricing & Demo Request' : 'e.g. Networking & Collaboration'}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-xs h-9 border-white/10"
              style={{ backgroundColor: inputBg, color: text }}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold opacity-90">
              Message <span className="text-red-400">*</span>
            </Label>
            <Textarea
              placeholder={
                isBusiness
                  ? 'Please describe your requirements, questions, or scope...'
                  : 'Write a brief message or note...'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              required
              className="text-xs border-white/10 resize-none"
              style={{ backgroundColor: inputBg, color: text }}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full text-xs font-bold h-10 transition-transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
            style={{
              backgroundColor: btnBg,
              color: btnText,
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Message...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{isBusiness ? 'Submit Enquiry' : 'Send Message'}</span>
              </>
            )}
          </Button>

          <p className="text-[10px] text-center opacity-60">
            Protected with spam verification. Your contact information is delivered privately.
          </p>
        </form>
      )}
    </div>
  );
}

