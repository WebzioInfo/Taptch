import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Boxes } from 'lucide-react';
import { ApiClient } from '../../services/api';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';

export function AdminNfcLifecyclePage() {
  const queryClient = useQueryClient();
  const { can } = useAdminPermissions();
  const canManageCards = can('cards.manage');
  const canManageInv = can('inventory.manage');

  const [tab, setTab] = useState<'cards' | 'inventory'>('cards');
  const [confirmCard, setConfirmCard] = useState<{ id: string; action: 'activate' | 'damage' | 'revoke' | 'replace' } | null>(null);
  const [reason, setReason] = useState('');

  const { data: cardsData, isLoading: cardsLoading } = useQuery<{ items: any[]; total: number }>({
    queryKey: ['admin-nfc-lifecycle'],
    queryFn: () => ApiClient.get('/api/v1/admin/nfc-lifecycle'),
  });

  const { data: invData, isLoading: invLoading } = useQuery<{ items: any[]; movements: any[] }>({
    queryKey: ['admin-inventory'],
    queryFn: () => ApiClient.get('/api/v1/admin/inventory'),
    enabled: can('inventory.view'),
  });

  const cardMutation = useMutation({
    mutationFn: (p: { id: string; action: string; reason: string }) =>
      ApiClient.patch(`/api/v1/admin/nfc-lifecycle/${p.id}`, { action: p.action, reason: p.reason }),
    onSuccess: () => {
      setConfirmCard(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-nfc-lifecycle'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('cards')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border ${
            tab === 'cards' ? 'bg-[#FF6A00] text-white border-[#FF6A00]' : 'bg-white border-[#E8E8E8]'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          NFC Lifecycle
        </button>
        <button
          type="button"
          onClick={() => setTab('inventory')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border ${
            tab === 'inventory' ? 'bg-[#FF6A00] text-white border-[#FF6A00]' : 'bg-white border-[#E8E8E8]'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          Inventory Movements
        </button>
      </div>

      {tab === 'cards' ? (
        <div className="rounded-lg bg-white border border-[#E8E8E8] overflow-hidden">
          {cardsLoading ? (
            <div className="p-6 text-center text-xs text-[#666666]">Loading NFC lifecycle...</div>
          ) : !cardsData?.items?.length ? (
            <div className="p-6 text-center text-xs text-[#666666]">No purchased NFC cards found.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FB] text-[#666666] border-b border-[#E8E8E8]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Card ID</th>
                  <th className="px-4 py-2.5 font-medium">Material</th>
                  <th className="px-4 py-2.5 font-medium">Assignment</th>
                  <th className="px-4 py-2.5 font-medium">Activation</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8]">
                {cardsData.items.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2.5 font-mono text-[11px]">{c.id.slice(0, 12)}</td>
                    <td className="px-4 py-2.5">{c.material}</td>
                    <td className="px-4 py-2.5">{c.profileAssignmentStatus}</td>
                    <td className="px-4 py-2.5">{c.activationStatus}</td>
                    <td className="px-4 py-2.5 text-right space-x-1">
                      {canManageCards && (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmCard({ id: c.id, action: 'activate' })}
                            className="px-2 py-1 rounded border border-[#E8E8E8]"
                          >
                            Activate
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmCard({ id: c.id, action: 'revoke' })}
                            className="px-2 py-1 rounded border border-red-200 text-red-700"
                          >
                            Revoke
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-white border border-[#E8E8E8] overflow-hidden">
          {invLoading ? (
            <div className="p-6 text-center text-xs text-[#666666]">Loading inventory...</div>
          ) : !invData?.items?.length ? (
            <div className="p-6 text-center text-xs text-[#666666]">
              No inventory items recorded.{canManageInv ? ' Use API to receive initial stock.' : ''}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FB] text-[#666666] border-b border-[#E8E8E8]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Material</th>
                  <th className="px-4 py-2.5 font-medium">SKU</th>
                  <th className="px-4 py-2.5 font-medium">Available</th>
                  <th className="px-4 py-2.5 font-medium">Damaged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8]">
                {invData.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2.5 font-medium">{item.material}</td>
                    <td className="px-4 py-2.5 font-mono">{item.sku}</td>
                    <td className="px-4 py-2.5">{item.availableQty}</td>
                    <td className="px-4 py-2.5">{item.damagedQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {confirmCard && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E8E8E8] w-full max-w-md p-5 space-y-3 text-xs">
            <h3 className="text-sm font-semibold">Confirm Card {confirmCard.action}</h3>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for lifecycle action..."
              className="w-full px-3 py-1.5 border border-[#E8E8E8] rounded-md"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmCard(null)} className="px-3 py-1.5 rounded border border-[#E8E8E8]">
                Cancel
              </button>
              <button
                type="button"
                disabled={!reason.trim()}
                onClick={() => cardMutation.mutate({ ...confirmCard, reason })}
                className="px-3 py-1.5 rounded bg-[#FF6A00] text-white disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
