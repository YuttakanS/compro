import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

// --- Server Action 1: ฟังก์ชันสำหรับล้างข้อมูลประวัติ Logs ---
async function clearAllLogs() {
  'use server';
  try {
    await prisma.accessLog.deleteMany({});
    const capturesDir = path.join(process.cwd(), 'public', 'captures');
    if (fs.existsSync(capturesDir)) {
      const files = fs.readdirSync(capturesDir);
      for (const file of files) {
        if (file.endsWith('.jpg')) {
          fs.unlinkSync(path.join(capturesDir, file));
        }
      }
    }
    revalidatePath('/admin');
  } catch (error) {
    console.error("Clear Logs Error:", error);
  }
}

// --- Server Action 2: ฟังก์ชันลบสิทธิ์ (ดึงสิทธิ์มาให้เฉพาะ Admin) ---
async function deletePlate(formData: FormData) {
  'use server';
  const id = Number(formData.get('id')); 
  if (!id) return;
  try {
    await prisma.authorizedPlate.delete({ where: { id: id } });
    revalidatePath('/admin'); // รีเฟรชหน้า Admin
    revalidatePath('/');      // รีเฟรชหน้า User
  } catch (error) {
    console.error("Delete Error:", error);
  }
}

export default async function AdminDashboard({ searchParams }: any) {
  const params = await searchParams;
  const filter = params?.filter;

  // ดึงประวัติเข้า-ออก (Logs)
  const allLogs = await prisma.accessLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50, 
  });
  const displayLogs = filter ? allLogs.filter(log => log.status === filter) : allLogs;

  // ดึงข้อมูลรถที่ลงทะเบียนทั้งหมด (สำหรับลบสิทธิ์)
  const plates = await prisma.authorizedPlate.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-200">
      <main className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                ADMIN CONSOLE
              </span>
              <span className="text-xs text-slate-500">• Live Security & RBAC Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Dashboard ผู้ดูแลระบบ
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <form action={clearAllLogs}>
              <button type="submit" className="text-xs sm:text-sm bg-red-900/30 hover:bg-red-800/80 text-red-400 hover:text-white px-4 py-2 rounded-lg border border-red-800/50 transition flex items-center gap-1.5 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                ล้าง Logs
              </button>
            </form>
            <Link href="/" className="text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-slate-700 transition flex items-center gap-1.5">
              ← หน้าลงทะเบียน
            </Link>
          </div>
        </div>

        {/* --- โซนที่ 1: ประวัติการตรวจจับเข้า-ออก --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/50">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              ประวัติภาพถ่ายเข้า-ออก (Access Logs)
            </h2>
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1 w-full sm:w-auto">
              <a href="/admin" className={`flex-1 sm:flex-none text-center px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition ${!filter ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}>
                ทั้งหมด ({allLogs.length})
              </a>
              <a href="/admin?filter=AUTHORIZED" className={`flex-1 sm:flex-none text-center px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition ${filter === 'AUTHORIZED' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800/50 shadow' : 'text-emerald-500/50 hover:text-emerald-400 hover:bg-slate-900'}`}>
                ผ่านการตรวจ
              </a>
              <a href="/admin?filter=DENIED" className={`flex-1 sm:flex-none text-center px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition ${filter === 'DENIED' ? 'bg-red-900/50 text-red-400 border border-red-800/50 shadow' : 'text-red-500/50 hover:text-red-400 hover:bg-slate-900'}`}>
                ปฏิเสธสิทธิ์
              </a>
            </div>
          </div>
          <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
            {displayLogs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-800/40 transition">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative w-24 h-16 sm:w-32 sm:h-20 bg-slate-950 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
                    <img src={log.imagePath} alt="Plate" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="border border-slate-600 rounded px-2.5 py-1 bg-slate-950 font-bold text-sm text-white">{log.plateNumber}</span>
                      {log.status === 'AUTHORIZED' ? (
                        <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 text-xs rounded-md">✓ ผ่าน</span>
                      ) : (
                        <span className="bg-red-950/60 text-red-400 border border-red-800/80 px-2 py-0.5 text-xs rounded-md">✕ ปฏิเสธ</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">เวลา: {new Date(log.createdAt).toLocaleString('th-TH')}</div>
                  </div>
                </div>
              </div>
            ))}
            {displayLogs.length === 0 && <div className="text-center py-12 text-slate-500">ไม่มีข้อมูลในหมวดหมู่นี้</div>}
          </div>
        </div>

        {/* --- โซนที่ 2: ระบบจัดการสิทธิ์ฐานข้อมูลรถ (Plate Management) --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              จัดการสิทธิ์ยานพาหนะในระบบ (Plate Management)
            </h2>
            <span className="bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 text-xs font-bold px-3 py-1 rounded-full">
              ลงทะเบียนไว้ {plates.length} คัน
            </span>
          </div>
          
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plates.map((plate) => (
              <div key={plate.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-700 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="inline-block border border-slate-600 rounded-md px-3 py-1 bg-slate-900 shadow-sm mb-1.5">
                      <span className="text-sm font-bold text-white tracking-wide">{plate.plateNumber}</span>
                    </div>
                    <div className="text-sm text-slate-300 font-medium">{plate.ownerName}</div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded text-[10px] font-medium bg-emerald-900/20 text-emerald-400 border border-emerald-800/50">
                    Authorized
                  </span>
                </div>
                
                {/* ปุ่มลบสิทธิ์ที่ย้ายมาอยู่ที่หน้า Admin เท่านั้น */}
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-500">ID: #{plate.id}</span>
                  <form action={deletePlate}>
                    <input type="hidden" name="id" value={plate.id} />
                    <button type="submit" className="text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 px-3 py-1.5 rounded-md transition-colors text-xs font-semibold flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      เพิกถอนสิทธิ์
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {plates.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                ยังไม่มีรถลงทะเบียนในระบบ
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}