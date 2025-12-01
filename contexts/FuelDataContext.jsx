'use client';

import { createContext, useContext, useState } from 'react';

const FuelDataContext = createContext();

export const useFuelData = () => {
  const context = useContext(FuelDataContext);
  if (!context) {
    return { selectedGroup: null, selectGroup: () => {} }; 
  }
  return context;
};

export const FuelDataProvider = ({ children }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [allGroups, setAllGroups] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pagination, setPagination] = useState({});
  const [onPageChangeCallback, setOnPageChangeCallback] = useState(null);
  const [refreshTableCallback, setRefreshTableCallback] = useState(null);
  const [justWrapped, setJustWrapped] = useState(false);

  const selectGroup = (group) => {
    console.log("Selecting group:", group);
    setSelectedGroup(group);
    console.log("Selected group set to:", allGroups);
    const index = allGroups.findIndex(g => g.id === group.id);
    if (index !== -1) {
      setCurrentIndex(index);
    }
    setJustWrapped(false); 
  };

  const setGroupsData = (groups) => {
    console.log("Setting groups data:", groups);
    setAllGroups(groups);
  };

  const navigateToPrevious = () => {
    if (allGroups.length > 0) {
      if (currentIndex > 0) {
        // ยังอยู่ในหน้าเดิม - ไปรายการก่อนหน้า
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        setSelectedGroup(allGroups[newIndex]);
        return { success: true, group: allGroups[newIndex], needPageChange: false };
      } else {
        // อยู่ที่รายการแรก - ไปหน้าก่อนหน้าถ้ามี
        if (pagination.hasPrev && onPageChangeCallback) {
          onPageChangeCallback('previous');
          setCurrentIndex(allGroups.length - 1); // รีเซ็ต index สำหรับหน้าก่อนหน้า
          return { success: true, group: null, needPageChange: true };
        } else {
          // ไม่มีหน้าก่อนหน้า - วนไปรายการสุดท้ายของหน้าปัจจุบัน
          const newIndex = allGroups.length - 1;
          setCurrentIndex(newIndex);
          setSelectedGroup(allGroups[newIndex]);
          return { success: true, group: allGroups[newIndex], needPageChange: false };
        }
      }
    }
    return { success: false, group: null, needPageChange: false };
  };

  const navigateToNext = () => {
    if (allGroups.length > 0) {
      if (currentIndex < allGroups.length - 1) {
        // ยังอยู่ในหน้าเดิม - ไปรายการถัดไป
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        setSelectedGroup(allGroups[newIndex]);
        return { success: true, group: allGroups[newIndex], needPageChange: false };
      } else {
        // อยู่ที่รายการสุดท้าย - ไปหน้าถัดไปถ้ามี
        if (pagination.hasNext && onPageChangeCallback) {
          onPageChangeCallback('next');
          setCurrentIndex(0); // รีเซ็ต index สำหรับหน้าถัดไป
          return { success: true, group: null, needPageChange: true };
        } else {
          // ไม่มีหน้าถัดไป - วนกลับไปรายการแรกของหน้าปัจจุบัน
          const newIndex = 0;
          setCurrentIndex(newIndex);
          setSelectedGroup(allGroups[newIndex]);
          return { success: true, group: allGroups[newIndex], needPageChange: false };
        }
      }
    }
    return { success: false, group: null, needPageChange: false };
  };

  const setPaginationData = (paginationInfo) => {
    setPagination(paginationInfo);
  };

  const setPageChangeCallback = (callback) => {
    setOnPageChangeCallback(() => callback);
  };

  const setRefreshTableCallbackHandler = (callback) => {
    setRefreshTableCallback(() => callback);
  };

  const refreshTableData = () => {
    if (refreshTableCallback) {
      refreshTableCallback();
    }
  };


  const value = {
    selectedGroup,
    selectGroup,
    allGroups,
    setGroupsData,
    navigateToPrevious,
    navigateToNext,
    currentIndex,
    setCurrentIndex,
    setPaginationData,
    setPageChangeCallback,
    setRefreshTableCallback: setRefreshTableCallbackHandler,
    refreshTableData,
    justWrapped,
    setJustWrapped,
  };

  return (
    <FuelDataContext.Provider value={value}>
      {children}
    </FuelDataContext.Provider>
  );
};