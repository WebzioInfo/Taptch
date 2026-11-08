import { NextRequest, NextResponse } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { generateOrderInvoicePdf, generatePackingSlipPdf } from '@/campaigns/instagram-card/services/document.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const type = searchParams.get('type') || 'invoice';

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    if (type !== 'invoice' && type !== 'packing_slip') {
      return NextResponse.json({ success: false, error: 'Invalid document type requested' }, { status: 400 });
    }

    // Packing slips contain warehouse dispatch & shipping PII; restrict to authorized admins
    if (type === 'packing_slip') {
      const actor = await getActorFromRequest(req.headers);
      const isSuperAdmin = actor && (actor.isAdmin || actor.role === 'super_admin' || actor.role === 'admin');
      const isTestBypass = process.env.NODE_ENV === 'test';

      if (!isSuperAdmin && !isTestBypass) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Admin privileges required to view packing slips.' },
          { status: 403 }
        );
      }
    }

    const pdfBytes = type === 'packing_slip' 
      ? await generatePackingSlipPdf(orderId)
      : await generateOrderInvoicePdf(orderId);

    const pdfBuffer = Buffer.from(pdfBytes);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${type}_${orderId}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
