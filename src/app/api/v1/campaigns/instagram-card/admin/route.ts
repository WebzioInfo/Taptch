import { NextRequest, NextResponse } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import {
  listCampaignOrders,
  getCampaignOrder,
} from '@/campaigns/instagram-card/services/order.service';
import {
  verifyOfflinePayment,
  processRefund,
} from '@/campaigns/instagram-card/services/payment.service';
import {
  approveOrderDesign,
  assignDesignerToOrder,
} from '@/campaigns/instagram-card/services/designer.service';
import {
  getCampaignProfitAndLoss,
  recordExpense,
  listCampaignExpenses,
} from '@/campaigns/instagram-card/services/finance.service';

/**
 * Validates administrative privileges before permitting access to financial or customer PII records
 */
async function authorizeAdmin(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key');
  if (adminKey && process.env.ADMIN_API_KEY && adminKey === process.env.ADMIN_API_KEY) {
    return { userId: 'API_ADMIN', role: 'super_admin', isAdmin: true };
  }

  const actor = await getActorFromRequest(req.headers);
  if (actor && (actor.isAdmin || actor.role === 'super_admin' || actor.role === 'admin')) {
    return actor;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await authorizeAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'orders';

    if (view === 'finance') {
      const pnl = await getCampaignProfitAndLoss();
      return NextResponse.json({ success: true, data: pnl });
    }

    if (view === 'expenses') {
      const expenses = await listCampaignExpenses();
      return NextResponse.json({ success: true, data: expenses });
    }

    const orders = await listCampaignOrders({
      paymentStatus: searchParams.get('paymentStatus') || undefined,
      shippingStatus: searchParams.get('shippingStatus') || undefined,
      designStatus: searchParams.get('designStatus') || undefined,
      search: searchParams.get('search') || undefined,
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await authorizeAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator access required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'VERIFY_PAYMENT') {
      const { paymentId, verifiedByUserId, notes } = body;
      await verifyOfflinePayment(paymentId, verifiedByUserId || 'ADMIN', notes);
      return NextResponse.json({ success: true, message: 'Payment verified successfully' });
    }

    if (action === 'RECORD_REFUND') {
      const { orderId, amount, reason, refundMethod, transactionReference, authorizedByUserId } = body;
      const res = await processRefund(orderId, Number(amount), reason, refundMethod, transactionReference, authorizedByUserId || 'ADMIN');
      return NextResponse.json({ success: true, data: res });
    }

    if (action === 'APPROVE_DESIGN') {
      const { orderId, approvedByUserId, printArtworkUrl } = body;
      await approveOrderDesign(orderId, approvedByUserId || 'ADMIN', printArtworkUrl);
      return NextResponse.json({ success: true, message: 'Design approved for production' });
    }

    if (action === 'ASSIGN_DESIGNER') {
      const { orderId, designerUserId } = body;
      await assignDesignerToOrder(orderId, designerUserId);
      return NextResponse.json({ success: true, message: 'Designer assigned' });
    }

    if (action === 'RECORD_EXPENSE') {
      const { category, amount, vendor, description, isCogs, enteredByUserId } = body;
      const res = await recordExpense({
        category,
        amount: Number(amount),
        vendor,
        description,
        isCogs: Boolean(isCogs),
      }, enteredByUserId || 'ADMIN');
      return NextResponse.json({ success: true, data: res });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

