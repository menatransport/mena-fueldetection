"use client";

import { useState, useEffect } from "react";
import { useFuelData } from "@/contexts/FuelDataContext";
import { Expand, ChartLine, Truck } from "lucide-react";
import Swal from "sweetalert2";

export const Graph = () => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const {
    selectedGroup,
    navigateToPrevious,
    navigateToNext,
    allGroups,
    currentIndex,
  } = useFuelData();
  const defaultImageUrl = "/opengraph.jpg";

  useEffect(() => {
    if (selectedGroup && selectedGroup.chart_url) {
      // console.log("Loading chart for group:", selectedGroup.chart_url);
      setCurrentImageUrl(selectedGroup.chart_url);
      setIsImageLoaded(true);

    } else {
      setCurrentImageUrl(defaultImageUrl);
      setIsImageLoaded(true);
    }
  }, [selectedGroup]);



  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const handleImageError = () => {
    setIsImageLoaded(false);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const handlePrevious = () => {
    navigateToPrevious();
  };

  const handleNext = () => {
    navigateToNext();
  };

  const graphRejection = (message) => {
    console.log(message);
    Swal.fire({
      title: "คุณแน่ใจที่จะปฏิเสธกราฟหรือไม่?",
      text: "แจ้งรายงาน : " + message + "!",
      icon: "warning",
      showCancelButton: true,
      allowOutsideClick: false,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "ยืนยัน"
    }).then(async (result) => {
      if (result.isConfirmed) {

        console.log("selectedGroup : ", selectedGroup)
        const updates = selectedGroup.items.map((item) => ({
          _id: item._id,
          result: message,
          updated_at: new Date()
        }));

        const res = await fetch("/api/graphreject", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ updates }),
        });
        const data = await res.json();
        console.log("data : ", data)
        if (data.success) {
          Swal.fire({
            title: "บันทึกสำเร็จ!",
            text: "ข้อมูลถูกบันทึกเรียบร้อยแล้ว.",
            icon: "success"
          });
          refreshTableData();
        }

      }
    });
  }

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "ArrowLeft") {
        handlePrevious();
      } else if (event.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [allGroups, currentIndex]);

  return (
    <>
      <div className={`w-auto h-full p-1 rounded-lg`}>
        {/* Chart Container */}
        <div
          className="relative bg-gray-100 m-3  rounded-lg p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all duration-300"
          style={{
            width: `auto`,
            height: `auto`,
            minWidth: "300px",
            minHeight: "300px",
            maxWidth: "100%",
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Loading State */}
            {!isImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">กำลังโหลดกราฟ...</p>
                  <p className="text-sm text-gray-400">
                    {selectedGroup?.id || "Default"}
                  </p>
                </div>
              </div>
            )}

            {/* Main Chart Image */}
            {currentImageUrl && (
              <img
                src={currentImageUrl}
                alt={`Fuel Detection Chart for ${selectedGroup?.id || "Default"
                  }`}
                className={`max-w-full object-contain rounded-lg shadow-md transition-all duration-300 transform ${isImageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}

            {isImageLoaded && (
              <div>

                <div className="absolute top-2 right-56 flex flex-col items-center justify-center hover:scale-110 "
                  onClick={() => graphRejection("รถไม่ได้วิ่งงาน")}
                >
                  <div className="bg-red-500 bg-opacity-80 cursor-pointer hover:bg-red-600 text-white p-2 rounded-lg shadow-lg  transition-all duration-300 transform ">
                    <Truck className="w-14 h-14" />
                  </div>
                  <p className="mt-1 text-lg ">รถไม่ได้วิ่งงาน</p>
                </div>

                <div className="absolute top-2 right-28 flex flex-col items-center justify-center hover:scale-110 "
                  onClick={() => graphRejection("กราฟมีปัญหา")}
                >
                  <div className="bg-red-500 bg-opacity-80 cursor-pointer hover:bg-red-600 text-white p-2 rounded-lg shadow-lg  transition-all duration-300 transform ">
                    <ChartLine className="w-14 h-14" />
                  </div>
                  <p className="mt-1 text-lg">กราฟมีปัญหา</p>
                </div>

                <div
                  className="absolute top-2 right-2 bg-blue-500 bg-opacity-80 hover:bg-blue-600 text-white p-2 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-110 shadow-lg"
                  onClick={openFullscreen}
                  title="ขยายเต็มจอ"
                >
                  <Expand className="w-14 h-14" />

                </div>
              </div>
            )}

            {(selectedGroup?.items?.[0]?.result == "รถไม่ได้วิ่งงาน" || selectedGroup?.items?.[0]?.result == "กราฟมีปัญหา") && (
              <div className="absolute inset-0 flex justify-center items-center text-center 
                bg-red-600 opacity-50 animate-pulse hover:bg-red-600 
                text-white p-2 rounded-lg cursor-not-allowed 
                transition-all duration-300 transform shadow-lg">

                <p className="text-5xl font-bold animate-pulse">
                  {selectedGroup?.items?.[0]?.result}
                </p>
              </div>

            )}

            <div
              className={`absolute bottom-2 right-32 bg-opacity-80 hover:opacity-100 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer transition-all duration-300 transform hover:scale-110 shadow-lg ${isImageLoaded ? "opacity-100" : "opacity-0"
                }`}
              onClick={handlePrevious}
              title={`ไปซ้าย ${allGroups.length > 0
                ? `(${currentIndex + 1}/${allGroups.length})`
                : ""
                }`}
            >
              <svg
                className="w-14 h-14 text-white hover:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </div>
            <div
              className={`absolute bottom-2 right-2 bg-opacity-80 hover:opacity-100 bg-blue-500 hover:bg-blue-600 text-white  p-2 rounded-full cursor-pointer transition-all duration-300 transform hover:scale-110 shadow-lg ${isImageLoaded ? "opacity-100" : "opacity-0"
                }`}
              onClick={handleNext}
              title={`ไปขวา ${allGroups.length > 0
                ? `(${currentIndex + 1}/${allGroups.length})`
                : ""
                }`}
            >
              <svg
                className="w-14 h-14 text-white hover:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2"
          onClick={closeFullscreen}
        >
          <div
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeFullscreen}
              className="absolute m-2 -top-auto right-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-300 font-medium z-10 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              ปิด
            </button>

            {/* Fullscreen Image */}
            <img
              src={currentImageUrl}
              alt={`Full Size Chart for ${selectedGroup?.id || "Default"}`}
              className="max-w-full max-h-[1200px] object-contain rounded-lg shadow-2xl border-4 border-white"
            />
          </div>
        </div>
      )}
    </>
  );
};
