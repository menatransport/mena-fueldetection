import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { FuelDetection } from "@/models/Item";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { records } = await request.json();

    const itemsToCreate = records.map((record: any) => {
      let convertedDateTime = null;
      if (record.datetime5mins) {
        try {
          console.log("Original datetime5mins:", record.datetime5mins);
          
          // ทำความสะอาดข้อมูลและแยกวันที่และเวลา
          const cleanedDateTime = record.datetime5mins.trim();
          console.log("Cleaned datetime5mins:", cleanedDateTime);
          
          const [datePart, timePart = '00:00'] = cleanedDateTime.split(' ');
          const [year, month, day] = datePart.split('-');
          const [hour, minute] = timePart.split(':');
          console.log('Parsed DateTime:', year + "-" + month + "-" + day + "T" + hour + ":" + minute + ":00Z");

          const dateObject = new Date(year + "-" + month + "-" + day + "T" + hour + ":" + minute + ":00Z");
          
          if (isNaN(dateObject.getTime())) {
            throw new Error('Invalid date');
          }
          
          // แปลงเป็น ISO string format
          convertedDateTime = dateObject.toISOString();
          console.log("Converted DateTime (ISO):", convertedDateTime);
          console.log("Expected format: YYYY-MM-DDTHH:mm:ss.sssZ");
      
          
        } catch (error) {
          console.warn(`ไม่สามารถแปลงวันที่ ${record.datetime5mins}:`, error);
          convertedDateTime = new Date().toISOString(); 
        }
      }

      return {
        mark_id: record.mark_id,
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
