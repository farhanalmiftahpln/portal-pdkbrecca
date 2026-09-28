import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  ShieldCheck, 
  Package, 
  Truck, 
  Building2, 
  Search, 
  Plus, 
  QrCode, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Edit3, 
  ArrowRightLeft, 
  Clock, 
  ChevronRight, 
  Menu, 
  X,
  Camera, 
  Printer,
  Grid,
  List,
  Upload,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon,
  FileText
} from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { gasService } from '../services/gasService';
import { useAuthStore } from '../store/useAuthStore';

const ExportLaporanModal = React.lazy(() => import('../components/warehouse/ExportLaporanModal'));

// 5 Dedicated Submenus + Overview
export type WarehouseSubmenu = 
  | 'OVERVIEW'
  | 'PERALATAN KERJA'
  | 'PERALATAN K2/K3'
  | 'MATERIAL'
  | 'KENDARAAN'
  | 'INVENTARIS KANTOR';

// Helper to compress and convert file to Base64 image
const compressAndReadImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1024;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressed);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

interface NavItem {
  id: WarehouseSubmenu;
  label: string;
  icon: React.ElementType;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'OVERVIEW', label: 'OVERVIEW', icon: LayoutDashboard, description: 'Ringkasan Eksekutif & Statistik Gudang' },
  { id: 'PERALATAN KERJA', label: 'PERALATAN KERJA', icon: Wrench, description: 'Tools Isolasi, Hotstick, Alat Kerja PDKB' },
  { id: 'PERALATAN K2/K3', label: 'PERALATAN K2/K3', icon: ShieldCheck, description: 'Alat Pelindung Diri & Safety PDKB' },
  { id: 'MATERIAL', label: 'MATERIAL', icon: Package, description: 'Stok Material Gudang & Mobil Operasional' },
  { id: 'KENDARAAN', label: 'KENDARAAN', icon: Truck, description: 'Armada Mobil PDKB, Pajak & Odometer' },
  { id: 'INVENTARIS KANTOR', label: 'INVENTARIS KANTOR', icon: Building2, description: 'Perangkat Kerja, Meja & Arsip PDKB' },
];

export default function Warehouse() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userName = user?.name || 'Petugas PDKB';

  // Navigation State
  const [activeSubmenu, setActiveSubmenu] = useState<WarehouseSubmenu>('OVERVIEW');
  const [activeTab, setActiveTab] = useState<'LIST' | 'MUTASI'>('LIST');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data State
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [itemsData, setItemsData] = useState<any[]>([]);
  const [mutasiData, setMutasiData] = useState<any[]>([]);
  const [submenuStats, setSubmenuStats] = useState<Record<string, { count: number; baik: number; rusak: number }>>({});

  // Filtering & View Mode
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKondisi, setFilterKondisi] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals State
  const [isScanning, setIsScanning] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [mutasiModalOpen, setMutasiModalOpen] = useState(false);
  const [mutasiForm, setMutasiForm] = useState<any>({
    itemId: '',
    kode: '',
    itemNama: '',
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'MASUK',
    jumlah: 1,
    pic: userName,
    noWo: '',
    keterangan: '',
    odometer_km: '',
    status_bbm: 'FULL',
    lokasi_ruangan: ''
  });
  const [saving, setSaving] = useState(false);

  // Photo Upload & Camera State
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setProcessingImage(true);
      const base64 = await compressAndReadImage(file);
      setFormData((prev: any) => ({
        ...prev,
        'LINK GAMBAR': base64,
        link_gambar: base64,
        GAMBAR: base64,
        foto_kendaraan: base64,
        'FOTO KENDARAAN': base64
      }));
    } catch (err) {
      console.error('Gagal memproses gambar:', err);
    } finally {
      setProcessingImage(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev: any) => ({
      ...prev,
      'LINK GAMBAR': '',
      link_gambar: '',
      GAMBAR: '',
      foto_kendaraan: '',
      'FOTO KENDARAAN': ''
    }));
  };

  // Initial Load: Fetch Overview & Stats
  useEffect(() => {
    fetchOverview();
  }, []);

  // When Submenu changes, load submenu data
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    setFilterKondisi('ALL');
    setFilterStatus('ALL');
    if (activeSubmenu === 'OVERVIEW') {
      fetchOverview();
    } else {
      fetchSubmenuData(activeSubmenu);
    }
  }, [activeSubmenu]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await gasService.getWarehouseOverview(true);
      if (res.success && res.data) {
        setOverviewData(res.data);
        if (res.data.byCategory) {
          const statsMap: Record<string, any> = {};
          Object.entries(res.data.byCategory).forEach(([cat, stat]: [string, any]) => {
            statsMap[cat] = {
              count: stat.count || 0,
              baik: stat.baik || 0,
              rusak: stat.rusak || 0
            };
          });
          setSubmenuStats(statsMap);
        }
      }
    } catch (err) {
      console.error('Error loading overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmenuData = async (submenu: WarehouseSubmenu) => {
    setLoading(true);
    try {
      const res = await gasService.getWarehouseSubmenuData(submenu, true);
      if (res.success) {
        setItemsData(res.data || []);
        setMutasiData(res.mutasi || []);
        if (res.overview) {
          setSubmenuStats(prev => ({
            ...prev,
            [submenu]: {
              count: res.data?.length || 0,
              baik: res.overview.baik || 0,
              rusak: res.overview.rusak || 0
            }
          }));
        }
      }
    } catch (err) {
      console.error(`Error loading submenu ${submenu}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSheets = async () => {
    if (!confirm('Apakah Anda ingin menyinkronkan seluruh 5 sheet Warehouse dari Google Sheets?')) return;
    setSyncing(true);
    try {
      const res = await gasService.syncAllWarehouseSubmenus();
      if (res.success) {
        alert(res.message || 'Sinkronisasi berhasil!');
        fetchOverview();
        if (activeSubmenu !== 'OVERVIEW') {
          fetchSubmenuData(activeSubmenu);
        }
      } else {
        alert('Gagal sinkronisasi: ' + (res.message || 'Error'));
      }
    } catch (e: any) {
      alert('Error sinkronisasi: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  // Filtered Items for Tab 1 (LIST)
  const filteredItems = useMemo(() => {
    return itemsData.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        String(item.KODE || item.kode || item['PLAT KENDARAAN'] || '').toLowerCase().includes(q) ||
        String(item['NAMA PERALATAN'] || item['NAMA - JENIS'] || item['NAMA KENDARAAN'] || item['NAMA BARANG'] || '').toLowerCase().includes(q) ||
        String(item.MERK || item['MERK / TIPE'] || '').toLowerCase().includes(q) ||
        String(item.JENIS || item['LOKASI RUANGAN'] || '').toLowerCase().includes(q);

      const itemKondisi = String(item.KONDISI || item.kondisi || '').toUpperCase();
      const matchKondisi = filterKondisi === 'ALL' ||
        (filterKondisi === 'BAIK' && itemKondisi.includes('BAIK')) ||
        (filterKondisi === 'RUSAK' && itemKondisi.includes('RUSAK'));

      const itemStatus = String(item.STATUS || item.status || '').toUpperCase();
      const matchStatus = filterStatus === 'ALL' || itemStatus === filterStatus;

      return matchSearch && matchKondisi && matchStatus;
    });
  }, [itemsData, searchTerm, filterKondisi, filterStatus]);

  // Paginated Items
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Filtered Mutasi for Tab 2 (MUTASI)
  const filteredMutasi = useMemo(() => {
    return mutasiData.filter(m => {
      const q = searchTerm.toLowerCase();
      return !searchTerm ||
        String(m.item_kode || '').toLowerCase().includes(q) ||
        String(m.item_nama || '').toLowerCase().includes(q) ||
        String(m.pic || '').toLowerCase().includes(q) ||
        String(m.no_wo || '').toLowerCase().includes(q) ||
        String(m.keterangan || '').toLowerCase().includes(q) ||
        String(m.jenis || '').toLowerCase().includes(q);
    });
  }, [mutasiData, searchTerm]);

  // Handle Scanning QR
  const processScanResult = (code: string) => {
    if (!code) return;
    setIsScanning(false);
    const cleaned = code.trim().toLowerCase();
    
    const found = itemsData.find(item => {
      const k = String(item.KODE || item.kode || item['PLAT KENDARAAN'] || '').trim().toLowerCase();
      const link = String(item['LINK QR CODE'] || '').trim().toLowerCase();
      return k === cleaned || link.includes(cleaned) || cleaned.includes(k);
    });

    if (found) {
      setDetailItem(found);
    } else {
      alert(`Kode "${code}" tidak ditemukan pada daftar ${activeSubmenu}.`);
    }
  };

  // Open Mutasi Modal prefilled with item
  const openMutasiForItem = (item: any) => {
    const code = item.KODE || item.kode || item['PLAT KENDARAAN'] || '';
    const name = item['NAMA PERALATAN'] || item['NAMA - JENIS'] || item['NAMA KENDARAAN'] || item['NAMA BARANG'] || '';
    setMutasiForm({
      itemId: item.id,
      kode: code,
      itemNama: name,
      tanggal: new Date().toISOString().split('T')[0],
      jenis: activeSubmenu === 'MATERIAL' ? 'MASUK KE GUDANG' : (activeSubmenu === 'PERALATAN KERJA' || activeSubmenu === 'PERALATAN K2/K3') ? 'DIGUNAKAN' : activeSubmenu === 'KENDARAAN' ? 'OPERASIONAL DINAS' : 'KELUAR GUDANG',
      jumlah: 1,
      pic: userName,
      noWo: '',
      keterangan: '',
      odometer_km: item.mutasi_odometer_km || '',
      status_bbm: item.status_bbm || 'FULL',
      lokasi_ruangan: item['LOKASI RUANGAN'] || ''
    });
    setMutasiModalOpen(true);
  };

  // Submit Mutasi Record
  const handleSaveMutasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutasiForm.kode && !mutasiForm.itemId) {
      alert('Pilih barang terlebih dahulu!');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...mutasiForm,
        submenu: activeSubmenu
      };
      const res = await gasService.recordWarehouseSubmenuMutasi(activeSubmenu, payload);
      if (res.success) {
        alert(res.message || 'Mutasi berhasil dicatat!');
        setMutasiModalOpen(false);
        gasService.clearCache();
        await fetchSubmenuData(activeSubmenu);
        await fetchOverview();
      } else {
        alert('Gagal mencatat mutasi: ' + (res.message || 'Error'));
      }
    } catch (err: any) {
      alert('Error mencatat mutasi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Item Form
  const openEditForm = (item: any) => {
    setEditItem(item);
    setIsCreating(false);
    setFormData({ ...item });
  };

  // Open Create Item Form
  const openCreateForm = () => {
    setEditItem(null);
    setIsCreating(true);
    setShowUrlInput(false);
    setFormData({
      KODE: '',
      'NAMA PERALATAN': '',
      'NAMA - JENIS': '',
      'NAMA KENDARAAN': '',
      'NAMA BARANG': '',
      'PLAT KENDARAAN': '',
      MERK: '',
      'MERK / TIPE': '',
      KONDISI: 'BAIK',
      STATUS: 'MASUK GUDANG/TERSEDIA',
      JENIS: activeSubmenu.includes('K2') ? 'APD' : 'ISOLASI',
      'TGL UJI': '-',
      'STOK GUDANG': 1,
      'STOK MOBIL': 0,
      'TOTAL STOK': 1,
      JUMLAH: 1,
      'LOKASI RUANGAN': 'Kantor PDKB',
      'PENANGGUNG JAWAB': userName,
      'STATUS PAJAK TAHUNAN': 'AKTIF',
      'STATUS BBM': 'FULL'
    });
  };

  // Submit Item Form
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        id: editItem?.id,
        submenu: activeSubmenu
      };
      const res = await gasService.saveWarehouseSubmenuItem(activeSubmenu, payload);
      if (res.success) {
        alert(res.message || 'Data berhasil disimpan!');
        setEditItem(null);
        setIsCreating(false);
        fetchSubmenuData(activeSubmenu);
        fetchOverview();
      } else {
        alert('Gagal menyimpan data: ' + (res.message || 'Error'));
      }
    } catch (err: any) {
      alert('Error menyimpan data: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Mutasi Options per Submenu
  const mutasiOptions = useMemo(() => {
    switch (activeSubmenu) {
      case 'MATERIAL':
        return ['MASUK KE GUDANG', 'PINDAH KE MOBIL', 'KEMBALI KE GUDANG', 'TERPAKAI WO', 'KELUAR GUDANG'];
      case 'PERALATAN KERJA':
      case 'PERALATAN K2/K3':
        return ['MASUK GUDANG/ TERSEDIA', 'KELUAR GUDANG', 'DIGUNAKAN', 'KEMBALI KE GUDANG'];
      case 'KENDARAAN':
        return ['OPERASIONAL DINAS', 'SERVIS / BENGKEL', 'STANDBY GUDANG'];
      case 'INVENTARIS KANTOR':
        return ['MASUK INVENTARIS', 'PINDAH RUANGAN', 'RUSAK / PERBAIKAN'];
      default:
        return ['MASUK', 'KELUAR'];
    }
  }, [activeSubmenu]);

  return (
    <div className="flex h-screen bg-[#070e12] text-gray-200 overflow-hidden font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0a1318] border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate(user?.bidang?.toUpperCase() === 'BAKTI' ? '/guild' : '/office')} 
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
              title="Kembali ke Office"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-white text-base tracking-wider flex items-center gap-1.5">
                WAREHOUSE
                <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded font-mono">
                  PDKB
                </span>
              </h1>
              <p className="text-[11px] text-gray-400 font-mono">Gudang & Inventaris</p>
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Submenu List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 px-3 py-1 font-mono">
            Menu Gudang
          </p>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubmenu === item.id;
            const stat = submenuStats[item.id];

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSubmenu(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-primary/20 text-white border border-primary/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-black' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-white font-bold' : ''}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate font-mono">
                      {item.id === 'OVERVIEW' ? 'Dashboard Statistik' : `${stat?.count || 0} Aset Terdaftar`}
                    </p>
                  </div>
                </div>

                {item.id !== 'OVERVIEW' && (
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-primary/30 text-primary border border-primary/40' : 'bg-white/5 text-gray-400'
                  }`}>
                    {stat?.count || 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10 bg-[#070e12]/60 space-y-2">
          <button
            onClick={handleSyncSheets}
            disabled={syncing}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-xl text-xs text-gray-300 hover:text-white transition disabled:opacity-50"
            title="Sinkronkan data dari Google Spreadsheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-primary' : 'text-gray-400'}`} />
            <span>{syncing ? 'Menyinkronkan...' : 'Sinkron Google Sheet'}</span>
          </button>

          <div className="px-2 py-1.5 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between text-[11px] text-gray-400">
            <span className="truncate">User: {userName}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#070e12]">
        {/* Top Navbar */}
        <header className="h-16 border-b border-white/10 bg-[#0a1318]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {activeSubmenu}
                </h2>
                <span className="text-[11px] text-primary/80 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-mono">
                  {activeSubmenu === 'OVERVIEW' ? 'Monitoring' : activeTab}
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">
                {NAV_ITEMS.find(n => n.id === activeSubmenu)?.description}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center space-x-2">
            {activeSubmenu !== 'OVERVIEW' && (
              <>
                {/* Tab Switcher: LIST vs MUTASI */}
                <div className="flex bg-[#0d181f] p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => setActiveTab('LIST')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      activeTab === 'LIST'
                        ? 'bg-primary text-black font-bold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    LIST {activeSubmenu.replace('PERALATAN ', '')}
                  </button>
                  <button
                    onClick={() => setActiveTab('MUTASI')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                      activeTab === 'MUTASI'
                        ? 'bg-primary text-black font-bold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    MUTASI
                    {mutasiData.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        activeTab === 'MUTASI' ? 'bg-black/30 text-black font-mono' : 'bg-white/10 text-primary'
                      }`}>
                        {mutasiData.length}
                      </span>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setIsScanning(true)}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-xl text-gray-300 hover:text-white transition"
                  title="Scan QR Code"
                >
                  <QrCode className="w-4 h-4 text-primary" />
                </button>
              </>
            )}

            <button
              onClick={() => activeSubmenu === 'OVERVIEW' ? fetchOverview() : fetchSubmenuData(activeSubmenu)}
              disabled={loading}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ================================================================= */}
          {/* VIEW: OVERVIEW DASHBOARD */}
          {/* ================================================================= */}
          {activeSubmenu === 'OVERVIEW' ? (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Top Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0a1318] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-primary/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Total Semua Aset</span>
                    <Package className="w-5 h-5 text-primary opacity-80" />
                  </div>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white">
                      {overviewData?.totalItems || 0}
                    </span>
                    <span className="text-xs text-gray-400">item terdaftar</span>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-400">
                    5 Submenu Terintegrasi Supabase
                  </div>
                </div>

                <div className="bg-[#0a1318] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Kondisi Siap Pakai</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-80" />
                  </div>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                      {overviewData?.totalBaik || 0}
                    </span>
                    <span className="text-xs text-emerald-500/80 font-mono">
                      ({overviewData?.persenBaik || 100}%)
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-400">
                    Status kondisi Baik & Terkalibrasi
                  </div>
                </div>

                <div className="bg-[#0a1318] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-red-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Butuh Perbaikan</span>
                    <AlertTriangle className="w-5 h-5 text-rose-400 opacity-80" />
                  </div>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-rose-400">
                      {overviewData?.totalRusak || 0}
                    </span>
                    <span className="text-xs text-gray-400">item rusak</span>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-400">
                    Perlu perbaikan atau afkir
                  </div>
                </div>

                <div className="bg-[#0a1318] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-cyan-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Aktivitas Mutasi</span>
                    <ArrowRightLeft className="w-5 h-5 text-cyan-400 opacity-80" />
                  </div>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400">
                      {overviewData?.totalMutasiCount || 0}
                    </span>
                    <span className="text-xs text-gray-400">transaksi</span>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-400">
                    Pergerakan masuk & keluar
                  </div>
                </div>
              </div>

              {/* Category Breakdown Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Status Tiap Submenu Gudang
                  </h3>
                  <span className="text-xs text-gray-400">Klik untuk membuka detail</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {NAV_ITEMS.filter(n => n.id !== 'OVERVIEW').map((nav) => {
                    const Icon = nav.icon;
                    const catStat = overviewData?.byCategory?.[nav.id] || { count: 0, baik: 0, rusak: 0, persenBaik: 100 };
                    
                    return (
                      <div
                        key={nav.id}
                        onClick={() => setActiveSubmenu(nav.id)}
                        className="bg-[#0a1318] border border-white/10 rounded-2xl p-5 hover:border-primary/50 hover:bg-[#0c171e] transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2.5 rounded-xl bg-white/5 text-primary group-hover:scale-110 transition-transform">
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-sm group-hover:text-primary transition">
                                  {nav.label}
                                </h4>
                                <p className="text-[11px] text-gray-400 font-mono">
                                  {nav.id === 'MATERIAL' ? `Stok Fisik: ${catStat.totalStock || 0}` : `${catStat.count || 0} Unit/Item`}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                          </div>

                          {/* Condition Progress Bar */}
                          <div className="mt-5 space-y-1.5">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Baik: {catStat.baik || 0}
                              </span>
                              <span className="text-rose-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                Rusak: {catStat.rusak || 0}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex">
                              <div 
                                style={{ width: `${catStat.persenBaik || 100}%` }}
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              />
                              <div 
                                style={{ width: `${100 - (catStat.persenBaik || 100)}%` }}
                                className="bg-rose-500 h-full transition-all duration-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                          <span>Kesiapan Operasional</span>
                          <span className="font-bold font-mono text-white">{catStat.persenBaik || 100}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity Log */}
              <div className="bg-[#0a1318] border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      Riwayat Mutasi Terkini (Seluruh Submenu)
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    {overviewData?.recentMutations?.length || 0} Aktivitas Terbaru
                  </span>
                </div>

                {overviewData?.recentMutations && overviewData.recentMutations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 font-mono uppercase text-[10px]">
                          <th className="py-2.5 px-3">Tanggal</th>
                          <th className="py-2.5 px-3">Submenu</th>
                          <th className="py-2.5 px-3">Kode & Nama Item</th>
                          <th className="py-2.5 px-3">Jenis Mutasi</th>
                          <th className="py-2.5 px-3 text-center">Jumlah</th>
                          <th className="py-2.5 px-3">Penanggung Jawab</th>
                          <th className="py-2.5 px-3">Keperluan / Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {overviewData.recentMutations.map((m: any, idx: number) => {
                          const isMasuk = m.jenis?.includes('MASUK') || m.jenis?.includes('KEMBALI');
                          const isKeluar = m.jenis?.includes('KELUAR') || m.jenis?.includes('TERPAKAI') || m.jenis?.includes('PINJAM');

                          return (
                            <tr key={`ov-mut-${m.id || idx}-${idx}`} className="hover:bg-white/5 transition">
                              <td className="py-2.5 px-3 font-mono text-gray-300">{m.tanggal}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-gray-300">
                                  {m.submenu}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-white">{m.item_nama || '-'}</div>
                                <div className="font-mono text-[10px] text-primary">{m.item_kode || '-'}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  isMasuk
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : isKeluar
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                }`}>
                                  {m.jenis}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-white">
                                {m.jumlah}
                              </td>
                              <td className="py-2.5 px-3 text-gray-300">
                                {m.pic || '-'}
                              </td>
                              <td className="py-2.5 px-3 text-gray-400">
                                {m.no_wo ? <span className="font-mono text-primary mr-1">[{m.no_wo}]</span> : null}
                                {m.keterangan || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    Belum ada riwayat mutasi yang dicatat.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VIEW: SUBMENU CONTENT (TAB 1: LIST OR TAB 2: MUTASI) */
            <div className="space-y-4 max-w-7xl mx-auto">
              {/* Search & Filter Bar */}
              <div className="bg-[#0a1318] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-1 items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Cari nama, kode, merk pada ${activeSubmenu}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                    />
                  </div>

                  {activeTab === 'LIST' && (
                    <>
                      {/* Kondisi Filter */}
                      <select
                        value={filterKondisi}
                        onChange={(e) => setFilterKondisi(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-primary"
                      >
                        <option value="ALL">Kondisi: Semua</option>
                        <option value="BAIK">Kondisi: BAIK</option>
                        <option value="RUSAK">Kondisi: RUSAK</option>
                      </select>

                      {/* Status Filter for Peralatan */}
                      {(activeSubmenu === 'PERALATAN KERJA' || activeSubmenu === 'PERALATAN K2/K3') && (
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-primary"
                        >
                          <option value="ALL">Status: Semua</option>
                          <option value="MASUK GUDANG/TERSEDIA">MASUK GUDANG/TERSEDIA</option>
                          <option value="DIGUNAKAN">DIGUNAKAN</option>
                          <option value="KELUAR GUDANG">KELUAR GUDANG</option>
                        </select>
                      )}

                      {/* View Mode Toggle */}
                      <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                        <button
                          onClick={() => setViewMode('GRID')}
                          className={`p-1.5 rounded-lg transition ${viewMode === 'GRID' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                          title="Tampilan Grid"
                        >
                          <Grid className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setViewMode('TABLE')}
                          className={`p-1.5 rounded-lg transition ${viewMode === 'TABLE' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                          title="Tampilan Tabel"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Main Action Buttons */}
                <div className="flex items-center space-x-2">
                  {activeTab === 'LIST' ? (
                    <>
                      {(activeSubmenu === 'PERALATAN KERJA' || activeSubmenu === 'PERALATAN K2/K3') && (
                        <button
                          onClick={() => setExportModalOpen(true)}
                          className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs rounded-xl shadow-lg shadow-rose-950/20 transition"
                          title={`Export Laporan PDF ${activeSubmenu}`}
                        >
                          <FileText className="w-4 h-4 text-rose-400" />
                          <span>Export PDF</span>
                        </button>
                      )}
                      <button
                        onClick={openCreateForm}
                        className="flex items-center space-x-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-black font-bold text-xs rounded-xl shadow transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Item</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setMutasiForm({
                          itemId: '',
                          kode: '',
                          itemNama: '',
                          tanggal: new Date().toISOString().split('T')[0],
                          jenis: mutasiOptions[0] || 'MASUK',
                          jumlah: 1,
                          pic: userName,
                          noWo: '',
                          keterangan: '',
                          odometer_km: '',
                          status_bbm: 'FULL',
                          lokasi_ruangan: ''
                        });
                        setMutasiModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-black font-bold text-xs rounded-xl shadow transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Catat Mutasi Baru</span>
                    </button>
                  )}
                </div>
              </div>

              {/* TAB 1: LIST SUBMENU */}
              {activeTab === 'LIST' && (
                <div className="space-y-4">
                  {/* Results Count & Badges */}
                  <div className="flex items-center justify-between text-xs text-gray-400 px-1 font-mono">
                    <span>Menampilkan {filteredItems.length} barang ({paginatedItems.length} di halaman ini)</span>
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Baik: {filteredItems.filter(i => String(i.KONDISI || '').toUpperCase().includes('BAIK')).length}
                      </span>
                      <span className="flex items-center gap-1 text-rose-400">
                        <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                        Rusak: {filteredItems.filter(i => String(i.KONDISI || '').toUpperCase().includes('RUSAK')).length}
                      </span>
                    </div>
                  </div>

                  {/* GRID VIEW */}
                  {viewMode === 'GRID' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {paginatedItems.map((item, idx) => {
                        const code = item.KODE || item.kode || item['PLAT KENDARAAN'] || `ITEM-${idx}`;
                        const name = item['NAMA PERALATAN'] || item['NAMA - JENIS'] || item['NAMA KENDARAAN'] || item['NAMA BARANG'] || '-';
                        const merk = item.MERK || item['MERK / TIPE'] || '-';
                        const kondisi = String(item.KONDISI || item.kondisi || 'BAIK').toUpperCase();
                        const isBaik = kondisi.includes('BAIK');
                        const status = item.STATUS || item.status || 'TERSEDIA';
                        const img = item['LINK GAMBAR'] || item.GAMBAR || item['FOTO KENDARAAN'] || '';

                        return (
                          <div 
                            key={`grid-${item.id || idx}-${code}-${idx}`}
                            className="bg-[#0a1318] border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all flex flex-col group"
                          >
                            {/* Card Image Banner */}
                            <div className="aspect-video w-full bg-black/50 relative overflow-hidden flex items-center justify-center">
                              {img && !img.includes('CellImage') ? (
                                <img 
                                  src={img} 
                                  alt={name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e: any) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-gray-600">
                                  <Package className="w-8 h-8 opacity-40 mb-1" />
                                  <span className="text-[10px] font-mono">PDKB ASSET</span>
                                </div>
                              )}

                              {/* Badges Overlay */}
                              <div className="absolute top-2 left-2 flex flex-col gap-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shadow-sm ${
                                  isBaik ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'
                                }`}>
                                  {kondisi}
                                </span>
                              </div>

                              <div className="absolute top-2 right-2">
                                <button
                                  onClick={() => setDetailItem(item)}
                                  className="p-1.5 bg-black/60 hover:bg-black/90 backdrop-blur-xs rounded-lg text-white transition"
                                  title="Lihat QR Code & Detail"
                                >
                                  <QrCode className="w-3.5 h-3.5 text-primary" />
                                </button>
                              </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                              <div>
                                <div className="flex items-center justify-between text-[11px] font-mono text-primary mb-1">
                                  <span className="font-bold truncate">{code}</span>
                                  {item.JENIS && (
                                    <span className="text-gray-400 text-[10px]">{item.JENIS}</span>
                                  )}
                                </div>
                                <h4 className="font-bold text-white text-xs leading-snug line-clamp-2" title={name}>
                                  {name}
                                </h4>
                                <p className="text-[11px] text-gray-400 mt-1 truncate">
                                  Merk: <span className="text-gray-300">{merk}</span>
                                </p>
                              </div>

                              {/* Specific Metrics per Submenu */}
                              <div className="pt-2 border-t border-white/5 text-[11px]">
                                {activeSubmenu === 'MATERIAL' && (
                                  <div className="grid grid-cols-3 gap-1 text-center font-mono">
                                    <div className="bg-black/30 p-1 rounded">
                                      <div className="text-[9px] text-gray-400">Gudang</div>
                                      <div className="font-bold text-white">{item['STOK GUDANG'] || 0}</div>
                                    </div>
                                    <div className="bg-black/30 p-1 rounded">
                                      <div className="text-[9px] text-gray-400">Mobil</div>
                                      <div className="font-bold text-white">{item['STOK MOBIL'] || 0}</div>
                                    </div>
                                    <div className="bg-primary/10 border border-primary/30 p-1 rounded">
                                      <div className="text-[9px] text-primary">Total</div>
                                      <div className="font-bold text-primary">{item['TOTAL STOK'] || 0}</div>
                                    </div>
                                  </div>
                                )}

                                {activeSubmenu === 'KENDARAAN' && (
                                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                                    <span>Pajak: <span className="text-emerald-400 font-bold">{item['STATUS PAJAK TAHUNAN'] || 'AKTIF'}</span></span>
                                    <span>BBM: <span className="text-primary font-bold">{item['STATUS BBM'] || 'FULL'}</span></span>
                                  </div>
                                )}

                                {activeSubmenu === 'INVENTARIS KANTOR' && (
                                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                                    <span className="truncate">Ruang: {item['LOKASI RUANGAN'] || '-'}</span>
                                    <span className="font-bold text-white">Qty: {item.JUMLAH || 1}</span>
                                  </div>
                                )}

                                {(activeSubmenu === 'PERALATAN KERJA' || activeSubmenu === 'PERALATAN K2/K3') && (
                                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                                    <span>Tgl Uji: {item['TGL UJI'] || '-'}</span>
                                    <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                                      String(status).includes('TERSEDIA') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                      String(status) === 'DIGUNAKAN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    }`}>
                                      {status}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Card Action Buttons */}
                              <div className="grid grid-cols-3 gap-1 pt-2">
                                <button
                                  onClick={() => setDetailItem(item)}
                                  className="py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white text-[10px] font-medium flex items-center justify-center gap-1 transition"
                                  title="Detail & Riwayat Mutasi"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Detail</span>
                                </button>
                                <button
                                  onClick={() => openMutasiForItem(item)}
                                  className="py-1.5 px-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition"
                                  title="Catat Mutasi"
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                  <span>Mutasi</span>
                                </button>
                                <button
                                  onClick={() => openEditForm(item)}
                                  className="py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white text-[10px] font-medium flex items-center justify-center gap-1 transition"
                                  title="Edit Item"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* TABLE VIEW */
                    <div className="bg-[#0a1318] border border-white/10 rounded-2xl overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 font-mono uppercase text-[10px]">
                            <th className="py-3 px-4">No</th>
                            <th className="py-3 px-4">Kode</th>
                            <th className="py-3 px-4">Nama Barang</th>
                            <th className="py-3 px-4">Merk / Tipe</th>
                            <th className="py-3 px-4">Kondisi</th>
                            {(activeSubmenu === 'PERALATAN KERJA' || activeSubmenu === 'PERALATAN K2/K3') && (
                              <>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Tgl Uji</th>
                              </>
                            )}
                            {activeSubmenu === 'MATERIAL' && (
                              <>
                                <th className="py-3 px-4 text-center">Gudang</th>
                                <th className="py-3 px-4 text-center">Mobil</th>
                                <th className="py-3 px-4 text-center">Total</th>
                              </>
                            )}
                            {activeSubmenu === 'KENDARAAN' && (
                              <>
                                <th className="py-3 px-4">Pajak</th>
                                <th className="py-3 px-4">BBM</th>
                              </>
                            )}
                            {activeSubmenu === 'INVENTARIS KANTOR' && (
                              <>
                                <th className="py-3 px-4">Lokasi Ruang</th>
                                <th className="py-3 px-4 text-center">Jumlah</th>
                              </>
                            )}
                            <th className="py-3 px-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {paginatedItems.map((item, idx) => {
                            const code = item.KODE || item.kode || item['PLAT KENDARAAN'] || `ITEM-${idx}`;
                            const name = item['NAMA PERALATAN'] || item['NAMA - JENIS'] || item['NAMA KENDARAAN'] || item['NAMA BARANG'] || '-';
                            const merk = item.MERK || item['MERK / TIPE'] || '-';
                            const kondisi = String(item.KONDISI || item.kondisi || 'BAIK').toUpperCase();
                            const isBaik = kondisi.includes('BAIK');

                            return (
                              <tr key={`tbl-${item.id || idx}-${code}-${idx}`} className="hover:bg-white/5 transition">
                                <td className="py-3 px-4 font-mono text-gray-400">{item.NO || idx + 1}</td>
                                <td className="py-3 px-4 font-mono font-bold text-primary">{code}</td>
                                <td className="py-3 px-4 font-medium text-white max-w-xs truncate">{name}</td>
                                <td className="py-3 px-4 text-gray-300">{merk}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    isBaik ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  }`}>
                                    {kondisi}
                                  </span>
                                </td>

                                {(activeSubmenu === 'PERALATAN KERJA' || activeSubmenu === 'PERALATAN K2/K3') && (
                                  <>
                                    <td className="py-3 px-4">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                        String(item.STATUS || item.status || '').includes('TERSEDIA')
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                          : String(item.STATUS || item.status || '') === 'DIGUNAKAN'
                                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      }`}>
                                        {item.STATUS || item.status || 'MASUK GUDANG/TERSEDIA'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-gray-400">{item['TGL UJI'] || '-'}</td>
                                  </>
                                )}

                                {activeSubmenu === 'MATERIAL' && (
                                  <>
                                    <td className="py-3 px-4 text-center font-mono text-gray-300">{item['STOK GUDANG'] || 0}</td>
                                    <td className="py-3 px-4 text-center font-mono text-gray-300">{item['STOK MOBIL'] || 0}</td>
                                    <td className="py-3 px-4 text-center font-mono font-bold text-primary">{item['TOTAL STOK'] || 0}</td>
                                  </>
                                )}

                                {activeSubmenu === 'KENDARAAN' && (
                                  <>
                                    <td className="py-3 px-4 font-mono text-emerald-400">{item['STATUS PAJAK TAHUNAN'] || 'AKTIF'}</td>
                                    <td className="py-3 px-4 font-mono text-primary">{item['STATUS BBM'] || 'FULL'}</td>
                                  </>
                                )}

                                {activeSubmenu === 'INVENTARIS KANTOR' && (
                                  <>
                                    <td className="py-3 px-4 text-gray-300">{item['LOKASI RUANGAN'] || '-'}</td>
                                    <td className="py-3 px-4 text-center font-mono font-bold text-white">{item.JUMLAH || 1}</td>
                                  </>
                                )}

                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end space-x-1.5">
                                    <button
                                      onClick={() => setDetailItem(item)}
                                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white"
                                      title="Detail"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => openMutasiForItem(item)}
                                      className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg"
                                      title="Catat Mutasi"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => openEditForm(item)}
                                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white"
                                      title="Edit"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-mono">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 disabled:opacity-40"
                      >
                        Sebelumnya
                      </button>
                      <span className="text-gray-400">
                        Halaman <span className="text-white font-bold">{currentPage}</span> dari {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 disabled:opacity-40"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MUTASI SUBMENU */}
              {activeTab === 'MUTASI' && (
                <div className="bg-[#0a1318] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                        Riwayat Mutasi: {activeSubmenu}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Pencatatan pergerakan barang, peminjaman, dan penyesuaian stok.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                      {filteredMutasi.length} Catatan Mutasi
                    </span>
                  </div>

                  {filteredMutasi.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 font-mono uppercase text-[10px]">
                            <th className="py-2.5 px-3">Tanggal</th>
                            <th className="py-2.5 px-3">Kode & Nama Barang</th>
                            <th className="py-2.5 px-3">Jenis Mutasi</th>
                            <th className="py-2.5 px-3 text-center">Jumlah</th>
                            <th className="py-2.5 px-3">PIC / Petugas</th>
                            <th className="py-2.5 px-3">No. WO / Keperluan</th>
                            <th className="py-2.5 px-3">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredMutasi.map((m: any, idx: number) => {
                            const isMasuk = m.jenis?.includes('MASUK') || m.jenis?.includes('KEMBALI');
                            const isKeluar = m.jenis?.includes('KELUAR') || m.jenis?.includes('TERPAKAI') || m.jenis?.includes('PINJAM');

                            return (
                              <tr key={`mut-row-${m.id || idx}-${idx}`} className="hover:bg-white/5 transition">
                                <td className="py-3 px-3 font-mono text-gray-300">{m.tanggal}</td>
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-white">{m.item_nama || '-'}</div>
                                  <div className="font-mono text-[10px] text-primary">{m.item_kode || '-'}</div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                    isMasuk
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : isKeluar
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                  }`}>
                                    {m.jenis}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-bold text-white">
                                  {m.jumlah}
                                </td>
                                <td className="py-3 px-3 text-gray-300">
                                  {m.pic || '-'}
                                </td>
                                <td className="py-3 px-3 font-mono text-gray-300">
                                  {m.no_wo ? <span className="text-primary font-bold">{m.no_wo}</span> : '-'}
                                </td>
                                <td className="py-3 px-3 text-gray-400">
                                  {m.keterangan || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                        <ArrowRightLeft className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Belum Ada Riwayat Mutasi</h4>
                        <p className="text-xs text-gray-400 max-w-sm">
                          Catatan mutasi untuk submenu {activeSubmenu} akan muncul di sini setiap kali ada pergerakan atau peminjaman barang.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setMutasiForm({
                            itemId: '',
                            kode: '',
                            itemNama: '',
                            tanggal: new Date().toISOString().split('T')[0],
                            jenis: mutasiOptions[0] || 'MASUK',
                            jumlah: 1,
                            pic: userName,
                            noWo: '',
                            keterangan: '',
                            odometer_km: '',
                            status_bbm: 'FULL',
                            lokasi_ruangan: ''
                          });
                          setMutasiModalOpen(true);
                        }}
                        className="px-4 py-2 bg-primary text-black font-bold text-xs rounded-xl shadow mt-2"
                      >
                        + Catat Mutasi Pertama
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL: DETAIL BARANG & QR CODE */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a1318] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-white text-sm">
                  Detail & QR Code: {detailItem.KODE || detailItem.kode || detailItem['PLAT KENDARAAN']}
                </h3>
              </div>
              <button 
                onClick={() => setDetailItem(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* QR Code and Main Image Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* QR Code Display */}
                <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center text-black">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      detailItem.KODE || detailItem.kode || detailItem['PLAT KENDARAAN'] || 'PDKB'
                    )}`}
                    alt="QR Code"
                    className="w-40 h-40 object-contain"
                  />
                  <span className="font-mono font-bold text-xs mt-2 tracking-wider">
                    {detailItem.KODE || detailItem.kode || detailItem['PLAT KENDARAAN']}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">PDKB UP3 WATAMPONE</span>
                </div>

                {/* Item Photo Preview */}
                <div className="bg-black/50 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 aspect-square sm:aspect-auto">
                  {detailItem['LINK GAMBAR'] || detailItem.GAMBAR || detailItem['FOTO KENDARAAN'] ? (
                    <img
                      src={detailItem['LINK GAMBAR'] || detailItem.GAMBAR || detailItem['FOTO KENDARAAN']}
                      alt="Foto Barang"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-500 text-xs flex flex-col items-center">
                      <Camera className="w-8 h-8 opacity-40 mb-1" />
                      <span>Tidak ada foto</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-white/5 rounded-xl p-4 space-y-2 text-xs">
                <h4 className="font-mono uppercase text-gray-400 text-[10px] tracking-wider mb-2 font-bold">
                  Spesifikasi Teknis
                </h4>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <span className="text-gray-400">Nama:</span>{' '}
                    <span className="text-white font-bold">{detailItem['NAMA PERALATAN'] || detailItem['NAMA - JENIS'] || detailItem['NAMA KENDARAAN'] || detailItem['NAMA BARANG']}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Merk / Tipe:</span>{' '}
                    <span className="text-white">{detailItem.MERK || detailItem['MERK / TIPE'] || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Kondisi:</span>{' '}
                    <span className={`font-bold ${String(detailItem.KONDISI).includes('BAIK') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {detailItem.KONDISI || 'BAIK'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>{' '}
                    <span className="text-primary">{detailItem.STATUS || detailItem.status || 'MASUK GUDANG/TERSEDIA'}</span>
                  </div>
                  {detailItem['TGL UJI'] && (
                    <div>
                      <span className="text-gray-400">Tgl Uji:</span>{' '}
                      <span className="text-white">{detailItem['TGL UJI']}</span>
                    </div>
                  )}
                  {detailItem['TOTAL STOK'] !== undefined && (
                    <div>
                      <span className="text-gray-400">Total Stok:</span>{' '}
                      <span className="text-primary font-bold">{detailItem['TOTAL STOK']}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Specific Item Mutasi History */}
              {detailItem.riwayat_mutasi && detailItem.riwayat_mutasi.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-mono uppercase text-gray-400 text-[10px] tracking-wider font-bold">
                    Riwayat Mutasi Barang Ini
                  </h4>
                  <div className="bg-black/30 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2 text-xs">
                    {detailItem.riwayat_mutasi.map((m: any, idx: number) => (
                      <div key={`detail-mut-${m.id || idx}-${idx}`} className="flex items-center justify-between border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                        <div>
                          <span className="font-mono text-primary font-bold mr-2">{m.jenis}</span>
                          <span className="text-gray-400">({m.tanggal}) - PIC: {m.pic}</span>
                          {m.keterangan && <div className="text-[11px] text-gray-400">{m.keterangan}</div>}
                        </div>
                        <span className="font-mono font-bold text-white">Qty: {m.jumlah}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/20">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center space-x-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300 hover:text-white transition"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Label QR</span>
              </button>

              <button
                onClick={() => {
                  setDetailItem(null);
                  openMutasiForItem(detailItem);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-cyan-500 text-black font-bold text-xs rounded-xl shadow transition"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Catat Mutasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CATAT MUTASI */}
      {mutasiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a1318] border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-white text-sm">
                  Catat Mutasi: {activeSubmenu}
                </h3>
              </div>
              <button onClick={() => setMutasiModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMutasi} className="p-5 space-y-4 text-xs">
              {/* Select Item */}
              <div>
                <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                  Pilih Barang / Item
                </label>
                <select
                  value={mutasiForm.itemId ? String(mutasiForm.itemId) : mutasiForm.kode}
                  onChange={(e) => {
                    const val = e.target.value;
                    const sel = itemsData.find(i => String(i.id) === val || (i.KODE || i.kode || i['PLAT KENDARAAN']) === val);
                    const k = sel?.KODE || sel?.kode || sel?.['PLAT KENDARAAN'] || val;
                    const n = sel ? (sel['NAMA PERALATAN'] || sel['NAMA - JENIS'] || sel['NAMA KENDARAAN'] || sel['NAMA BARANG']) : '';
                    setMutasiForm((prev: any) => ({
                      ...prev,
                      kode: k,
                      itemId: sel?.id || '',
                      itemNama: n,
                      lokasi_ruangan: sel?.['LOKASI RUANGAN'] || prev.lokasi_ruangan || ''
                    }));
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                  required
                >
                  <option value="">-- Pilih Barang --</option>
                  {itemsData.map((item, idx) => {
                    const k = item.KODE || item.kode || item['PLAT KENDARAAN'] || `ITEM-${idx}`;
                    const n = item['NAMA PERALATAN'] || item['NAMA - JENIS'] || item['NAMA KENDARAAN'] || item['NAMA BARANG'] || '';
                    const merk = item.MERK || item['MERK / TIPE'];
                    return (
                      <option key={`opt-item-${item.id || idx}-${k}-${idx}`} value={item.id ? String(item.id) : k}>
                        {k} - {n} {merk ? `(${merk})` : ''}
                      </option>
                    );
                  })}
                </select>

                {/* Stock Info for Material */}
                {activeSubmenu === 'MATERIAL' && mutasiForm.kode && (() => {
                  const sel = itemsData.find(x => x.KODE === mutasiForm.kode || x.kode === mutasiForm.kode || String(x.id) === String(mutasiForm.itemId));
                  if (!sel) return null;
                  const sg = sel['STOK GUDANG'] ?? sel.stok_gudang ?? 0;
                  const sm = sel['STOK MOBIL'] ?? sel.stok_mobil ?? 0;
                  const st = sel['TOTAL STOK'] ?? sel.total_stok ?? 0;
                  return (
                    <div className="mt-1.5 p-2 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-gray-400">Stok Saat Ini:</span>
                      <div className="space-x-3">
                        <span className="text-amber-400">Gudang: <b>{sg}</b></span>
                        <span className="text-cyan-400">Mobil: <b>{sm}</b></span>
                        <span className="text-green-400">Total: <b>{st}</b></span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Tanggal & Jenis Mutasi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={mutasiForm.tanggal}
                    onChange={(e) => setMutasiForm({ ...mutasiForm, tanggal: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                    Jenis Mutasi
                  </label>
                  <select
                    value={mutasiForm.jenis}
                    onChange={(e) => setMutasiForm({ ...mutasiForm, jenis: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                    required
                  >
                    {mutasiOptions.map((opt, optIdx) => (
                      <option key={`opt-type-${opt}-${optIdx}`} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {activeSubmenu === 'MATERIAL' && (
                    <p className="mt-1 text-[10px] text-cyan-400 font-mono leading-tight">
                      {mutasiForm.jenis === 'MASUK KE GUDANG' && '⚡ Menambah Stok Gudang (Penerimaan baru)'}
                      {mutasiForm.jenis === 'PINDAH KE MOBIL' && '⚡ Mengurangi Gudang & Menambah Mobil'}
                      {mutasiForm.jenis === 'KEMBALI KE GUDANG' && '⚡ Mengurangi Mobil & Menambah Gudang (Retur Mobil)'}
                      {mutasiForm.jenis === 'TERPAKAI WO' && '⚡ Mengurangi Stok Mobil (Terpakai WO)'}
                      {(mutasiForm.jenis === 'KELUAR GUDANG' || mutasiForm.jenis === 'KELUAR') && '⚡ Mengurangi Stok Gudang (Pengeluaran langsung)'}
                    </p>
                  )}
                  {(activeSubmenu === 'PERALATAN KERJA' || activeSubmenu === 'PERALATAN K2/K3') && (
                    <p className="mt-1 text-[10px] text-cyan-400 font-mono leading-tight">
                      {mutasiForm.jenis === 'MASUK GUDANG/ TERSEDIA' && '⚡ Status item diubah menjadi MASUK GUDANG/TERSEDIA'}
                      {mutasiForm.jenis === 'KELUAR GUDANG' && '⚡ Status item diubah menjadi KELUAR GUDANG'}
                      {mutasiForm.jenis === 'DIGUNAKAN' && '⚡ Status item diubah menjadi DIGUNAKAN (Dipakai Lapangan)'}
                      {mutasiForm.jenis === 'KEMBALI KE GUDANG' && '⚡ Status item diubah menjadi MASUK GUDANG/TERSEDIA (Alat Kembali)'}
                    </p>
                  )}
                </div>
              </div>

              {/* Jumlah & Penanggung Jawab */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                    Jumlah (Qty)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={mutasiForm.jumlah}
                    onChange={(e) => setMutasiForm({ ...mutasiForm, jumlah: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                    PIC / Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={mutasiForm.pic}
                    onChange={(e) => setMutasiForm({ ...mutasiForm, pic: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* No. WO / Keperluan */}
              <div>
                <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                  No. Work Order (WO) / Tujuan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: WO/UP3/2026/042 atau Pekerjaan Pemeliharaan"
                  value={mutasiForm.noWo}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, noWo: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                />
              </div>

              {/* Kendaraan Specific Fields */}
              {activeSubmenu === 'KENDARAAN' && (
                <div className="grid grid-cols-2 gap-3 bg-white/5 p-3 rounded-xl">
                  <div>
                    <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                      Odometer (KM)
                    </label>
                    <input
                      type="number"
                      value={mutasiForm.odometer_km}
                      onChange={(e) => setMutasiForm({ ...mutasiForm, odometer_km: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none font-mono"
                      placeholder="KM Saat Ini"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                      Status BBM
                    </label>
                    <select
                      value={mutasiForm.status_bbm}
                      onChange={(e) => setMutasiForm({ ...mutasiForm, status_bbm: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                    >
                      <option value="FULL">FULL</option>
                      <option value="3/4">3/4</option>
                      <option value="1/2">1/2</option>
                      <option value="1/4">1/4</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Keterangan */}
              <div>
                <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                  Catatan / Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan..."
                  value={mutasiForm.keterangan}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, keterangan: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMutasiModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-black font-bold rounded-xl shadow disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Mutasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT ITEM */}
      {(isCreating || editItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a1318] border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-white text-sm">
                  {isCreating ? `Tambah Item: ${activeSubmenu}` : `Edit Item: ${formData.KODE || formData['PLAT KENDARAAN']}`}
                </h3>
              </div>
              <button 
                onClick={() => { setIsCreating(false); setEditItem(null); }}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4 text-xs">
              {/* Kode Item */}
              <div>
                <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                  {activeSubmenu === 'KENDARAAN' ? 'Plat Kendaraan' : 'Kode Barang'}
                </label>
                <input
                  type="text"
                  value={formData.KODE || formData['PLAT KENDARAAN'] || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    KODE: e.target.value,
                    'PLAT KENDARAAN': e.target.value,
                    kode: e.target.value,
                    plat_kendaraan: e.target.value
                  })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none font-mono"
                  required
                />
              </div>

              {/* Nama Item */}
              <div>
                <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                  Nama Barang / Peralatan
                </label>
                <input
                  type="text"
                  value={formData['NAMA PERALATAN'] || formData['NAMA - JENIS'] || formData['NAMA KENDARAAN'] || formData['NAMA BARANG'] || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    'NAMA PERALATAN': e.target.value,
                    'NAMA - JENIS': e.target.value,
                    'NAMA KENDARAAN': e.target.value,
                    'NAMA BARANG': e.target.value,
                    nama_peralatan: e.target.value,
                    nama_jenis: e.target.value,
                    nama_kendaraan: e.target.value,
                    nama_barang: e.target.value
                  })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                  required
                />
              </div>

              {/* Merk / Tipe & Kondisi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                    Merk / Tipe
                  </label>
                  <input
                    type="text"
                    value={formData.MERK || formData['MERK / TIPE'] || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      MERK: e.target.value,
                      'MERK / TIPE': e.target.value,
                      merk: e.target.value,
                      merk_tipe: e.target.value
                    })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                    Kondisi
                  </label>
                  <select
                    value={formData.KONDISI || 'BAIK'}
                    onChange={(e) => setFormData({ ...formData, KONDISI: e.target.value, kondisi: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none font-mono font-bold"
                  >
                    <option value="BAIK">BAIK</option>
                    <option value="RUSAK">RUSAK</option>
                  </select>
                </div>
              </div>

              {/* Material Specific Stok */}
              {activeSubmenu === 'MATERIAL' && (
                <div className="grid grid-cols-2 gap-3 bg-white/5 p-3 rounded-xl">
                  <div>
                    <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                      Stok Gudang
                    </label>
                    <input
                      type="number"
                      value={formData['STOK GUDANG'] || 0}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        'STOK GUDANG': Number(e.target.value),
                        stok_gudang: Number(e.target.value)
                      })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 font-mono uppercase text-[10px]">
                      Stok Mobil
                    </label>
                    <input
                      type="number"
                      value={formData['STOK MOBIL'] || 0}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        'STOK MOBIL': Number(e.target.value),
                        stok_mobil: Number(e.target.value)
                      })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Foto / Gambar Barang (Ambil Foto / Upload) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-gray-400 font-mono uppercase text-[10px]">
                    Foto / Gambar {activeSubmenu}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 font-mono transition"
                  >
                    <LinkIcon className="w-3 h-3" />
                    {showUrlInput ? 'Gunakan Kamera / Upload' : 'Gunakan Link URL'}
                  </button>
                </div>

                {/* Hidden Inputs for Camera and File Upload */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />

                {(() => {
                  const currentPhoto = formData['LINK GAMBAR'] || formData.foto_kendaraan || formData.link_gambar || formData.GAMBAR || formData['FOTO KENDARAAN'] || '';

                  if (processingImage) {
                    return (
                      <div className="border border-white/10 rounded-xl p-6 bg-black/40 flex flex-col items-center justify-center text-center space-y-2">
                        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                        <span className="text-xs text-gray-400">Memproses & mengoptimalkan foto...</span>
                      </div>
                    );
                  }

                  if (currentPhoto) {
                    return (
                      <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-3">
                        <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/60 max-h-48 flex items-center justify-center">
                          <img
                            src={currentPhoto}
                            alt="Preview Barang"
                            className="max-h-48 w-full object-contain"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-gray-300 hover:text-white transition cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-primary" />
                            <span>Ambil Foto Ulang</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-gray-300 hover:text-white transition cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-primary" />
                            <span>Ganti File</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-[11px] text-rose-400 hover:text-rose-300 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-white/15 bg-black/30 hover:bg-white/5 hover:border-primary/50 transition-all text-center group cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2 group-hover:scale-105 transition-transform">
                            <Camera className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-semibold text-white">Ambil Foto</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">Kamera Perangkat</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-white/15 bg-black/30 hover:bg-white/5 hover:border-primary/50 transition-all text-center group cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-105 transition-transform">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-semibold text-white">Upload Foto</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">Galeri / Berkas</span>
                        </button>
                      </div>

                      {showUrlInput && (
                        <div className="pt-1">
                          <input
                            type="text"
                            placeholder="Atau masukkan link gambar: https://..."
                            value={formData['LINK GAMBAR'] || formData.foto_kendaraan || ''}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              'LINK GAMBAR': e.target.value,
                              link_gambar: e.target.value,
                              GAMBAR: e.target.value,
                              foto_kendaraan: e.target.value,
                              'FOTO KENDARAAN': e.target.value
                            })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none font-mono text-[11px]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setEditItem(null); }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-black font-bold rounded-xl shadow disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCAN QR CODE */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a1318] border border-white/10 rounded-2xl max-w-md w-full p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-white text-sm">Scan QR Code Barang</h3>
              </div>
              <button onClick={() => setIsScanning(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-square w-full rounded-xl overflow-hidden bg-black relative flex items-center justify-center">
              <Scanner
                onScan={(result) => {
                  if (result && result.length > 0) {
                    processScanResult(result[0].rawValue);
                  }
                }}
                allowMultiple={true}
                components={{ audio: false }}
              />
            </div>

            {/* Manual input fallback */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <p className="text-[11px] text-gray-400">Atau masukkan kode barang secara manual:</p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Contoh: 12.10 atau LLC-001"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono"
                />
                <button
                  onClick={() => {
                    if (manualCodeInput.trim()) {
                      processScanResult(manualCodeInput.trim());
                    }
                  }}
                  className="px-4 py-2 bg-primary text-black font-bold text-xs rounded-xl"
                >
                  Cari
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT LAPORAN PDF MODAL */}
      {(activeSubmenu === 'PERALATAN KERJA' || activeSubmenu === 'PERALATAN K2/K3') && exportModalOpen && (
        <React.Suspense fallback={null}>
          <ExportLaporanModal
            isOpen={exportModalOpen}
            onClose={() => setExportModalOpen(false)}
            menu={activeSubmenu}
            items={itemsData}
            userName={userName}
          />
        </React.Suspense>
      )}
    </div>
  );
}
