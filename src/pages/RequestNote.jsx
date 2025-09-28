import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Plus,
    Filter,
    FileSpreadsheet,
    HandHelping,
    File,
    Search,
    Package,
    AlertTriangle,
    CheckCircle,
    ChevronUp,
    ChevronDown,
    X,
    TrendingUp,
    TrendingDown,
    RotateCcw,
    Eye,
    XCircle,
    Clock,
    User
} from 'lucide-react';

const RequestNote = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Sorting state
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');

    // Advanced filters
    const [advancedFilters, setAdvancedFilters] = useState({
        userId: '',
        startDate: '',
        endDate: ''
    });

    // Modal state for viewing request details
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Fungsi untuk mengambil data item requests dari API
    const fetchRequests = async (page = 1) => {
        try {
            setLoading(true);

            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

            if (!token) {
                setError('Token tidak ditemukan. Silakan login terlebih dahulu.');
                return;
            }

            const params = new URLSearchParams({
                page: page.toString()
            });

            if (filterStatus !== 'all') {
                params.append('status', filterStatus);
            }

            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            const response = await axios.get(`http://127.0.0.1:8000/api/item-requests?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data.success) {
                const data = response.data.data;
                setRequests(data.data || []);
                setCurrentPage(data.current_page || 1);
                setTotalPages(data.last_page || 1);
                setError(null);
            } else {
                setError('Gagal mengambil data requests');
            }
        } catch (err) {
            console.error('Error fetching requests:', err);
            if (err.response?.status === 401) {
                setError('Sesi login telah berakhir. Silakan login kembali.');
            } else {
                setError('Gagal mengambil data requests');
            }
        } finally {
            setLoading(false);
        }
    };

    // Panggil fetchRequests saat komponen dimount atau filter berubah
    useEffect(() => {
        fetchRequests(1);
    }, [filterStatus, searchQuery]);

    // Sorting function
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Get sorted data
    const getSortedData = (data) => {
        return [...data].sort((a, b) => {
            let aValue, bValue;

            switch (sortField) {
                case 'request_number':
                    aValue = a.request_number;
                    bValue = b.request_number;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'items_count':
                    aValue = a.details?.length || 0;
                    bValue = b.details?.length || 0;
                    break;
                case 'created_at':
                    aValue = new Date(a.created_at);
                    bValue = new Date(b.created_at);
                    break;
                default:
                    aValue = a[sortField];
                    bValue = b[sortField];
            }

            if (sortDirection === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
    };

    // Export to Excel
    const exportToExcel = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Riwayat Permintaan');

            // Add headers
            const headers = ['Request Number', 'User', 'Status', 'Total Items', 'Note', 'Created At'];
            worksheet.addRow(headers);

            // Add data
            filteredItems.forEach(item => {
                worksheet.addRow([
                    item.request_number,
                    item.user?.name || 'Unknown User',
                    item.status,
                    item.details?.length || 0,
                    item.note || '-',
                    new Date(item.created_at).toLocaleDateString()
                ]);
            });

            // Generate and download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `item_requests_${new Date().toISOString().slice(0, 10)}.xlsx`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Failed to export Excel file');
        }
    };

    // Export to PDF
    const exportToPDF = () => {
        try {
            const doc = new jsPDF();

            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Item Request Report', 14, 20);

            // Date
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

            // Table data
            const tableColumns = ['Request Number', 'User', 'Status', 'Items', 'Created At'];
            const tableRows = filteredItems.map(item => [
                item.request_number,
                item.user?.name || 'Unknown',
                item.status,
                item.details?.length || 0,
                new Date(item.created_at).toLocaleDateString()
            ]);

            // Generate table
            autoTable(doc, {
                head: [tableColumns],
                body: tableRows,
                startY: 40,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [230, 230, 250],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                }
            });

            doc.save(`item_requests_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            alert('Failed to export PDF file');
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setFilterStatus('all');
        setAdvancedFilters({
            userId: '',
            startDate: '',
            endDate: ''
        });
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'draft':
                return <Clock className="w-4 h-4 text-gray-500" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'approved':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'partially_approved':
                return <TrendingUp className="w-4 h-4 text-cyan-500" />;
            case 'completed':
                return <Package className="w-4 h-4 text-blue-500" />;
            default:
                return <Package className="w-4 h-4 text-black" />;
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'partially_approved':
                return 'bg-cyan-100 text-cyan-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-black text-black';
        }
    };


    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // View request details
    const handleViewDetails = async (requestId) => {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

            const response = await axios.get(`http://127.0.0.1:8000/api/item-requests/${requestId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data.success) {
                setSelectedRequest(response.data.data);
                setShowDetailModal(true);
            } else {
                alert('Gagal memuat detail request');
            }
        } catch (error) {
            console.error('Error fetching request details:', error);
            alert('Terjadi kesalahan saat memuat detail request');
        }
    };

    const handleCancelRequest = async (requestId) => {
        if (!window.confirm('Apakah Anda yakin ingin membatalkan request ini? Stok akan dikembalikan?')) return;

        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

            const response = await axios.post(
                `http://127.0.0.1:8000/api/item-requests/${requestId}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                alert('Request berhasil dibatalkan dan stok dikembalikan!');
                fetchRequests(currentPage);
            } else {
                alert('Gagal membatalkan request: ' + response.data.message);
            }
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat membatalkan request');
        }
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            fetchRequests(newPage);
        }
    };

    // Tampilkan loading state
    if (loading && requests.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    // Tampilkan error state
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={() => fetchRequests(1)}
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    // Filter data
    const filteredItems = getSortedData(requests.filter((item) => {
        const matchesUserId = !advancedFilters.userId ||
            item.user_id.toString().includes(advancedFilters.userId);
        const matchesStartDate = !advancedFilters.startDate ||
            new Date(item.created_at) >= new Date(advancedFilters.startDate);
        const matchesEndDate = !advancedFilters.endDate ||
            new Date(item.created_at) <= new Date(advancedFilters.endDate);

        return matchesUserId && matchesStartDate && matchesEndDate;
    }));

    // Render sort icon
    const renderSortIcon = (field) => {
        if (sortField !== field) {
            return <div className="w-4 h-4"></div>;
        }
        return sortDirection === 'asc' ?
            <ChevronUp className="w-4 h-4" /> :
            <ChevronDown className="w-4 h-4" />;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Riwayat Permintaan</h1>
                    <p className="text-gray-600 mt-1">Merekam segala permintaan yang dilakukan oleh pengguna</p>
                </div>

                <button
                    onClick={() => fetchRequests(currentPage)}
                    className="px-4 py-2 border font-medium text-white bg-green-500 border-gray-300 rounded-xl hover:bg-green-700 transition-colors"
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari berdasarkan request number atau nama user"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">Semua Status</option>
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="partially_approved">Partially Approved</option>
                                <option value="completed">Completed</option>
                            </select>


                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Filter Lanjutan
                            </button>

                            <button
                                onClick={exportToExcel}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Excel
                            </button>

                            <button
                                onClick={exportToPDF}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                            >
                                <File className="w-4 h-4 mr-2" />
                                PDF
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div className="border-t pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                                    <input
                                        type="text"
                                        placeholder="User ID"
                                        value={advancedFilters.userId}
                                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, userId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                                    <input
                                        type="date"
                                        value={advancedFilters.startDate}
                                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                                    <input
                                        type="date"
                                        value={advancedFilters.endDate}
                                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, endDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Reset Filter
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('request_number')}
                                >
                                    <div className="flex items-center justify-between">
                                        Request Number
                                        {renderSortIcon('request_number')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center justify-between">
                                        Status
                                        {renderSortIcon('status')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Items Requested
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Catatan
                                </th>
                                <th
                                    className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('created_at')}
                                >
                                    <div className="flex items-center justify-between">
                                        Tanggal
                                        {renderSortIcon('created_at')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredItems.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {item.request_number}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                            {getStatusIcon(item.status)}
                                            <span className="ml-1 capitalize">{item.status}</span>
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="max-w-xs">
                                            {item.details && item.details.length > 0 ? (
                                                <div className="space-y-1">
                                                    {item.details.slice(0, 3).map((detail, idx) => (
                                                        <div key={idx} className="flex items-center text-xs">
                                                            <div className="w-4 h-4 bg-green-500 rounded mr-2 flex-shrink-0 flex items-center justify-center">
                                                                <Package className="w-2 h-2 text-white" />
                                                            </div>
                                                            <span className="truncate font-medium">
                                                                {detail.name || detail.product?.name || `Product ID: ${detail.product_id}`}
                                                            </span>
                                                            <span className="ml-2 text-gray-500 flex-shrink-0">
                                                                ({detail.requested_quantity}x)
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {item.details.length > 3 && (
                                                        <div className="text-xs text-gray-500 font-medium">
                                                            +{item.details.length - 3} item lainnya
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500">No items</span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        {item.note || '-'}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        {formatDate(item.created_at)}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button
                                                onClick={() => handleViewDetails(item.id)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            {item.status === 'draft' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateRequest(item.id)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Update Request"
                                                    >
                                                        <HandHelping className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelRequest(item.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Cancel Request"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {filteredItems.length} requests (Page {currentPage} of {totalPages})
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        <span className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm">
                            {currentPage}
                        </span>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedRequest && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                                Detail Request: {selectedRequest.request_number}
                            </h3>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Request Info */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900">Informasi Request</h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">User:</span>
                                        <span className="ml-2">{selectedRequest.user?.name || 'Unknown User'}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Status:</span>
                                        <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                                            {getStatusIcon(selectedRequest.status)}
                                            <span className="ml-1 capitalize">{selectedRequest.status}</span>
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Tanggal Request:</span>
                                        <span className="ml-2">{formatDate(selectedRequest.created_at)}</span>
                                    </div>
                                    {selectedRequest.approved_at && (
                                        <div>
                                            <span className="font-medium text-gray-700">Tanggal Disetujui:</span>
                                            <span className="ml-2">{formatDate(selectedRequest.approved_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900">Catatan</h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Catatan User:</span>
                                        <div className="mt-1 p-2 bg-gray-50 rounded text-gray-600">
                                            {selectedRequest.note || 'Tidak ada catatan'}
                                        </div>
                                    </div>
                                    {selectedRequest.admin_note && (
                                        <div>
                                            <span className="font-medium text-gray-700">Catatan Admin:</span>
                                            <div className="mt-1 p-2 bg-blue-50 rounded text-gray-600">
                                                {selectedRequest.admin_note}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Items Details */}
                        <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3">Detail Barang</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Nama Barang</th>
                                            <th className="px-4 py-2 text-center">Diminta</th>
                                            <th className="px-4 py-2 text-center">Disetujui</th>
                                            <th className="px-4 py-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {selectedRequest.details?.map((detail, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center">
                                                        {detail.product?.image_url ? (
                                                            <img
                                                                src={
                                                                    detail.product?.image_url
                                                                        ? detail.product.image_url.replace(/\s*\(\d+×\d+\)/, '')
                                                                        : ''
                                                                }
                                                                alt={detail.product?.name}
                                                                className="w-9 h-9 object-cover"
                                                                onError={(e) => {
                                                                    console.log('Gambar gagal dimuat:', detail.product?.image_url);
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextElementSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}

                                                        <div
                                                            className="w-full h-full flex items-center justify-center"
                                                            style={{ display: detail.product?.image_url ? 'none' : 'flex' }}
                                                        >
                                                            <Package className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div className="font-medium">
                                                            {detail.name || detail.product?.name || `Product ID: ${detail.product_id}`}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500">
                                                            SKU: {detail.product?.sku || 'N/A'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-center font-medium">
                                                    {detail.requested_quantity}
                                                </td>
                                                <td className="px-4 py-2 text-center font-medium">
                                                    {detail.approved_quantity || detail.requested_quantity}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(detail.status || selectedRequest.status)}`}>
                                                        {getStatusIcon(selectedRequest.status)}
                                                        <span className="ml-1 capitalize">{detail.status || selectedRequest.status}</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 border bg-gray-400 border-gray-300 rounded-lg text-white hover:bg-gray-700"
                            >
                                Tutup
                            </button>
                            {selectedRequest.status === 'draft' && (
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        handleCancelRequest(selectedRequest.id);
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Batalkan Request
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestNote;