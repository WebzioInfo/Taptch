import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Button } from '../components/ui/button';
import { QrCode, Plus, ExternalLink, Link2 } from 'lucide-react';

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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold text-white">Dynamic QR Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create high-speed trackable QR codes that update in real-time
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-primary text-black hover:bg-primary-hover font-semibold rounded-xl"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Dynamic QR
        </Button>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-[#121216] border border-border/40 animate-pulse" />
            ))}
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border/60 bg-[#121216]/50">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Dynamic QR Codes Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Create a dynamic QR code pointing to your Google Review page, restaurant menu, catalogue PDF, or landing page.
            </p>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-primary text-black hover:bg-primary-hover font-semibold rounded-xl"
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
                className="p-6 rounded-2xl bg-[#121216] border border-border/60 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{c.label || c.serialNumber}</h3>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                      Destination: <span className="text-primary">{c.manualRedirectUrl || c.targetUrl}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">
                      Token: /dq/{c.token}
                    </p>
                  </div>
                </div>
                <a
                  href={`/dq/${c.token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-muted-foreground hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#121216] border border-border/60">
            <h3 className="text-lg font-bold text-white mb-4">Create Dynamic QR</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Label / Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Reception Desk Reviews"
                  className="w-full px-3 py-2 bg-[#18181D] border border-border/60 rounded-xl text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Destination URL
                </label>
                <input
                  type="url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://g.page/review/my-business"
                  className="w-full px-3 py-2 bg-[#18181D] border border-border/60 rounded-xl text-sm text-white"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate({ title, destinationUrl })}
                disabled={!destinationUrl || createMutation.isPending}
                className="bg-primary text-black hover:bg-primary-hover font-semibold"
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
