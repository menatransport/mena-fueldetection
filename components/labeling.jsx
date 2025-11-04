"use client";

import { useState, useEffect } from "react";
import { useFuelData } from "@/contexts/FuelDataContext";

export const Labeling = () => {
  const [markerResults, setMarkerResults] = useState({}); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { selectedGroup, refreshTableData } = useFuelData();
  const currentData = selectedGroup?.items || null;

  const handleMarkerResultChange = (markerId, mongoId, result) => {
    setMarkerResults((prev) => ({
      ...prev,
      [markerId]: {
        ...prev[markerId],
        mongoId: mongoId,
        result: result,
        liter: result === "ไม่ปกติ" ? prev[markerId]?.liter || "" : null,
      },
    }));
  };

  const handleLiterChange = (markerId, liter) => {
    setMarkerResults((prev) => ({
      ...prev,
      [markerId]: {
        ...prev[markerId],
        liter: liter,
      },
    }));
  };

  const handleSelectAllNormal = () => {
    const newState = {};
    if (currentData) {
      currentData.forEach((item) => {
        newState[item.marker_id] = {
          mongoId: item._id,
          result: "ปกติ",
          liter: null,
        };
      });
    }
    setMarkerResults(newState);
  };


  const handleSelectAllAbnormal = () => {
    const newState = {};
    if (currentData) {
      currentData.forEach((item) => {
        newState[item.marker_id] = {
          mongoId: item._id,
          result: "ไม่ปกติ",
          liter: markerResults[item.marker_id]?.liter || "",
        };
      });
    }
    setMarkerResults(newState);
  };

  const handleSave = async () => {
    const updates = [];
    const incompleteMarkers = [];

    Object.entries(markerResults).forEach(([markerId, data]) => {
      if (
        data.result === "ไม่ปกติ" &&
        (!data.liter)
      ) {
        incompleteMarkers.push(markerId);
      } else if (data.result) {
        updates.push({
          _id: data.mongoId,
          marker_id: parseInt(markerId),
          result: data.result,
          liter:
            data.result === "ไม่ปกติ" ? (parseFloat(data.liter) || 0) : null,
        });
      }
    });

    if (incompleteMarkers.length > 0) {
      alert(
        `กรุณากรอกจำนวนลิตรสำหรับ Marker ที่ไม่ปกติ: ${incompleteMarkers.join(
          ", "
        )}`
      );
      return;
    }

    if (updates.length === 0) {
      alert("กรุณาเลือกระดับน้ำมันสำหรับ Marker อย่างน้อย 1 รายการ");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Sending updates:", updates);

      const response = await fetch("/api/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      const result = await response.json();

      if (result.success) {

        refreshTableData();
        alert( `บันทึกข้อมูลสำเร็จ ${updates.length} จุด`);
      } else {
        throw new Error(result.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (currentData && currentData.length > 0) {
      const results = {};
      console.log("Current data for labeling:", currentData);
      currentData.forEach((item) => {
    
        results[item.marker_id] = {
          mongoId: item._id,
          result: item.result,
          liter: item.liter || null, 
        };
      });
      setMarkerResults(results);
    } else {
      setMarkerResults({});
    }
  }, [selectedGroup, currentData]);

  if (!selectedGroup) {
    return (
      <div className="w-full h-full bg-white rounded-lg shadow-lg p-6 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🏷️</div>
          <p className="text-lg font-medium">เลือกกลุ่มข้อมูล</p>
          <p className="text-lg">คลิกปุ่ม "View" จากตารางเพื่อเริ่ม Labeling</p>
        </div>
      </div>
    );
  }

  if (!currentData || currentData.length === 0) {
    return (
      <div className="w-full h-full bg-white rounded-lg shadow-lg p-6 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">ไม่มีข้อมูล Marker</p>
          <p className="text-lg">กลุ่ม: {selectedGroup.id}</p>
        </div>
      </div>
    );
  }

  const uniqueMarkerIds = [
    ...new Set(currentData.map((item) => item.marker_id)),
  ].sort((a, b) => a - b);

  return (
    <div className="w-full max-h-auto bg-white rounded-lg shadow-lg p-2 overflow-y-auto">
      {/* Actions Bar */}
      <div className="flex justify-between items-center p-4 bg-white">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="text-4xl animate-bounceIn">🏷️</div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Labeling
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSelectAllNormal}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 group"
          >
            <svg
              className="w-4 h-4 group-hover:animate-bounce"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-lg">ปกติทั้งหมด</span>
          </button>
          <button
            onClick={handleSelectAllAbnormal}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 group"
          >
            <svg
              className="w-4 h-4 group-hover:animate-pulse"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-lg">ไม่ปกติทั้งหมด</span>
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={Object.keys(markerResults).length === 0 || isSubmitting}
          className="relative px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-lg font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span className="animate-pulse">กำลังบันทึก...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 transform transition-transform duration-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              <span className="text-xl font-semibold">บันทึกข้อมูล</span>
            </>
          )}
        </button>
      </div>

      {/* Mark ID Selection Table */}
      <div className="mb-3">
        <div className="bg-gray-100 rounded-lg p-2">
          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-y-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-white shadow-lg sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-lg font-semibold text-gray-700">
                    Mark ID
                  </th>
                  <th className="px-4 py-3 text-left text-lg font-semibold text-gray-700">
                    <span className="text-green-600">ปกติ</span>
                  </th>
                  <th className="px-4 py-3 text-left text-lg font-semibold text-gray-700">
                    <span className="text-orange-600">ไม่ปกติ</span>
                  </th>
                  <th className="px-4 py-3 text-center text-lg font-semibold text-gray-700">
                    <span className="text-blue-600">จำนวนลิตรน้ำมัน</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {uniqueMarkerIds.map((markerId) => {
                  const markerData = currentData.find(
                    (item) => item.marker_id === markerId
                  );
                  const currentResult = markerResults[markerId];

                  return (
                    <tr
                      key={markerId}
                      className={`hover:bg-blue-50 transition-colors ${
                        currentResult?.result === "ปกติ"
                          ? "bg-white"
                          : currentResult?.result === "ไม่ปกติ"
                          ? "bg-white"
                          : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="text-xl font-semibold text-gray-900 font-mono">
                            {markerId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name={`marker_${markerId}`}
                            checked={currentResult?.result === "ปกติ"}
                            onChange={() =>
                              handleMarkerResultChange(
                                markerId,
                                markerData?._id,
                                "ปกติ"
                              )
                            }
                            className="sr-only"
                          />
                          {currentResult?.result === "ปกติ" ? (
                            <div className="flex items-center justify-center w-22 h-8 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">
                              <svg
                                className="w-8 h-8 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-lg font-bold">OK</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-16 h-8 bg-gray-200 text-gray-500 rounded-full hover:bg-green-100 hover:text-green-600 transition-all duration-300 transform hover:scale-105">
                              <span className="text-lg font-medium">เลือก</span>
                            </div>
                          )}
                        </label>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name={`marker_${markerId}`}
                            checked={currentResult?.result === "ไม่ปกติ"}
                            onChange={() =>
                              handleMarkerResultChange(
                                markerId,
                                markerData?._id,
                                "ไม่ปกติ"
                              )
                            }
                            className="sr-only"
                          />
                          {currentResult?.result === "ไม่ปกติ" ? (
                            <div className="flex items-center justify-center w-28 h-8 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-full shadow-lg transform hover:scale-105 transition-all">
                              <svg
                                className="w-8 h-8 mr-1 "
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-lg font-bold">WARN</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-20 h-8 bg-gray-200 text-gray-500 rounded-full hover:bg-orange-100 hover:text-orange-600 transition-all duration-300 transform hover:scale-105">
                              <span className="text-lg font-medium">เลือก</span>
                            </div>
                          )}
                        </label>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="0.0"
                            value={currentResult?.liter || ""}
                            onChange={(e) =>
                              handleLiterChange(markerId, e.target.value)
                            }
                            disabled={currentResult?.result !== "ไม่ปกติ"}
                            className={`w-24 h-10 px-3 py-2 text-center border-2 rounded-xl text-lg font-semibold transition-all duration-300 ${
                              currentResult?.result === "ไม่ปกติ"
                                ? "border-orange-400 bg-white text-orange-800 focus:ring-4 focus:ring-orange-200 focus:border-orange-500 shadow-md hover:shadow-lg transform hover:scale-105"
                                : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Status Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-gray-700">
                  ทั้งหมด: {uniqueMarkerIds.length} จุด
                </span>
              </div>
              <div className="flex space-x-3">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
              
                  <span className="font-semibold text-gray-700">
                    ปกติ:{" "}
                    {
                      Object.values(markerResults).filter(
                        (v) => v?.result === "ปกติ"
                      ).length
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
               
                  <span className="font-semibold text-gray-700">
                    ไม่ปกติ:{" "}
                    {
                      Object.values(markerResults).filter(
                        (v) => v?.result === "ไม่ปกติ"
                      ).length
                    }
                  </span>
                </div>
                {/* <div className="hidden items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="font-semibold text-gray-600">
                    ยังไม่ตัดสินใจ:{" "}
                    {uniqueMarkerIds.length - Object.keys(markerResults).length}
                  </span>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
