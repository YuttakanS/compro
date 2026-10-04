import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { retrieveOmiseCharge } from '@/lib/omise';

export async function POST(request: Request) {
  let event: { key?: string; data?: { id?: string } };
  try {
    event = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (event.key !== 'charge.complete' || !event.data?.id) {
    return Response.json({ received: true });
  }

  try {
    // Trust the charge only after retrieving it directly from Omise.
    const charge = await retrieveOmiseCharge(event.data.id);
    const reservation = await prisma.paymentReservation.findFirst({
      where: {
        OR: [
          { omiseChargeId: charge.id },
          ...(charge.metadata?.reservation_id ? [{ id: charge.metadata.reservation_id }] : []),
        ],
      },
    });
    if (!reservation) return Response.json({ received: true });

    if (charge.amount !== reservation.amount || charge.currency !== 'THB') {
      console.error('Omise charge does not match reservation', charge.id);
      return Response.json({ error: 'Charge does not match reservation' }, { status: 400 });
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
      revalidatePath('/');
    } else if (charge.status === 'failed' || charge.status === 'expired') {
      await prisma.paymentReservation.update({ where: { id: reservation.id }, data: { status: charge.status } });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Omise webhook processing failed:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
