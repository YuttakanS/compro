'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

type Plate = {
  id: number;
  plateNumber: string;
  ownerName: string;
};

type RegistrationResult = {
  ok: boolean;
  message: string;
  reservationId?: string;
  qrImageUrl?: string;
};

type PaymentUIProps = {
  plates: Plate[];
  initialPending: { id: string; qrImageUrl: string | null } | null;
  createReservationAction: (formData: FormData) => Promise<RegistrationResult>;
};

const glassPanel =
  'border border-white/[0.13] bg-white/[0.075] shadow-[0_20px_60px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl';

const inputClass =
  'w-full rounded-2xl border border-white/15 bg-[#111713]/65 px-4 py-3.5 text-base text-white outline-none transition placeholder:text-white/30 hover:border-white/25 focus:border-amber-200/70 focus:bg-[#111713]/85 focus:ring-4 focus:ring-amber-200/10 disabled:cursor-wait disabled:opacity-60';

export default function PaymentUI({ plates, initialPending, createReservationAction }: PaymentUIProps) {
  const router = useRouter();
  const [plateNumber, setPlateNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'paid' | 'failed' | 'expired' | 'error'>(initialPending ? 'pending' : 'idle');
  const [feedback, setFeedback] = useState(initialPending ? 'มีรายการรอชำระอยู่ สแกน QR เพื่อชำระเงินต่อได้' : '');
  const [reservationId, setReservationId] = useState<string | null>(initialPending?.id ?? null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(initialPending?.qrImageUrl ?? null);

  const isSaving = status === 'saving';

  useEffect(() => {
    if (!reservationId || status === 'paid' || status === 'failed' || status === 'expired') return;
    let stopped = false;

    async function refreshPaymentStatus() {
      try {
        const response = await fetch(`/api/payments/${reservationId}`, { cache: 'no-store' });
        if (!response.ok) return;
        const result = (await response.json()) as { status: string };
        if (stopped) return;
        if (result.status === 'paid') {
          setStatus('paid');
          setFeedback('ชำระเงินสำเร็จ ระบบลงทะเบียนรถให้แล้ว');
          setPlateNumber('');
          setOwnerName('');
          setReservationId(null);
          router.refresh();
        } else if (result.status === 'failed' || result.status === 'expired') {
          setStatus(result.status);
          setFeedback(result.status === 'expired' ? 'QR หมดอายุแล้ว กรุณาสร้างรายการใหม่' : 'รายการชำระเงินไม่สำเร็จ กรุณาสร้างรายการใหม่');
          setReservationId(null);
        }
      } catch {
        // Keep showing the QR; the next poll can recover from a temporary network error.
      }
    }

    void refreshPaymentStatus();
    const interval = window.setInterval(() => void refreshPaymentStatus(), 4000);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [reservationId, router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus('saving');
    setFeedback('กำลังบันทึกข้อมูลการจอง…');

    try {
      const result = await createReservationAction(new FormData(form));
      setStatus(result.ok ? 'pending' : 'error');
      setFeedback(result.message);

      if (result.ok) {
        setReservationId(result.reservationId ?? null);
        setQrImageUrl(result.qrImageUrl ?? null);
      }
    } catch {
      setStatus('error');
      setFeedback('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง');
    }
  }

  function updatePlateNumber(value: string) {
    setPlateNumber(value.replace(/\s+/g, '').toLocaleUpperCase());
    if (status !== 'pending') { setStatus('idle'); setFeedback(''); }
  }

  function updateOwnerName(value: string) {
    setOwnerName(value);
    if (status !== 'pending') { setStatus('idle'); setFeedback(''); }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#171d18] px-4 py-7 font-sans text-[#f8f5ec] sm:px-6 sm:py-10 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-36 h-[34rem] w-[34rem] rounded-full bg-amber-700/20 blur-[130px]" />
        <div className="absolute -right-36 top-[18%] h-[32rem] w-[32rem] rounded-full bg-emerald-500/15 blur-[140px]" />
        <div className="absolute -bottom-48 left-[35%] h-[30rem] w-[30rem] rounded-full bg-rose-400/10 blur-[130px]" />
      </div>

      <main className="relative mx-auto max-w-6xl">
        <header className="mb-9 flex items-center justify-between gap-4 sm:mb-12">
          <Link href="/" aria-label="หน้าหลัก" className="group inline-flex items-center gap-3 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200">
            <span className="grid size-11 place-items-center rounded-2xl border border-amber-100/20 bg-amber-100/10 text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition group-hover:bg-amber-100/15">
              <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none">
                <path d="M4 17.5V8.8c0-.9.6-1.7 1.5-1.9l1.2-.3.8-2.1c.2-.6.8-1 1.5-1h6c.7 0 1.3.4 1.5 1l.8 2.1 1.2.3c.9.2 1.5 1 1.5 1.9v8.7M4 13h16M7 17.5h.01M17 17.5h.01M6 7l1 6m11-6-1 6M7 17.5h10M4 17.5h-1m18 0h-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide text-white">Parkside</span>
              <span className="mt-0.5 block text-xs text-white/45">ที่จอดรถรายเดือน</span>
            </span>
          </Link>

          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-white/75 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="hidden sm:inline">สำหรับผู้ดูแล</span>
            <span className="sm:hidden">Admin</span>
          </Link>
        </header>

        <section className="mb-8 max-w-3xl sm:mb-10">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/70">
            <span className="h-px w-7 bg-amber-100/50" /> Monthly parking pass
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[#fbf8ef] sm:text-5xl sm:leading-[1.12]">
            กลับมาเมื่อไหร่<br className="hidden sm:block" /> ก็มีที่จอดรออยู่
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base sm:leading-7">
            ลงทะเบียนรถของคุณ แล้วจองสิทธิ์จอดรถรายเดือนในไม่กี่ขั้นตอน
          </p>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.8fr)] lg:gap-7">
          <div className="space-y-5">
            <section aria-labelledby="vehicle-heading" className={`${glassPanel} rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-8`}>
              <div className="mb-7 flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-amber-100/15 bg-amber-100/[0.08] text-sm font-semibold text-amber-100">01</span>
                <div>
                  <h2 id="vehicle-heading" className="text-lg font-semibold text-white sm:text-xl">เริ่มจากข้อมูลของคุณ</h2>
                  <p className="mt-1 text-sm leading-6 text-white/50">ใช้ข้อมูลนี้เพื่อบันทึกสิทธิ์รถของคุณในระบบ</p>
                </div>
              </div>

              <form id="reservation-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="plateNumber" className="mb-2 block text-sm font-medium text-white/80">เลขทะเบียนรถ</label>
                  <div className="relative">
                    <input
                      id="plateNumber"
                      name="plateNumber"
                      type="text"
                      value={plateNumber}
                      onChange={(event) => updatePlateNumber(event.target.value)}
                      placeholder="เช่น 1กข 1234"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      maxLength={16}
                      disabled={isSaving || status === 'pending'}
                      required
                      aria-describedby="plate-hint"
                      className={`${inputClass} pr-12 font-mono tracking-wide`}
                    />
                    <svg aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-white/35" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M4 17.5V8.8c0-.9.6-1.7 1.5-1.9l1.2-.3.8-2.1c.2-.6.8-1 1.5-1h6c.7 0 1.3.4 1.5 1l.8 2.1 1.2.3c.9.2 1.5 1 1.5 1.9v8.7M4 13h16M7 17.5h.01M17 17.5h.01" />
                    </svg>
                  </div>
                  <p id="plate-hint" className="mt-2 text-xs leading-5 text-white/40">ไม่ต้องเว้นวรรค ระบบจัดรูปแบบทะเบียนให้อัตโนมัติ</p>
                </div>

                <div>
                  <label htmlFor="ownerName" className="mb-2 block text-sm font-medium text-white/80">ชื่อผู้จอง</label>
                  <input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    value={ownerName}
                    onChange={(event) => updateOwnerName(event.target.value)}
                    placeholder="ชื่อและนามสกุล"
                    autoComplete="name"
                    maxLength={100}
                    disabled={isSaving || status === 'pending'}
                    required
                    className={inputClass}
                  />
                </div>

                {feedback && (
                  <p
                    role={status === 'error' ? 'alert' : 'status'}
                    aria-live="polite"
                    className={`rounded-2xl border px-4 py-3 text-sm leading-5 ${
                      status === 'paid'
                        ? 'border-emerald-200/20 bg-emerald-200/[0.08] text-emerald-100'
                        : status === 'error' || status === 'failed' || status === 'expired'
                          ? 'border-rose-200/20 bg-rose-200/[0.08] text-rose-100'
                          : 'border-white/10 bg-white/[0.04] text-white/70'
                    }`}
                  >
                    {feedback}
                  </p>
                )}
              </form>
            </section>

            <section aria-labelledby="vehicles-heading" className={`${glassPanel} rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-7`}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 id="vehicles-heading" className="font-semibold text-white">รถที่ลงทะเบียนแล้ว</h2>
                  <p className="mt-1 text-xs text-white/45">รายการล่าสุดในระบบ</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs tabular-nums text-white/55">{plates.length} คัน</span>
              </div>

              {plates.length > 0 ? (
                <ul className="space-y-2.5">
                  {plates.map((plate) => (
                    <li key={plate.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#111713]/40 p-3.5 sm:px-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.07] text-white/65">
                          <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 17.5V8.8c0-.9.6-1.7 1.5-1.9l1.2-.3.8-2.1c.2-.6.8-1 1.5-1h6c.7 0 1.3.4 1.5 1l.8 2.1 1.2.3c.9.2 1.5 1 1.5 1.9v8.7M4 13h16M7 17.5h.01M17 17.5h.01" />
                          </svg>
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-sm font-semibold tracking-wide text-white">{plate.plateNumber}</span>
                          <span className="mt-0.5 block truncate text-xs text-white/45">{plate.ownerName}</span>
                        </span>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200/15 bg-emerald-200/[0.07] px-2.5 py-1 text-[11px] text-emerald-100/80">
                        <span className="size-1.5 rounded-full bg-emerald-200/80" /> พร้อมใช้งาน
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-7 text-center">
                  <p className="text-sm text-white/65">ยังไม่มีรถในรายการ</p>
                  <p className="mt-1 text-xs text-white/40">เพิ่มทะเบียนด้านบนเพื่อเริ่มจองที่จอด</p>
                </div>
              )}
            </section>
          </div>

          <aside aria-labelledby="payment-heading" className={`${glassPanel} overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] lg:sticky lg:top-8`}>
            <div className="border-b border-white/10 bg-gradient-to-br from-amber-100/[0.10] via-white/[0.035] to-transparent px-5 py-6 sm:px-7 sm:py-7">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-100/65">02 · Your reservation</p>
              <h2 id="payment-heading" className="mt-2 text-xl font-semibold text-white">สรุปค่าบริการ</h2>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight text-[#fbf8ef]">฿300</span>
                <span className="pb-1 text-sm text-white/50">/ เดือน</span>
              </div>
              <p className="mt-2 text-sm text-white/55">สิทธิ์จอดรถสำหรับสมาชิก 1 เดือน</p>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              <div className="rounded-2xl border border-sky-200/15 bg-sky-200/[0.06] p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-sky-300/15 text-sm font-bold text-sky-100">QR</span>
                  <div>
                    <p className="text-sm font-medium text-white/90">พร้อมเพย์</p>
                    <p className="mt-0.5 text-xs text-white/45">สแกนด้วยแอปธนาคารเพื่อชำระเงิน</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-5 text-sm">
                <div className="flex justify-between text-white/55"><span>ค่าบริการรายเดือน</span><span>฿300.00</span></div>
                <div className="flex justify-between font-semibold text-white"><span>ยอดรวม</span><span>฿300.00</span></div>
              </div>

              <div>
                <button
                  type="submit"
                  form="reservation-form"
                  disabled={isSaving || status === 'pending'}
                  className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#e8c98d] px-5 py-4 text-base font-semibold text-[#26271f] shadow-[0_10px_30px_rgba(191,153,87,0.2),inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:-translate-y-0.5 hover:bg-[#f0d9a8] hover:shadow-[0_14px_35px_rgba(191,153,87,0.28)] active:translate-y-0 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-amber-100"
                >
                  {isSaving ? (
                    <>
                      <svg aria-hidden="true" className="size-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                      กำลังบันทึกการจอง…
                    </>
                  ) : status === 'paid' ? (
                    <>
                      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="m5 12 4 4L19 6" /></svg>
                      จองสำเร็จ · ลงทะเบียนรถเพิ่ม
                    </>
                  ) : (
                    <>
                      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7V5a2 2 0 0 1 2-2h7l4 4v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2m7-10v4m0 0-2-2m2 2 2-2M3 12h10" /></svg>
                      ยืนยันการจอง
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-xs leading-5 text-white/45">
                  {status === 'pending' ? 'กำลังรอยืนยันการชำระเงินจาก Omise' : 'การลงทะเบียนจะเสร็จหลังระบบยืนยันการชำระเงิน'}
                </p>
              </div>

              {qrImageUrl && status === 'pending' && (
                <div className="rounded-2xl border border-white/10 bg-white p-4 text-center">
                  {/* Omise returns a short-lived, signed QR image URL for this charge. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrImageUrl} alt="PromptPay QR สำหรับชำระเงิน" className="mx-auto aspect-square w-full max-w-[260px] object-contain" />
                  <p className="mt-2 text-xs text-slate-600">สแกน QR นี้เพื่อชำระ ฿300.00</p>
                </div>
              )}

              <div className="flex items-start gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 text-xs leading-5 text-white/45">
                <svg aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-200/75" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="m9 12 2 2 4-4" /></svg>
                <p>ข้อมูลทะเบียนรถจะถูกใช้สำหรับตรวจสิทธิ์เข้าใช้งานลานจอดรถ</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
