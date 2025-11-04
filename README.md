# Fuel Detection System

ระบบตรวจจับและรายงานการใช้เชื้อเพลิง (Fuel Detection System) เป็น Web Application ที่พัฒนาด้วย Next.js สำหรับการจัดการและแสดงผลข้อมูลการใช้เชื้อเพลิงของพาหนะต่างๆ

## เทคโนโลยีที่ใช้

### Frontend
- **Next.js 16.0.1** - React Framework พร้อม App Router
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS Framework

### Backend & Database
- **MongoDB** - NoSQL Database
- **Next.js API Routes** - Backend API

### Additional Libraries
- **Lucide React** - Icon Library
- **Date-fns** - Date Utility Library

### การติดตั้ง

1. **Clone Repository**
```bash
git clone <repository-url>
cd fuel-detection
```

2. **ติดตั้ง Dependencies**
```bash
npm install
# หรือ
yarn install
```

3. **ตั้งค่า Environment Variables**
สร้างไฟล์ `.env.local` และเพิ่มตัวแป: ????


4. **รันเซิร์ฟเวอร์พัฒนา**
```bash
npm run dev
# หรือ
yarn dev
```

5. **เปิดเว็บเบราว์เซอร์**
ไปที่ [http://localhost:3000](http://localhost:3000)

## โครงสร้างโปรเจค

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── fuel-data/     # API สำหรับดึงข้อมูลเชื้อเพลิง
│   │   └── update/        # API สำหรับอัปเดตข้อมูล
│   ├── globals.css        # CSS ส่วนกลาง
│   ├── layout.tsx         # Layout หลัก
│   └── page.tsx           # หน้าแรก
├── components/            # React Components
│   ├── graph.jsx          # คอมโพเนนต์แสดงกราฟ
│   ├── table.jsx          # คอมโพเนนต์แสดงตาราง
│   └── labeling.jsx       # คอมโพเนนต์จัดการป้ายกำกับ
├── contexts/              # React Contexts
│   └── FuelDataContext.jsx # Context สำหรับจัดการข้อมูล
├── lib/                   # Utility Libraries
│   ├── mongodb.ts         # การเชื่อมต่อ MongoDB
│   └── utils.ts           # ฟังก์ชันช่วยเหลือ
├── models/                # Database Models
│   └── Item.ts            # Mongoose Schema
└── public/                # Static Files
```


### GET /api/fuel-data
ดึงข้อมูลการใช้เชื้อเพลิง

**Query Parameters:**
- `page` (optional): หมายเลขหน้า (default: 1)
- `limit` (optional): จำนวนรายการต่อหน้า (default: 10)
- `vehicle` (optional): ทะเบียนพาหนะที่ต้องการกรอง
- `grouped` (optional): จัดกลุ่มข้อมูลตาม ID (true/false)

**ตัวอย่าง:**
```javascript
// ดึงข้อมูลหน้าแรก
fetch('/api/fuel-data?page=1&limit=10')

// กรองตามทะเบียนพาหนะ
fetch('/api/fuel-data?vehicle=ABC123')

// ดึงข้อมูลแบบจัดกลุ่ม
fetch('/api/fuel-data?grouped=true')
```

### POST /api/update
อัปเดตข้อมูลการใช้เชื้อเพลิง

**Request Body:**
```json
{
  "id": "item_id",
  "result": "ปกติ" | "ไม่ปกติ",
  "liter": 50.5
}
```

## โครงสร้างข้อมูล

### Fuel Detection Schema
```javascript
{
  id: String,              // รหัสอ้างอิง
  ทะเบียนพาหนะ: String,      // หมายเลขทะเบียนรถ
  วันที่: String,           // วันที่บันทึกข้อมูล
  marker_id: Number,       // รหัสจุดมาร์กเกอร์
  chart_url: String,       // URL ของแผนภูมิ
  result: String,          // ผลการตรวจสอบ (ปกติ/ไม่ปกติ)
  liter: Number,           // ปริมาณเชื้อเพลิง (ลิตร)
  updated_at: Date         // วันที่อัปเดต
}
```

## คำสั่งที่สำคัญ

```bash
# พัฒนา
npm run dev         # รันเซิร์ฟเวอร์พัฒนา
npm run build       # สร้างไฟล์ production
npm run start       # รันเซิร์ฟเวอร์ production
npm run lint        # ตรวจสอบ code style

# การจัดการฐานข้อมูล
# (ใช้ MongoDB Compass หรือ CLI สำหรับจัดการฐานข้อมูล)
```

## การ Deploy

### Deploy บน Vercel
1. Push โค้ดขึ้น GitHub
2. เชื่อมต่อ Repository กับ Vercel
3. ตั้งค่า Environment Variables ใน Vercel Dashboard
4. Deploy อัตโนมัติ

### Deploy แบบ Manual
```bash
npm run build
npm run start
```

## การพัฒนาต่อยอด

### การเพิ่มฟีเจอร์ใหม่
1. สร้าง Component ใหม่ใน `components/`
2. เพิ่ม API Route ใน `app/api/`
3. อัปเดต Database Schema ใน `models/`
4. ใช้ Context สำหรับจัดการ State

### การปรับแต่ง UI
- แก้ไข Tailwind Classes ใน Components
- เพิ่ม Custom CSS ใน `globals.css`
- ใช้ Radix UI สำหรับ Components ที่ซับซ้อน

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย
1. **การเชื่อมต่อฐานข้อมูล**: ตรวจสอบ MongoDB URI
2. **Port ถูกใช้งาน**: เปลี่ยน PORT ใน environment
3. **Dependencies Error**: ลบ `node_modules` และ `package-lock.json` แล้วติดตั้งใหม่

### Logs และ Debugging
```bash
# ดู logs ใน development
console.log() # ใน browser console

# ดู API logs
# ตรวจสอบใน Network tab ของ Developer Tools
```

## การมีส่วนร่วมในโปรเจค

1. **Fork Repository**
2. **สร้าง Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```
3. **Commit การเปลี่ยนแปลง**
   ```bash
   git commit -m "Add new feature"
   ```
4. **Push ไปยัง Branch**
   ```bash
   git push origin feature/new-feature
   ```
5. **สร้าง Pull Request**

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ติดต่อ

หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาสร้าง Issue ใน Repository นี้

---

**หมายเหตุ**: โปรเจคนี้อยู่ในช่วงการพัฒนา ฟีเจอร์บางอย่างอาจมีการเปลี่ยนแปลงได้
