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

## ข้อจำกัดของงานต้นแบบ

หน้าชำระเงินเป็น UI จำลอง ยังไม่ได้เชื่อมต่อธนาคารหรือ payment gateway และหน้า Admin ยังไม่มีระบบยืนยันตัวตนผู้ดูแล
