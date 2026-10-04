import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { retrieveOmiseCharge } from '@/lib/omise';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservation = await prisma.paymentReservation.findUnique({ where: { id } });

  if (!reservation) return Response.json({ error: 'ไม่พบรายการจอง' }, { status: 404 });
  let paymentStatus = reservation.status;
  if (reservation.status === 'pending' && reservation.createdAt.getTime() <= Date.now() - 24 * 60 * 60 * 1000) {
    await prisma.paymentReservation.update({ where: { id }, data: { status: 'expired' } });
    paymentStatus = 'expired';
  }

  // Local test mode cannot receive Omise webhooks unless the developer exposes a public tunnel.
  // Reconcile pending test charges directly; live charges are always finalized by the webhook.
  if (paymentStatus === 'pending' && reservation.omiseChargeId && process.env.OMISE_SECRET_KEY?.startsWith('skey_test_')) {
    try {
      const charge = await retrieveOmiseCharge(reservation.omiseChargeId);
      if (charge.amount !== reservation.amount || charge.currency !== 'THB') {
        return Response.json({ error: 'Charge does not match reservation' }, { status: 502 });
      }

      if (charge.status === 'successful' && charge.paid) {
        await prisma.$transaction(async (tx) => {
          await tx.paymentReservation.update({ where: { id: reservation.id }, data: { status: 'paid' } });
          await tx.authorizedPlate.upsert({
            where: { plateNumber: reservation.plateNumber },
            create: { plateNumber: reservation.plateNumber, ownerName: reservation.ownerName },
            update: {},
          });
        });
        paymentStatus = 'paid';
        revalidatePath('/');
      } else if (charge.status === 'failed' || charge.status === 'expired') {
        await prisma.paymentReservation.update({ where: { id }, data: { status: charge.status } });
        paymentStatus = charge.status;
      }
    } catch (error) {
      console.error('Could not reconcile test charge:', error);
      return Response.json({ error: 'Could not verify test charge' }, { status: 502 });
    }
  }

  return Response.json({ status: paymentStatus, plateNumber: reservation.plateNumber }, { headers: { 'Cache-Control': 'no-store' } });
}
