import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Save, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

const EmailChange = () => {
    const [emailSettings, setEmailSettings] = useState({
        requestNotifications: true,
        adminEmail: 'aribiya@gmail.com',
        ccEmails: [],
        lowStockThreshold: 10,
        lowStockNotifications: true
    });

    const [newEmail, setNewEmail] = useState('');
    const [ccEmail, setCcEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const API_BASE_URL = 'http://127.0.0.1:8000/api';

    useEffect(() => {
        fetchEmailSettings();
    }, []);

    const fetchEmailSettings = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/email-settings`);
            if (data.success) {
                setEmailSettings(data.data);
                setNewEmail(data.data.adminEmail);
            } else {
                window.alert(data.message || 'Gagal memuat pengaturan email');
            }
        } catch (err) {
            window.alert('Gagal memuat pengaturan email: ' + err.message);
        }
    };

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const updateSettings = async (payload, successMsg) => {
        try {
            const { data } = await axios.put(`${API_BASE_URL}/email-settings`, payload);
            if (data.success) {
                setEmailSettings(data.data);
                if (payload.adminEmail) setNewEmail(data.data.adminEmail);
                window.alert(successMsg || data.message || 'Berhasil diperbarui');
                return true;
            }
            window.alert(data.message || 'Gagal memperbarui');
            return false;
        } catch (err) {
            window.alert('Terjadi kesalahan: ' + err.message);
            return false;
        }
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        if (!newEmail.trim() || !isValidEmail(newEmail)) {
            window.alert('Format email tidak valid');
            return;
        }
        setIsLoading(true);
        const ok = await updateSettings({
            adminEmail: newEmail.trim(),
            requestNotifications: emailSettings.requestNotifications,
            lowStockNotifications: emailSettings.lowStockNotifications,
            lowStockThreshold: emailSettings.lowStockThreshold,
            ccEmails: emailSettings.ccEmails
        }, 'Email berhasil diperbarui');
        if (ok) testEmailNotification();
        setIsLoading(false);
    };

    const addCcEmail = async () => {
        if (!ccEmail.trim() || !isValidEmail(ccEmail)) {
            window.alert('Format email CC tidak valid');
            return;
        }
        if (emailSettings.ccEmails.includes(ccEmail.trim())) {
            window.alert('Email sudah ditambahkan');
            return;
        }
        const updated = [...emailSettings.ccEmails, ccEmail.trim()];
        const ok = await updateSettings({ ...emailSettings, ccEmails: updated }, 'Email CC berhasil ditambahkan');
        if (ok) setCcEmail('');
    };

    // >>> semua aksi di bawah pakai window.alert <<<

    const removeCcEmail = async (emailToRemove) => {
        const ok = await updateSettings(
            { ...emailSettings, ccEmails: emailSettings.ccEmails.filter(e => e !== emailToRemove) },
            'Email CC berhasil dihapus'
        );
        if (ok) window.alert(`Email CC "${emailToRemove}" dihapus`);
    };

    const handleToggleNotification = async (type) => {
        const ok = await updateSettings(
            { ...emailSettings, [type]: !emailSettings[type] },
            'Pengaturan notifikasi diperbarui'
        );
        if (ok) window.alert(`Notifikasi ${type} diubah`);
    };

    const handleThresholdChange = async (value) => {
        const v = parseInt(value, 10);
        if (!isNaN(v) && v >= 0) {
            const ok = await updateSettings(
                { ...emailSettings, lowStockThreshold: v },
                'Batas stok rendah diperbarui'
            );
            if (ok) window.alert(`Batas stok rendah sekarang ${v}`);
        } else {
            window.alert('Nilai batas stok tidak valid');
        }
    };

    const resetToDefault = async () => {
        const ok = await updateSettings({
            adminEmail: 'aribiya@gmail.com',
            requestNotifications: true,
            lowStockNotifications: true,
            lowStockThreshold: 10,
            ccEmails: []
        }, 'Pengaturan dikembalikan ke default');
        if (ok) window.alert('Pengaturan berhasil dikembalikan ke default');
    };

    const handleCcEmailKeyPress = (e) =>
        e.key === 'Enter' && (e.preventDefault(), addCcEmail());

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Mail className="w-6 h-6 mr-3 text-green-600" />
                        Pengaturan Email Notifikasi
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Kelola email penerima notifikasi permintaan barang dan stok rendah
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Email Configuration */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Email Penerima Utama
                        </h3>
                        <form onSubmit={handleUpdateEmail} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Admin
                                </label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="Masukkan email admin"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Email ini akan menerima notifikasi semua permintaan barang
                                </p>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>

                                <button
                                    type="button"
                                    onClick={resetToDefault}
                                    disabled={isLoading}
                                    className="flex items-center px-4 py-2 border font-medium border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reset Default
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* CC Emails */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Email CC (Tambahan)
                        </h3>
                        <div className="space-y-4">
                            <div className="flex space-x-2">
                                <input
                                    type="email"
                                    value={ccEmail}
                                    onChange={(e) => setCcEmail(e.target.value)}
                                    onKeyPress={handleCcEmailKeyPress}
                                    placeholder="Masukkan email CC"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <button
                                    onClick={addCcEmail}
                                    className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-700 font-medium transition-colors"
                                >
                                    Tambah
                                </button>
                            </div>

                            {emailSettings.ccEmails.length > 0 && (
                                <div className="border border-gray-200 rounded-xl">
                                    {emailSettings.ccEmails.map((email, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0">
                                            <span className="text-sm text-gray-700">{email}</span>
                                            <button
                                                onClick={() => removeCcEmail(email)}
                                                className="bg-red-500 text-white rounded-lg hover:bg-red-700 text-md px-3 py-1 font-medium transition-colors"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    {/* Notification Settings */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Pengaturan Notifikasi
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Notifikasi Permintaan</p>
                                    <p className="text-sm text-gray-500">Kirim email saat ada permintaan baru</p>
                                </div>
                                <button
                                    onClick={() => handleToggleNotification('requestNotifications')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailSettings.requestNotifications ? 'bg-green-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailSettings.requestNotifications ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Notifikasi Stok Rendah</p>
                                    <p className="text-sm text-gray-500">Kirim email saat stok menipis</p>
                                </div>
                                <button
                                    onClick={() => handleToggleNotification('lowStockNotifications')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailSettings.lowStockNotifications ? 'bg-green-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailSettings.lowStockNotifications ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Low Stock Threshold */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Batas Stok Rendah
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Threshold Stok Rendah
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={emailSettings.lowStockThreshold}
                                    onChange={(e) => handleThresholdChange(e.target.value)}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <span className="text-gray-600">item</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Notifikasi akan dikirim saat stok ≤ nilai ini
                            </p>
                        </div>
                    </div>

                    {/* Current Status */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Status Saat Ini
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Email Utama:</span>
                                <span className="font-medium">{emailSettings.adminEmail}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Email CC:</span>
                                <span className="font-medium">{emailSettings.ccEmails.length} email</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Notifikasi Aktif:</span>
                                <span className={`font-medium ${emailSettings.requestNotifications ? 'text-green-600' : 'text-red-600'}`}>
                                    {emailSettings.requestNotifications ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailChange;