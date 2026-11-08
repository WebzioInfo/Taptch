'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  CreditCard,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle,
  FileText,
  FileCheck2,
  Truck,
  RotateCcw,
  Loader2,
  RefreshCw,
  Plus,
  ArrowRight,
  Eye,
  Sliders,
} from 'lucide-react';

export default function CampaignAdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'finance' | 'expenses'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [finance, setFinance] = useState<any | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected Order for detail & verification modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verifying, setVerifying] = useState(false);

  // New Expense dialog states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState('CHIP_PURCHASE');
  const [expAmount, setExpAmount] = useState('');
  const [expVendor, setExpVendor] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, finRes, expRes] = await Promise.all([
        fetch('/api/v1/campaigns/instagram-card/admin?view=orders').then((r) => r.json()),
        fetch('/api/v1/campaigns/instagram-card/admin?view=finance').then((r) => r.json()),
        fetch('/api/v1/campaigns/instagram-card/admin?view=expenses').then((r) => r.json()),
      ]);

      if (ordersRes.success) setOrders(ordersRes.data);
      if (finRes.success) setFinance(finRes.data);
      if (expRes.success) setExpenses(expRes.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyOrderPayment = async (order: any) => {
    setVerifying(true);
    try {
      // Find latest unverified payment or create verified placeholder
      const res = await fetch('/api/v1/campaigns/instagram-card/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_PAYMENT',
          paymentId: `cpay_mock_${order.id}`, // verified handler
          verifiedByUserId: 'ADMIN',
          notes: verificationNotes || 'Verified by Store Manager',
        }),
      });
      await loadData();
      setSelectedOrder(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || !expVendor) return;

    try {
      await fetch('/api/v1/campaigns/instagram-card/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_EXPENSE',
          category: expCategory,
          amount: Number(expAmount),
          vendor: expVendor,
          description: expDesc,
          isCogs: ['CHIP_PURCHASE', 'CARD_MANUFACTURING', 'PRINTING', 'PACKAGING'].includes(expCategory),
        }),
      });

      setShowExpenseModal(false);
      setExpAmount('');
      setExpVendor('');
      setExpDesc('');
      await loadData();
    } catch (err) {
      console.error('Failed to record expense', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased p-6 space-y-6 max-w-6xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Campaign Admin</span>
            <span className="text-slate-300">/</span>
            <h1 className="text-xl font-bold text-slate-950">Instagram Card Commerce Cockpit</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage orders, offline payments, barcode packing, expenses & P&L
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            className="h-8 text-xs border-slate-300 text-slate-700 gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setShowExpenseModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Financial KPI Metrics */}
      {finance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Orders</span>
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{finance.kpis.totalOrders}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {finance.kpis.paidOrdersCount} verified paid
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Gross Sales</span>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">₹{finance.kpis.grossSalesVolume}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              ₹{finance.kpis.recognizedRevenue} recognized
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Cash Collected</span>
              <CreditCard className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-2">₹{finance.kpis.netCashCollected}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              ₹{finance.kpis.outstandingReceivables} pending
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Estimated Net Profit</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700 mt-2">₹{finance.kpis.netProfit}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              After ₹{finance.kpis.totalExpenses} expenses
            </div>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex rounded-md border border-slate-200 bg-white p-1 text-xs w-fit">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-1.5 rounded-sm font-semibold transition-colors ${activeTab === 'orders' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`px-4 py-1.5 rounded-sm font-semibold transition-colors ${activeTab === 'finance' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          Profit & Loss Summary
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-1.5 rounded-sm font-semibold transition-colors ${activeTab === 'expenses' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          Expense Ledger ({expenses.length})
        </button>
      </div>

      {/* 4. Tab 1: Orders Table */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order no, customer, phone..."
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Order No / Barcode</th>
                  <th className="py-2.5 px-3">Customer & IG</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Total / Paid</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Design</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-mono">
                      <div className="font-bold text-slate-900">{ord.orderNumber}</div>
                      <div className="text-[10px] text-slate-400">{ord.barcode}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{ord.customerName}</div>
                      <div className="text-blue-600 text-[11px]">@{ord.instagramUsername}</div>
                      <div className="text-slate-400 text-[10px]">{ord.customerPhone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div>{ord.productName}</div>
                      <span className="text-[10px] text-slate-400">{ord.material} (x{ord.quantity})</span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <div className="font-bold text-slate-900">₹{ord.totalAmount}</div>
                      <div className="text-[11px] text-emerald-600">Paid: ₹{ord.amountPaid}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${ord.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : ord.paymentStatus === 'PAYMENT_REPORTED'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {ord.designStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <a
                        href={`/api/v1/campaigns/instagram-card/documents?orderId=${ord.id}&type=invoice`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-slate-700">
                          Invoice
                        </Button>
                      </a>
                      <a
                        href={`/api/v1/campaigns/instagram-card/documents?orderId=${ord.id}&type=packing_slip`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-slate-700">
                          Slip
                        </Button>
                      </a>
                      {ord.paymentStatus !== 'PAID' && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedOrder(ord)}
                          className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          Verify
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Profit & Loss Statement */}
      {activeTab === 'finance' && finance && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Income Statement (Profit & Loss) — Instagram NFC Campaign
          </h2>

          <div className="space-y-4 max-w-xl text-xs">
            <div className="flex justify-between font-semibold text-slate-800 text-sm pb-1 border-b border-slate-100">
              <span>Operating Revenue (Recognized on Paid Orders)</span>
              <span>₹{finance.kpis.recognizedRevenue}</span>
            </div>

            <div className="flex justify-between text-slate-600 pl-4">
              <span>Cost of Goods Sold (Card Chips, Materials & Packaging)</span>
              <span>-₹{finance.kpis.cogs}</span>
            </div>

            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2">
              <span>Gross Profit</span>
              <span>₹{finance.kpis.grossProfit}</span>
            </div>

            <div className="flex justify-between text-slate-600 pl-4">
              <span>Operating & Marketing Overheads</span>
              <span>-₹{finance.kpis.operatingOverheads}</span>
            </div>

            <div className="flex justify-between font-semibold font-mono text-blue-700 text-base border-t border-slate-200 pt-3">
              <span>Net Profit (Pre-tax)</span>
              <span>₹{finance.kpis.netProfit}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Expenses Ledger */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900">Recorded Expenses</h2>
            <Button
              size="sm"
              onClick={() => setShowExpenseModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
            >
              Log Expense
            </Button>
          </div>

          <table className="w-full text-left text-xs divide-y divide-slate-100">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Vendor & Description</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="py-2.5 px-3 text-slate-500">
                    {new Date(exp.expenseDate).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{exp.category}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-900">{exp.vendor}</div>
                    <div className="text-[11px] text-slate-400">{exp.description}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {exp.isCogs ? 'COGS' : 'Overhead'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{exp.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 7. Manual Payment Verification Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Verify Offline Settlement for #{selectedOrder.orderNumber}
            </h3>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div>Customer: <span className="font-bold">{selectedOrder.customerName}</span></div>
              <div>Instagram: <span className="font-semibold text-blue-600">@{selectedOrder.instagramUsername}</span></div>
              <div>Order Amount Due: <span className="font-bold text-blue-600">₹{selectedOrder.totalAmount}</span></div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Verification Notes / UTR Ref</label>
              <Input
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="e.g. Verified in HDFC bank statement UTR-123456"
                className="h-8 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="h-8 text-xs border-slate-300 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={verifying}
                onClick={() => handleVerifyOrderPayment(selectedOrder)}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm Payment (Mark PAID)'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <form onSubmit={handleAddExpense} className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Log Operational Expense</h3>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full h-8 rounded border border-slate-200 text-xs px-2"
                >
                  <option value="CHIP_PURCHASE">NFC Chip Purchase</option>
                  <option value="CARD_MANUFACTURING">Card Manufacturing / PVC Core</option>
                  <option value="PRINTING">UV Printing / Inks</option>
                  <option value="PACKAGING">Packaging & Sleeves</option>
                  <option value="COURIER">Courier Shipping Expense</option>
                  <option value="MARKETING_ADS">Instagram Ads & Promotions</option>
                  <option value="MISCELLANEOUS">Miscellaneous Expense</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount (INR) *</label>
                <Input
                  type="number"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Vendor / Supplier *</label>
                <Input
                  type="text"
                  required
                  value={expVendor}
                  onChange={(e) => setExpVendor(e.target.value)}
                  placeholder="e.g. SmartTag Manufacturer Ltd"
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <Input
                  type="text"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Details of batch or goods purchased"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowExpenseModal(false)}
                className="h-8 text-xs border-slate-300 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Save Expense
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

