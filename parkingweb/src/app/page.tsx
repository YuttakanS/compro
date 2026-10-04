import { prisma } from '@/lib/db';
import { createPromptPayCharge } from '@/lib/omise';
import PaymentUI from './PaymentUI';

const MONTHLY_FEE_SATANG = 30_000;

export default async function Home() {
  // ดึงข้อมูลรถที่ลงทะเบียน 5 คันล่าสุด
  const [plates, latestPending] = await Promise.all([
    prisma.authorizedPlate.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.paymentReservation.findFirst({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, qrImageUrl: true },
    }),
  ]);

  // Create a pending reservation and its PromptPay charge. Registration is granted by the webhook.
  async function createReservationAction(formData: FormData) {
    'use server';
    const plateNumber = String(formData.get('plateNumber') ?? '').replace(/\s+/g, '').toLocaleUpperCase();
    const ownerName = String(formData.get('ownerName') ?? '').trim();
    if (!plateNumber || !ownerName) {
      return { ok: false, message: 'กรุณากรอกเลขทะเบียนและชื่อผู้จองให้ครบ' };
    }

    if (!process.env.OMISE_SECRET_KEY) {
      return { ok: false, message: 'ยังไม่ได้ตั้งค่า Omise test key ในไฟล์ .env.local' };
    }

    try {
      const existingPlate = await prisma.authorizedPlate.findUnique({ where: { plateNumber } });
      if (existingPlate) return { ok: false, message: 'ทะเบียนนี้ลงทะเบียนแล้ว' };

      const pending = await prisma.paymentReservation.findFirst({
        where: {
          plateNumber,
          status: 'pending',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (pending) return { ok: false, message: 'ทะเบียนนี้มีรายการรอชำระอยู่แล้ว กรุณาชำระ QR เดิมก่อน' };

      const reservation = await prisma.paymentReservation.create({
        data: { plateNumber, ownerName, amount: MONTHLY_FEE_SATANG },
      });

      try {
        const charge = await createPromptPayCharge(MONTHLY_FEE_SATANG, reservation.id);
        const qrImageUrl = charge.source?.scannable_code?.image?.download_uri;
        if (!charge.id || !qrImageUrl) throw new Error('Omise did not return a PromptPay QR code');

        await prisma.paymentReservation.update({
          where: { id: reservation.id },
          data: { omiseChargeId: charge.id, qrImageUrl },
        });

        return { ok: true, reservationId: reservation.id, qrImageUrl, message: 'สแกน QR เพื่อชำระเงิน แล้วรอระบบยืนยันรายการ' };
      } catch (error) {
        await prisma.paymentReservation.update({ where: { id: reservation.id }, data: { status: 'failed' } });
        throw error;
      }
    } catch (error) {
      console.error('Reservation/payment error:', error);
      return { ok: false, message: 'สร้างรายการชำระเงินไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า Omise แล้วลองอีกครั้ง' };
    }
  }

  // เรียกใช้หน้าตา UI ที่เราแยกไฟล์ไว้
  return <PaymentUI plates={plates} initialPending={latestPending} createReservationAction={createReservationAction} />;
}
