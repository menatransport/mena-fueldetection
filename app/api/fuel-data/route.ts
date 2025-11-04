import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { FuelDetection } from "@/models/Item";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const vehicle = searchParams.get('vehicle');
    const grouped = searchParams.get('grouped') === 'true'; 
    
    const filter: any = {};
    if (vehicle) {
      filter.ทะเบียนพาหนะ = vehicle;
    }
    
    if (grouped) {
      const aggregationPipeline: any[] = [
        { $match: filter }, 
        {
          $group: {
            _id: "$id", 
            items: { 
              $push: {
                _id: "$_id",
                ทะเบียนพาหนะ: "$ทะเบียนพาหนะ",
                วันที่: "$วันที่",
                marker_id: "$marker_id",
                result: "$result",
                liter: "$liter",
                updated_at: "$updated_at"
              }
            },
            count: { $sum: 1 },
            วันที่: { $first: "$วันที่" },
            chart_url: { $first: "$chart_url" }
          }
        },
        {
          $project: {
            id: "$_id",
            _id: 0,
            items: 1,
            count: 1,
            วันที่: 1,
            chart_url: 1
          }
        },
        { $sort: { id: 1 } } 
      ];
      
  
      const skip = (page - 1) * limit;
      aggregationPipeline.push({ $skip: skip });
      aggregationPipeline.push({ $limit: limit });
      
      const groupedData = await FuelDetection.aggregate(aggregationPipeline);
      

      const totalGroupsResult = await FuelDetection.aggregate([
        { $match: filter },
        { $group: { _id: "$id" } },
        { $count: "totalGroups" }
      ]);
      
      const totalGroups = totalGroupsResult[0]?.totalGroups || 0;
 
      return NextResponse.json({ 
        success: true, 
        data: groupedData,
        pagination: {
          currentPage: page,
          limit: limit,
          totalCount: totalGroups,
          totalPages: Math.ceil(totalGroups / limit),
          hasNext: (skip + groupedData.length) < totalGroups,
          hasPrev: page > 1
        },
        grouped: true
      });
    } else {
      
      const skip = (page - 1) * limit;
      
      const data = await FuelDetection.find(filter)
        .sort({ วันที่: -1 }) 
        .skip(skip)
        .limit(limit);
    
      const totalCount = await FuelDetection.countDocuments(filter);
      
      return NextResponse.json({ 
        success: true, 
        data: data,
        pagination: {
          currentPage: page,
          limit: limit,
          totalCount: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: (skip + data.length) < totalCount,
          hasPrev: page > 1
        },
        grouped: false
      });
    }
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}