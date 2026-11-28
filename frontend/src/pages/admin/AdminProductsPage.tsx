import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ApiClient } from '../../services/api';
import { AdminPageHeader } from '../../components/common/AdminPageHeader';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';

interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  material: 'pvc' | 'metal' | string;
  finish?: string | null;
  colorName: string;
  color: string;
  imageUrl?: string | null;
  stockStatus?: 'IN_STOCK' | 'OUT_OF_STOCK' | string;
  isActive: boolean;
}

export function AdminProductsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [q, setQ] = useState('');
    const [materialFilter, setMaterialFilter] = useState<'ALL' | 'pvc' | 'metal'>('ALL');
    const [sort, setSort] = useState('featured');

    const [previewProduct, setPreviewProduct] = useState<AdminProductRow | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<AdminProductRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminProductRow | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [material, setMaterial] = useState<'pvc' | 'metal'>('pvc');
    const [finish, setFinish] = useState('solid-matte');
    const [colorName, setColorName] = useState('Black');
    const [color, setColor] = useState('#161616');
    const [basePrice, setBasePrice] = useState('1499');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [stockStatus, setStockStatus] = useState<'IN_STOCK' | 'OUT_OF_STOCK'>('IN_STOCK');
    const [isActive, setIsActive] = useState(true);

    const { data, isLoading, isError, error } = useQuery<{ items: AdminProductRow[]; total: number }>({
      queryKey: ['admin-products', q, materialFilter, sort],
      queryFn: () => {
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        if (materialFilter !== 'ALL') params.set('material', materialFilter);
        if (sort !== 'featured') params.set('sort', sort);
        return ApiClient.get(`/api/v1/admin/products?${params.toString()}`);
      },
    });

    const openCreateModal = () => {
      setEditingProduct(null);
      setName('');
      setMaterial('pvc');
      setFinish('solid-matte');
      setColorName('Black');
      setColor('#161616');
      setBasePrice('1499');
      setDescription('');
      setImageUrl('');
      setStockStatus('IN_STOCK');
      setIsActive(true);
      setEditModalOpen(true);
    };

    const openEditModal = (prod: AdminProductRow) => {
      setEditingProduct(prod);
      setName(prod.name);
      setMaterial((prod.material === 'metal' ? 'metal' : 'pvc') as 'pvc' | 'metal');
      setFinish(prod.finish || 'solid-matte');
      setColorName(prod.colorName || 'Black');
      setColor(prod.color || '#161616');
      setBasePrice(String(prod.basePrice || 1499));
      setDescription(prod.description || '');
      setImageUrl(prod.imageUrl || '');
      setStockStatus((prod.stockStatus === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : 'IN_STOCK'));
      setIsActive(Boolean(prod.isActive));
      setEditModalOpen(true);
    };

    const saveMutation = useMutation({
      mutationFn: () => {
        const payload = {
          name: name.trim(),
          material,
          finish: finish.trim() || 'solid-matte',
          colorName: colorName.trim(),
          color: color.trim(),
          basePrice: Number(basePrice),
          description: description.trim(),
          imageUrl: imageUrl.trim() || undefined,
          stockStatus,
          isActive,
        };
        if (editingProduct) {
          return ApiClient.patch(`/api/v1/admin/products/${editingProduct.id}`, payload);
        }
        return ApiClient.post('/api/v1/admin/products', payload);
      },
      onSuccess: () => {
        setErrorMsg(null);
        setEditModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      },
      onError: (err: Error) => setErrorMsg(err.message || 'Failed to save product.'),
    });

    const quickToggleMutation = useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
        ApiClient.patch(`/api/v1/admin/products/${id}`, patch),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      },
      onError: (err: Error) => setErrorMsg(err.message || 'Failed to update product.'),
    });

    const deleteMutation = useMutation({
      mutationFn: (id: string) => ApiClient.delete(`/api/v1/admin/products/${id}`),
      onSuccess: () => {
        setDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      },
      onError: (err: Error) => setErrorMsg(err.message || 'Failed to delete product.'),
    });

    const products = data?.items ?? [];

    return(
          <div className="w-full px-4 md:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
            <AdminPageHeader
              title="Products"
              subtitle="Manage the NFC Card Catalogue, pricing, finishes, stock, and shop visibility"
              action={
                <Button variant="accent" size="sm" onClick={openCreateModal} className="min-h-[44px] md:min-h-[36px]">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Product
                </Button>
              }
            />

            {errorMsg && (
              <div className="p-3 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button type="button" onClick={() => setErrorMsg(null)} className="font-semibold">
                  Dismiss
                </button>
              </div>
            )}

            {/* Search, Material Filter Pills & Sort */}
            <div className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-[var(--ink-subtle)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search products by name, color, or description..."
                    className="w-full min-h-[44px] md:min-h-[38px] pl-9 pr-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  {(['ALL', 'pvc', 'metal'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMaterialFilter(m)}
                      className={`min-h-[44px] md:min-h-[36px] px-3.5 py-1.5 rounded-[8px] text-xs font-semibold border transition-colors ${materialFilter === m
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-[var(--bg-surface)] text-[var(--ink)] border-[var(--border-strong)] hover:bg-[var(--bg-raised)]'
                        }`}
                    >
                      {m === 'ALL' ? 'All' : m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort products"
                className="min-h-[44px] md:min-h-[38px] px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>

            {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-72 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] animate-pulse"
            />
          ))}
        </div>
            ) : isError ? (
        <div className="p-4 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)]">
          {(error as Error)?.message || 'Failed to load products.'}
        </div>
            ) : products.length === 0 ? (
              <div className="p-10 text-center rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] space-y-4">
                <div className="w-14 h-14 rounded-full bg-[var(--accent-tint)] border border-[var(--accent-border)] flex items-center justify-center mx-auto text-[var(--accent-text)]">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-[var(--ink)]">No products found</h3>
                  <p className="text-xs text-[var(--ink-muted)] max-w-xs mx-auto">
                    Add your first NFC card product or adjust your search filters.
                  </p>
                </div>
                <Button variant="accent" size="sm" onClick={openCreateModal}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Product
                </Button>
              </div>
            ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((prod) => {
            const inStock = prod.stockStatus !== 'OUT_OF_STOCK';
            return (
              <div
                key={prod.id}
                className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden flex flex-col justify-between"
              >
                {/* Card Visual */}
                <div className="p-4 bg-[var(--bg-raised)] border-b border-[var(--border)] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-14 h-9 rounded-[6px] border border-[var(--border-strong)] shrink-0 shadow-xs"
                      style={{ backgroundColor: prod.color || '#161616' }}
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[var(--ink)] truncate">{prod.name}</h3>
                      <p className="text-[11px] text-[var(--ink-muted)] truncate">
                        {prod.material?.toUpperCase()} · {prod.finish || 'solid-matte'} · {prod.colorName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-[var(--ink)] tabular-nums">
                      ₹{Number(prod.basePrice || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Body & Quick Toggles */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-[var(--ink-muted)] line-clamp-2">{prod.description}</p>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--ink-muted)] font-medium">Stock Status</span>
                      <button
                        type="button"
                        onClick={() =>
                          quickToggleMutation.mutate({
                            id: prod.id,
                            patch: { stockStatus: inStock ? 'OUT_OF_STOCK' : 'IN_STOCK' },
                          })
                        }
                        className="min-h-[32px]"
                      >
                        <StatusBadge
                          status={inStock ? 'active' : 'failed'}
                          label={inStock ? 'In Stock' : 'Out of Stock'}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--ink-muted)] font-medium">Visible in shop</span>
                      <button
                        type="button"
                        onClick={() =>
                          quickToggleMutation.mutate({
                            id: prod.id,
                            patch: { isActive: !prod.isActive },
                          })
                        }
                        className="min-h-[32px]"
                      >
                        <StatusBadge
                          status={prod.isActive ? 'active' : 'inactive'}
                          label={prod.isActive ? 'Visible' : 'Hidden'}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 min-h-[44px] md:min-h-[34px]"
                      onClick={() => setPreviewProduct(prod)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View Details
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="min-h-[44px] md:min-h-[34px]"
                      onClick={() => openEditModal(prod)}
                      title="Edit product"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="min-h-[44px] md:min-h-[34px]"
                      onClick={() => setDeleteTarget(prod)}
                      title="Delete product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
            )}

            {/* View Details / Customize Preview Modal */}
            {previewProduct && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--ink)]">{previewProduct.name}</h3>
                    <button
                      type="button"
                      onClick={() => setPreviewProduct(null)}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[var(--ink-muted)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-5 space-y-4 text-xs">
                    <div
                      className="w-full h-40 rounded-[12px] border border-[var(--border)] flex items-center justify-center text-white font-bold text-sm shadow-inner"
                      style={{ backgroundColor: previewProduct.color || '#161616' }}
                    >
                      {previewProduct.name}
                    </div>
                    <p className="text-[var(--ink-muted)] leading-relaxed">{previewProduct.description}</p>
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-[10px] bg-[var(--bg-raised)] border border-[var(--border)]">
                      <div>
                        <span className="text-[var(--ink-muted)]">Material</span>
                        <div className="font-semibold text-[var(--ink)] uppercase">
                          {previewProduct.material}
                        </div>
                      </div>
                      <div>
                        <span className="text-[var(--ink-muted)]">Price</span>
                        <div className="font-semibold text-[var(--ink)]">
                          ₹{Number(previewProduct.basePrice).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2 pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const p = previewProduct;
                          setPreviewProduct(null);
                          openEditModal(p);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Edit Product
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => navigate(`/studio/${previewProduct.id}`)}
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        Customize
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add / Edit Product Modal */}
            {editModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                <div className="w-full max-w-lg rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--ink)]">
                      {editingProduct ? 'Edit Product' : 'Add Product'}
                    </h3>
                    <button type="button" onClick={() => setEditModalOpen(false)}>
                      <X className="w-4 h-4 text-[var(--ink-muted)]" />
                    </button>
                  </div>
                  <div className="p-5 space-y-3 text-xs overflow-y-auto">
                    <div>
                      <label className="block font-medium text-[var(--ink)] mb-1">Product Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Metal NFC Card — Matte Black"
                        className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-[var(--ink)] mb-1">Type</label>
                        <select
                          value={material}
                          onChange={(e) => setMaterial(e.target.value as 'pvc' | 'metal')}
                          className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                        >
                          <option value="pvc">PVC</option>
                          <option value="metal">Metal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-[var(--ink)] mb-1">Price (INR)</label>
                        <input
                          type="number"
                          value={basePrice}
                          onChange={(e) => setBasePrice(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-medium text-[var(--ink)] mb-1">Finish</label>
                        <input
                          type="text"
                          value={finish}
                          onChange={(e) => setFinish(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-[var(--ink)] mb-1">Colour Name</label>
                        <input
                          type="text"
                          value={colorName}
                          onChange={(e) => setColorName(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-[var(--ink)] mb-1">Colour Hex</label>
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-medium text-[var(--ink)] mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-[var(--ink)] mb-1">Image URL (optional)</label>
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="/products/metal-black.svg"
                        className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-[var(--ink)] mb-1">Stock Status</label>
                        <select
                          value={stockStatus}
                          onChange={(e) => setStockStatus(e.target.value as 'IN_STOCK' | 'OUT_OF_STOCK')}
                          className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                        >
                          <option value="IN_STOCK">In Stock</option>
                          <option value="OUT_OF_STOCK">Out of Stock</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-[var(--ink)] mb-1">Shop Visibility</label>
                        <select
                          value={isActive ? 'active' : 'hidden'}
                          onChange={(e) => setIsActive(e.target.value === 'active')}
                          className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                        >
                          <option value="active">Active (Visible)</option>
                          <option value="hidden">Hidden</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-3.5 border-t border-[var(--border)] flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="accent"
                      size="sm"
                      disabled={saveMutation.isPending || !name.trim() || !description.trim()}
                      onClick={() => saveMutation.mutate()}
                    >
                      {saveMutation.isPending ? 'Saving...' : 'Save Product'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteTarget && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-5 space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold text-[var(--ink)]">Delete Product?</h3>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(deleteTarget.id)}
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
}
