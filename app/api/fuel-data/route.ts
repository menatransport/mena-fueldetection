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

    // Filter parameters
    const filterId = searchParams.get('filterId');
    const filterDate = searchParams.get('filterDate');
    const filterStatus = searchParams.get('filterStatus');

    const filter: any = {};
    if (vehicle) {
      filter.ทะเบียนพาหนะ = vehicle;
    }

    if (filterId) {
      filter.id = { $regex: filterId, $options: 'i' };
    }


    if (filterDate) {
      filter.วันที่ = { $regex: filterDate, $options: 'i' };
    }


    if (!grouped) {
      if (filterStatus == 'pending') {
        filter.result = { $in: [null, "", undefined] };
      } else if (filterStatus == 'completed') {
        filter.result = { $nin: [null, "", undefined, "รถไม่ได้วิ่งงาน", "กราฟมีปัญหา"] };
      } else if (filterStatus == 'reject') {
        filter.result = { $in: ["รถไม่ได้วิ่งงาน", "กราฟมีปัญหา"] };
      }
    }

    if (grouped) {
      let aggregationPipeline: any[] = [
        { $match: filter },
        {
          $group: {
            _id: "$id",
            items: {
              $push: {
                _id: "$_id",
                ทะเบียนพาหนะ: "$ทะเบียนพาหนะ",
                วันที่: "$วันที่",
                mark_id: "$mark_id",
                result: "$result",
                liter: "$liter",
                updated_at: "$updated_at",
                datetime5mins: "$datetime5mins",
                fuel_diff_5min_ago: "$fuel_diff_5min_ago"
              }
            },
            count: { $sum: 1 },
            วันที่: { $first: "$วันที่" },
            chart_url: { $first: "$chart_url" }
          }
        },
        {
          $addFields: {
            completedCount: {
              $size: {
                $filter: {
                  input: "$items",
                  cond: {
                    $and: [
                      { $ne: ["$$this.result", null] },
                      { $ne: ["$$this.result", ""] },
                      { $ne: ["$$this.result", undefined] }
                    ]
                  }
                }
              }
            },
            status: {
              $cond: {
                if: {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: "$items",
                          cond: {
                            $or: [
                              { $eq: ["$$this.result", "รถไม่ได้วิ่งงาน"] },
                              { $eq: ["$$this.result", "กราฟมีปัญหา"] }
                            ]
                          }
                        }
                      }
                    },
                    0
                  ]
                },
                then: "reject",
                else: {
                  $cond: {
                    if: {
                      $eq: [
                        {
                          $size: {
                            $filter: {
                              input: "$items",
                              cond: {
                                $and: [
                                  { $ne: ["$$this.result", null] },
                                  { $ne: ["$$this.result", ""] },
                                  { $ne: ["$$this.result", undefined] }
                                ]
                              }
                            }
                          }
                        },
                        "$count"
                      ]
                    },
                    then: "completed",
                    else: "pending"
                  }
                }
              }
            }
          }
        }
      ];

      if (filterStatus && filterStatus !== 'all') {
        aggregationPipeline.push({
          $match: { status: filterStatus }
        });
      }

      aggregationPipeline.push({
        $project: {
          id: "$_id",
          _id: 0,
          items: 1,
          count: 1,
          วันที่: 1,
          chart_url: 1,
          completedCount: 1,
          status: 1
        }
      });


      aggregationPipeline.push({ $sort: { id: 1 } });


      const skip = (page - 1) * limit;
      aggregationPipeline.push({ $skip: skip });
      aggregationPipeline.push({ $limit: limit });

      const groupedData = await FuelDetection.aggregate(aggregationPipeline);


      let totalGroupsPipeline: any[] = [
        { $match: filter },
        {
          $group: {
            _id: "$id",
            items: {
              $push: {
                result: "$result"
              }
            },
            count: { $sum: 1 }
          }
        }
      ];

      if (filterStatus && filterStatus !== 'all') {
        totalGroupsPipeline.push({
          $addFields: {
            completedCount: {
              $size: {
                $filter: {
                  input: "$items",
                  cond: {
                    $and: [
                      { $ne: ["$$this.result", null] },
                      { $ne: ["$$this.result", ""] },
                      { $ne: ["$$this.result", undefined] }
                    ]
                  }
                }
              }
            },
            status: {
              $cond: {
                if: {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: "$items",
                          cond: {
                            $or: [
                              { $eq: ["$$this.result", "รถไม่ได้วิ่งงาน"] },
                              { $eq: ["$$this.result", "กราฟมีปัญหา"] }
                            ]
                          }
                        }
                      }
                    },
                    0
                  ]
                },
                then: "reject",
                else: {
                  $cond: {
                    if: {
                      $eq: [
                        {
                          $size: {
                            $filter: {
                              input: "$items",
                              cond: {
                                $and: [
                                  { $ne: ["$$this.result", null] },
                                  { $ne: ["$$this.result", ""] },
                                  { $ne: ["$$this.result", undefined] }
                                ]
                              }
                            }
                          }
                        },
                        "$count"
                      ]
                    },
                    then: "completed",
                    else: "pending"
                  }
                }
              }
            }
          }
        });
        totalGroupsPipeline.push({
          $match: { status: filterStatus }
        });
      }

      totalGroupsPipeline.push({ $count: "totalGroups" });

      const totalGroupsResult = await FuelDetection.aggregate(totalGroupsPipeline);

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