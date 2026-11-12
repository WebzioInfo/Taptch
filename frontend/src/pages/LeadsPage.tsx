import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Users, Mail, Phone, Building } from 'lucide-react';

export function LeadsPage() {
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', 'my'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/leads'),
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold text-white">Collected Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Contacts shared by visitors on your digital cards
          </p>
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-[#121216] border border-border/40 animate-pulse" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border/60 bg-[#121216]/50">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Contacts Collected Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              When people tap your card and use the "Exchange Contact" button, their submitted details will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-[#121216]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181D] text-muted-foreground border-b border-border/40 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{l.name}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {l.email && <div className="flex items-center space-x-1.5"><Mail className="w-3 h-3 text-primary" /><span>{l.email}</span></div>}
                      {l.phone && <div className="flex items-center space-x-1.5 mt-0.5"><Phone className="w-3 h-3 text-primary" /><span>{l.phone}</span></div>}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {l.company || '—'} {l.jobTitle ? `(${l.jobTitle})` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
