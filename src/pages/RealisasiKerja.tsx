import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { gasService } from '../services/gasService';
import { 
  ArrowLeft, Search, Filter, Calendar, MapPin, 
  ChevronRight, AlignLeft, ShieldCheck, Camera, X, FileText,
  Trash2, Plus, Package, RefreshCw
} from 'lucide-react';
import { cn, formatDate, formatGoogleDriveUrl } from '../lib/utils';
import ImageZoomModal from '../components/ImageZoomModal';

export default function RealisasiKerja() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handlePrint = () => {
    window.print();
  };

  const [loading, setLoading] = useState(true);
  const [syncingSpreadsheet, setSyncingSpreadsheet] = useState(false);
  const [data, setData] = useState<any[]>([]);
  
  // Modals
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Konfirmasi & Edit States
  const [realisasiEdits, setRealisasiEdits] = useState<any>({});
  const [realisasiMaterials, setRealisasiMaterials] = useState<any[]>([]);
  const [warehouseMaterials, setWarehouseMaterials] = useState<any[]>([]);
  const [loadingRealisasi, setLoadingRealisasi] = useState(false);
  const [showKonfirmasiModal, setShowKonfirmasiModal] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [ulpFilter, setUlpFilter] = useState('Semua');
  const [penyulangFilter, setPenyulangFilter] = useState('Semua');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [options, setOptions] = useState<any>({
    ulp: [],
    penyulang: [],
    bulan: [],
    tahun: []
  });

  useEffect(() => {
    fetchRealisasi();
  }, []);

  const handleSyncSpreadsheet = async () => {
    try {
      setSyncingSpreadsheet(true);
      const res = await gasService.syncRealisasiKerja();
      if (res.success) {
        gasService.clearCache('getRealisasiList');
        gasService.clearCache('getRealisasiDetail');
        gasService.clearCache('getDashboardStats');
        await fetchRealisasi();
        alert(res.message || 'Sinkronisasi Realisasi Kerja dari Spreadsheet berhasil!');
      } else {
        alert(res.message || 'Gagal sinkronisasi data Realisasi Kerja.');
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan sinkronisasi: ${err.message || err}`);
    } finally {
      setSyncingSpreadsheet(false);
    }
  };

  const fetchRealisasi = async () => {
    setLoading(true);
    const res = await gasService.post('getRealisasiList');
    if (res.success && res.data) {
      const sorted = [...res.data].sort((a: any, b: any) => {
        const dStrA = a["TANGGAL REALISASI"] || a["TANGGAL DIRENCANAKAN"] || "";
        const dStrB = b["TANGGAL REALISASI"] || b["TANGGAL DIRENCANAKAN"] || "";
        const tglA = dStrA ? new Date(dStrA).getTime() : 0;
        const tglB = dStrB ? new Date(dStrB).getTime() : 0;
        if (tglB !== tglA) return tglB - tglA;
        const numA = parseInt(String(a["NO. WO"] || a["NO WO"] || "").replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(String(b["NO. WO"] || b["NO WO"] || "").replace(/\D/g, ""), 10) || 0;
        return numB - numA;
      });
      setData(sorted);
      
      // Build options from data
      const ulps = new Set<string>();
      const penyulangs = new Set<string>();
      const bulans = new Set<string>();
      const tahuns = new Set<string>();

      sorted.forEach((item: any) => {
        if (item["ULP"]) ulps.add(item["ULP"]);
        if (item["PENYULANG"]) penyulangs.add(item["PENYULANG"]);
        if (item["BULAN"]) bulans.add(item["BULAN"].toString());
        if (item["TAHUN"]) tahuns.add(item["TAHUN"].toString());
      });

      setOptions({
        ulp: Array.from(ulps).sort(),
        penyulang: Array.from(penyulangs).sort(),
        bulan: Array.from(bulans).sort(),
        tahun: Array.from(tahuns).sort()
      });

    } else {
      setData([]);
    }

    try {
      const matRes = await gasService.post('getWarehouseData', { sheetName: 'MATERIAL' });
      if (matRes.success && matRes.data) {
        setWarehouseMaterials(matRes.data);
      }
    } catch (e) {
      console.error("Failed to load materials", e);
    }

    setLoading(false);
  };

  const handleOpenDetail = async (item: any) => {
    setLoadingRealisasi(true);
    setSelectedItem(item); // Optimistic UI
    
    const noWo = item["NO WO"] || item["NO. WO"] || item["NO.WO"];
    if (noWo) {
        const res = await gasService.post("getRealisasiDetail", { noWo });
        if (res.success && res.data) {
          setSelectedItem({ ...item, ...res.data });
          setRealisasiEdits({
            "BEBAN (A)": res.data["BEBAN (A)"] || "",
            "PELANGGAN PADAM": res.data["PELANGGAN PADAM"] || "",
            "JUMLAH PELANGGAN": res.data["JUMLAH PELANGGAN"] || "",
            "DURASI": res.data["DURASI"] || "",
          });
          if (res.data.materials && Array.isArray(res.data.materials)) {
             setRealisasiMaterials(res.data.materials.map((m: any) => ({
                 nama: m['NAMA MATERIAL'] || m['NAMA - JENIS'] || m['NAMA'] || m.nama || m.nama_material || '',
                 spesifikasi: m['SPESIFIKASI'] || m.spesifikasi || '',
                 volume: m['VOLUME'] || m.volume || '',
                 keterangan: m['KETERANGAN'] || m.keterangan || ''
             })));
          } else {
             setRealisasiMaterials([]);
          }
        }
    }
    setLoadingRealisasi(false);
  };

  const handleConfirmRealisasi = async (status: "APPROVE" | "DISAPPROVE") => {
    setLoadingRealisasi(true);
    const noWo = selectedItem["NO WO"] || selectedItem["NO. WO"];
    const res = await gasService.post("updateRealisasiStatus", {
      noWo,
      status,
      updates: realisasiEdits,
      materials: realisasiMaterials,
      pic: user?.name || user?.nip || 'Preparator'
    });
    if (res.success) {
      alert("Berhasil mengonfirmasi realisasi");
      setShowKonfirmasiModal(false);
      setSelectedItem(null);
      fetchRealisasi(); 
    } else {
      alert("Gagal mengonfirmasi realisasi: " + (res.message || res.error || JSON.stringify(res)));
    }
    setLoadingRealisasi(false);
  };

  const filteredData = data.filter(item => {
    // Only show items with NO WO
    const noWo = (item["NO WO"] || item["NO. WO"] || item["NO.WO"] || "").toString().trim();
    if (!noWo) return false;

    // ULP Filter
    if (ulpFilter !== 'Semua' && item["ULP"]?.toString().toLowerCase() !== ulpFilter.toLowerCase()) return false;
    // Penyulang Filter
    if (penyulangFilter !== 'Semua' && item["PENYULANG"]?.toString().toLowerCase() !== penyulangFilter.toLowerCase()) return false;
    // Bulan Filter
    if (monthFilter && item["BULAN"]?.toString().toLowerCase() !== monthFilter.toLowerCase()) return false;
    // Tahun Filter
    if (yearFilter && item["TAHUN"]?.toString().toLowerCase() !== yearFilter.toLowerCase()) return false;
    
    // Date Filter (YYYY-MM-DD -> DD/MM/YYYY approx)
    if (dateFilter) {
      const dateParts = dateFilter.split('-');
      if (dateParts.length === 3) {
        const d = parseInt(dateParts[2]).toString();
        const m = parseInt(dateParts[1]).toString();
        const y = dateParts[0];
        const dateStr = item["TANGGAL AWAL KERJA"] || item["TANGGAL REALISASI"] || item["TANGGAL"];
        if (dateStr && !dateStr.includes(`${d}/${m}/${y}`) && !dateStr.includes(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`)) {
           return false;
        }
      }
    }

    // Search Query (NO WO, Temuan, Alamat)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const temuan = (item["TEMUAN"] || "").toString().toLowerCase();
      const alamat = (item["ALAMAT"] || item["LOKASI"] || "").toString().toLowerCase();
      
      if (!noWo.toLowerCase().includes(q) && !temuan.includes(q) && !alamat.includes(q)) return false;
    }

    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, monthFilter, yearFilter, ulpFilter, penyulangFilter]);

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const isPreparator = user?.role === "PREPARATOR" || user?.jabatan?.toUpperCase().includes("PREPARATOR");

  return (
    <div className="min-h-screen bg-[#0a1014] flex flex-col font-sans">
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
            <h1 className="text-sm font-bold tracking-widest text-white uppercase leading-tight">Realisasi Kerja</h1>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest">DAFTAR REALISASI PEKERJAAN</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncSpreadsheet}
            disabled={syncingSpreadsheet || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e7490]/20 hover:bg-[#0e7490] border border-[#0e7490]/40 text-[#22d3ee] hover:text-black rounded text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm"
            title="Sinkronisasi data dari Google Spreadsheet ke Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingSpreadsheet ? "animate-spin" : ""}`} />
            <span>{syncingSpreadsheet ? "Menyinkronkan..." : "Sinkron Spreadsheet"}</span>
          </button>
          <button
            onClick={() => { gasService.clearCache('getRealisasiList'); fetchRealisasi(); }}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto relative mb-4 sm:mb-0">
            <Search className="w-4 h-4 text-gray-500 absolute left-3" />
            <input
              type="text"
              placeholder="Cari NO WO / Alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-[#1a252b] border border-white/10 rounded pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-primary transition-colors font-mono uppercase placeholder:normal-case"
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center justify-center sm:justify-start gap-2 px-4 py-2 sm:py-1.5 border rounded text-xs font-bold uppercase tracking-widest transition-colors ${
              showFilters ? 'bg-primary text-black border-primary' : 'bg-[#1a252b] border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <Filter className="h-3 w-3" />
            Filter Data
          </button>
        </div>

        {showFilters && (
          <div className="bg-[#0d161a] p-4 rounded-xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-2">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Pilih Tanggal</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-[#1a252b] border border-white/5 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary font-mono transition-colors"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Bulan</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full bg-[#1a252b] border border-white/5 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary font-mono transition-colors"
              >
                <option value="">Semua Bulan</option>
                {options.bulan.map((o: string) => <option key={o} value={o}>Bulan {o}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tahun</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full bg-[#1a252b] border border-white/5 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary font-mono transition-colors"
              >
                <option value="">Semua Tahun</option>
                {options.tahun.map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ULP</label>
              <select
                value={ulpFilter}
                onChange={(e) => setUlpFilter(e.target.value)}
                className="w-full bg-[#1a252b] border border-white/5 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary font-mono transition-colors"
              >
                <option value="Semua">Semua ULP</option>
                {options.ulp.map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Penyulang</label>
              <select
                value={penyulangFilter}
                onChange={(e) => setPenyulangFilter(e.target.value)}
                className="w-full bg-[#1a252b] border border-white/5 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary font-mono transition-colors"
              >
                <option value="Semua">Semua Penyulang</option>
                {options.penyulang.map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            
            <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-5 flex justify-end">
              <button
                onClick={() => {
                  setDateFilter('');
                  setMonthFilter('');
                  setYearFilter('');
                  setUlpFilter('Semua');
                  setPenyulangFilter('Semua');
                  setSearchQuery('');
                }}
                className="text-xs text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                Reset Semua Filter
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center -translate-y-16">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest animate-pulse text-xs">Memuat Data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center -translate-y-16 text-center max-w-md">
            <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
              <Search className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-widest uppercase">Pencarian Tidak Ditemukan</h3>
            <p className="text-gray-500 text-sm">Coba sesuaikan filter atau kata kunci pencarian Anda untuk menemukan realisasi yang dimaksud.</p>
          </div>
        ) : (
          <>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedData.map((item, index) => {
                const noWo = item["NO WO"] || item["NO. WO"] || item["NO.WO"] || `Real-${index}`;
                const rawFoto = item["FOTO REALISASI"] || item["FOTO TEMUAN"] || item["FOTO THUMBNAIL"] || item["FOTO AWAL (Temuan)"] || item["FOTO AWAL"] || item["FOTO LOKASI"] || "";
                const fotoUrl = formatGoogleDriveUrl(rawFoto);

                return (
                  <div 
                    key={noWo}
                    onClick={() => handleOpenDetail(item)}
                    className="group bg-[#0d161a] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,94,0,0.1)] hover:-translate-y-1"
                  >
                    <div className="relative h-48 bg-black/40">
                      {fotoUrl ? (
                        <img 
                          src={fotoUrl} 
                          alt={noWo} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1a1a1a/444444?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                          <Camera className="w-8 h-8 mb-2 opacity-30" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">Tidak ada foto</span>
                        </div>
                      )}
                      
                      <div className="absolute top-4 left-4">
                        <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 shadow-xl">
                          {item["ULP"] || "UNKNOWN"}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        {item["KONFIRMASI"] === "APPROVE" ? (
                          <span className="bg-green-500/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-green-500/20 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 shadow-xl">
                            SUDAH DIKONFIRMASI
                          </span>
                        ) : item["KONFIRMASI"] === "DISAPPROVE" ? (
                           <span className="bg-red-500/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-red-500/20 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 shadow-xl">
                            DITOLAK
                           </span>
                        ) : (
                          <span className="bg-yellow-500/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-yellow-500/20 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 shadow-xl">
                            BELUM DIKONFIRMASI
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5">No. Rekam / WO</h3>
                          <p className="text-white font-mono font-bold">{noWo}</p>
                        </div>
                      </div>

                      <div className="space-y-3 mb-5">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-base text-gray-300 line-clamp-2 leading-relaxed">
                              {item["ALAMAT"] || item["LOKASI"] || "-"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <AlignLeft className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-base text-gray-300 line-clamp-2 leading-relaxed">
                              {item["DETAIL PEKERJAAN"] || item["TEMUAN"] || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">{formatDate(item["TANGGAL REALISASI"] || item["TANGGAL AWAL KERJA"] || item["TANGGAL AWAL"] || item["TANGGAL"] || "-")}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center space-x-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-xs font-bold tracking-widest uppercase rounded text-gray-300 transition-colors"
                >
                  Sebelumnya
                </button>
                <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-xs font-bold tracking-widest uppercase rounded text-gray-300 transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Detail Modal */}
      {selectedItem && !showKonfirmasiModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-[#0d161a] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
              <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Detail Realisasi WO
              </h2>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-2 mr-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Tutup Detil"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6" id="printable-content">
               <div className="space-y-8 bg-[#0d161a] p-2 text-white">
                 <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold uppercase tracking-widest text-primary mb-2">Laporan Realisasi Pekerjaan</h1>
                    <p className="text-sm font-mono text-gray-400">{selectedItem["NO WO"] || selectedItem["NO. WO"]}</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {Object.keys(selectedItem).map(key => {
                        const val = selectedItem[key];
                        if (key.includes("FOTO") || key === "materials") return null;
                        
                        return (
                           <div key={key} className="flex flex-col">
                              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-widest border-b border-white/5 pb-1">{key}</label>
                              <span className="text-sm text-gray-200 mt-1 whitespace-pre-wrap">{val !== undefined && val !== null ? String(val) : "-"}</span>
                           </div>
                        );
                    })}
                 </div>

                 {/* Photos section */}
                 <div className="mt-8 pt-8 border-t border-white/10 break-inside-avoid">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-white/10 pb-2 mb-6">Lampiran Foto</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {Object.keys(selectedItem).filter(k => k.includes("FOTO") && k !== "FOTO GDRIVE").map(k => {
                           const rawVal = selectedItem[k];
                           if (!rawVal) return null;
                           const val = formatGoogleDriveUrl(String(rawVal));
                           return (
                               <div key={k} className="bg-black/30 border border-white/5 rounded-xl p-3 break-inside-avoid">
                                   <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-widest block">{k}</label>
                                   <div 
                                      className="aspect-video relative rounded-lg overflow-hidden bg-black/50 cursor-pointer group"
                                      onClick={() => setZoomedImage(val)}
                                   >
                                       <img src={val} alt={k} className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1a1a1a/444444?text=Gagal+Memuat+Foto';
                                       }} />
                                   </div>
                               </div>
                           );
                       })}
                    </div>
                 </div>

                 {/* Actions block triggering Modal Konfirmasi */}
                 {isPreparator && (
                   <div className="mt-8 pt-8 border-t border-white/10 flex flex-col items-center justify-center no-print pb-8" style={{ border: 'none', padding: 0 }}>
                        {selectedItem["KONFIRMASI"] === "APPROVE" ? (
                          <button
                            disabled
                            className="px-6 py-3 bg-green-500/20 text-green-400 border border-green-500/30 font-bold uppercase tracking-widest text-xs rounded-xl cursor-not-allowed opacity-70"
                          >
                            Sudah Dikonfirmasi
                          </button>
                        ) : selectedItem["KONFIRMASI"] === "DISAPPROVE" ? (
                           <div className="text-center">
                               <button
                                 onClick={() => setShowKonfirmasiModal(true)}
                                 className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-red-500/30 transition-colors shadow-lg shadow-red-500/10 mb-2"
                               >
                                 Konfirmasi Ulang Realisasi WO
                               </button>
                               <p className="text-red-400 text-xs mt-2 italic">Ditolak sebelumnya</p>
                           </div>
                        ) : (
                          <button
                            onClick={() => setShowKonfirmasiModal(true)}
                            className="w-full max-w-sm px-6 py-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-purple-500/30 transition-colors shadow-lg shadow-purple-500/10"
                          >
                            Konfirmasi Realisasi WO
                          </button>
                        )}
                   </div>
                 )}
               </div>
            </div>
            
            <div className="p-6 border-t border-white/10 bg-black/20 flex gap-4 no-print">
               <button
                  onClick={() => handlePrint()}
                  className="flex-1 py-3 bg-primary/20 text-primary border border-primary/30 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-primary/30 transition-colors shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
               >
                  <FileText className="w-4 h-4" />
                  Buat Laporan (PDF)
               </button>
               <button
                  onClick={() => setSelectedItem(null)}
                  className="px-6 py-3 bg-white/5 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-colors"
               >
                  Tutup
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi Realisasi Modal */}
      {showKonfirmasiModal && selectedItem && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-[#0d161a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">
                Konfirmasi Realisasi WO - {selectedItem["NO WO"] || selectedItem["NO. WO"]}
              </h3>
              <button 
                onClick={() => setShowKonfirmasiModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {loadingRealisasi ? (
                  <div className="text-center text-gray-500 py-4">Memuat material...</div>
               ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {["BEBAN (A)", "PELANGGAN PADAM", "JUMLAH PELANGGAN", "DURASI"].map((k) => (
                        <div key={k} className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{k}</label>
                          <input
                            type="text"
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                            value={typeof realisasiEdits[k] === 'object' ? '' : (realisasiEdits[k] ?? '')}
                            onChange={(e) => setRealisasiEdits({ ...realisasiEdits, [k]: e.target.value })}
                            placeholder={`${k}...`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" /> Penggunaan Material
                        </h4>
                        <button
                          onClick={() => setRealisasiMaterials([...realisasiMaterials, { nama: '', spesifikasi: '', volume: '', keterangan: '' }])}
                          className="flex items-center gap-1 text-[10px] text-primary hover:text-white transition-colors uppercase tracking-widest font-bold bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg border border-primary/20"
                        >
                          <Plus className="w-3 h-3" /> Tambah Material
                        </button>
                      </div>
                      <div className="flex flex-col gap-3">
                        {realisasiMaterials.map((m, idx) => (
                          <div key={idx} className="flex flex-col gap-2 bg-[#0d161a] p-3 rounded-lg border border-white/5 relative group">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Nama Material</label>
                                <select 
                                  value={m.nama} 
                                  onChange={(e) => {
                                     const newMats = [...realisasiMaterials]; 
                                     newMats[idx].nama = e.target.value; 
                                     newMats[idx].spesifikasi = ''; // Reset SPESIFIKASI when NAMA changes
                                     setRealisasiMaterials(newMats);
                                  }} 
                                  className="w-full bg-black/50 border border-white/10 rounded overflow-hidden text-xs text-white p-2 outline-none focus:border-primary/50"
                                >
                                  <option value="">-- Pilih Material --</option>
                                  {Array.from(new Set(warehouseMaterials.filter(wh => {
                                      const stock = parseFloat(wh['TOTAL STOK'] || wh['Total Stok'] || wh['STOK'] || wh['Stok'] || wh['stok'] || 0);
                                      return !isNaN(stock) && stock > 0;
                                    }).map(wh => {
                                      const nj = wh['NAMA MATERIAL'] || wh['NAMA - JENIS'] || wh['NAMA'] || '';
                                      let name = nj;
                                      if (name.includes(' - ')) name = name.split(' - ')[0];
                                      else if (name.includes(',')) name = name.split(',')[0];
                                      return name.trim();
                                  }).filter(v => v !== ''))).map(nama => (
                                      <option key={nama} value={nama}>{nama}</option>
                                  ))}
                                  <option value="LAINNYA">LAINNYA</option>
                                </select>
                                {m.nama === "LAINNYA" && (
                                   <input type="text" placeholder="Material Lainnya" className="w-full bg-black/50 border border-white/10 rounded text-xs text-white p-2 mt-2 outline-none focus:border-primary/50" value={m.keterangan || ''} onChange={e => {
                                       const newMats = [...realisasiMaterials];
                                       newMats[idx].keterangan = e.target.value;
                                       setRealisasiMaterials(newMats);
                                   }} />
                                )}
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Spesifikasi</label>
                                <select 
                                  value={m.spesifikasi} 
                                  onChange={(e) => {
                                     const newMats = [...realisasiMaterials]; newMats[idx].spesifikasi = e.target.value; setRealisasiMaterials(newMats);
                                  }} 
                                  className="w-full bg-black/50 border border-white/10 rounded overflow-hidden text-xs text-white p-2 outline-none focus:border-primary/50"
                                  disabled={m.nama === 'LAINNYA'}
                                >
                                  <option value="">-- Pilih Spesifikasi --</option>
                                  {warehouseMaterials
                                    .filter(wh => {
                                      const stock = parseFloat(wh['TOTAL STOK'] || wh['Total Stok'] || wh['STOK'] || wh['Stok'] || wh['stok'] || 0);
                                      return !isNaN(stock) && stock > 0;
                                    })
                                    .map(wh => wh['NAMA MATERIAL'] || wh['NAMA - JENIS'] || wh['NAMA'] || '')
                                    .filter(nj => {
                                      let name = nj;
                                      if (name.includes(' - ')) name = name.split(' - ')[0];
                                      else if (name.includes(',')) name = name.split(',')[0];
                                      return name.trim() === m.nama;
                                    })
                                    .map(nj => {
                                      let spec = '';
                                      if (nj.includes(' - ')) spec = nj.split(' - ').slice(1).join(' - ');
                                      else if (nj.includes(',')) spec = nj.split(',').slice(1).join(',');
                                      return spec.trim();
                                    })
                                    .filter(spec => spec !== '')
                                    .map(spec => (
                                      <option key={spec} value={spec}>{spec}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">
                                  Volume {(() => {
                                    if (!m.nama || m.nama === 'LAINNYA') return null;
                                    const targetName1 = m.spesifikasi ? `${m.nama}, ${m.spesifikasi}` : m.nama;
                                    const targetName2 = m.spesifikasi ? `${m.nama} - ${m.spesifikasi}` : m.nama;
                                    const whItem = warehouseMaterials.find(wh => {
                                      const nj = String(wh['NAMA - JENIS'] || wh['NAMA MATERIAL'] || wh['NAMA'] || '').trim();
                                      return nj.toLowerCase() === targetName1.toLowerCase() || nj.toLowerCase() === targetName2.toLowerCase();
                                    });
                                    if (!whItem) return null;
                                    const stokMobil = whItem['STOK MOBIL'] ?? whItem.stok_mobil ?? 0;
                                    const totalStok = whItem['TOTAL STOK'] ?? whItem['Total Stok'] ?? whItem['STOK'] ?? whItem.total_stok ?? 0;
                                    return (
                                      <span className="text-cyan-400 font-mono ml-1 font-semibold">
                                        (Stok Mobil: {stokMobil} | Total: {totalStok})
                                      </span>
                                    );
                                  })()}
                                </label>
                                <div className="flex gap-2">
                                  <input value={m.volume} onChange={(e) => {
                                     const newMats = [...realisasiMaterials]; newMats[idx].volume = e.target.value; setRealisasiMaterials(newMats);
                                  }} type="number" placeholder="Vol" className="w-1/3 bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-primary/50" />
                                  <button onClick={() => {
                                      const newMats = [...realisasiMaterials];
                                      newMats.splice(idx, 1);
                                      setRealisasiMaterials(newMats);
                                    }}
                                    className="p-2 px-4 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 flex items-center justify-center"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {realisasiMaterials.length === 0 && <p className="text-xs text-gray-500 italic p-2 text-center">Belum ada material yang digunakan</p>}
                      </div>
                    </div>
                  </>
               )}
            </div>
            
            <div className="p-6 border-t border-white/10 bg-black/20 flex gap-4">
              <button
                disabled={loadingRealisasi}
                onClick={() => {
                   handleConfirmRealisasi("DISAPPROVE");
                }}
                className="flex-1 py-3 bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                Tolak (Disapprove)
              </button>
              <button
                disabled={loadingRealisasi}
                onClick={() => {
                   handleConfirmRealisasi("APPROVE");
                }}
                className="flex-1 py-3 bg-green-500/20 text-green-500 border border-green-500/30 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-green-500/30 transition-colors disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      <ImageZoomModal 
        imageUrl={zoomedImage} 
        onClose={() => setZoomedImage(null)} 
      />
    </div>
  );
}
