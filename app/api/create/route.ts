import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { FuelDetection } from "@/models/Item";
import cluster from "cluster";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { records } = await request.json();

    const itemsToCreate = records.map((record: any) => {
      // แปลงรูปแบบวันที่จาก "01/10/2568 16:00" เป็น ISO Date
      let convertedDateTime = null;
      if (record.datetime5mins) {
        try {
          // แยกวันที่และเวลา
          const [datePart, timePart] = record.datetime5mins.split(' ');
          const [day, month, year] = datePart.split('/');
          const [hour, minute] = (timePart || '00:00').split(':');
          
          // สร้าง Date object
          convertedDateTime = new Date(
            parseInt(year) - 543,
            parseInt(month) - 1, // เดือนเริ่มจาก 0
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            0,
            0
          );
          console.log("Converted DateTime:", convertedDateTime);
          // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
          if (isNaN(convertedDateTime.getTime())) {
            throw new Error('Invalid date');
          }
        } catch (error) {
          console.warn(`ไม่สามารถแปลงวันที่ ${record.datetime5mins}:`, error);
          convertedDateTime = new Date(); // ใช้วันที่ปัจจุบันเป็น fallback
        }
      }

      return {
        marker_id: record.marker_id,
        datetime5mins: convertedDateTime,
        result: record.result,
        liter: record.liter || null,
        fuel_diff_5min_ago: record.fuel_diff_5min_ago || null,
        id: record.group_id || null,
        created_by: "User",
        chart_url: record.chart_url || null,
        updated_at: new Date()
      };
    });
    // console.log("Items to create:", JSON.stringify(itemsToCreate));
     const result = await FuelDetection.insertMany(itemsToCreate);

    return NextResponse.json({
      success: true,
      message: `สร้างข้อมูลใหม่สำเร็จ ${itemsToCreate.length} รายการ`,
      created_count: itemsToCreate.length,
      created_ids: result.map((item: any) => item._id)
    });

  } catch (error: any) {
    console.error("Create API Error:", error);
    
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return NextResponse.json(
        { 
          success: false, 
          message: `ข้อมูลซ้ำในฟิลด์ ${duplicateField}` 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
