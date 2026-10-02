import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { gasService } from '../services/gasService';
import { 
  ArrowLeft, Plus, Filter, Search, Calendar, MapPin, 
  ChevronRight, AlignLeft, ShieldCheck, Camera, X, ClipboardList, PenTool, Zap, Building, UtilityPole, Star, RefreshCw, FileText
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { format } from 'date-fns';
import PhotoEditor from '../components/PhotoEditor';
import ImageZoomModal from '../components/ImageZoomModal';
import { ExportWorkOrderModal } from '../components/export/ExportWorkOrderModal';

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    const idMatch = url.match(/id=([^&]+)/) || url.match(/\/d\/(.*?)\//);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
  }
  return url;
};

export default function WorkOrder() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [wos, setWos] = useState<any[]>([]);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWo, setSelectedWo] = useState<any>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showExportWoModal, setShowExportWoModal] = useState(false);
  
  // Photo Editor State
  const [photoToEdit, setPhotoToEdit] = useState<string | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [ulpFilter, setUlpFilter] = useState('Semua');

  const [options, setOptions] = useState<any>(null);
  const [newWo, setNewWo] = useState({ 
    kategori: '', ulp: '', garduInduk: '', penyulang: '', segmen: '', alamat: '', koordinat: '', 
    skalaPrioritas: '', jenisTiang: '', ukuranTiang: '', jenisKonduktor: '', 
    ukuranKonduktor: '', keypoint: '', keterangan: '', temuan: '', fotoBase64: '' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // LLC States
  const [isLlcModalOpen, setIsLlcModalOpen] = useState(false);
  const [llcData, setLlcData] = useState<any[]>([]);
  const [llcLoading, setLlcLoading] = useState(false);
  const [llcSyncing, setLlcSyncing] = useState(false);
  const [llcFilters, setLlcFilters] = useState({ ulp: '', garduInduk: '', penyulang: '', segmen: '', status: '' });
  const [selectedLlcItem, setSelectedLlcItem] = useState<any>(null);
  const [selectedLlcOrigin, setSelectedLlcOrigin] = useState<any>(null);
  const [showLlcConfirm, setShowLlcConfirm] = useState(false);
  const [showFotoLlc, setShowFotoLlc] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  const canAddWO = ['PELAKSANA', 'SURVEYOR', 'PREPARATOR', 'INISIATOR', 'KEPALA REGU', 'PENGAWAS K3', 'USER'].includes(user?.role?.toUpperCase() || '');
  const [syncingSpreadsheet, setSyncingSpreadsheet] = useState(false);

  useEffect(() => {
    fetchWOs();
    fetchOptions();
  }, []);

  const handleSyncSpreadsheet = async () => {
    try {
      setSyncingSpreadsheet(true);
      const res = await gasService.syncWorkOrders();
      if (res.success) {
        gasService.clearCache('getWorkOrders');
        await fetchWOs();
        alert(res.message || 'Sinkronisasi Work Orders dari Spreadsheet berhasil!');
      } else {
        alert(res.message || 'Gagal sinkronisasi data Work Orders.');
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan sinkronisasi: ${err.message || err}`);
    } finally {
      setSyncingSpreadsheet(false);
    }
  };

  const fetchWOs = async () => {
    setLoading(true);
    const res = await gasService.post('getWorkOrders');
    if (res.success && res.data) {
      const sorted = [...res.data]
        .filter((w: any) => {
          const no = String(w.noWo || w.id || '').trim();
          return !/\.(jpg|jpeg|png|webp|gif)$/i.test(no) && !no.toUpperCase().includes('.FOTO.');
        })
        .sort((a: any, b: any) => {
          const getCleanNum = (val: any) => {
            const s = String(val || '').trim();
            const m = s.match(/^\d+/);
            return m ? parseInt(m[0], 10) : (parseInt(s.replace(/\D/g, ''), 10) || 0);
          };
          return getCleanNum(b.noWo || b.id) - getCleanNum(a.noWo || a.id);
        });
      setWos(sorted);
    } else {
      setWos([]);
    }
    setLoading(false);
  };

  const fetchLlcData = async () => {
    setLlcLoading(true);
    const res = await gasService.post('getLlcList');
    if (res.success) {
      setLlcData(res.data || []);
    } else {
      setLlcData([]);
    }
    setLlcLoading(false);
  };

  const fetchOptions = async () => {
    const res = await gasService.post('getOptions');
    if (res.success) {
       setOptions(res.data);
    }
  };

  const handleLlcConfirm = () => {
    if (selectedLlcItem) {
      setNewWo((prev) => ({
        ...prev,
        kategori: prev.kategori || 'PEMELIHARAAN',
        ulp: selectedLlcItem['ULP'] || prev.ulp,
        garduInduk: selectedLlcItem['GARDU INDUK'] || prev.garduInduk,
        penyulang: selectedLlcItem['PENYULANG'] || prev.penyulang,
        segmen: selectedLlcItem['SEGMEN'] || prev.segmen,
        alamat: selectedLlcItem['ALAMAT'] || prev.alamat,
        koordinat: selectedLlcItem['TITIK KOORDINAT'] || prev.koordinat,
        skalaPrioritas: selectedLlcItem['SKALA PRIORITAS'] ? String(selectedLlcItem['SKALA PRIORITAS']) : prev.skalaPrioritas,
        
        jenisTiang: options?.spekJtm?.['JENIS TIANG']?.find((opt: string) => String(opt).toLowerCase() === (selectedLlcItem['JENIS TIANG'] || '').toString().toLowerCase()) || selectedLlcItem['JENIS TIANG'] || prev.jenisTiang,
        ukuranTiang: options?.spekJtm?.['UKURAN TIANG']?.find((opt: string) => String(opt).toLowerCase() === (selectedLlcItem['UKURAN TIANG'] || '').toString().toLowerCase()) || selectedLlcItem['UKURAN TIANG'] || prev.ukuranTiang,
        jenisKonduktor: options?.spekJtm?.['JENIS KONDUKTOR']?.find((opt: string) => String(opt).toLowerCase() === (selectedLlcItem['JENIS KONDUKTOR'] || '').toString().toLowerCase()) || selectedLlcItem['JENIS KONDUKTOR'] || prev.jenisKonduktor,
        ukuranKonduktor: options?.spekJtm?.['UKURAN KONDUKTOR']?.find((opt: string) => String(opt).toLowerCase() === (selectedLlcItem['UKURAN KONDUKTOR'] || '').toString().toLowerCase()) || selectedLlcItem['UKURAN KONDUKTOR'] || prev.ukuranKonduktor,

        keypoint: selectedLlcItem['KEYPOINT'] || prev.keypoint,
        temuan: selectedLlcItem['TEMUAN'] || selectedLlcItem['TEMUAN SEBELUMNYA'] || prev.temuan,
        keterangan: selectedLlcItem['KETERANGAN'] || prev.keterangan,
      }));
      // Simpan referensi item LLC agar ketika "SIMPAN WO" ditekan, statusnya berubah menjadi SUDAH DIRENCANAKAN
      setSelectedLlcOrigin(selectedLlcItem);
      setShowLlcConfirm(false);
      setIsLlcModalOpen(false);
      setSelectedLlcItem(null);
    }
  };

  // Filter: Jangan tampilkan baris yang tidak memiliki NO. WO atau KOSONG
  const filteredLlcData = llcData.filter(item => {
    const noWo = String(item['NO. WO'] || item['no_wo'] || item['NO WO'] || '').trim();
    if (!noWo || noWo === '-' || noWo === '0' || noWo.toLowerCase() === 'null') return false;
    return (!llcFilters.ulp || item['ULP'] === llcFilters.ulp) &&
           (!llcFilters.garduInduk || item['GARDU INDUK'] === llcFilters.garduInduk) &&
           (!llcFilters.penyulang || item['PENYULANG'] === llcFilters.penyulang) &&
           (!llcFilters.segmen || item['SEGMEN'] === llcFilters.segmen) &&
           (!llcFilters.status || item['STATUS PEMELIHARAAN'] === llcFilters.status);
  });

  const getUniqueValues = (key: string, condition?: Record<string, string>) => {
    return Array.from(new Set(llcData.filter(item => {
      const noWo = String(item['NO. WO'] || item['no_wo'] || item['NO WO'] || '').trim();
      if (!noWo || noWo === '-' || noWo === '0' || noWo.toLowerCase() === 'null') return false;
      if (!condition) return true;
      for (const k in condition) {
        if (condition[k] && item[k] !== condition[k]) return false;
      }
      return true;
    }).map(item => item[key]).filter(Boolean)));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser ini.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setNewWo((prev) => ({ ...prev, koordinat: `${latitude}, ${longitude}` }));
        setGettingLocation(false);
      },
      (error) => {
        alert('Gagal mendapatkan lokasi: ' + error.message);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoToEdit(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleSubmitWo = async () => {
    if (!newWo.kategori || !newWo.ulp || !newWo.temuan) {
      alert('Kategori, ULP, dan Temuan wajib diisi');
      return;
    }
    setSubmitting(true);
    const llcNoWo = selectedLlcOrigin ? (selectedLlcOrigin['NO. WO'] || selectedLlcOrigin.no_wo) : undefined;
    const llcRowIndex = selectedLlcOrigin ? selectedLlcOrigin._rowIndex : undefined;

    const res = await gasService.post('submitWorkOrder', {
      ...newWo,
      surveyor: user?.name,
      llcNoWo: llcNoWo ? String(llcNoWo).trim() : undefined,
      llcRowIndex: llcRowIndex,
    });
    if (res.success) {
      // Jika berasal dari item Pemeliharaan LLC, update STATUS PEMELIHARAAN menjadi SUDAH DIRENCANAKAN
      if (selectedLlcOrigin) {
        try {
          await gasService.post('updateLlcStatus', {
            noWo: llcNoWo ? String(llcNoWo).trim() : undefined,
            rowIndex: llcRowIndex,
            id: selectedLlcOrigin.id,
            status: 'SUDAH DIRENCANAKAN'
          });
          setLlcData(prev => prev.map(item => {
            const isMatch = (llcNoWo && (String(item['NO. WO']).trim() === String(llcNoWo).trim() || String(item.no_wo).trim() === String(llcNoWo).trim())) ||
                            (llcRowIndex && item._rowIndex === llcRowIndex) ||
                            (selectedLlcOrigin.id && item.id === selectedLlcOrigin.id);
            return isMatch ? { ...item, 'STATUS PEMELIHARAAN': 'SUDAH DIRENCANAKAN', status_pemeliharaan: 'SUDAH DIRENCANAKAN' } : item;
          }));
        } catch (e) {
          console.error('Gagal update status LLC:', e);
        }
        setSelectedLlcOrigin(null);
      }

      setShowAddModal(false);
      setNewWo({ 
        kategori: '', ulp: '', garduInduk: '', penyulang: '', segmen: '', alamat: '', koordinat: '', 
        skalaPrioritas: '', jenisTiang: '', ukuranTiang: '', jenisKonduktor: '', 
        ukuranKonduktor: '', keypoint: '', keterangan: '', temuan: '', fotoBase64: '' 
      });
      fetchWOs();
      
      if (user?.role === 'PREPARATOR' || user?.role === 'INISIATOR') {
        const generatedNoWo = res.data?.noWo;
        if (generatedNoWo) {
          if (window.confirm("WO berhasil tersimpan. Lanjut Review WO ini ?")) {
            navigate('/review-wo?viewDetail=' + generatedNoWo);
          }
        }
      }
    } else {
      alert('Gagal submit WO: ' + (res.message || res.error || JSON.stringify(res)));
    }
    setSubmitting(false);
  };

  const filteredWos = wos.filter(wo => {
    // Status Filter
    if (statusFilter !== 'Semua' && !wo.status?.toString().toLowerCase().includes(statusFilter.toLowerCase())) return false;
    
    // ULP Filter
    if (ulpFilter !== 'Semua' && ulpFilter !== 'Semua ULP' && wo.ulp?.toString().toLowerCase() !== ulpFilter.toLowerCase()) return false;

    // Date Filter
    if (dateFilter) {
      // Assuming dateFilter is YYYY-MM-DD
      const dateParts = dateFilter.split('-');
      if (dateParts.length === 3) {
        // convert to DD/MM/YYYY
        const expectedDdmmyyyy = `${parseInt(dateParts[2])}/${parseInt(dateParts[1])}/${dateParts[0]}`;
        // standard format is D/M/YYYY or DD/MM/YYYY, check include
        if (!wo.tanggal?.includes(expectedDdmmyyyy) && !wo.tanggal?.includes(dateFilter)) {
          // let's do a more robust check by also matching D/M/YYYY
          const d = parseInt(dateParts[2]).toString();
          const m = parseInt(dateParts[1]).toString();
          const y = dateParts[0];
          if (!wo.tanggal?.includes(`${d}/${m}/${y}`) && !wo.tanggal?.includes(`${d}-${m}-${y}`) && !wo.tanggal?.includes(dateFilter)) return false;
        }
      }
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchWo = wo.noWo?.toString().toLowerCase().includes(q);
      const matchPenyulang = wo.penyulang?.toString().toLowerCase().includes(q);
      const matchGardu = wo.garduInduk?.toString().toLowerCase().includes(q);
      const matchId = wo.id?.toString().toLowerCase().includes(q);
      if (!matchWo && !matchPenyulang && !matchGardu && !matchId) return false;
    }

    return true;
  });

  const uniqueStatuses = [...new Set(wos.map(wo => wo.status?.toString() || ''))].filter(Boolean).sort();
  const uniqueULPs = [...new Set(wos.map(wo => wo.ulp?.toString() || ''))].filter(Boolean).sort();

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('selesai') || s.includes('disetujui')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (s.includes('tunggu') || s.includes('approval')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (s.includes('tolak')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <div className="min-h-screen bg-[#0a0f12] text-white flex flex-col font-sans pb-20">
      {/* Header */}
      <header className="h-14 border-b border-[#0d8291]/30 bg-[#0d161a] flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/office')}
            className="w-8 h-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-widest text-white uppercase leading-tight">Work Order</h1>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest">Daftar Pekerjaan PDKB</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncSpreadsheet}
            disabled={syncingSpreadsheet || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e7490]/20 hover:bg-[#0e7490] border border-[#0e7490]/40 text-[#22d3ee] hover:text-black rounded text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm"
            title="Sinkronisasi data dari Google Spreadsheet ke Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingSpreadsheet ? 'animate-spin' : ''}`} />
            <span>{syncingSpreadsheet ? 'Menyinkronkan...' : 'Sinkron Spreadsheet'}</span>
          </button>
          <button
            onClick={() => { gasService.clearCache('getWorkOrders'); fetchWOs(); }}
            disabled={loading || syncingSpreadsheet}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col gap-4">
        
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto relative mb-4 sm:mb-0">
            <Search className="w-4 h-4 text-gray-500 absolute left-3" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. WO / Penyulang..." 
              className="w-full sm:w-64 bg-[#1a252b] border border-white/10 rounded pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-primary transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (filteredWos.length > 0) {
                  setSelectedWo(filteredWos[0]);
                  setShowExportWoModal(true);
                } else if (wos.length > 0) {
                  setSelectedWo(wos[0]);
                  setShowExportWoModal(true);
                } else {
                  alert('Belum ada data Work Order untuk diexport.');
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-primary/20 hover:bg-primary border border-primary/40 text-primary hover:text-black rounded text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-primary/10"
              title="Export dokumen resmi Work Order"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Work Order</span>
            </button>

            <button 
              id="filter-btn"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center justify-center sm:justify-start gap-2 px-4 py-2 sm:py-1.5 border rounded text-xs font-bold uppercase tracking-widest transition-colors ${
                showFilters ? 'bg-primary text-black border-primary' : 'bg-[#1a252b] border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <Filter className="h-3 w-3" />
              Filter Data
            </button>
          </div>
        </div>

        {/* Filter Panel Open */}
        {showFilters && (
          <div className="bg-[#0d161a] p-4 rounded-xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
             <div>
               <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Status</label>
               <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#1a252b] border border-white/5 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
               >
                 <option value="Semua">Semua Status</option>
                 {uniqueStatuses.map(status => (
                   <option key={status} value={status}>{status}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Tanggal</label>
               <input 
                 type="date" 
                 value={dateFilter}
                 onChange={(e) => setDateFilter(e.target.value)}
                 className="w-full bg-[#1a252b] border border-white/5 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary" 
               />
             </div>
             <div>
               <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">ULP</label>
               <select 
                 value={ulpFilter}
                 onChange={(e) => setUlpFilter(e.target.value)}
                 className="w-full bg-[#1a252b] border border-white/5 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
               >
                 <option value="Semua">Semua ULP</option>
                 {uniqueULPs.map(ulp => (
                   <option key={ulp} value={ulp}>{ulp}</option>
                 ))}
               </select>
             </div>
          </div>
        )}

        {/* WO List */}
        {loading ? (
           <div className="flex-1 flex items-center justify-center min-h-[300px]">
             <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
           </div>
        ) : filteredWos.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-gray-500">
             <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
             <p className="text-sm uppercase tracking-widest font-bold">Tidak ada Data WO</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWos.map((wo) => (
              <div 
                key={wo.id}
                onClick={() => setSelectedWo(wo)}
                className="bg-[#0d161a] rounded-xl border border-white/5 overflow-hidden hover:border-primary/50 transition-colors cursor-pointer shadow-xl group flex flex-col"
              >
                <div className="h-28 bg-[#1a252b] relative overflow-hidden flex items-center justify-center">
                  {wo.foto ? (
                    <img src={getImageUrl(wo.foto)} alt="WO" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                  ) : (
                    <Camera className="w-8 h-8 text-white/10" />
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={cn("px-2 py-0.5 rounded border text-[9px] uppercase tracking-widest font-bold shadow-lg backdrop-blur bg-opacity-90", getStatusColor(wo.status))}>
                      {wo.status}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded backdrop-blur">
                    <Calendar className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-mono">{formatDate(wo.tanggal)}</span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-primary font-mono text-xs mb-1 font-bold">{wo.noWo || wo.id}</div>
                  <h3 className="text-sm font-bold text-white mb-2 leading-tight uppercase line-clamp-1">{wo.temuan || 'Normal Assessment'}</h3>
                  
                  <div className="space-y-1.5 mt-auto">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                      <span className="text-[10px] text-gray-400 flex-1 break-words"><span className="uppercase tracking-widest font-bold">ALAMAT:</span> {wo.alamat || '-'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlignLeft className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                      <span className="text-[10px] text-gray-400 flex-1 break-words"><span className="uppercase tracking-widest font-bold">SEGMEN:</span> {wo.segmen || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Building className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                       <span className="text-[10px] text-gray-400 capitalize"><span className="uppercase tracking-widest font-bold">ULP:</span> {wo.ulp}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <UtilityPole className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                       <span className="text-[10px] text-gray-400 capitalize"><span className="uppercase tracking-widest font-bold">PENYULANG:</span> {wo.penyulang}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-[8px] font-bold">
                        {wo.surveyor?.charAt(0) || 'S'}
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">{wo.surveyor || 'Surveyor'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWo(wo);
                          setShowExportWoModal(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-primary/15 hover:bg-primary text-primary hover:text-black border border-primary/30 rounded text-[10px] font-bold uppercase tracking-wider transition-all pointer-events-auto shadow-sm"
                        title="Export dokumen Work Order ini"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Export WO</span>
                      </button>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FAB Add Work Order */}
      {canAddWO && (
        <button 
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark text-black rounded-full shadow-[0_0_20px_rgba(255,94,0,0.4)] flex items-center justify-center transition-transform hover:scale-105 z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 transition-all">
          <div className="bg-[#0d161a] w-full max-w-2xl rounded-t-2xl sm:rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0a0f12]/50">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white">Input Work Order Baru</h2>
              <button onClick={() => { setShowAddModal(false); setSelectedLlcOrigin(null); }} className="text-gray-500 hover:text-white p-1 bg-white/5 rounded"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex justify-between items-center gap-2">
                {selectedLlcOrigin ? (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs">
                    <span className="text-emerald-400 font-bold">Terhubung LLC:</span>
                    <span className="text-white font-mono font-bold">WO #{selectedLlcOrigin['NO. WO'] || selectedLlcOrigin.no_wo}</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedLlcOrigin(null)}
                      className="text-gray-400 hover:text-rose-400 text-[10px] ml-1 underline cursor-pointer"
                    >
                      (Lepas Tautan)
                    </button>
                  </div>
                ) : <div />}
                <button
                  type="button"
                  onClick={() => {
                    if (llcData.length === 0) fetchLlcData();
                    setIsLlcModalOpen(true);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded text-xs font-bold transition flex items-center gap-2 ml-auto"
                >
                  <Search className="w-4 h-4" />
                  Pemeliharaan LLC ?
                </button>
              </div>

              {/* Form Input WO placeholder */}
              <div className="bg-primary/10 border border-primary/20 p-3 rounded flex items-start gap-3">
                 <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5"/>
                 <div>
                   <h4 className="text-xs font-bold text-primary mb-1 uppercase tracking-widest">Informasi Otomatis</h4>
                   <p className="text-[10px] text-gray-400">NO. WO dan TANGGAL SURVEY akan di-generate otomatis saat submit.</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest">Foto Temuan</label>
                    {newWo.fotoBase64 && (
                      <button 
                        onClick={() => setPhotoToEdit(newWo.fotoBase64)}
                        className="text-[10px] uppercase tracking-widest font-bold text-primary hover:text-primary-dark flex items-center gap-1"
                      >
                        <PenTool className="w-3 h-3" /> Edit Foto
                      </button>
                    )}
                  </div>
                  <label className="border-2 border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center bg-[#1a252b]/50 hover:bg-[#1a252b] transition-colors cursor-pointer overflow-hidden relative">
                    {newWo.fotoBase64 ? (
                      <img src={newWo.fotoBase64} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="text-xs text-gray-400">Klik untuk upload foto atau ambil gambar</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Temuan</label>
                  <textarea 
                    rows={3} 
                    value={newWo.temuan}
                    onChange={(e) => setNewWo({ ...newWo, temuan: e.target.value })}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  ></textarea>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Keterangan</label>
                  <textarea 
                    rows={2} 
                    value={newWo.keterangan}
                    onChange={(e) => setNewWo({ ...newWo, keterangan: e.target.value })}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  ></textarea>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Kategori</label>
                  <select 
                    value={newWo.kategori}
                    onChange={(e) => setNewWo({ ...newWo, kategori: e.target.value })}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="">Pilih Kategori...</option>
                    <option value="PEMELIHARAAN">PEMELIHARAAN</option>
                    <option value="NIAGA">NIAGA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">ULP</label>
                  <select 
                    value={newWo.ulp}
                    onChange={(e) => setNewWo({ ...newWo, ulp: e.target.value })}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="">Pilih ULP...</option>
                    {[...new Set((options?.unitJar || []).map((u: any) => u.ulp))].map((ulp: any) => (
                      <option key={ulp} value={ulp}>{ulp}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Gardu Induk</label>
                  <select 
                    value={newWo.garduInduk}
                    onChange={(e) => setNewWo({ ...newWo, garduInduk: e.target.value })}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="">Pilih GI...</option>
                    {[...new Set((options?.unitJar || []).filter((u: any) => u.ulp === newWo.ulp).map((u: any) => u.gi))].map((gi: any) => (
                      <option key={gi} value={gi}>{gi}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Penyulang</label>
                  <select 
                    value={newWo.penyulang}
                    onChange={(e) => setNewWo({ ...newWo, penyulang: e.target.value })}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="">Pilih Penyulang...</option>
                    {[...new Set((options?.unitJar || []).filter((u: any) => u.gi === newWo.garduInduk).map((u: any) => u.penyulang))].map((p: any) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Segmen / Zona</label>
                  <select 
                    value={newWo.segmen}
                    onChange={(e) => setNewWo({ ...newWo, segmen: e.target.value })}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="">Pilih Segmen...</option>
                    {[...new Set((options?.unitJar || []).filter((u: any) => u.penyulang === newWo.penyulang).map((u: any) => u.segmen))].map((s: any) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Alamat / Lokasi</label>
                  <input 
                    type="text" 
                    value={newWo.alamat}
                    onChange={(e) => setNewWo({ ...newWo, alamat: e.target.value })}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                    placeholder="Contoh: Jl. Sudirman atau Tiang T.04"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Titik Koordinat</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newWo.koordinat}
                      onChange={(e) => setNewWo({ ...newWo, koordinat: e.target.value })}
                      className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                      placeholder="-5.13111, 119.41311"
                    />
                    <button 
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gettingLocation}
                      className="px-3 bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30 rounded flex items-center gap-2 text-xs font-bold whitespace-nowrap transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {gettingLocation ? 'Melacak...' : 'Tag Lokasi'}
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Skala Prioritas</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((star) => {
                      const selectedStars = newWo.skalaPrioritas ? 5 - Number(newWo.skalaPrioritas) : 0;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewWo({ ...newWo, skalaPrioritas: String(5 - star) })}
                          className="focus:outline-none"
                        >
                          <Star className={`w-8 h-8 transition-colors ${selectedStars >= star ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Jenis Tiang</label>
                  <select 
                    value={newWo.jenisTiang}
                    onChange={(e) => setNewWo({ ...newWo, jenisTiang: e.target.value })}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="">Pilih Jenis Tiang...</option>
                    {(options?.spekJtm?.['JENIS TIANG'] || []).map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Ukuran Tiang</label>
                  <select 
                    value={newWo.ukuranTiang}
                    onChange={(e) => setNewWo({ ...newWo, ukuranTiang: e.target.value })}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="">Pilih Ukuran Tiang...</option>
                    {(options?.spekJtm?.['UKURAN TIANG'] || []).map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Jenis Konduktor</label>
                  <select 
                    value={newWo.jenisKonduktor}
                    onChange={(e) => setNewWo({ ...newWo, jenisKonduktor: e.target.value })}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="">Pilih Jenis Konduktor...</option>
                    {(options?.spekJtm?.['JENIS KONDUKTOR'] || []).map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Ukuran Konduktor</label>
                  <select 
                    value={newWo.ukuranKonduktor}
                    onChange={(e) => setNewWo({ ...newWo, ukuranKonduktor: e.target.value })}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="">Pilih Ukuran Konduktor...</option>
                    {(options?.spekJtm?.['UKURAN KONDUKTOR'] || []).map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Keypoint</label>
                  <select 
                    value={newWo.keypoint}
                    onChange={(e) => setNewWo({ ...newWo, keypoint: e.target.value })}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="">Pilih Keypoint...</option>
                    {['Sehat', 'Sakit', 'Kronis'].map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                




              </div>
            </div>
            <div className="p-4 border-t border-white/5 bg-[#0a0f12]/50 flex justify-end gap-3">
              <button disabled={submitting} onClick={() => { setShowAddModal(false); setSelectedLlcOrigin(null); }} className="px-4 py-2 border border-white/10 rounded text-xs font-bold uppercase tracking-widest text-gray-400 hover:bg-white/5">Batal</button>
              <button 
                onClick={handleSubmitWo} 
                disabled={submitting}
                className="px-6 py-2 bg-primary rounded text-xs font-bold uppercase tracking-widest text-black hover:bg-primary-dark shadow-[0_0_15px_rgba(255,94,0,0.3)] disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan WO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail WO Modal */}
      {selectedWo && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/80 backdrop-blur-sm p-4 transition-all overflow-y-auto pt-20 pb-20">
          <div className="bg-[#0d161a] w-full max-w-3xl rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative my-auto">
            <button onClick={() => setSelectedWo(null)} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black/80 backdrop-blur">
              <X className="w-4 h-4"/>
            </button>
            
            <div className="h-48 sm:h-64 bg-[#1a252b] relative overflow-hidden group">
               {selectedWo.foto ? (
                  <div onClick={() => setZoomedImage(getImageUrl(selectedWo.foto))} className="cursor-pointer block w-full h-full">
                    <img src={getImageUrl(selectedWo.foto)} alt="WO" className="w-full h-full object-cover transition-transform group-hover:scale-105" title="Klik untuk melihat foto ukuran penuh" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600"><Camera className="w-12 h-12" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d161a] to-transparent pointer-events-none"></div>
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded border text-[10px] uppercase tracking-widest font-bold backdrop-blur", getStatusColor(selectedWo.status))}>
                        {selectedWo.status}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/50 text-white text-[10px] uppercase font-mono backdrop-blur cursor-pointer hover:bg-black/70">
                        {selectedWo.noWo || selectedWo.id}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowExportWoModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-primary hover:bg-primary-dark text-black text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-primary/20 transition-all pointer-events-auto"
                      title="Eksport dokumen resmi Work Order"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Export Berkas WO</span>
                    </button>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight uppercase">{selectedWo.temuan || 'Normal Assessment'}</h2>
                </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Tanggal WO</div>
                  <div className="text-sm font-mono text-gray-200">{formatDate(selectedWo.tanggal)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Surveyor</div>
                  <div className="text-sm font-bold text-gray-200">{selectedWo.surveyor || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Area ULP</div>
                  <div className="text-sm font-bold text-gray-200">{selectedWo.ulp || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Gardu Induk</div>
                  <div className="text-sm font-bold text-gray-200">{selectedWo.garduInduk || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Penyulang</div>
                  <div className="text-sm font-bold text-gray-200">{selectedWo.penyulang || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Segmen</div>
                  <div className="text-sm font-bold text-gray-200">{selectedWo.segmen || '-'}</div>
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Alamat</div>
                  <div className="text-sm font-bold text-gray-200">{selectedWo.alamat || '-'}</div>
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Titik Koordinat
                  </div>
                  {selectedWo.koordinat ? (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedWo.koordinat)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-secondary hover:text-secondary-dark transition-colors flex items-center gap-1 underline"
                    >
                      {selectedWo.koordinat}
                    </a>
                  ) : (
                    <div className="text-sm font-bold text-gray-500">-</div>
                  )}
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Skala Prioritas</div>
                  <div className="text-sm font-bold text-gray-200">{selectedWo.skalaPrioritas || '-'}</div>
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Jenis Tiang</div>
                  <div className="text-sm font-bold text-gray-200">{selectedWo.jenisTiang || '-'}</div>
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ukuran Tiang</div>
                  <div className="text-sm font-bold text-gray-200">{selectedWo.ukuranTiang || '-'}</div>
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Jenis Konduktor</div>
                  <div className="text-sm font-bold text-gray-200">{selectedWo.jenisKonduktor || '-'}</div>
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ukuran Konduktor</div>
                  <div className="text-sm font-bold text-gray-200">{selectedWo.ukuranKonduktor || '-'}</div>
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Keypoint</div>
                  <div className="text-sm font-bold text-gray-200">{selectedWo.keypoint || '-'}</div>
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Keterangan</div>
                  <div className="text-sm font-bold text-gray-200">{selectedWo.keterangan || '-'}</div>
                </div>
              </div>

              {/* Approval Track */}
              <div className="border border-white/5 rounded-xl bg-[#0a0f12] overflow-hidden">
                <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-tertiary" />
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Status Approval</h3>
                  </div>
                  {/* Keep the go to review WO action here if they are a preparator */}
                  {user?.role === 'PREPARATOR' && (!selectedWo.approvalPreparator || String(selectedWo.approvalPreparator).toLowerCase() === 'menunggu approval' || String(selectedWo.approvalPreparator).trim() === '') && (
                    <button
                      onClick={() => {
                        const tlStatus = selectedWo.approvalTl?.toString().toLowerCase() || '';
                        if (tlStatus === 'diterima') {
                          navigate(`/review-wo?woId=${selectedWo.id}&noWo=${selectedWo.noWo}&index=${selectedWo.rowIndex}`);
                        } else {
                          alert('Form Review WO hanya dapat dibuka jika Approval TL PDKB sudah berstatus "Diterima". Silahkan hubungi TL PDKB terlebih dahulu.');
                        }
                      }}
                      className="text-[10px] uppercase font-bold tracking-widest text-primary hover:text-primary-dark transition-colors border border-primary/30 px-2 py-1 rounded"
                    >
                      Buka Form Review
                    </button>
                  )}
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">APPROVAL ASMAN</div>
                    <div className={cn("text-xs font-bold uppercase", selectedWo.approvalAsman?.toString().toLowerCase().includes('disetujui') ? 'text-green-400' : selectedWo.approvalAsman?.toString().toLowerCase().includes('ditolak') ? 'text-red-400' : selectedWo.approvalAsman ? 'text-yellow-400' : 'text-gray-500')}>
                      {selectedWo.approvalAsman || 'MENUNGGU'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">KET ASMAN</div>
                    <div className="text-xs text-gray-300">{selectedWo.ketAsman || '-'}</div>
                  </div>
                  
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">APPROVAL TL PDKB</div>
                    <div className={cn("text-xs font-bold uppercase", selectedWo.approvalTl?.toString().toLowerCase().includes('diterima') ? 'text-green-400' : selectedWo.approvalTl?.toString().toLowerCase().includes('ditolak') ? 'text-red-400' : selectedWo.approvalTl ? 'text-yellow-400' : 'text-gray-500')}>
                      {selectedWo.approvalTl || 'Menunggu Approval'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">KET TL PDKB</div>
                    <div className="text-xs text-gray-300">{selectedWo.ketTl || '-'}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">APPROVAL PREPARATOR</div>
                    <div className={cn("text-xs font-bold uppercase", (selectedWo.approvalPreparator?.toString().toLowerCase().includes('tidak layak') || selectedWo.approvalPreparator?.toString().toLowerCase().includes('ditolak')) ? 'text-red-400' : selectedWo.approvalPreparator?.toString().toLowerCase().includes('layak') ? 'text-green-400' : selectedWo.approvalPreparator ? 'text-yellow-400' : 'text-gray-500')}>
                      {selectedWo.approvalPreparator || 'Menunggu Approval'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">KET PREPARATOR</div>
                    <div className="text-xs text-gray-300">{selectedWo.ketPreparator || '-'}</div>
                  </div>
                </div>

                {/* Bottom Dedicated Action Footer */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between bg-white/[0.02] p-4 rounded-xl">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Dokumen Resmi</span>
                    <span className="text-xs text-gray-300 font-mono">Template: WORK_ORDER-{(selectedWo.noWo || selectedWo.id || '001')}.pdf</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExportWoModal(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-black rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/25 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Export Dokumen Work Order</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {photoToEdit && (
        <PhotoEditor 
          initialImage={photoToEdit}
          onSave={(editedBase64) => {
             setNewWo({ ...newWo, fotoBase64: editedBase64 });
             setPhotoToEdit(null);
          }}
          onCancel={() => setPhotoToEdit(null)}
        />
      )}
      
      <ImageZoomModal 
        imageUrl={zoomedImage} 
        onClose={() => setZoomedImage(null)} 
      />

      {/* Export Work Order Modal */}
      {selectedWo && (
        <ExportWorkOrderModal
          isOpen={showExportWoModal}
          onClose={() => setShowExportWoModal(false)}
          workOrder={selectedWo}
        />
      )}

      {/* LLC List Modal */}
      {isLlcModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0d161a] w-full max-w-4xl max-h-[90vh] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0a0f12]/50">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">List Pemeliharaan LLC</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                  {filteredLlcData.length} item
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setLlcSyncing(true);
                    try {
                      await gasService.post('syncLlc');
                      const res = await gasService.post('getLlcList', {}, false, true);
                      if (res.success && res.data) {
                        setLlcData(res.data);
                      }
                    } catch (e) {
                      console.error('Error sync LLC:', e);
                    }
                    setLlcSyncing(false);
                  }}
                  disabled={llcSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded border border-white/10 text-xs font-bold transition disabled:opacity-50"
                  title="Sinkronkan data dari Spreadsheet ke Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${llcSyncing ? 'animate-spin text-primary' : ''}`} />
                  <span>{llcSyncing ? 'Menyinkronkan...' : 'Sinkron Spreadsheet'}</span>
                </button>
                <button onClick={() => setIsLlcModalOpen(false)} className="text-gray-500 hover:text-white p-1 bg-white/5 rounded">
                  <X className="w-4 h-4"/>
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-[#111c22] border-b border-white/5 grid grid-cols-2 sm:grid-cols-5 gap-3">
              <select value={llcFilters.ulp} onChange={e => setLlcFilters(prev => ({ ...prev, ulp: e.target.value, garduInduk: '', penyulang: '', segmen: '' }))} className="bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white">
                <option value="">Semua ULP</option>
                {getUniqueValues('ULP').map((val: any) => <option key={val} value={val}>{val}</option>)}
              </select>
              <select value={llcFilters.garduInduk} onChange={e => setLlcFilters(prev => ({ ...prev, garduInduk: e.target.value, penyulang: '', segmen: '' }))} className="bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white">
                <option value="">Semua GI</option>
                {getUniqueValues('GARDU INDUK', { 'ULP': llcFilters.ulp }).map((val: any) => <option key={val} value={val}>{val}</option>)}
              </select>
              <select value={llcFilters.penyulang} onChange={e => setLlcFilters(prev => ({ ...prev, penyulang: e.target.value, segmen: '' }))} className="bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white">
                <option value="">Semua Penyulang</option>
                {getUniqueValues('PENYULANG', { 'ULP': llcFilters.ulp, 'GARDU INDUK': llcFilters.garduInduk }).map((val: any) => <option key={val} value={val}>{val}</option>)}
              </select>
              <select value={llcFilters.segmen} onChange={e => setLlcFilters(prev => ({ ...prev, segmen: e.target.value }))} className="bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white">
                <option value="">Semua Segmen</option>
                {getUniqueValues('SEGMEN', { 'ULP': llcFilters.ulp, 'GARDU INDUK': llcFilters.garduInduk, 'PENYULANG': llcFilters.penyulang }).map((val: any) => <option key={val} value={val}>{val}</option>)}
              </select>
              <select value={llcFilters.status} onChange={e => setLlcFilters(prev => ({ ...prev, status: e.target.value }))} className="bg-[#1a252b] border border-white/10 rounded p-2 text-xs text-white">
                <option value="">Semua Status</option>
                {getUniqueValues('STATUS PEMELIHARAAN').map((val: any) => <option key={val} value={val}>{val}</option>)}
              </select>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {llcLoading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : filteredLlcData.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs">Tidak ada data ditemukan.</div>
              ) : (
                <div className="space-y-2">
                  {filteredLlcData.map((item, idx) => (
                    <div 
                      key={item.id || idx} 
                      className="bg-[#1a252b] border border-white/5 p-3 rounded-lg hover:border-primary/50 cursor-pointer transition relative group"
                      onPointerDown={() => {
                        setIsLongPress(false);
                        longPressTimer.current = setTimeout(() => {
                          setIsLongPress(true);
                          if (item['FOTO SESUDAH']) setShowFotoLlc(item['FOTO SESUDAH']);
                        }, 500);
                      }}
                      onPointerUp={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                      onPointerLeave={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                      onClick={(e) => { 
                        if (isLongPress) { e.preventDefault(); return; }
                        setSelectedLlcItem(item); 
                        setShowLlcConfirm(true); 
                      }}
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary font-mono text-xs font-bold">
                            WO: {item['NO. WO'] || item.no_wo}
                          </span>
                          <span className="font-bold text-sm text-white">
                            {item['PENYULANG']}{item['SEGMEN'] ? `, ${item['SEGMEN']}` : ''}
                          </span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ${
                          item['STATUS PEMELIHARAAN'] === 'SUDAH DIRENCANAKAN' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : item['STATUS PEMELIHARAAN'] === 'LEWAT JADWAL'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-white/10 text-gray-300'
                        }`}>
                          {item['STATUS PEMELIHARAAN']}
                        </span>
                      </div>
                      <div className="text-xs text-yellow-400/90 mb-1 font-medium">{item['TEMUAN SEBELUMNYA'] || item['TEMUAN']}</div>
                      <div className="text-xs text-gray-400 mb-1">{item['ALAMAT']}</div>
                      <div className="flex flex-wrap gap-4 text-[10px] text-gray-500">
                        <span>GI: {item['GARDU INDUK']}</span>
                        <span>Jadwal: {item['JADWAL PEMELIHARAAN'] ? String(item['JADWAL PEMELIHARAAN']).split('T')[0] : '-'}</span>
                        <span>Koordinat: {item['TITIK KOORDINAT'] ? (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${item['TITIK KOORDINAT']}`} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline"
                          >{item['TITIK KOORDINAT']}</a>
                        ) : '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* LLC Foto Modal */}
      {showFotoLlc && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowFotoLlc(null)}>
          <div className="relative max-w-3xl w-full max-h-[90vh]">
            <img src={showFotoLlc} alt="Foto LLC" className="w-full h-full object-contain" />
            <button 
              onClick={() => setShowFotoLlc(null)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
            >
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showLlcConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0d161a] max-w-sm w-full rounded-xl p-6 text-center border border-white/10">
            <h3 className="text-white font-bold mb-2">Konfirmasi</h3>
            <p className="text-gray-400 text-sm mb-6">Apakah anda yakin memasukkannya ke dalam Work Order?</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => { setShowLlcConfirm(false); setSelectedLlcItem(null); }}
                className="px-4 py-2 rounded text-xs font-bold text-gray-400 bg-white/5 hover:bg-white/10 transition"
              >
                Batal
              </button>
              <button 
                onClick={handleLlcConfirm}
                className="px-4 py-2 rounded text-xs font-bold text-white bg-primary hover:bg-primary/90 transition"
              >
                Ya, Masukkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
