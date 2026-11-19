import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Button } from '../components/ui/button';
import { QrCode, Plus, ExternalLink } from 'lucide-react';

export function QrPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['qr', 'my'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/qr'),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; destinationUrl: string }) =>
      ApiClient.post('/api/v1/qr', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr', 'my'] });
      setShowModal(false);
      setTitle('');
      setDestinationUrl('');
    },
  });

  return (
        <div className="p-6 sm:p-8 max-w-6xl mx-auto font-body text-[var(--ink)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
            <div>
                <h1 className="font-head text-2xl font-medium tracking-tight text-[var(--ink)]">
                  Dynamic QR Engine
                </h1>
                <p className="font-body text-sm text-[var(--ink-muted)] mt-1">
                  Create high-speed trackable QR codes that update in real-time
                </p>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              variant="accent"
              className="rounded-[var(--radius-sm)] text-xs font-medium gap-1.5 shadow-none"
            >
              <Plus className="w-4 h-4" />
              <span>Create Dynamic QR</span>
            </Button>
          </div>

          <div className="mt-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
              <div
                key={i}
                className="h-44 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] animate-pulse"
              />
                ))}
              </div>
            ) : codes.length === 0 ? (
                  <div className="text-center py-16 px-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-surface)]">
                    <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-text)] mx-auto mb-4">
                      <QrCode className="w-5 h-5" />
                    </div>
                      <h3 className="font-head text-lg font-medium text-[var(--ink)] mb-1">No Dynamic QR Codes Yet</h3>
                      <p className="font-body text-xs sm:text-sm text-[var(--ink-muted)] max-w-md mx-auto mb-6">
                        Create a dynamic QR code pointing to your Google Review page, restaurant menu, catalogue PDF, or landing page.
                      </p>
                      <Button
                        onClick={() => setShowModal(true)}
                        variant="accent"
                        className="rounded-[var(--radius-sm)] text-xs font-medium"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Create First QR Code
                      </Button>
                  </div>
                  ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {codes.map((c) => (
                      <div
                        key={c.id}
                        className="p-6 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-text)]">
                              <QrCode className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-head text-base font-medium text-[var(--ink)]">{c.label || c.serialNumber}</h3>
                                <p className="font-body text-xs text-[var(--ink-muted)] truncate max-w-xs mt-0.5">
                                  Destination: <span className="text-[var(--accent-text)]">{c.manualRedirectUrl || c.targetUrl}</span>
                                </p>
                                  <p className="font-mono text-[10px] text-[var(--ink-muted)] mt-1">
                                    Token: /dq/{c.token}
                                  </p>
                                </div>
                            </div>
                            <a
                              href={`/dq/${c.token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
            ))}
                        </div>
        )}
                      </div>

      {/* Create Modal */ }
      { showModal && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                              <div className="w-full max-w-md p-6 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] shadow-md">
                                <h3 className="font-head text-lg font-medium text-[var(--ink)] mb-4">Create Dynamic QR</h3>
                                <div className="space-y-4 font-body text-xs">
                                  <div>
                                      <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                                        Label / Title
                                      </label>
                                      <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Reception Desk Reviews"
                                        className="w-full px-3 py-2 bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                                        Destination URL
                                      </label>
                                      <input
                                        type="url"
                                        value={destinationUrl}
                                        onChange={(e) => setDestinationUrl(e.target.value)}
                                        placeholder="https://g.page/review/my-business"
                                        className="w-full px-3 py-2 bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono text-xs"
                                      />
                                  </div>
                                </div>
                                <div className="mt-6 flex justify-end space-x-3">
                                    <Button variant="outline" size="sm" onClick={() => setShowModal(false)} className="rounded-[var(--radius-sm)]">
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() => createMutation.mutate({ title, destinationUrl })}
                                      disabled={!destinationUrl || createMutation.isPending}
                                      variant="accent"
                                      size="sm"
                                      className="rounded-[var(--radius-sm)]"
                                    >
                                      {createMutation.isPending ? 'Creating...' : 'Create QR Code'}
                                    </Button>
                                </div>
                              </div>
                            </div>
      )}
                          </div>
                          );
}
