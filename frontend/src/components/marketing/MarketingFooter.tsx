import React from 'react';
import { Link } from 'react-router-dom';
import { brandConfig } from '../../config/brand';
import { BrandLogo } from '../brand';

export function MarketingFooter() {
  return (
      <footer className="w-full border-t border-[var(--border)] py-16 bg-[var(--bg-surface)] text-xs text-[var(--ink-muted)]">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[var(--border)]">
              {/* Brand Info */}
                <div className="space-y-4">
                  <BrandLogo variant="horizontal" size="md" />
                    <p className="text-xs text-[var(--ink-muted)] leading-relaxed max-w-sm">
                      The smart contactless NFC business card and digital identity platform. Tap or scan to share your verified profile, phonebook vCard, and ventures in seconds.
                    </p>
                      <p className="font-mono text-[11px] text-[var(--ink-muted)] uppercase tracking-wider">
                        Developed by {brandConfig.legalName}
                      </p>
                    </div>

                    {/* Solutions */}
                    <div className="space-y-3">
                        <p className="font-head font-medium text-[var(--ink)] text-xs uppercase tracking-wider">Solutions</p>
                        <ul className="space-y-2.5">
                          <li>
                              <Link to="/nfc-business-card" className="hover:text-[var(--ink)] transition-colors">
                                NFC Business Cards
                              </Link>
                          </li>
                          <li>
                              <Link to="/digital-business-card" className="hover:text-[var(--ink)] transition-colors">
                                Digital Business Cards
                              </Link>
                          </li>
                          <li>
                              <Link to="/templates" className="hover:text-[var(--ink)] transition-colors">
                                Template Showcase
                              </Link>
                          </li>
                        </ul>
                    </div>

                    {/* Platform */}
                    <div className="space-y-3">
                        <p className="font-head font-medium text-[var(--ink)] text-xs uppercase tracking-wider">Platform</p>
                        <ul className="space-y-2.5">
                          <li>
                              <Link to="/features" className="hover:text-[var(--ink)] transition-colors">
                                Platform Features
                              </Link>
                          </li>
                          <li>
                              <Link to="/how-it-works" className="hover:text-[var(--ink)] transition-colors">
                                How It Works
                              </Link>
                          </li>
                          <li>
                              <Link to="/pricing" className="hover:text-[var(--ink)] transition-colors">
                                Pricing & Plans
                              </Link>
                          </li>
                          <li>
                              <Link to="/faq" className="hover:text-[var(--ink)] transition-colors">
                                Frequently Asked
                              </Link>
                          </li>
                        </ul>
                    </div>

                    {/* Company & Support */}
                    <div className="space-y-3">
                        <p className="font-head font-medium text-[var(--ink)] text-xs uppercase tracking-wider">Company</p>
                        <ul className="space-y-2.5">
                          <li>
                              <Link to="/about" className="hover:text-[var(--ink)] transition-colors">
                                About Us
                              </Link>
                          </li>
                          <li>
                              <Link to="/contact" className="hover:text-[var(--ink)] transition-colors">
                                Contact Support
                              </Link>
                          </li>
                          <li>
                              <Link to="/login" className="hover:text-[var(--ink)] transition-colors">
                                Sign In
                              </Link>
                          </li>
                          <li>
                              <Link to="/register" className="hover:text-[var(--ink)] transition-colors">
                                Create Account
                              </Link>
                          </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                  <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[var(--ink-muted)]">
                    <div>
                      &copy; {new Date().getFullYear()} {brandConfig.legalName}. All rights reserved.
                    </div>
                    <div className="flex items-center space-x-6">
                      <span>Made with precision in India</span>
                      <span>&bull;</span>
                      <span>DPDP Act Compliant</span>
                    </div>
                  </div>
                </div>
              </footer>
              );
}
