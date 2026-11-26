import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Button } from '../components/ui/button';
import { Plus, ExternalLink, CreditCard, Edit3, AlertCircle, RefreshCw } from 'lucide-react';

export function DashboardPage() {
  const { data: rawProfiles, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['profiles', 'my'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/profiles'),
  });
  const profiles = Array.isArray(rawProfiles) ? rawProfiles : [];

  return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto">
        {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
            <div>
                <h1 className="font-head text-2xl font-medium tracking-tight text-[var(--ink)]">
                  Digital Profiles
                </h1>
                <p className="font-body text-sm text-[var(--ink-muted)] mt-1">
                  Manage your personal and business contactless cards
                </p>
            </div>
            <Link to="/builder/new">
                <Button variant="accent" className="rounded-[var(--radius-sm)] text-xs font-medium gap-1.5 shadow-none">
                  <Plus className="w-4 h-4" />
                  <span>Create New Profile</span>
                </Button>
            </Link>
          </div>

          {/* Profiles Grid */}
          <div className="mt-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-52 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] animate-pulse"
              />
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-12 px-4 rounded-[var(--radius-md)] border border-rose-200 bg-rose-50/60">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-3" />
                <h3 className="font-head text-base font-medium text-[#171717] mb-1">
                  Could not load your digital profiles
                </h3>
                <p className="font-body text-xs text-[#666666] max-w-md mx-auto mb-5">
                  {error instanceof Error ? error.message : 'An unexpected error occurred while fetching profiles.'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => refetch()}
                  className="rounded-[var(--radius-sm)] text-xs font-medium gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </Button>
              </div>
            ) : profiles.length === 0 ? (
                  <div className="text-center py-16 px-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-surface)]">
                    <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-text)] mx-auto mb-4">
                      <CreditCard className="w-5 h-5" />
                    </div>
                      <h3 className="font-head text-lg font-medium text-[var(--ink)] mb-1">No Profiles Yet</h3>
                      <p className="font-body text-xs sm:text-sm text-[var(--ink-muted)] max-w-md mx-auto mb-6">
                        Create your first digital profile to start sharing your contacts, portfolio, and socials with a single contactless tap.
                      </p>
                      <Link to="/builder/new">
                          <Button variant="accent" className="rounded-[var(--radius-sm)] text-xs font-medium gap-1.5">
                            <Plus className="w-4 h-4" />
                            <span>Build My First Card</span>
                          </Button>
                      </Link>
                  </div>
                  ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {profiles.map((p) => {
                                const isPublished = p.status === 'PUBLISHED';
                                return (
                <div
                  key={p.id}
                  className="p-6 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`px-2 py-0.5 rounded-[var(--radius-sm)] font-mono text-[10px] font-medium uppercase tracking-[0.04em] ${
                          isPublished
                            ? 'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30'
                            : 'bg-[var(--bg-raised)] text-[var(--ink-muted)] border border-[var(--border)]'
                        }`}
                      >
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span className="font-mono text-xs text-[var(--ink-muted)]">
                        /{p.slug}
                      </span>
                    </div>

                    <h3 className="font-head text-base font-medium text-[var(--ink)] mb-1">
                      {p.displayName || 'Untitled Profile'}
                    </h3>
                    <p className={`font-body text-xs line-clamp-2 ${p.headline ? 'text-[var(--ink-muted)]' : 'text-[var(--ink-muted)]/60 italic'}`}>
                      {p.headline || 'Add a headline'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between font-body text-xs">
                    <Link
                      to={`/builder/${p.id}`}
                      className="flex items-center text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      <span>Edit studio</span>
                    </Link>
                    <a
                      href={`/p/${p.slug || p.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center text-[var(--accent-text)] font-medium hover:underline"
                    >
                      <span>Live card</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>
                        );
            })}
                      </div>
                    )}
                  </div>
                </div>
                );
}
