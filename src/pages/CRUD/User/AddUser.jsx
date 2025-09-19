import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Save, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle
} from 'lucide-react';
import axios from 'axios';

const AddUser = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'Admin'
    });

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nama lengkap harus diisi';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Username harus diisi';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username minimal 3 karakter';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email harus diisi';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Password harus diisi';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password minimal 6 karakter';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrors({});
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('auth_token');

            if (!token) {
                throw new Error('Token autentikasi tidak ditemukan');
            }

            console.log('Sending data:', formData);

            const response = await axios.post(
                'http://127.0.0.1:8000/api/users',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('Response:', response.data);

            if (response.data.message) {
                // Tampilkan alert sukses
                alert('Pengguna berhasil ditambahkan!');

                // Langsung redirect ke halaman users
                navigate('/users');
            }

        } catch (error) {
            console.error('Error creating user:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);

            if (error.response?.status === 422) {
                // Validation errors from backend
                console.log('Validation errors:', error.response.data);

                // Laravel validation errors format: { errors: { field: ["message"] } }
                const backendErrors = {};
                if (error.response.data.errors) {
                    Object.keys(error.response.data.errors).forEach(field => {
                        // Ambil pesan error pertama untuk setiap field
                        backendErrors[field] = error.response.data.errors[field][0];
                    });
                }

                setErrors(backendErrors);
            } else if (error.response?.status === 401) {
                setErrors({ general: 'Sesi telah berakhir. Silakan login kembali.' });
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_id');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else if (error.response?.data?.message) {
                setErrors({ general: error.response.data.message });
            } else {
                setErrors({ general: 'Terjadi kesalahan saat menambahkan pengguna' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Yakin ingin membatalkan? Semua perubahan akan hilang.')) {
            navigate('/users');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/users"
                        className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Pengguna
                    </Link>
                    <div className="flex items-center">
                        <div className="ml-4">
                            <h1 className="text-3xl font-bold text-gray-900">Tambah Pengguna</h1>
                            <p className="text-gray-600 mt-1">Silahkan isi data pengguna berikut ini</p>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                            <span className="text-green-700 font-medium">{successMessage}</span>
                        </div>
                    </div>
                )}

                {/* General Error */}
                {errors.general && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                            <span className="text-red-700 font-medium">{errors.general}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Diri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nama Lengkap */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nama Lengkap <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Masukkan nama lengkap"
                                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.name
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="Masukkan username"
                                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.username
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                />
                                {errors.username && (
                                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Masukkan alamat email"
                                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.email
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Masukkan password"
                                        className={`w-full px-3 py-2 pr-10 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.password
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-green-500'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.role
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Superadmin">Superadmin</option>
                                    <option value="User">User</option>
                                </select>
                                {errors.role && (
                                    <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-gray-50 px-8 py-6 flex justify-end space-x-4 rounded-2xl">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-lime-400 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Tambah Pengguna
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUser;