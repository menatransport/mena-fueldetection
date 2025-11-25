"use client";

import { useState, useEffect } from "react";
import { useFuelData } from "@/contexts/FuelDataContext";

export const Labeling = () => {
  const [markerResults, setMarkerResults] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customMarkers, setCustomMarkers] = useState([]);

  const { selectedGroup, refreshTableData } = useFuelData();
  const currentData = selectedGroup?.items || null;

  const handleMarkerResultChange = (markerId, mongoId, result) => {
    setMarkerResults((prev) => ({
      ...prev,
      [markerId]: {
        ...prev[markerId],
        mongoId: mongoId,
        result: result,
        liter: result === "ผิดปกติ" ? prev[markerId]?.liter || "" : null,
      },
    }));
  };

  const handleDateTimeChange = (markerId, datetime) => {
    setCustomMarkers((prev) =>
      prev.map((marker) =>
        marker.mark_id === markerId
          ? { ...marker, datetime5mins: datetime }
          : marker
      )
    );
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
        newState[item.mark_id] = {
          mongoId: item._id,
          result: "ปกติ",
          liter: null,
        };
      });
    }

    customMarkers.forEach((marker) => {
      newState[marker.mark_id] = {
        mongoId: null,
        result: "ปกติ",
        liter: null,
        isCustom: true,
      };
    });
    setMarkerResults(newState);
  };

  const handleSelectAllAbnormal = () => {
    const newState = {};
    if (currentData) {
      currentData.forEach((item) => {
        newState[item.mark_id] = {
          mongoId: item._id,
          result: "ผิดปกติ",
          liter: markerResults[item.mark_id]?.liter || "",
        };
      });
    }

    customMarkers.forEach((marker) => {
      newState[marker.mark_id] = {
        mongoId: null,
        result: "ผิดปกติ",
        liter: markerResults[marker.mark_id]?.liter || "",
        isCustom: true,
      };
    });
    setMarkerResults(newState);
  };

  const handleAddCustomMarker = () => {
    const existingMarkerIds = [
      ...(currentData ? currentData.map((item) => item.mark_id) : []),
      ...customMarkers.map((marker) => marker.mark_id),
    ];

    const nextMarkerId =
      existingMarkerIds.length > 0 ? Math.max(...existingMarkerIds) + 1 : 1;

    const newCustomMarker = {
      mark_id: nextMarkerId,
      _id: `custom_${Date.now()}`,
      datetime5mins: null,
      fuel_diff_5min_ago: 0,
      result: null,
      liter: null,
      isCustom: true,
    };

    setCustomMarkers((prev) => [...prev, newCustomMarker]);
  };

  const handleDeleteCustomMarker = (markerId) => {
    setCustomMarkers((prev) =>
      prev.filter((marker) => marker.mark_id !== markerId)
    );
    setMarkerResults((prev) => {
      const newResults = { ...prev };
      delete newResults[markerId];
      return newResults;
    });
  };

  const handleSave = async () => {
    const updates = [];
    const newRecords = [];
    const incompleteMarkers = [];
    const incompleteCustomMarkers = [];

    Object.entries(markerResults).forEach(([markerId, data]) => {
      const markerData = allMarkerData.find(
        (item) => item.mark_id === parseInt(markerId)
      );
      const isCustomMarker = markerData?.isCustom;

      if (data.result === "ผิดปกติ" && !data.liter) {
        if (isCustomMarker) {
          incompleteCustomMarkers.push(markerId);
        } else {
          incompleteMarkers.push(markerId);
        }
      } else if (isCustomMarker && !markerData?.datetime5mins) {
        incompleteCustomMarkers.push(`${markerId} (ไม่มี datetime)`);
      } else if (data.result) {
        if (isCustomMarker) {
          newRecords.push({
            mark_id: parseInt(markerId),
            datetime5mins: markerData?.datetime5mins,
            result: data.result,
            liter:
              data.result === "ผิดปกติ" ? parseFloat(data.liter) || 0 : null,
            fuel_diff_5min_ago: null,
            group_id: selectedGroup?.id || null,
          });
        } else {
          updates.push({
            _id: data.mongoId,
            mark_id: parseInt(markerId),
            result: data.result,
            liter:
              data.result === "ผิดปกติ" ? parseFloat(data.liter) || 0 : null,
          });
        }
      }
    });

    if (incompleteMarkers.length > 0 || incompleteCustomMarkers.length > 0) {
      let errorMessage = "";
      if (incompleteMarkers.length > 0) {
        errorMessage += `กรุณากรอกจำนวนลิตรสำหรับ Marker ผิดปกติ: ${incompleteMarkers.join(
          ", "
        )}\n`;
      }
      if (incompleteCustomMarkers.length > 0) {
        errorMessage += `กรุณากรอกข้อมูลให้สมบูรณ์สำหรับ Marker ใหม่: ${incompleteCustomMarkers.join(
          ", "
        )}`;
      }
      alert(errorMessage);
      return;
    }

    if (updates.length === 0 && newRecords.length === 0) {
      alert("กรุณาเลือกระดับน้ำมันสำหรับ Marker อย่างน้อย 1 รายการ");
      return;
    }

    try {
      setIsSubmitting(true);
      let successCount = 0;
      let errors = [];

      // บันทึกข้อมูลเดิม (PUT)
      if (updates.length > 0) {
        try {
          const updateResponse = await fetch("/api/update", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ updates }),
          });

          const updateResult = await updateResponse.json();

          if (updateResult.success) {
            successCount += updates.length;
          } else {
            errors.push(`อัพเดท: ${updateResult.message}`);
          }
        } catch (error) {
          errors.push(`อัพเดท: ${error.message}`);
        }
      }

      // บันทึกข้อมูลใหม่ (POST)
      if (newRecords.length > 0) {
        try {
          const createResponse = await fetch("/api/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ records: newRecords }),
          });

          const createResult = await createResponse.json();

          if (createResult.success) {
            successCount += newRecords.length;
            setCustomMarkers([]);
          } else {
            errors.push(`เพิ่มใหม่: ${createResult.message}`);
          }
        } catch (error) {
          errors.push(`เพิ่มใหม่: ${error.message}`);
        }
      }

      if (successCount > 0) {
        refreshTableData();
        if (errors.length === 0) {
          alert(`บันทึกข้อมูลสำเร็จ ${successCount} จุด`);
        } else {
          alert(
            `บันทึกข้อมูลสำเร็จ ${successCount} จุด\nมีข้อผิดพลาด: ${errors.join(
              ", "
            )}`
          );
        }
      } else {
        throw new Error(errors.join(", ") || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsSubmitting(false);
      // ปิดโหลดหน้ากราฟ

    }
  };

  useEffect(() => {
    console.log('currentData', currentData);
    if (currentData && currentData.length > 0) {
      const results = {};
      currentData.forEach((item) => {
        results[item.mark_id] = {
          mongoId: item._id,
          result: item.result,
          liter: item.liter || null,
        };
      });
      setMarkerResults(results);
    } else {
      setMarkerResults({});
    }

    setCustomMarkers([]);
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
  const allMarkerData = [...(currentData || []), ...customMarkers];

  const uniqueMarkerIds = [
    ...new Set(allMarkerData.map((item) => item.mark_id)),
  ].sort((a, b) => a - b);

  return (
    <div className="w-auto max-h-auto bg-white rounded-lg shadow-xl m-4 overflow-y-auto">
      {/* Actions Bar */}
      <div className="flex justify-between items-center p-4 bg-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl animate-bounceIn">🏷️</div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Labeling
            </h2>
          </div>
          <button
            onClick={handleAddCustomMarker}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 group"
          >
            <svg
              className="w-4 h-4 group-hover:animate-bounce"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-lg">เพิ่มข้อมูล</span>
          </button>
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
            <span className="text-lg">ผิดปกติทั้งหมด</span>
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
      <div className="mb-2">
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
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-lg font-semibold text-gray-700">
                    <span className="text-green-600">ปกติ</span>
                  </th>
                  <th className="px-4 py-3 text-left text-lg font-semibold text-gray-700">
                    <span className="text-orange-600">ผิดปกติ</span>
                  </th>
                  <th className="px-4 py-3 text-left text-lg font-semibold text-gray-700">
                    Fuel Diff (5min)
                  </th>
                  <th className="px-4 py-3 text-center text-lg font-semibold text-gray-700">
                    <span className="text-blue-600">จำนวนลิตรน้ำมัน</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {uniqueMarkerIds.map((markerId) => {
                  const markerData = allMarkerData.find(
                    (item) => item.mark_id === markerId
                  );
                  const currentResult = markerResults[markerId];
                  const isCustomMarker = markerData?.isCustom;

                  return (
                    <tr
                      key={markerId}
                      className={`hover:bg-blue-50 transition-colors ${currentResult?.result === "ปกติ"
                          ? "bg-white"
                          : currentResult?.result === "ผิดปกติ"
                            ? "bg-white"
                            : "bg-gray-50"
                        }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xl font-semibold font-mono ${isCustomMarker
                                ? "text-green-600"
                                : "text-gray-900"
                              }`}
                          >
                            {markerId}
                            {isCustomMarker && (
                              <span className="ml-2 text-md bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                NEW
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-start">
                          <span
                            className={`text-xl font-medium px-2 py-1 rounded font-mono`}
                          >
                            {markerData?.datetime5mins &&
                              !customMarkers.find(
                                (m) => m.mark_id === markerId
                              ) ? (
                              markerData?.datetime5mins.slice(0, 16).split('T', 2)[0] + ' ' + markerData?.datetime5mins.slice(0, 16).split('T', 2)[1]
                            ) : (
                              <input
                                type="text"
                                className="border font-[system-ui] border-gray-300 bg-white text-left rounded px-1 py-1 w-52"
                                placeholder="YYYY-MM-DD HH:MM"
                                onChange={(e) =>
                                  handleDateTimeChange(markerId, e.target.value)
                                }
                              />
                            )}
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
                            checked={currentResult?.result === "ผิดปกติ"}
                            onChange={() =>
                              handleMarkerResultChange(
                                markerId,
                                markerData?._id,
                                "ผิดปกติ"
                              )
                            }
                            className="sr-only"
                          />
                          {currentResult?.result === "ผิดปกติ" ? (
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
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span
                            className={`text-xl font-medium font-mono px-2 py-1 rounded-md ${isCustomMarker
                                ? "text-purple-700 bg-purple-50"
                                : markerData?.fuel_diff_5min_ago
                                  ? parseFloat(markerData.fuel_diff_5min_ago) > 0
                                    ? "text-green-700 bg-green-50"
                                    : parseFloat(markerData.fuel_diff_5min_ago) <
                                      0
                                      ? "text-red-700 bg-red-50"
                                      : "text-gray-700 bg-gray-50"
                                  : "text-gray-500"
                              }`}
                          >
                            {isCustomMarker
                              ? ""
                              : markerData?.fuel_diff_5min_ago
                                ? `${markerData.fuel_diff_5min_ago.toFixed(2)} L`
                                : "N/A"}
                          </span>
                        </div>
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
                            disabled={currentResult?.result !== "ผิดปกติ"}
                            className={`w-24 h-10 px-3 py-2 text-center border-2 rounded-xl text-lg font-semibold transition-all duration-300 ${currentResult?.result === "ผิดปกติ"
                                ? "border-orange-400 bg-white text-orange-800 focus:ring-4 focus:ring-orange-200 focus:border-orange-500 shadow-md hover:shadow-lg transform hover:scale-105"
                                : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isCustomMarker && (
                          <button
                            onClick={() => handleDeleteCustomMarker(markerId)}
                            className="ml-2 p-2 bg-red-100 hover:bg-red-200 text-red-600 hover:scale-110 cursor-pointer rounded-full transition-colors duration-200 group"
                            title="ลบ Marker นี้"
                          >
                            <svg
                              className="w-8 h-8 group-hover:animate-pulse"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                                clipRule="evenodd"
                              />
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Status Summary */}
          <div className="border-t border-gray-200">
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
                    ผิดปกติ:{" "}
                    {
                      Object.values(markerResults).filter(
                        (v) => v?.result === "ผิดปกติ"
                      ).length
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
