import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import PaymentUI from './PaymentUI';

const prisma = new PrismaClient();

export default async function Home() {
  // ดึงข้อมูลรถที่ลงทะเบียน 5 คันล่าสุด
  const plates = await prisma.authorizedPlate.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5 
  });

  // Server Action สำหรับบันทึกข้อมูล
  async function registerPlateAction(formData: FormData) {
    'use server';
    const plateNumber = String(formData.get('plateNumber') ?? '').replace(/\s+/g, '').toLocaleUpperCase();
    const ownerName = String(formData.get('ownerName') ?? '').trim();
    if (!plateNumber || !ownerName) {
      return { ok: false, message: 'กรุณากรอกเลขทะเบียนและชื่อผู้จองให้ครบ' };
    }

    try {
      await prisma.authorizedPlate.create({
        data: { plateNumber, ownerName },
      });
      revalidatePath('/');
      return { ok: true, message: 'บันทึกการจองและทะเบียนรถเรียบร้อยแล้ว' };
    } catch (error) {
      console.error("Database Error:", error);
      return { ok: false, message: 'บันทึกไม่สำเร็จ อาจมีทะเบียนนี้ในระบบแล้ว กรุณาตรวจสอบและลองอีกครั้ง' };
    }
  }

  // เรียกใช้หน้าตา UI ที่เราแยกไฟล์ไว้
  return <PaymentUI plates={plates} registerPlateAction={registerPlateAction} />;
}
