import { randomBytes } from 'node:crypto';
import { db } from '@/db';
import {
  campaignOrders,
  campaignPayments,
  campaignRefunds,
  campaignExpenses,
  campaignProducts,
} from '@/db/schema';
import { eq, sql, desc, and } from 'drizzle-orm';
import { INSTAGRAM_CAMPAIGN_CONFIG } from '../config';

export interface ExpenseRecordInput {
  category: string;
  amount: number;
  vendor: string;
  description: string;
  transactionReference?: string;
  receiptUrl?: string;
  isCogs?: boolean;
}

/**
 * Log an operational or manufacturing expense
 */
export async function recordExpense(input: ExpenseRecordInput, enteredByUserId: string) {
  const expenseId = `cexp_${Date.now()}_${randomBytes(4).toString('hex')}`;

  await db.insert(campaignExpenses).values({
    id: expenseId,
    campaignKey: INSTAGRAM_CAMPAIGN_CONFIG.key,
    category: input.category,
    amount: input.amount,
    vendor: input.vendor,
    description: input.description,
    transactionReference: input.transactionReference || null,
    receiptUrl: input.receiptUrl || null,
    isCogs: input.isCogs ?? true,
    enteredBy: enteredByUserId,
  });

  return { expenseId };
}

/**
 * List all recorded campaign expenses
 */
export async function listCampaignExpenses() {
  return await db
    .select()
    .from(campaignExpenses)
    .where(eq(campaignExpenses.campaignKey, INSTAGRAM_CAMPAIGN_CONFIG.key))
    .orderBy(desc(campaignExpenses.expenseDate));
}

/**
 * Authoritative Profit & Loss (P&L) and Cash Summary Report
 * Strict double-entry logic: distinguishes Gross Sales, Verified Cash Collected, Direct COGS, and Overheads.
 */
export async function getCampaignProfitAndLoss() {
  // 1. Gross sales & orders
  const orders = await db
    .select({
      totalAmount: campaignOrders.totalAmount,
      amountPaid: campaignOrders.amountPaid,
      quantity: campaignOrders.quantity,
      paymentStatus: campaignOrders.paymentStatus,
      orderStatus: campaignOrders.orderStatus,
      productId: campaignOrders.productId,
    })
    .from(campaignOrders)
    .where(eq(campaignOrders.campaignKey, INSTAGRAM_CAMPAIGN_CONFIG.key));

  const totalOrdersCount = orders.length;
  const grossSalesVolume = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const totalVerifiedCashReceived = orders.reduce((sum: number, o: any) => sum + (o.amountPaid || 0), 0);
  const outstandingReceivables = orders
    .filter((o: any) => o.orderStatus !== 'CANCELLED')
    .reduce((sum: number, o: any) => sum + Math.max(0, (o.totalAmount || 0) - (o.amountPaid || 0)), 0);

  // 2. Verified refunds
  const refunds = await db
    .select({ amount: campaignRefunds.amount })
    .from(campaignRefunds);

  const totalRefunds = refunds.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
  const netCashCollected = Math.max(0, totalVerifiedCashReceived - totalRefunds);

  // 3. Expenses
  const expenses = await db
    .select({
      amount: campaignExpenses.amount,
      isCogs: campaignExpenses.isCogs,
      category: campaignExpenses.category,
    })
    .from(campaignExpenses)
    .where(eq(campaignExpenses.campaignKey, INSTAGRAM_CAMPAIGN_CONFIG.key));

  const directCogsExpenses = expenses
    .filter((e: any) => e.isCogs)
    .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  const operatingOverheadExpenses = expenses
    .filter((e: any) => !e.isCogs)
    .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  const totalExpenses = directCogsExpenses + operatingOverheadExpenses;

  // 4. Theoretical COGS from physical products dispatched/produced
  const products = await db
    .select({
      id: campaignProducts.id,
      mfgCost: campaignProducts.manufacturingCost,
      pkgCost: campaignProducts.packagingCost,
    })
    .from(campaignProducts);

  const prodCostMap = new Map<string, number>(products.map((p: any) => [p.id as string, ((p.mfgCost || 0) + (p.pkgCost || 0)) as number]));
  const estimatedProductCostOfGoods = orders
    .filter((o: any) => o.orderStatus !== 'CANCELLED' && o.paymentStatus === 'PAID')
    .reduce((sum: number, o: any) => {
      const unitCost = Number(prodCostMap.get(o.productId) ?? 150);
      const qty = Number(o.quantity ?? 1);
      return sum + (unitCost * qty);
    }, 0);

  // Accounting P&L:
  // Revenue (Recognized on Paid Orders)
  const paidOrders = orders.filter((o: any) => o.paymentStatus === 'PAID');
  const recognizedRevenue = paidOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const grossProfit = recognizedRevenue - (directCogsExpenses > 0 ? directCogsExpenses : estimatedProductCostOfGoods);
  const netProfit = grossProfit - operatingOverheadExpenses;

  return {
    kpis: {
      totalOrders: totalOrdersCount,
      paidOrdersCount: paidOrders.length,
      grossSalesVolume,
      recognizedRevenue,
      totalVerifiedCashReceived,
      outstandingReceivables,
      totalRefunds,
      netCashCollected,
      totalExpenses,
      cogs: directCogsExpenses > 0 ? directCogsExpenses : estimatedProductCostOfGoods,
      operatingOverheads: operatingOverheadExpenses,
      grossProfit,
      netProfit,
    },
    expensesByCategory: (() => {
      const acc: Record<string, number> = {};
      for (const curr of expenses as any[]) {
        if (curr && curr.category) {
          acc[curr.category] = (acc[curr.category] || 0) + (curr.amount || 0);
        }
      }
      return acc;
    })(),
  };
}
