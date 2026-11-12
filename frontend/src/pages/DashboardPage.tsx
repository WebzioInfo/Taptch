import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Button } from '../components/ui/button';
import { Plus, ExternalLink, Sparkles, Edit3, Smartphone, QrCode } from 'lucide-react';

export function DashboardPage() {
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles', 'my'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/profiles'),
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold text-white">Digital Profiles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal and business contactless cards
          </p>
        </div>
        <Link to="/builder/new">
          <Button className="bg-primary text-black hover:bg-primary-hover font-semibold rounded-xl">
            <Plus className="w-4 h-4 mr-1.5" />
            Create New Profile
          </Button>
        </Link>
      </div>

      {/* Profiles Grid */}
      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-2xl bg-[#121216] border border-border/40 animate-pulse" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border/60 bg-[#121216]/50">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Profiles Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Create your first digital profile to start sharing your contacts, portfolio, and socials with a single contactless tap.
            </p>
            <Link to="/builder/new">
              <Button className="bg-primary text-black hover:bg-primary-hover font-semibold rounded-xl">
                <Plus className="w-4 h-4 mr-1.5" />
                Build My First Card
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="p-6 rounded-2xl bg-[#121216] border border-border/60 hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        p.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {p.status}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      /{p.slug}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{p.displayName}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {p.headline || 'No headline configured'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                  <Link
                    to={`/builder/${p.id}`}
                    className="flex items-center text-xs text-muted-foreground hover:text-white transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Edit Studio
                  </Link>
                  <a
                    href={`/p/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center text-xs text-primary font-semibold hover:underline"
                  >
                    Live Card
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

