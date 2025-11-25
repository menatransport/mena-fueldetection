import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { FuelDetection } from "@/models/Item";

export async function PUT(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { updates } = body;

    const bulkOps = updates.map((update: any) => ({
      updateOne: {
        filter: { _id: update._id },
        update: {
          $set: {
            result: update.result,
            updated_at: new Date()
          }
        }
      }
    }));


    const result = await FuelDetection.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      message: "Data updated successfully",
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });

  } catch (error) {
    console.error("Update API error:", error);
    return NextResponse.json({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }

}