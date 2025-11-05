"use client";

import { useState, useEffect } from "react";
import { useFuelData } from "@/contexts/FuelDataContext";

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
      console.log("Loading chart for group:", selectedGroup.chart_url);
      setCurrentImageUrl(selectedGroup.chart_url);
      setIsImageLoaded(false);
    } else {
      setCurrentImageUrl(defaultImageUrl);
      setIsImageLoaded(false);
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
      <div className={`w-full h-full p-1 bg-white rounded-lg shadow-lg`}>
        {/* Chart Container */}
        <div
          className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all duration-300"
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
                alt={`Fuel Detection Chart for ${
                  selectedGroup?.id || "Default"
                }`}
                className={`max-w-full max-h-full object-contain rounded-lg shadow-md transition-all duration-300 transform ${
                  isImageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}

            {/* Fullscreen Icon - มุมขวาบน */}
            {isImageLoaded && (
              <div
                className="absolute top-2 right-2 bg-blue-500 bg-opacity-80 hover:bg-blue-600 text-white p-2 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-110 shadow-lg"
                onClick={openFullscreen}
                title="ขยายเต็มจอ"
              >
                <svg
                  className="w-14 h-14"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </div>
            )}

            <div
              className="absolute bottom-2 right-32 bg-opacity-80 hover:opacity-100 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer transition-all duration-300 transform hover:scale-110 shadow-lg"
              onClick={handlePrevious}
              title={`ไปซ้าย ${
                allGroups.length > 0
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
              className="absolute bottom-2 right-2 bg-opacity-80 hover:opacity-100 bg-blue-500 hover:bg-blue-600 text-white  p-2 rounded-full cursor-pointer transition-all duration-300 transform hover:scale-110 shadow-lg"
              onClick={handleNext}
              title={`ไปขวา ${
                allGroups.length > 0
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
