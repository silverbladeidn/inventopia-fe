import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    BarChart3,
    Package,
    Users,
    TrendingUp,
    RefreshCw,
} from 'lucide-react';
import StatCard from '../components/Dashboard/StatCard';
import RecentActivity from '../components/Dashboard/RecentActivity';
import ChartWidget from '../components/Dashboard/ChartWidget';

// Configure axios defaults
axios.defaults.baseURL = 'http://127.0.0.1:8000';

// Add token to all requests if available
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Accept'] = 'application/json';
    return config; // Hapus Content-Type karena akan di-set otomatis
});

// Handle 401 responses globally
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

const Dashboard = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const initialStats = [
        {
            title: 'Total Products',
            value: '0',
            change: '0%',
            trend: 'up',
            icon: Package,
            color: 'from-blue-500 to-purple-600'
        },
        {
            title: 'In Stock',
            value: '0',
            change: '0%',
            trend: 'up',
            icon: Users,
            color: 'from-green-500 to-teal-600'
        },
        {
            title: 'Low Stock',
            value: '0',
            change: '0%',
            trend: 'up',
            icon: TrendingUp,
            color: 'from-orange-500 to-red-600'
        },
        {
            title: 'Out of Stock',
            value: '0',
            change: '0%',
            trend: 'up',
            icon: BarChart3,
            color: 'from-purple-500 to-pink-600'
        },
    ];

    const [stats, setStats] = useState(initialStats);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Gunakan endpoint yang sesuai dengan route Laravel Anda
            const [productsResponse, statsResponse] = await Promise.all([
                axios.get('/api/products'),
                axios.get('/api/products/stats') // Gunakan endpoint stats yang sudah ada
            ]);

            // Debug response
            console.log('Products Response:', productsResponse.data);
            console.log('Stats Response:', statsResponse.data);

            // PERBAIKAN: Akses data dengan struktur yang benar
            const products = productsResponse.data?.data || productsResponse.data || [];
            const statsData = statsResponse.data?.data || statsResponse.data || {};

            updateStats(products, statsData);

        } catch (error) {
            console.error('Error fetching data:', error);
            // Fallback: Jika endpoint stats tidak ada, hitung manual
            try {
                const productsResponse = await axios.get('/api/products');
                const products = productsResponse.data?.data || productsResponse.data || [];
                calculateStatsManually(products);
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError);
                setStats(initialStats);
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateStatsManually = (products) => {
        const totalProducts = products.length;
        const inStock = products.filter(product => product.status === 'in_stock').length;
        const lowStock = products.filter(product => product.status === 'low_stock').length;
        const outOfStock = products.filter(product => product.status === 'out_of_stock').length;

        setStats([
            {
                ...initialStats[0],
                value: totalProducts.toString(),
                change: '0%',
                trend: 'neutral'
            },
            {
                ...initialStats[1],
                value: inStock.toString(),
                change: '0%',
                trend: 'neutral'
            },
            {
                ...initialStats[2],
                value: lowStock.toString(),
                change: '0%',
                trend: lowStock > 0 ? 'down' : 'neutral'
            },
            {
                ...initialStats[3],
                value: outOfStock.toString(),
                change: '0%',
                trend: outOfStock > 0 ? 'down' : 'neutral'
            }
        ]);
    };

    const updateStats = (products, statsData) => {
        try {
            console.log('Processing products:', products);
            console.log('Processing stats data:', statsData);

            // Gunakan data dari stats endpoint jika available
            if (statsData.total_products !== undefined) {
                setStats([
                    {
                        ...initialStats[0],
                        value: statsData.total_products.toString(),
                        change: '0%',
                        trend: 'neutral'
                    },
                    {
                        ...initialStats[1],
                        value: statsData.in_stock.toString(),
                        change: '0%',
                        trend: 'neutral'
                    },
                    {
                        ...initialStats[2],
                        value: statsData.low_stock.toString(),
                        change: '0%',
                        trend: statsData.low_stock > 0 ? 'down' : 'neutral'
                    },
                    {
                        ...initialStats[3],
                        value: statsData.out_of_stock.toString(),
                        change: '0%',
                        trend: statsData.out_of_stock > 0 ? 'down' : 'neutral'
                    }
                ]);
            } else {
                // Fallback ke perhitungan manual
                calculateStatsManually(products);
            }

        } catch (error) {
            console.error('Error in updateStats:', error);
            setStats(initialStats);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const actions = [
        {
            title: 'Tambah Inventori',
            color: 'from-blue-500 to-blue-600',
            icon: Package,
            route: '/inventory/add'
        },
        {
            title: 'Atur Pengguna',
            color: 'from-green-500 to-green-600',
            icon: Users,
            route: '/users'
        },
        {
            title: 'Pantau Laporan Stok',
            color: 'from-purple-500 to-purple-600',
            icon: BarChart3,
            route: '/stocknote'
        },
    ];

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Selamat datang di Inventopia! Silahkan atur inventory sekolah ini!</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-lime-400 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    disabled={isRefreshing}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={stat.title} stat={stat} index={index} />
                ))}
            </div>

            {/* Charts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2">
                    <ChartWidget />
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-1">
                    <RecentActivity />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Tombol Cepat</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {actions.map((action, index) => (
                        <Link
                            key={action.title}
                            to={action.route}
                            className={`p-4 bg-gradient-to-r ${action.color} text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 no-underline`}
                        >
                            <action.icon className="w-5 h-5" />
                            <span className="font-medium">{action.title}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;