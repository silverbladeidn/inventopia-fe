import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    BarChart3,
    Package,
    Users,
    Archive,
    Settings,
    Bell,
    Search,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    LogOut,
    ChevronDown
} from 'lucide-react';
import axios from 'axios';

const Layout = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarMin, setSidebarMin] = useState(false);
    const [notifications] = useState(3);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const location = useLocation();
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setUserDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchAuthenticatedUser = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No authentication token found');

            const userId = localStorage.getItem('user_id');

            if (!token || !userId) {
                throw new Error('No authentication data found');
            }

            const response = await axios.get(`http://127.0.0.1:8000/api/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setUser(response.data.data);
            setError(null);

        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_id');
                localStorage.removeItem('user');
                setError('Session expired. Please login again.');
                // window.location.href = '/login';
            } else {
                setError(err.message);
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('auth_token');

            // Call logout API
            await axios.post('http://127.0.0.1:8000/api/logout', {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Clear local storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user');

            // Redirect to login page
            window.location.href = '/';

        } catch (error) {
            console.error('Logout error:', error);
            // Even if API call fails, clear local storage and redirect
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    };

    useEffect(() => {
        fetchAuthenticatedUser();
    }, []);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };

    // Fungsi untuk cek apakah user adalah superadmin
    const isSuperAdmin = () => {
        return user?.role === 'Superadmin';
    };

    // Base navigation items
    const baseNavigation = [
        { name: 'Beranda', href: '/home', icon: BarChart3, roles: ['Admin', 'Superadmin'] },
        { name: 'Inventori', href: '/inventory', icon: Package, roles: ['Admin', 'Superadmin'] },
        { name: 'Catatan Stok', href: '/stocknote', icon: Archive, roles: ['Admin', 'Superadmin'] }
    ];

    // Navigation items hanya untuk superadmin
    const superAdminNavigation = [
        { name: 'Pengguna', href: '/users', icon: Users, roles: ['Superadmin'] }
    ];

    const userNavigation = [
        { name: 'Beranda', href: '/homeuser', icon: BarChart3, roles: ['User'] },
        { name: 'Inventaris', href: '/inventaris', icon: Package, roles: ['User'] },
        { name: 'Riwayat Permintaan', href: '/requestnote', icon: Archive, roles: ['User'] }
    ];

    // Gabungkan navigation berdasarkan role
    const navigation = user?.role === 'Superadmin'
        ? [...baseNavigation, ...superAdminNavigation]
        : user?.role === 'Admin'
            ? [...baseNavigation]
            : user?.role === 'User'
                ? [...baseNavigation, ...userNavigation] :
                [...userNavigation];


    // Filter navigation berdasarkan role user
    const filteredNavigation = navigation.filter(item =>
        item.roles.includes(user?.role)
    );

    const isActive = (path) => location.pathname === path;

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="text-red-800 font-medium">Authentication Error</h3>
                        <p className="text-red-600 mt-2">{error}</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-green-50">
            {/* Backdrop untuk mobile */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)} />
            )}

            <div className="flex">
                {/* Sidebar */}
                <aside className={`
                    fixed inset-y-0 left-0 z-50 ${sidebarMin ? 'w-20' : 'w-72'} bg-gradient-to-r from-green-500 to-lime-300
                    transform transition-all duration-300 ease-in-out
                    lg:translate-x-0 lg:static lg:inset-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>

                    {/* Logo dan Brand */}
                    <div className={`h-16 px-6 flex items-center justify-between border-b bg-green-900 border-gray-100 ${sidebarMin ? 'justify-center' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-lime-400 flex items-center justify-center">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            {!sidebarMin && (
                                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-lime-400 bg-clip-text text-transparent">
                                    Inventopia
                                </h1>
                            )}
                        </div>
                        <button onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className={`p-6 space-y-2 ${sidebarMin ? 'flex flex-col items-center' : ''}`}>
                        {filteredNavigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl
                                        transition-all duration-200 group
                                        ${isActive(item.href)
                                            ? 'bg-gradient-to-r from-green-600 to-lime-400 text-white shadow-lg'
                                            : 'hover:bg-gray-50 text-gray-600 hover:text-green-600'
                                        }
                                        ${sidebarMin ? 'justify-center px-2' : ''}
                                    `}
                                >
                                    <Icon className={`w-5 h-5 ${isActive(item.href)
                                        ? 'text-white'
                                        : 'text-gray-500 group-hover:text-green-600'
                                        }`} />
                                    {!sidebarMin && <span className="font-medium">{item.name}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile di Sidebar */}
                    {!sidebarMin && user && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-600 to-lime-400 flex items-center justify-center">
                                    <span className="text-white font-medium text-lg">{getInitials(user?.name)}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold text-gray-800 truncate">{user?.name}</h3>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    {/* Role badge */}
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${user?.role === 'superadmin'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {user?.role || 'User'}

                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 min-h-screen">
                    {/* Header */}
                    <header className="sticky top-0 z-30 bg-green-600/80 backdrop-blur-md border-b border-gray-100">
                        <div className="h-16 px-4 lg:px-6 flex items-center justify-between">
                            {/* Menu Toggle */}
                            <button
                                onClick={() => {
                                    window.innerWidth < 1024 ? setSidebarOpen(!sidebarOpen) : setSidebarMin(!sidebarMin);
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                {window.innerWidth < 1024 ? (
                                    <Menu className="w-6 h-6 text-gray-600" />
                                ) : (
                                    sidebarMin ? (
                                        <ChevronRight className="w-6 h-6 text-gray-600" />
                                    ) : (
                                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                                    )
                                )}
                            </button>

                            {/* Right Side Actions */}
                            <div className="flex items-center gap-4">

                                {/* User Profile with Dropdown */}
                                {user && (
                                    <div className="relative" ref={dropdownRef}>
                                        <button
                                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors"
                                        >
                                            <div className="hidden lg:block text-right">
                                                <p className="text-sm font-medium text-white">{user?.name}</p>
                                                <p className="text-xs text-green-100">{user?.email}</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-lime-500
                                                    flex items-center justify-center">
                                                <span className="text-white font-medium">{getInitials(user?.name)}</span>
                                            </div>
                                            <ChevronDown
                                                className={`w-4 h-4 text-white transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''
                                                    }`}
                                            />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {userDropdownOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                                {/* User Info */}
                                                <div className="px-4 py-3 border-b border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-lime-500
                                                               flex items-center justify-center">
                                                            <span className="text-white font-medium">{getInitials(user?.name)}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                                            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${user?.role === 'Superadmin'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {user?.role}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Menu Items */}
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => {
                                                            setUserDropdownOpen(false);
                                                            handleLogout();
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Keluar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Search */}
                        <div className="p-4 lg:hidden">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari apapun..."
                                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200
                                         bg-gray-50/80 hover:bg-white focus:bg-white
                                         transition-colors duration-200
                                         focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="p-4 lg:p-6">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Layout;