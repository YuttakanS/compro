import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

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
    console.error('Clear Logs Error:', error);
  }
}

async function deletePlate(formData: FormData) {
  'use server';
  const id = Number(formData.get('id'));
  if (!id) return;
  try {
    await prisma.authorizedPlate.delete({ where: { id } });
    revalidatePath('/admin');
    revalidatePath('/');
  } catch (error) {
    console.error('Delete Error:', error);
  }
}

export default async function AdminDashboard({ searchParams }: any) {
  const params = await searchParams;
  const filter = params?.filter;

  const allLogs = await prisma.accessLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const displayLogs = filter ? allLogs.filter((log) => log.status === filter) : allLogs;
  const authorizedCount = allLogs.filter((log) => log.status === 'AUTHORIZED').length;
  const deniedCount = allLogs.filter((log) => log.status === 'DENIED').length;

  const plates = await prisma.authorizedPlate.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const filterClass = (active: boolean, tone: 'neutral' | 'green' | 'rose') => {
    const selected = {
      neutral: 'border-white/15 bg-white/15 text-white shadow-sm',
      green: 'border-emerald-200/20 bg-emerald-200/10 text-emerald-100 shadow-sm',
      rose: 'border-rose-200/20 bg-rose-200/10 text-rose-100 shadow-sm',
    }[tone];
    const idle = {
      neutral: 'text-white/55 hover:bg-white/[0.07] hover:text-white',
      green: 'text-emerald-100/55 hover:bg-white/[0.07] hover:text-emerald-100',
      rose: 'text-rose-100/55 hover:bg-white/[0.07] hover:text-rose-100',
    }[tone];
    return `rounded-xl border px-3 py-2 text-center text-xs font-medium transition sm:px-4 sm:text-sm ${active ? selected : `border-transparent ${idle}`}`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#171d18] px-4 py-7 font-sans text-[#f8f5ec] sm:px-6 sm:py-10 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-36 h-[34rem] w-[34rem] rounded-full bg-amber-700/20 blur-[130px]" />
        <div className="absolute -right-36 top-[18%] h-[32rem] w-[32rem] rounded-full bg-emerald-500/15 blur-[140px]" />
        <div className="absolute -bottom-48 left-[35%] h-[30rem] w-[30rem] rounded-full bg-rose-400/10 blur-[130px]" />
      </div>

      <main className="relative mx-auto max-w-6xl space-y-7 sm:space-y-9">
        <header className="flex flex-col justify-between gap-5 rounded-[1.75rem] border border-white/[0.13] bg-white/[0.07] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl sm:flex-row sm:items-center sm:rounded-[2rem] sm:p-7">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/70">
              <span className="h-px w-6 bg-amber-100/50" /> Parkside · Operations
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">ภาพรวมลานจอดรถ</h1>
            <p className="mt-2 text-sm text-white/50">ตรวจสอบการเข้าใช้งานและจัดการสิทธิ์รถที่ลงทะเบียน</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <form action={clearAllLogs}>
              <button
                type="submit"
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200/20 bg-rose-200/[0.07] px-4 text-sm font-medium text-rose-100/85 transition hover:border-rose-200/35 hover:bg-rose-200/[0.13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200 sm:w-auto"
              >
                <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M19 7l-.9 12a2 2 0 01-2 1.8H7.9a2 2 0 01-2-1.8L5 7m5 4v6m4-6v6M4 7h16m-5 0V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3" /></svg>
                ล้างประวัติ
              </button>
            </form>
            <Link
              href="/"
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
            >
              <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M15 18l-6-6 6-6M9 12h12" /></svg>
              หน้าลงทะเบียน
            </Link>
          </div>
        </header>

        <section aria-label="สรุปสถานะ" className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-3xl border border-white/[0.12] bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
            <p className="text-sm text-white/50">รถที่มีสิทธิ์</p>
            <p className="mt-3 flex items-baseline gap-2"><span className="text-3xl font-semibold tabular-nums text-white">{plates.length}</span><span className="text-sm text-white/45">ทะเบียน</span></p>
          </div>
          <div className="rounded-3xl border border-emerald-200/15 bg-emerald-200/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-6">
            <p className="text-sm text-emerald-100/60">อนุญาต · 50 รายการล่าสุด</p>
            <p className="mt-3 flex items-baseline gap-2"><span className="text-3xl font-semibold tabular-nums text-emerald-100">{authorizedCount}</span><span className="text-sm text-emerald-100/45">ครั้ง</span></p>
          </div>
          <div className="rounded-3xl border border-rose-200/15 bg-rose-200/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-6">
            <p className="text-sm text-rose-100/60">ปฏิเสธ · 50 รายการล่าสุด</p>
            <p className="mt-3 flex items-baseline gap-2"><span className="text-3xl font-semibold tabular-nums text-rose-100">{deniedCount}</span><span className="text-sm text-rose-100/45">ครั้ง</span></p>
          </div>
        </section>

        <section aria-labelledby="logs-heading" className="overflow-hidden rounded-[1.75rem] border border-white/[0.13] bg-white/[0.07] shadow-[0_20px_60px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl sm:rounded-[2rem]">
          <div className="border-b border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-100/55">Recent activity</p>
                <h2 id="logs-heading" className="mt-2 text-xl font-semibold text-white">ประวัติการเข้าใช้งาน</h2>
                <p className="mt-1 text-sm text-white/45">แสดงรายการล่าสุดไม่เกิน 50 รายการ</p>
              </div>

              <nav aria-label="กรองประวัติการเข้าใช้งาน" className="grid grid-cols-3 rounded-2xl border border-white/10 bg-[#111713]/40 p-1">
                <Link href="/admin" aria-current={!filter ? 'page' : undefined} className={filterClass(!filter, 'neutral')}>ทั้งหมด <span className="ml-1 tabular-nums">{allLogs.length}</span></Link>
                <Link href="/admin?filter=AUTHORIZED" aria-current={filter === 'AUTHORIZED' ? 'page' : undefined} className={filterClass(filter === 'AUTHORIZED', 'green')}>อนุญาต</Link>
                <Link href="/admin?filter=DENIED" aria-current={filter === 'DENIED' ? 'page' : undefined} className={filterClass(filter === 'DENIED', 'rose')}>ปฏิเสธ</Link>
              </nav>
            </div>
          </div>

          {displayLogs.length > 0 ? (
            <ul className="max-h-[560px] divide-y divide-white/[0.08] overflow-y-auto">
              {displayLogs.map((log) => {
                const authorized = log.status === 'AUTHORIZED';
                return (
                  <li key={log.id} className="flex flex-col gap-4 p-4 transition hover:bg-white/[0.035] sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="relative h-[4.5rem] w-28 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-[#111713]/60 sm:h-20 sm:w-32">
                        <img src={log.imagePath} alt={`ภาพทะเบียน ${log.plateNumber}`} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg border border-white/15 bg-white/[0.07] px-2.5 py-1 font-mono text-sm font-semibold tracking-wide text-white">{log.plateNumber}</span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${authorized ? 'border-emerald-200/20 bg-emerald-200/[0.08] text-emerald-100' : 'border-rose-200/20 bg-rose-200/[0.08] text-rose-100'}`}>
                            <span className={`size-1.5 rounded-full ${authorized ? 'bg-emerald-200' : 'bg-rose-200'}`} />
                            {authorized ? 'อนุญาตให้เข้า' : 'ปฏิเสธการเข้า'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
                          {log.ownerName && <span>{log.ownerName}</span>}
                          <time dateTime={new Date(log.createdAt).toISOString()}>{new Date(log.createdAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</time>
                        </div>
                      </div>
                    </div>
                    <span className="self-end text-[11px] text-white/30 sm:self-center">Log #{log.id}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-5 py-14 text-center sm:py-16">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/45">
                <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12s3.3-7 9-7 9 7 9 7-3.3 7-9 7-9-7-9-7Z" /><circle cx="12" cy="12" r="2.5" strokeWidth="1.5" /></svg>
              </span>
              <p className="mt-4 font-medium text-white/75">ยังไม่มีประวัติในหมวดนี้</p>
              <p className="mt-1 text-sm text-white/40">เมื่อระบบตรวจพบรถ รายการจะปรากฏที่นี่</p>
            </div>
          )}
        </section>

        <section aria-labelledby="plates-heading" className="overflow-hidden rounded-[1.75rem] border border-white/[0.13] bg-white/[0.07] shadow-[0_20px_60px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl sm:rounded-[2rem]">
          <div className="flex flex-col justify-between gap-3 border-b border-white/10 bg-white/[0.025] p-5 sm:flex-row sm:items-center sm:p-7">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-100/55">Access management</p>
              <h2 id="plates-heading" className="mt-2 text-xl font-semibold text-white">ทะเบียนที่ได้รับอนุญาต</h2>
              <p className="mt-1 text-sm text-white/45">เพิกถอนสิทธิ์ได้เมื่อรถไม่ควรเข้าใช้งานแล้ว</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-200/[0.06] px-3.5 py-2 text-sm text-emerald-100/80">
              <span className="size-1.5 rounded-full bg-emerald-200/80" /> {plates.length} ทะเบียน
            </span>
          </div>

          {plates.length > 0 ? (
            <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
              {plates.map((plate) => (
                <li key={plate.id} className="flex min-h-40 flex-col justify-between rounded-2xl border border-white/[0.10] bg-[#111713]/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-white/20 hover:bg-white/[0.055]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-block max-w-full truncate rounded-lg border border-white/15 bg-white/[0.07] px-3 py-1.5 font-mono text-sm font-semibold tracking-wide text-white">{plate.plateNumber}</span>
                      <p className="mt-2 truncate text-sm font-medium text-white/75">{plate.ownerName}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-emerald-200/15 bg-emerald-200/[0.07] px-2.5 py-1 text-[11px] text-emerald-100/75">Active</span>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-3">
                    <span className="text-xs tabular-nums text-white/35">ID #{plate.id}</span>
                    <form action={deletePlate}>
                      <input type="hidden" name="id" value={plate.id} />
                      <button
                        type="submit"
                        className="flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200/15 bg-rose-200/[0.045] px-3 text-xs font-medium text-rose-100/75 transition hover:border-rose-200/30 hover:bg-rose-200/[0.10] hover:text-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200"
                      >
                        <svg aria-hidden="true" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M19 7l-.9 12a2 2 0 01-2 1.8H7.9a2 2 0 01-2-1.8L5 7m5 4v6m4-6v6M4 7h16m-5 0V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3" /></svg>
                        เพิกถอนสิทธิ์
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="font-medium text-white/70">ยังไม่มีทะเบียนรถที่ได้รับอนุญาต</p>
              <Link href="/" className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-amber-100/20 bg-amber-100/[0.08] px-4 text-sm text-amber-50 transition hover:bg-amber-100/[0.13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200">ไปหน้าลงทะเบียน</Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
