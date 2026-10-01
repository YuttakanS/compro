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
  async function registerPlate(formData: FormData) {
    'use server';
    const plateNumber = formData.get('plateNumber') as string;
    const ownerName = formData.get('ownerName') as string;
    if (!plateNumber || !ownerName) return;

    try {
      const cleanPlate = plateNumber.replace(/\s+/g, '');
      await prisma.authorizedPlate.create({
        data: { plateNumber: cleanPlate, ownerName: ownerName },
      });
      // รีเฟรชข้อมูลให้ตารางด้านล่างอัปเดตทันที
      revalidatePath('/'); 
    } catch (error) {
      console.error("Database Error:", error);
    }
  }

  // เรียกใช้หน้าตา UI ที่เราแยกไฟล์ไว้
  return <PaymentUI plates={plates} registerPlateAction={registerPlate} />;
}