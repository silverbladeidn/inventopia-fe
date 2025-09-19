import React, { useEffect, useState } from "react";
import RequestModal from '../components/UserDashboard/RequestModal';
import axios from "axios";

const Inventaris = () => {
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [barcodeSize, setBarcodeSize] = useState({ width: 100, height: 40 });
    const [sortField, setSortField] = useState("id");
    const [sortDirection, setSortDirection] = useState("asc");
    const [selectedItem, setSelectedItem] = useState(null);
    const [requestQuantity, setRequestQuantity] = useState(1);
    const [requestNote, setRequestNote] = useState("");
    const [advancedFilters, setAdvancedFilters] = useState({
        category: "all",
        priceMin: "",
        priceMax: "",
        stockMin: "",
        stockMax: "",
    });

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://127.0.0.1:8000/api/products");
            console.log("API result:", response.data);

            if (Array.isArray(response.data.data?.data)) {
                setInventoryItems(response.data.data.data);
            } else if (Array.isArray(response.data.data)) {
                setInventoryItems(response.data.data);
            } else {
                setInventoryItems([]);
            }

            setError(null);
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Gagal mengambil data produk");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setBarcodeSize({ width: 80, height: 30 });
            } else {
                setBarcodeSize({ width: 100, height: 40 });
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getSortedData = (data) => {
        return [...data].sort((a, b) => {
            let aValue, bValue;

            switch (sortField) {
                case "id":
                    aValue = parseInt(a.id);
                    bValue = parseInt(b.id);
                    break;
                case "name":
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case "category":
                    aValue = a.category?.name?.toLowerCase() || "";
                    bValue = b.category?.name?.toLowerCase() || "";
                    break;
                case "stock":
                    aValue = a.stock_quantity;
                    bValue = b.stock_quantity;
                    break;
                case "price":
                    aValue = a.price;
                    bValue = b.price;
                    break;
                case "status":
                    aValue = a.status;
                    bValue = b.status;
                    break;
                default:
                    aValue = a[sortField];
                    bValue = b[sortField];
            }

            if (sortDirection === "asc") {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
    };

    const clearFilters = () => {
        setSearchQuery("");
        setFilterStatus("all");
        setAdvancedFilters({
            category: "all",
            priceMin: "",
            priceMax: "",
            stockMin: "",
            stockMax: "",
        });
    };

    const filteredItems = getSortedData(
        inventoryItems.filter((item) => {
            const matchesSearch = item.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === "all" || item.status === filterStatus;
            const matchesCategory =
                advancedFilters.category === "all" ||
                item.category?.name === advancedFilters.category;
            const matchesPriceMin =
                !advancedFilters.priceMin ||
                item.price >= parseInt(advancedFilters.priceMin);
            const matchesPriceMax =
                !advancedFilters.priceMax ||
                item.price <= parseInt(advancedFilters.priceMax);
            const matchesStockMin =
                !advancedFilters.stockMin ||
                item.stock_quantity >= parseInt(advancedFilters.stockMin);
            const matchesStockMax =
                !advancedFilters.stockMax ||
                item.stock_quantity <= parseInt(advancedFilters.stockMax);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesCategory &&
                matchesPriceMin &&
                matchesPriceMax &&
                matchesStockMin &&
                matchesStockMax
            );
        })
    );

    const categories = [
        ...new Set(inventoryItems.map((item) => item.category?.name).filter(Boolean)),
    ];

    const handleQuickRequest = (item) => {
        setSelectedItem(item);
        setRequestQuantity(1);
        setRequestNote('');
        setShowRequestModal(true);
    };

    const submitRequest = async () => {
        try {
            await new Promise(res => setTimeout(res, 800));
            alert('Request berhasil dikirim!');
            setShowRequestModal(false);
            setSelectedItem(null);
            setStats(prev => ({ ...prev, pendingRequests: prev.pendingRequests + 1 }));
        } catch {
            alert('Gagal mengirim request');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={fetchProducts}
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manajemen Inventori</h1>
                    <p className="text-gray-600 mt-1">
                        Tempat Mengatur segala jumlah barang dan jenis barang yang ada
                    </p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-col gap-4">
                    {/* Main search and filter row */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Cari barang..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="flex items-center space-x-3">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">Semua Status</option>
                                <option value="in_stock">In Stock</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                            </select>

                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Filter Lanjutan
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div className="border-t pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                {/* Kategori */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kategori
                                    </label>
                                    <select
                                        value={advancedFilters.category}
                                        onChange={(e) =>
                                            setAdvancedFilters({
                                                ...advancedFilters,
                                                category: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="all">Semua Kategori</option>
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Harga Min */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Harga Minimum
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Harga Minimum"
                                        value={advancedFilters.priceMin}
                                        onChange={(e) =>
                                            setAdvancedFilters({
                                                ...advancedFilters,
                                                priceMin: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                {/* Harga Max */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Harga Maksimum
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Harga Maksimum"
                                        value={advancedFilters.priceMax}
                                        onChange={(e) =>
                                            setAdvancedFilters({
                                                ...advancedFilters,
                                                priceMax: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                {/* Stok Min */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Stok Minimum
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Stok Minimum"
                                        value={advancedFilters.stockMin}
                                        onChange={(e) =>
                                            setAdvancedFilters({
                                                ...advancedFilters,
                                                stockMin: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                {/* Stok Max */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Stok Maksimum
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Stok Maksimum"
                                        value={advancedFilters.stockMax}
                                        onChange={(e) =>
                                            setAdvancedFilters({
                                                ...advancedFilters,
                                                stockMax: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Ulang Filtering
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white shadow-md rounded-xl p-4 flex flex-col justify-between"
                    >
                        <div>
                            <img
                                src={item.image_url || "https://via.placeholder.com/150"}
                                alt={item.name}
                                className="w-full h-40 object-cover rounded-lg mb-4"
                            />
                            <h2 className="text-lg font-semibold">{item.name}</h2>
                            <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                            <p className="text-sm text-gray-600">Tipe: {item.category?.name}</p>
                            <p className="text-sm text-gray-600">Harga Satuan: {formatPrice(item.price)}</p>
                            <p
                                className={`mt-2 font-medium ${item.stock_quantity > 0 ? "text-green-600" : "text-red-600"
                                    }`}
                            >
                                {item.stock_quantity > 0
                                    ? `Stok: ${item.stock_quantity}`
                                    : "Stok Habis"}
                            </p>
                        </div>

                        <button
                            onClick={() => handleQuickRequest(item)}
                            disabled={item.stock_quantity <= 0}
                            className={`mt-4 px-4 py-2 rounded-lg text-white ${item.stock_quantity <= 0
                                ? "bg-red-600 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700"
                                }`}
                        >
                            {item.stock_quantity <= 0 ? "Kosong" : "Request Barang"}
                        </button>
                    </div>
                ))}

                {showRequestModal && (
                    <RequestModal
                        selectedItem={selectedItem}
                        requestQuantity={requestQuantity}
                        setRequestQuantity={setRequestQuantity}
                        requestNote={requestNote}
                        setRequestNote={setRequestNote}
                        onClose={() => setShowRequestModal(false)}
                        onSubmit={submitRequest}
                    />
                )}
            </div>
        </div>
    );
};

export default Inventaris;
