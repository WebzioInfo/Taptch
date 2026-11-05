import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { qrBatches, qrCodes } from '@/db/schema/qr';
import { getActorFromRequest } from '@/lib/auth/session';
import { generatePrintPdf, PrintLayoutType } from '@/modules/qr/print-engine';
import { apiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const layout = (searchParams.get('layout') || 'branded_sheet') as PrintLayoutType;

    const [batch] = await db.select().from(qrBatches).where(eq(qrBatches.id, id)).limit(1);
    if (!batch) {
      return apiError('NOT_FOUND', 'Batch not found.', 404);
    }

    const items = await db
      .select({
        token: qrCodes.token,
        serialNumber: qrCodes.serialNumber,
        label: qrCodes.label,
        sequenceNumber: qrCodes.batchSequence,
      })
      .from(qrCodes)
      .where(eq(qrCodes.batchId, id))
      .orderBy(qrCodes.batchSequence);

    const pdfBytes = await generatePrintPdf({
      layout,
      items: items.map((it: { token: string; serialNumber: string; label: string | null; sequenceNumber: number | null }) => ({
        token: it.token,
        serialNumber: it.serialNumber,
        label: it.label || undefined,
        sequenceNumber: it.sequenceNumber || undefined,
      })),
      companyName: batch.name,
      baseUrl: `${new URL(request.url).origin}/dq`,
    });

    const filename = `${batch.batchCode}-${layout}.pdf`;
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to generate PDF print sheet.', 500);
  }
}
