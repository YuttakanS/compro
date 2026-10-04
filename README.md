# ระบบลานจอดรถตรวจทะเบียนรถ

โปรเจ็กต์ Midterm สำหรับระบบเปิดทางเข้าลานจอดรถด้วยการอ่านป้ายทะเบียน ประกอบด้วยโปรแกรม Python ที่เชื่อมกล้อง USB และ Arduino กับเว็บ Next.js สำหรับลงทะเบียนรถและดูประวัติ

## ส่วนประกอบ

- `main.py` อ่านป้ายทะเบียนภาษาไทย/อังกฤษจากกล้องด้วย EasyOCR ตรวจสิทธิ์จาก SQLite บันทึกภาพและประวัติ แล้วสั่ง Arduino เปิดทางเมื่อทะเบียนได้รับอนุญาต
- `parkingweb/` เว็บลงทะเบียนรถและหน้า Admin สำหรับดู access logs และจัดการทะเบียน
- `parkingweb/prisma/schema.prisma` โครงสร้างฐานข้อมูล SQLite
- `parkingweb/prisma/migrations/` migration สำหรับสร้างตาราง

## สิ่งที่ต้องใช้

- Windows และ Python 3.12 (แนะนำ เพราะ environment เดิมสร้างด้วย Python 3.12)
- กล้องที่เชื่อมกับเครื่อง และ Arduino ที่ต่อผ่าน Serial
- Node.js และ npm

## เริ่มระบบเว็บ

```powershell
cd parkingweb
npm ci
npx prisma migrate deploy
npx prisma generate
npm run dev
```

เปิด `http://localhost:3000` เพื่อลงทะเบียนรถ และ `http://localhost:3000/admin` เพื่อดูหน้า Admin

## เริ่มโปรแกรมกล้องและ Arduino

จากโฟลเดอร์หลัก:

```powershell
py -3.12 -m venv parking_env
.\parking_env\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

ก่อนเริ่ม ให้ตรวจสอบ `COM_PORT` ใน `main.py` ให้ตรงกับพอร์ต Arduino และเตรียมให้ Arduino ส่งข้อความ `TRIGGER_CAMERA` เมื่อรถมาถึง แล้วรับไบต์ `1` เพื่อสั่งเปิดทาง โปรแกรม Python และเว็บใช้ฐานข้อมูลร่วมกันที่ `parkingweb/prisma/dev.db`

รูปที่กล้องจับได้จะถูกเก็บใน `parkingweb/public/captures/` ระหว่างใช้งาน ไฟล์ฐานข้อมูลและภาพเป็นข้อมูล runtime จึงไม่รวมไว้ใน Git

## ตั้งค่า PromptPay สำหรับเว็บต้นแบบ

เว็บสร้าง PromptPay QR ผ่าน Omise และจะเพิ่มทะเบียนเข้า `AuthorizedPlate` หลังได้รับ webhook ยืนยันว่ารายการสำเร็จเท่านั้น

1. สร้าง/เข้าใช้งานบัญชี Omise และคัดลอก **Test Secret Key** จากแดชบอร์ด
2. จากโฟลเดอร์ `parkingweb/` คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ `OMISE_SECRET_KEY=skey_test_...` ของตัวเอง (ห้ามนำ secret key ไปใส่ในโค้ดฝั่ง browser หรือ commit ไฟล์นี้)
3. รัน migration และเว็บตามขั้นตอนด้านบน
4. ตั้ง webhook endpoint ใน Omise Dashboard เป็น `https://<โดเมนที่เข้าถึงได้จากอินเทอร์เน็ต>/api/webhooks/omise` ให้ชี้ไปยังเซิร์ฟเวอร์เว็บที่กำลังรันอยู่ สำหรับ localhost ต้องใช้ HTTPS tunnel หรือ deploy ชั่วคราวเพื่อให้ Omise เรียก endpoint ได้
5. ทดสอบในโหมด Test โดยสร้าง QR แล้วเปลี่ยนสถานะ charge เป็นสำเร็จ/ไม่สำเร็จจาก Omise Dashboard; หน้าเว็บจะตรวจสถานะจากฐานข้อมูลที่ webhook อัปเดต
6. เมื่อต้องการรับเงินจริง ให้ติดต่อ `support@omise.co` เพื่อขอเปิด PromptPay และทำตามข้อกำหนดร้านค้าของ Omise จากนั้นจึงใช้ Live Secret Key ใน environment ของเว็บที่เปิดรับเงินจริง

ยอดทดสอบปัจจุบันตั้งไว้ที่ 300 บาท (แก้ที่ `MONTHLY_FEE_SATANG` ใน `parkingweb/src/app/page.tsx`; หน่วยเป็นสตางค์) คู่มือ Omise ระบุยอดขั้นต่ำ 20 บาท, QR หมดอายุปกติใน 24 ชั่วโมง และ PromptPay ยังคืนเงินผ่าน Omise ไม่ได้ จึงควรใช้ Test mode เป็นหลักจนกว่าจะพร้อมจัดการกรณีคืนเงินเอง. รายการจริงต้องรับ webhook จาก URL ที่ Omise เข้าถึงได้.

หน้า Admin ยังไม่มีระบบยืนยันตัวตนผู้ดูแล

## ใช้งานผ่าน GitHub

หลัง clone repository ให้ทำตามขั้นตอนติดตั้งด้านบน และตั้งค่า `.env.local` ด้วย Test Secret Key ของบัญชี Omise ของผู้ใช้งานแต่ละคน ไฟล์ `.env.local`, ฐานข้อมูล SQLite และภาพจากกล้องจะไม่ถูกส่งขึ้น GitHub
