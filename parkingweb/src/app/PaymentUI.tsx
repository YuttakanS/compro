'use client';

import { useState } from 'react';
import Link from 'next/link';

const METHODS = [
  { label: 'พร้อมเพย์', alt: 'PromptPay', src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3EuTsVPog_0wMsqMXwb7NzCeFzkq0Syu2YvVEMHH0yK2_FzN-1Tx9iGo&s=10', checked: true},
  { label: 'กสิกรไทย', alt: 'KBank', src: 'https://www.prachachat.net/wp-content/uploads/2020/02/kasikorn-bank.jpg' },
  { label: 'ไทยพาณิชย์', alt: 'SCB', src: 'https://contents.bu.ac.th/contents/images/mous/329753f9-5166-4d9b-911d-d78859cbb023.jpg' },
  { label: 'กรุงไทย', alt: 'Krungthai', src: 'https://thethaiger.com/th/wp-content/uploads/2020/11/HCtHFA7ele6Q2dUK3zFOTjoPDX29CBVDMs0YEZd0e6L7sICJ2fm3O2NBkweRpo6F9J.jpg' },
];

// Glass primitives
const glass = 'bg-white/[0.07] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]';
const inputCls =
  'w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-base text-white placeholder-white/35 outline-none backdrop-blur-md transition focus:border-cyan-300/60 focus:bg-white/10 focus:ring-4 focus:ring-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-40';

export default function PaymentUI({ plates, registerPlateAction }: any) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  async function handlePayment(e: any) {
    e.preventDefault();

    // 🌟 ดึงข้อมูลเก็บไว้ในตัวแปรก่อนที่ช่องจะถูก Disabled
    const formData = new FormData(e.currentTarget);

    setStatus('processing');
    await new Promise(resolve => setTimeout(resolve, 1500));

    setStatus('success');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 🌟 ส่งข้อมูลที่ดึงเก็บไว้ไปบันทึก
    await registerPlateAction(formData);

    setStatus('idle');
    e.target.reset();
  }

  const busy = status !== 'idle';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f24] px-4 py-8 font-sans text-white sm:px-6 lg:px-8">
      {/* Background blobs (glass needs something to blur) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-indigo-600/50 blur-[110px]" />
        <div className="absolute -right-24 top-1/4 h-[26rem] w-[26rem] rounded-full bg-cyan-400/35 blur-[110px]" />
        <div className="absolute -bottom-32 left-1/3 h-[24rem] w-[24rem] rounded-full bg-fuchsia-500/35 blur-[110px]" />
      </div>

      <main className="relative mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">My Project</h1>
            <p className="mt-1 text-sm text-white/60 sm:text-lg">ระบบลงทะเบียนและชำระค่าบริการลานจอดรถ</p>
          </div>
          <Link
            href="/admin"
            className={`${glass} inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Admin Login
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* --- ฝั่งซ้าย --- */}
          <div className="space-y-6 lg:col-span-2">
            <section className={`${glass} rounded-3xl p-6 sm:p-8`}>
              <h2 className="mb-6 text-lg font-semibold text-cyan-200">ข้อมูลผู้เช่าและยานพาหนะ</h2>
              <form id="payment-form" onSubmit={handlePayment} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="plateNumber" className="mb-2 block text-sm font-medium text-white/70">เลขทะเบียนรถ (Plate Number)</label>
                  <input id="plateNumber" type="text" name="plateNumber" placeholder="เช่น 1กข1234" disabled={busy} className={inputCls} required />
                </div>
                <div>
                  <label htmlFor="ownerName" className="mb-2 block text-sm font-medium text-white/70">ชื่อ-นามสกุล (Owner Name)</label>
                  <input id="ownerName" type="text" name="ownerName" placeholder="ระบุชื่อเจ้าของรถ" disabled={busy} className={inputCls} required />
                </div>
              </form>
            </section>

            <section className={`${glass} rounded-3xl p-6 sm:p-8`}>
              <h2 className="mb-5 text-lg font-semibold text-white/90">ยานพาหนะของคุณ (My Vehicles)</h2>
              <div className="space-y-3">
                {plates.map((plate: any) => (
                  <div key={plate.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="min-w-[96px] rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-center">
                        <span className="text-sm font-bold tracking-wider">{plate.plateNumber}</span>
                      </div>
                      <span className="truncate text-sm font-medium text-white/85">{plate.ownerName}</span>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#6ee7b7]" />
                      Active
                    </span>
                  </div>
                ))}
                {plates.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/20 py-8 text-center text-sm text-white/45">
                    ยังไม่มียานพาหนะที่ลงทะเบียน
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* --- ฝั่งขวา: Payment --- */}
          <aside className={`${glass} relative h-fit overflow-hidden rounded-3xl lg:sticky lg:top-8`}>
            {status === 'processing' && (
              <div role="status" className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0f24]/50 backdrop-blur-md">
                <svg className="mb-4 h-10 w-10 animate-spin text-cyan-300" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                <p className="font-medium text-cyan-100">กำลังติดต่อธนาคาร...</p>
              </div>
            )}

            <div className="border-b border-white/10 bg-white/[0.04] px-6 py-8 text-center sm:px-8">
              <h3 className="mb-2 text-sm font-medium text-white/60">ค่าบริการสมาชิก (รายเดือน)</h3>
              <div className="flex items-baseline justify-center gap-1 text-5xl font-extrabold tracking-tight">
                ฿300<span className="text-xl font-medium text-white/45">.00</span>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-white/80">เลือกช่องทางชำระเงิน</legend>
                <div className="grid grid-cols-2 gap-3">
                  {METHODS.map(m => (
                    <label key={m.alt} className="relative cursor-pointer">
                      <input type="radio" name="payment_method" className="peer sr-only" defaultChecked={m.checked} disabled={busy} />
                      <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] p-3 backdrop-blur-md transition hover:bg-white/10 peer-checked:border-cyan-300/70 peer-checked:bg-cyan-300/15 peer-checked:shadow-[0_0_20px_rgba(103,232,249,0.25)] peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-40">
                        {/* 🌟 ลิงก์รูปของคุณ */}
                        <span className="grid h-9 w-full place-items-center rounded-lg bg-white/90 px-2">
                          <img src={m.src} alt={m.alt} className="h-6 object-contain" />
                        </span>
                        <span className="text-xs font-medium text-white/80">{m.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <button
                  type="submit"
                  form="payment-form"
                  disabled={busy}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-base font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300
                    ${status === 'idle' ? 'border-white/30 bg-gradient-to-r from-indigo-500/80 to-cyan-400/80 text-white shadow-[0_8px_30px_rgba(99,102,241,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-md hover:brightness-110 active:scale-[0.98]' : ''}
                    ${status === 'processing' ? 'cursor-not-allowed border-white/10 bg-white/10 text-white/50' : ''}
                    ${status === 'success' ? 'border-emerald-200/40 bg-emerald-400/80 text-white shadow-[0_8px_30px_rgba(16,185,129,0.5)]' : ''}
                  `}
                >
                  {status === 'idle' && (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      ยืนยันการชำระเงิน
                    </>
                  )}
                  {status === 'processing' && 'กำลังประมวลผล...'}
                  {status === 'success' && (
                    <>
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      ชำระเงินสำเร็จ!
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-xs text-white/45">
                  ระบบจะบันทึกสิทธิ์เข้าลานจอดรถอัตโนมัติเมื่อทำรายการสำเร็จ
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}