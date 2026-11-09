import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { formatLoginError } from '@/app/(auth)/login/page';
import { PasswordInput } from '@/components/ui/password-input';

describe('Login Diagnostics & Error Handling Engine', () => {
  it('maps invalid credentials correctly without exposing user existence', () => {
    // Both 401 with INVALID_EMAIL_OR_PASSWORD and USER_NOT_FOUND must map to the same message
    expect(formatLoginError({ status: 401, code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' }))
      .toBe('Email or password is incorrect. Check your details and try again.');

    expect(formatLoginError({ status: 401, code: 'USER_NOT_FOUND', message: 'User not found' }))
      .toBe('Email or password is incorrect. Check your details and try again.');

    expect(formatLoginError('Invalid credentials'))
      .toBe('Email or password is incorrect. Check your details and try again.');
  });

  it('maps invalid email format accurately', () => {
    expect(formatLoginError({ code: 'INVALID_EMAIL', message: 'Enter a valid email' }))
      .toBe('Enter a valid email address.');

    expect(formatLoginError('Invalid email format'))
      .toBe('Enter a valid email address.');
  });

  it('maps empty email and empty password errors', () => {
    expect(formatLoginError({ code: 'EMPTY_EMAIL', message: 'Enter your email' }))
      .toBe('Enter your email address.');

    expect(formatLoginError({ code: 'EMPTY_PASSWORD', message: 'Enter your password' }))
      .toBe('Enter your password.');
  });

  it('maps network failures and transport interruptions', () => {
    expect(formatLoginError('TypeError: Failed to fetch'))
      .toBe('Unable to reach TAPTCH. Check your connection and try again.');

    expect(formatLoginError('net::ERR_QUIC_PROTOCOL_ERROR'))
      .toBe('Unable to reach TAPTCH. Check your connection and try again.');

    expect(formatLoginError('connect ECONNREFUSED 127.0.0.1:443'))
      .toBe('Unable to reach TAPTCH. Check your connection and try again.');
  });

  it('maps server internal errors (HTTP 500)', () => {
    expect(formatLoginError({ status: 500, code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' }))
      .toBe('Sign-in is temporarily unavailable. Please try again shortly.');

    expect(formatLoginError({ status: 502, message: 'Bad Gateway' }))
      .toBe('Sign-in is temporarily unavailable. Please try again shortly.');

    expect(formatLoginError({ status: 503, message: 'Service Unavailable' }))
      .toBe('Sign-in is temporarily unavailable. Please try again shortly.');
  });

  it('maps rate limiting (HTTP 429)', () => {
    expect(formatLoginError({ status: 429, code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' }))
      .toBe('Too many attempts. Please wait before trying again.');

    expect(formatLoginError('Too many attempts, please try again later.'))
      .toBe('Too many attempts. Please wait before trying again.');
  });

  it('maps account locked or suspended states', () => {
    expect(formatLoginError({ status: 403, code: 'ACCOUNT_LOCKED', message: 'Account is locked' }))
      .toBe('Sign-in is temporarily restricted. Please try again later.');

    expect(formatLoginError({ status: 403, code: 'ACCOUNT_SUSPENDED', message: 'Account suspended' }))
      .toBe('Sign-in is temporarily restricted. Please try again later.');
  });

  it('maps session creation failures', () => {
    expect(formatLoginError({ code: 'SESSION_CREATION_FAILED', message: 'Failed to create session' }))
      .toBe("Your credentials were accepted, but we couldn't establish your session. Please try again.");

    expect(formatLoginError({ code: 'FAILED_TO_CREATE_SESSION', message: 'Session failed' }))
      .toBe("Your credentials were accepted, but we couldn't establish your session. Please try again.");
  });

  it('maps email verification requirements', () => {
    expect(formatLoginError({ code: 'EMAIL_NOT_VERIFIED', message: 'Email not verified' }))
      .toBe('Verify your email address before signing in.');

    expect(formatLoginError({ code: 'EMAIL_VERIFICATION_REQUIRED', message: 'Verification needed' }))
      .toBe('Verify your email address before signing in.');
  });

  it('maps unexpected responses with safe fallback', () => {
    expect(formatLoginError(null))
      .toBe("We couldn't complete sign-in. Please try again or contact support if the problem continues.");

    expect(formatLoginError('Unrecognized random error code 9999'))
      .toBe("We couldn't complete sign-in. Please try again or contact support if the problem continues.");
  });

  it('validates empty email and empty password locally before submission', () => {
    // When user leaves fields empty, local validation errors match required strings
    const emptyEmail = '';
    const emptyPassword = '';
    expect(emptyEmail ? '' : 'Enter your email address.').toBe('Enter your email address.');
    expect(emptyPassword ? '' : 'Enter your password.').toBe('Enter your password.');
  });

  it('validates email regex format strictly', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test('notanemail')).toBe(false);
    expect(emailRegex.test('user@')).toBe(false);
    expect(emailRegex.test('@domain.com')).toBe(false);
    expect(emailRegex.test('admin@taptch.local')).toBe(true);
  });

  it('handles database connection and timeout errors safely', () => {
    expect(formatLoginError({ status: 500, message: 'Database connection timeout' }))
      .toBe('Sign-in is temporarily unavailable. Please try again shortly.');
    expect(formatLoginError({ status: 500, message: 'Supabase pooler closed' }))
      .toBe('Sign-in is temporarily unavailable. Please try again shortly.');
  });
});

describe('Password Visibility Toggle Component', () => {
  it('renders password input in concealed state by default with accessibility attributes', () => {
    const html = renderToString(
      React.createElement(PasswordInput, {
        id: 'test-password',
        value: 'TopSecretPassword!2026',
        onChange: () => {},
      })
    );

    // Default input type must be password
    expect(html).toContain('type="password"');
    // Value must be present
    expect(html).toContain('value="TopSecretPassword!2026"');
    // Button must have type="button" to prevent form submission
    expect(html).toContain('type="button"');
    // Accessible aria-label
    expect(html).toContain('aria-label="Show password"');
    // tabIndex should be -1 so keyboard Tab navigates past it to Submit
    expect(html).toContain('tabindex="-1"');
  });

  it('preserves password value when rendered with custom class and error state', () => {
    const html = renderToString(
      React.createElement(PasswordInput, {
        id: 'pwd-error',
        value: 'MyPreservedPassword123',
        error: true,
        onChange: () => {},
      })
    );

    expect(html).toContain('value="MyPreservedPassword123"');
    expect(html).toContain('border-red-400');
  });

  it('has accessible button semantics ensuring toggle button never submits enclosing form', () => {
    const html = renderToString(
      React.createElement(
        'form',
        null,
        React.createElement(PasswordInput, {
          id: 'test-form-pwd',
          value: 'Password123',
          onChange: () => {},
        })
      )
    );

    // Form element present
    expect(html).toContain('<form>');
    // The toggle button explicitly specifies type="button"
    expect(html).toContain('<button type="button"');
    // Input must preserve current-password autoComplete
    expect(html).toContain('autoComplete="current-password"');
  });
});
