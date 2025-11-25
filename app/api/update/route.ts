import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { FuelDetection } from "@/models/Item";

export async function PUT(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid updates data" },
        { status: 400 }
      );
    }

    // Validate update data
    for (const update of updates) {
      if (!update._id || !update.result) {
        return NextResponse.json(
          { success: false, message: "Missing required fields (_id, result)" },
          { status: 400 }
        );
      }

      // Validate result values
      if (!['ปกติ', 'ผิดปกติ'].includes(update.result)) {
        return NextResponse.json(
          { success: false, message: "Invalid result value. Must be 'ปกติ' or 'ผิดปกติ'" },
          { status: 400 }
        );
      }

      // Validate liter for abnormal results
      if (update.result === 'ผิดปกติ' && (update.liter === null || update.liter === undefined || isNaN(update.liter))) {
        return NextResponse.json(
          { success: false, message: "Valid liter value is required for abnormal results" },
          { status: 400 }
        );
      }
    }

    // Perform bulk update operations
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update._id },
        update: {
          $set: {
            result: update.result,
            liter: update.liter,
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