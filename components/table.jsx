
'use client';

import { useState, useEffect } from 'react';
import { useFuelData } from '@/contexts/FuelDataContext';

export const Table = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [selectedRowId, setSelectedRowId] = useState();
    const { selectGroup, setGroupsData, selectedGroup, setPaginationData, setPageChangeCallback, setRefreshTableCallback } = useFuelData();
    
    const limit = 5; 

    const fetchData = async (page = 1, selectLast = false) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/fuel-data?grouped=true&page=${page}&limit=${limit}`);
            const result = await res.json();
            
            if (result.success) {
                console.log('Fetched data:', result);
                setData(result.data);
                setPagination(result.pagination);
                setGroupsData(result.data);
                setPaginationData(result.pagination);
                
                if (result.data && result.data.length > 0) {
                    const selectedGroup = selectLast ? result.data[result.data.length - 1] : result.data[0];
                    setSelectedRowId(selectedGroup.id);
                    selectGroup(selectedGroup);
                }
            } else {
                setError(result.error || 'Failed to fetch data');
            }
        } catch (err) {
            setError('Network error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = async (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
            await fetchData(newPage);
        }
    };

    const handleNavigationPageChange = async (direction) => {
        let newPage;
        let selectLast = false;
        if (direction === 'next' && pagination.hasNext) {
            newPage = currentPage + 1;
            selectLast = false;
        } else if (direction === 'previous' && pagination.hasPrev) {
            console.log('Previous page:', currentPage - 1);
            newPage = currentPage - 1;
            selectLast = true;
        }
        
        if (newPage) {
            setCurrentPage(newPage);
            await fetchData(newPage, selectLast);
        }
    };

    const handleView = (group) => {
        console.log('Viewing group:', group);
        setSelectedRowId(group.id); 
        selectGroup(group); 
    };

    const getPageNumbers = () => {
        const pages = [];
        const { currentPage, totalPages } = pagination;
        
        if (currentPage > 3) pages.push(1);
        if (currentPage > 4) pages.push('...');
        
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            pages.push(i);
        }
        
        if (currentPage < totalPages - 3) pages.push('...');
        if (currentPage < totalPages - 2) pages.push(totalPages);
        
        return pages;
    };
    const markStatus = (group) => {
        const markedCount = group.items.filter(item => item.result).length;
        if (markedCount < group.count) {
            return { text: 'Pending', bg: 'bg-yellow-100 text-yellow-800' } ;
        } else if (markedCount === group.count) {
            return { text: 'Completed', bg: 'bg-green-100 text-green-800' };
        }   
    }

    useEffect(() => {
        fetchData(currentPage);
    }, []);

    useEffect(() => {
        setPageChangeCallback(handleNavigationPageChange);
    }, [pagination, currentPage]);

    useEffect(() => {
        const refreshTable = () => {
            fetchData(currentPage);
        };
        setRefreshTableCallback(refreshTable);
    }, [currentPage]);

    useEffect(() => {
        if (selectedGroup && selectedGroup.id) {
            setSelectedRowId(selectedGroup.id);
        }
    }, [selectedGroup]);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">กำลังโหลดข้อมูล...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                    <div className="text-red-400">⚠️</div>
                    <div className="ml-3">
                        <h3 className="text-red-800 font-medium">เกิดข้อผิดพลาด</h3>
                        <p className="text-red-700">{error}</p>
                        <button 
                            onClick={() => fetchData(currentPage)}
                            className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                        >
                            ลองใหม่
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* DataTable */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden m-4">
                

                {/* Table */}
                <div className="overflow-x-auto max-h-125 overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-gray-600 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-lg font-medium text-white uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-lg font-medium text-white uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-lg font-medium text-white uppercase tracking-wider">
                                    Mark ID
                                </th>
                                <th className="px-6 py-3 text-left text-lg font-medium text-white uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-center text-lg font-medium text-white uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 ">
                            {data.map((group, index) => (
                                <tr 
                                    key={group.id} 
                                    className={`transition-colors ${
                                        selectedRowId === group.id 
                                            ? 'bg-blue-400 text-white' 
                                            : 'hover:bg-blue-50'
                                    }`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-lg  ${
                                            selectedRowId === group.id ? 'text-white font-bold' : 'text-gray-900 font-medium'
                                        }`}>
                                            {group.id}
                                        </div>
                                        <div className={`text-md ${
                                            selectedRowId === group.id ? 'text-gray-200 font-bold' : 'text-gray-500 font-medium'
                                        }`}>
                                            {group.items?.[0]?.ทะเบียนพาหนะ || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-lg ${
                                            selectedRowId === group.id ? 'text-white font-bold' : 'text-gray-900 font-medium'
                                        }`}>
                                            {group.วันที่ || group.items?.[0]?.วันที่ || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-lg ${
                                            selectedRowId === group.id 
                                                ? 'bg-white text-blue-600 font-bold' 
                                                : 'bg-blue-100 text-blue-800 font-medium'
                                        }`}>
                                            {group.count} รายการ
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-lg  ${
                                            selectedRowId === group.id 
                                                ? 'bg-white text-blue-600 font-bold' 
                                                : markStatus(group).bg +" font-medium"
                                        }`}>
                                            {markStatus(group).text}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => handleView(group)}
                                            className={`inline-flex items-center px-3 py-2 border border-transparent text-lg leading-4  rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                selectedRowId === group.id
                                                    ? 'text-blue-600 bg-white font-bold hover:bg-gray-50 focus:ring-white'
                                                    : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 font-medium'
                                            }`}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={!pagination.hasPrev}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-lg font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                ก่อนหน้า
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={!pagination.hasNext}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-lg font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                ถัดไป
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-lg text-blue-700">
                                    แสดง <span className="font-medium">{(currentPage - 1) * limit + 1}</span> ถึง{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * limit, pagination.totalCount)}
                                    </span>{' '}
                                    จาก <span className="font-medium">{pagination.totalCount}</span> ข้อมูล
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={!pagination.hasPrev}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-lg font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        ‹
                                    </button>
                                    
                                    {getPageNumbers().map((page, index) => (
                                        page === '...' ? (
                                            <span key={index} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-lg font-medium text-gray-700">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={index}
                                                onClick={() => handlePageChange(page)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-lg font-medium ${
                                                    page === currentPage
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ))}
                                    
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={!pagination.hasNext}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-lg font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        ›
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

