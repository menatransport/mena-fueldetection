# Fuel Detection System

ระบบตรวจจับและรายงานการใช้เชื้อเพลิง (Fuel Detection System) เป็น Web Application ที่พัฒนาด้วย Next.js สำหรับการจัดการและแสดงผลข้อมูลการใช้เชื้อเพลิงของพาหนะต่างๆ

## เทคโนโลยีที่ใช้

### Frontend
- **Next.js 16.0.1** - React Framework พร้อม App Router
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS Framework
- **React Hooks** - useState, useEffect, useContext

### Backend & Database
- **MongoDB** - NoSQL Database
- **Mongoose** - MongoDB Object Modeling
- **Next.js API Routes** - Backend API

## โครงสร้างโปรเจค

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── fuel-data/     # API สำหรับดึงข้อมูลเชื้อเพลิง
│   │   ├── update/        # API สำหรับอัปเดตข้อมูล
│   │   └── create/        # API สำหรับสร้างข้อมูลใหม่
│   ├── globals.css        # CSS ส่วนกลาง
│   ├── layout.tsx         # Layout หลัก
│   └── page.tsx           # หน้าแรก
├── components/            # React Components
│   ├── graph.jsx          # คอมโพเนนต์แสดงกราฟ
│   ├── table.jsx          # คอมโพเนนต์แสดงตาราง
│   └── labeling.jsx       # คอมโพเนนต์จัดการป้ายกำกับและเพิ่มข้อมูล
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

### PUT /api/update
อัปเดตข้อมูลการใช้เชื้อเพลิงที่มีอยู่แล้ว

**Request Body:**
```json
{
  "updates": [
    {
      "_id": "item_id",
      "marker_id": 123,
      "result": "ปกติ" | "ไม่ปกติ",
      "liter": 50.5
    }
  ]
}
```

### PUT /api/graphreject
Reject ข้อมูลการใช้เชื้อเพลิง จากปุ่มหน้ากราฟ

**Request Body:**
```json
{
  "updates": [
    {
      "_id": "item_id",
      "marker_id": 123,
      "result": "รถไม่ได้วิ่งงาน" | "กราฟมีปัญหา"
    }
  ]
}
```

### POST /api/create
สร้างข้อมูลการใช้เชื้อเพลิงใหม่

**Request Body:**
```json
{
  "records": [
    {
      "marker_id": 124,
      "datetime5mins": "01/10/2568 16:35",
      "result": "ไม่ปกติ",
      "liter": 15.5,
      "fuel_diff_5min_ago": null,
      "group_id": "group_123"
    }
  ]
}
```

## โครงสร้างข้อมูล

### Fuel Detection Schema
```javascript
{
  id: String,                    // รหัสอ้างอิงกลุ่ม
  ทะเบียนพาหนะ: String,            // หมายเลขทะเบียนรถ
  วันที่: String,                 // วันที่บันทึกข้อมูลเริ่มต้น
  datetime5mins: Date,           // วันที่และเวลาที่แท้จริง (ISO Date)
  marker_id: Number,             // รหัสจุดมาร์กเกอร์ (unique)
  chart_url: String,             // URL ของแผนภูมิ
  result: String,                // ผลการตรวจสอบ (ปกติ/ไม่ปกติ)
  liter: Number,                 // ปริมาณเชื้อเพลิงที่รั่วไหล (ลิตร)
  fuel_diff_5min_ago: Number,    // ความแตกต่างเชื้อเพลิงจาก 5 นาทีที่แล้ว
  created_by: String,            // ผู้สร้างข้อมูล
  updated_at: Date               // วันที่อัปเดตล่าสุด
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
