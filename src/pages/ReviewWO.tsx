import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { gasService } from '../services/gasService';
import { 
  ArrowLeft, CheckSquare, Wrench, Package, Map, Cpu, AlertTriangle, ShieldCheck, Plus, Trash2, Camera, ChevronDown, ChevronUp, RefreshCw, Filter, Search, Image as ImageIcon, FileText
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

import PhotoEditor from '../components/PhotoEditor';
import MultiSelect from '../components/MultiSelect';
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

export default function ReviewWO() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateWoId = searchParams.get('woId');
  const templateRowIndex = searchParams.get('index');
  const templateNoWo = searchParams.get('noWo');
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('pekerjaan');
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailCache, setDetailCache] = useState<Record<string, any>>({});
  const [isWoCollapsed, setIsWoCollapsed] = useState(true);

  // Form State
  const [pekerjaan, setPekerjaan] = useState({ sop: '', instruksi: '', detail: '' });
  const [materials, setMaterials] = useState([{ nama: '', spesifikasi: '', volume: '', keterangan: '' }]);
  const [area, setArea] = useState({ areaPekerjaan: '', fotoAreaBase64: '', kondisiTanah: '', fotoTanahBase64: '', jarakJalanRaya: '' });
  const [konstruksi, setKonstruksi] = useState({ konstruksi1: '', konstruksi2: '', konstruksi3: '', fotoSutmBase64: '', fotoTiangBase64: '', fotoKonstruksiBase64: '' });
  const [hazards, setHazards] = useState([{ nama: '', keterangan: '', potensi: '', risiko: '', mitigasi: '', foto: '' }]);
  const [approval, setApproval] = useState({ status: 'Layak', keterangan: '', tanggalRencana: '', pelaksanaPdkb: '', picUnit: '' });
  const [lainLain, setLainLain] = useState({ areaPekerjaan: '', kondisiTanah: '', sutm: '', tiang: '', konstruksiJtm: '' });

  const [dropdownOptions, setDropdownOptions] = useState<any>({});
  const [dropdownRaw, setDropdownRaw] = useState<any[]>([]);
  const [warehouseMaterials, setWarehouseMaterials] = useState<any[]>([]);

  // Photo editing state. Contains base64, plus a callback on how to apply the edit
  const [photoToEdit, setPhotoToEdit] = useState<{ base64: string, applyId: string } | null>(null);

  // List view state
  const [reviewedWOs, setReviewedWOs] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [ulpFilter, setUlpFilter] = useState('Semua');
  const [keputusanFilter, setKeputusanFilter] = useState('Semua');
  const [dateFilter, setDateFilter] = useState('');
  const [viewingDetail, setViewingDetail] = useState<any | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showExportWoModal, setShowExportWoModal] = useState(false);
  const [woToExport, setWoToExport] = useState<any>(null);
  const viewDetailNoWo = searchParams.get('viewDetail');
  const isListView = !templateNoWo;

  useEffect(() => {
    async function loadOptions() {
      const res = await gasService.getOptions();
      if (res.success && res.data) {
        setDropdownOptions(res.data.dropdownData || {});
        setDropdownRaw(res.data.dropdownRaw || []);
      }
      
      try {
        const matRes = await gasService.post('getWarehouseData', { sheetName: 'MATERIAL' });
        if (matRes.success && matRes.data) {
          setWarehouseMaterials(matRes.data);
        }
      } catch (e) {
        console.error("Failed to load materials", e);
      }
    }
    loadOptions();
  }, []);

  useEffect(() => {
    if (isListView) {
      setLoading(true);
      Promise.all([
        gasService.post('getReviewedWOs'),
        gasService.post('getWorkOrders')
      ]).then(([resRev, resWo]) => {
        if (resRev.success) {
          let merged = resRev.data;
          if (resWo.success && resWo.data) {
            const woMap: Record<string, any> = {};
            resWo.data.forEach((w: any) => {
              if (w.noWo) woMap[w.noWo] = w;
            });
            merged = merged.map((r: any) => {
              const woInfo = woMap[r.noWo];
              return {
                ...r,
                temuan: r.temuan || (woInfo ? woInfo.temuan : ''),
                statusWo: r.statusWo || (woInfo ? woInfo.status : ''),
                foto: r.foto || (woInfo ? woInfo.foto : '')
              };
            });
          }
          merged.sort((a: any, b: any) => {
            const numA = parseInt(String(a.noWo || '').replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(String(b.noWo || '').replace(/\D/g, ''), 10) || 0;
            return numB - numA;
          });
          setReviewedWOs(merged);
          
          if (viewDetailNoWo) {
             const row = merged.find((r: any) => String(r.noWo) === String(viewDetailNoWo));
             if (row) {
                gasService.post('getReviewDetail', { noWo: viewDetailNoWo }).then(detailRes => {
                   if (detailRes.success) {
                      setViewingDetail({ ...row, details: detailRes.data });
                   }
                });
             }
          }
        }
        setLoading(false);
      });
    } else {
      // If we are editing/viewing an existing ReviewWO
      setLoading(true);
      // Also fetch ULP
      gasService.post('getWorkOrders').then(woRes => {
        let ulp = '';
        if (woRes.success && woRes.data) {
          const wo = woRes.data.find((w: any) => w.noWo === templateNoWo);
          if (wo) ulp = wo.ulp || '';
        }
        gasService.post('getReviewDetail', { noWo: templateNoWo }).then(res => {
        if (res.success && res.data) {
          const detail = res.data;
          
          if (detail.pekerjaan && Object.keys(detail.pekerjaan).length > 0) {
             setPekerjaan({
               sop: detail.pekerjaan['SOP PEKERJAAN'] || '',
               instruksi: detail.pekerjaan['INSTRUKSI KERJA'] || '',
               detail: detail.pekerjaan['DETAIL PEKERJAAN'] || ''
             });
          }
          if (detail.materials && detail.materials.length > 0) {
             setMaterials(detail.materials.map((m: any) => ({
               nama: m['NAMA MATERIAL'] || '',
               spesifikasi: m['SPESIFIKASI'] || '',
               volume: m['VOLUME'] || '',
               keterangan: m['KETERANGAN'] || ''
             })));
          }
          if (detail.area && Object.keys(detail.area).length > 0) {
             setArea({
               areaPekerjaan: detail.area['AREA PEKERJAAN'] || '',
               fotoAreaBase64: getImageUrl(detail.area['FOTO AREA'] || ''),
               kondisiTanah: detail.area['KONDISI TANAH'] || '',
               fotoTanahBase64: getImageUrl(detail.area['FOTO TANAH'] || ''),
               jarakJalanRaya: detail.area['JARAK LOKASI-JALAN RAYA'] || ''
             });
          }
          if (detail.konstruksi && Object.keys(detail.konstruksi).length > 0) {
             setKonstruksi({
               konstruksi1: detail.konstruksi['SUTM'] || '',
               fotoSutmBase64: getImageUrl(detail.konstruksi['FOTO SUTM'] || ''),
               konstruksi2: detail.konstruksi['TIANG'] || '',
               fotoTiangBase64: getImageUrl(detail.konstruksi['FOTO TIANG'] || ''),
               konstruksi3: detail.konstruksi['KONSTRUKSI'] || '',
               fotoKonstruksiBase64: getImageUrl(detail.konstruksi['FOTO KONSTRUKSI'] || '')
             });
          }
          if (detail.hazards && detail.hazards.length > 0) {
             setHazards(detail.hazards.map((h: any) => ({
                nama: h['NAMA HAZARD'] || '',
                keterangan: h['KETERANGAN'] || '',
                potensi: h['POTENSI'] || '',
                risiko: h['RISIKO'] || 'Rendah',
                mitigasi: h['MITIGASI'] || '',
                foto: getImageUrl(h['FOTO HAZARD'] || '')
             })));
          }
          if (detail.approval && Object.keys(detail.approval).length > 0) {
             let parsedDate = '';
             let rawDate = detail.approval['TANGGAL DIRENCANAKAN'] || '';
             if (rawDate) {
                const strDate = String(rawDate).trim();
                if (strDate.includes('-') && strDate.split('-')[0].length === 4) {
                   parsedDate = strDate.split('T')[0];
                } else if (strDate.includes('/')) {
                   const parts = strDate.split('/');
                   if (parts.length === 3 && parts[2].length === 4) {
                      parsedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                   }
                } else {
                   const d = new Date(strDate);
                   if (!isNaN(d.getTime())) {
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      parsedDate = `${year}-${month}-${day}`;
                   }
                }
             }
             setApproval({
               status: detail.approval['APPROVAL PREPARATOR'] || 'Menunggu Approval',
               keterangan: detail.approval['KET PREPARATOR'] || '',
               tanggalRencana: parsedDate,
               pelaksanaPdkb: user?.role !== 'INISIATOR' ? 'UP3 WATAMPONE' : (detail.approval['PELAKSANA PDKB'] || ''),
               picUnit: user?.role !== 'INISIATOR' ? ulp : (detail.approval['PIC UNIT'] || '')
             });
          }
        }
        setLoading(false);
      });
      });
    }
  }, [isListView, templateNoWo, viewDetailNoWo]);

  const handleViewDetail = async (wo: any) => {
    if (viewingDetail?.noWo === wo.noWo) return;
    
    setViewingDetail({ ...wo, details: detailCache[wo.noWo] || null });
    
    if (!detailCache[wo.noWo]) {
      setDetailLoading(true);
      const res = await gasService.post('getReviewDetail', { noWo: wo.noWo });
      if (res.success && res.data) {
        setViewingDetail({ ...wo, details: res.data });
        setDetailCache(prev => ({ ...prev, [wo.noWo]: res.data }));
      }
      setDetailLoading(false);
    }
  };

  const openCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    return new Promise<string>((resolve) => {
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
             const img = new Image();
             img.onload = () => {
                 const canvas = document.createElement('canvas');
                 const MAX_WIDTH = 1000;
                 const MAX_HEIGHT = 1000;
                 let width = img.width;
                 let height = img.height;

                 if (width > height) {
                     if (width > MAX_WIDTH) {
                         height *= MAX_WIDTH / width;
                         width = MAX_WIDTH;
                     }
                 } else {
                     if (height > MAX_HEIGHT) {
                         width *= MAX_HEIGHT / height;
                         height = MAX_HEIGHT;
                     }
                 }
                 canvas.width = width;
                 canvas.height = height;
                 const ctx = canvas.getContext('2d');
                 ctx?.drawImage(img, 0, 0, width, height);
                 resolve(canvas.toDataURL('image/jpeg', 0.7));
             };
             img.src = reader.result as string;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    });
  };

  const handlePhotoUpload = async (applyId: string) => {
    const base64 = await openCamera();
    if (base64) {
      setPhotoToEdit({ base64, applyId });
    }
  };

  const applyPhotoEdit = (editedBase64: string) => {
    if (!photoToEdit) return;
    const { applyId } = photoToEdit;
    if (applyId === 'area_area') setArea({ ...area, fotoAreaBase64: editedBase64 });
    else if (applyId === 'area_tanah') setArea({ ...area, fotoTanahBase64: editedBase64 });
    else if (applyId === 'konstruksi_sutm') setKonstruksi({ ...konstruksi, fotoSutmBase64: editedBase64 });
    else if (applyId === 'konstruksi_tiang') setKonstruksi({ ...konstruksi, fotoTiangBase64: editedBase64 });
    else if (applyId === 'konstruksi_lanjut') setKonstruksi({ ...konstruksi, fotoKonstruksiBase64: editedBase64 });
    else if (applyId.startsWith('hazard_')) {
      const index = parseInt(applyId.split('_')[1]);
      const newHazards = [...hazards];
      newHazards[index].foto = editedBase64;
      setHazards(newHazards);
    }
    setPhotoToEdit(null);
  };

  const tabs = [
    { id: 'pekerjaan', label: 'Pekerjaan', icon: Wrench },
    { id: 'material', label: 'Material', icon: Package },
    { id: 'area', label: 'Area Sekitar', icon: Map },
    { id: 'konstruksi', label: 'Konstruksi', icon: Cpu },
    { id: 'hazard', label: 'Hazard', icon: AlertTriangle },
    { id: 'approval', label: 'Approval', icon: ShieldCheck },
  ];

  const handleSubmit = async () => {
    if (!templateRowIndex) {
      alert("Row Index tidak ditemukan (dari Work Order).");
      return;
    }
    setLoading(true);
    
    const processedArea = { ...area };
    if (processedArea.areaPekerjaan.includes('Lain-lain') || processedArea.areaPekerjaan.includes('Lain-Lain') || processedArea.areaPekerjaan.includes('lain-lain')) {
      processedArea.areaPekerjaan = processedArea.areaPekerjaan.replace(/Lain-lain|Lain-Lain|lain-lain/g, lainLain.areaPekerjaan || 'Lain-lain');
    }
    if (processedArea.kondisiTanah.includes('Lain-lain') || processedArea.kondisiTanah.includes('Lain-Lain') || processedArea.kondisiTanah.includes('lain-lain')) {
      processedArea.kondisiTanah = processedArea.kondisiTanah.replace(/Lain-lain|Lain-Lain|lain-lain/g, lainLain.kondisiTanah || 'Lain-lain');
    }

    const processedKonstruksi = { ...konstruksi };
    if (processedKonstruksi.konstruksi1.includes('Lain-lain') || processedKonstruksi.konstruksi1.includes('Lain-Lain') || processedKonstruksi.konstruksi1.includes('lain-lain')) {
      processedKonstruksi.konstruksi1 = processedKonstruksi.konstruksi1.replace(/Lain-lain|Lain-Lain|lain-lain/g, lainLain.sutm || 'Lain-lain');
    }
    if (processedKonstruksi.konstruksi2.includes('Lain-lain') || processedKonstruksi.konstruksi2.includes('Lain-Lain') || processedKonstruksi.konstruksi2.includes('lain-lain')) {
      processedKonstruksi.konstruksi2 = processedKonstruksi.konstruksi2.replace(/Lain-lain|Lain-Lain|lain-lain/g, lainLain.tiang || 'Lain-lain');
    }
    if (processedKonstruksi.konstruksi3.includes('Lain-lain') || processedKonstruksi.konstruksi3.includes('Lain-Lain') || processedKonstruksi.konstruksi3.includes('lain-lain')) {
      processedKonstruksi.konstruksi3 = processedKonstruksi.konstruksi3.replace(/Lain-lain|Lain-Lain|lain-lain/g, lainLain.konstruksiJtm || 'Lain-lain');
    }

    const res = await gasService.post('submitReviewForm', {
      rowIndex: parseInt(templateRowIndex),
      noWo: templateNoWo,
      pekerjaan,
      materials,
      area: processedArea,
      konstruksi: processedKonstruksi,
      hazards,
      approval
    });
    
    setLoading(false);
    if (res.success) {
      // Clear client-side API caches
      gasService.clearCache('getReviewedWOs');
      gasService.clearCache('getReviewDetail');
      gasService.clearCache('getWorkOrders');
      gasService.clearCache('getWorkPlans');

      // Clear local memory detail cache for this WO
      setDetailCache(prev => {
        const next = { ...prev };
        delete next[templateNoWo];
        return next;
      });

      // Reset viewingDetail so fresh data will be fetched
      setViewingDetail(null);

      navigate('/review-wo?viewDetail=' + templateNoWo);
    } else {
      alert("Gagal melakukan submit Form Review: " + (res.message || res.error || JSON.stringify(res)));
    }
  };

  const currentTabIdx = tabs.findIndex(t => t.id === activeTab);
  const nextTab = () => {
    if (currentTabIdx < tabs.length - 1) setActiveTab(tabs[currentTabIdx + 1].id);
  };
  const prevTab = () => {
    if (currentTabIdx > 0) setActiveTab(tabs[currentTabIdx - 1].id);
  };

  return (
    <div className="min-h-screen bg-[#0a0f12] text-white flex flex-col font-sans pb-24 md:pb-0">
      {/* Header */}
      <header className="h-14 border-b border-[#0d8291]/30 bg-[#0d161a] flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (!isListView) {
                navigate('/review-wo');
              } else {
                navigate('/office');
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-widest text-white uppercase leading-tight">Form Review WO</h1>
            <span className="text-[9px] text-primary uppercase tracking-widest font-mono">
              {templateNoWo ? `EDIT DATA REVIEW NO. WO: ${templateNoWo}` : 'Data Baru'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isListView && !viewingDetail && (
            <button
              onClick={() => {
                setLoading(true);
                gasService.clearCache('getReviewedWOs');
                gasService.clearCache('getWorkOrders');
                gasService.clearCache('getReviewDetail');
                setDetailCache({});
                gasService.post('getReviewedWOs').then(res => {
                  if (res.success) {
                    setReviewedWOs(res.data);
                  }
                  setLoading(false);
                });
              }}
              disabled={loading}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {!isListView && templateNoWo && (
            <button 
              onClick={() => navigate('/review-wo?viewDetail=' + templateNoWo)}
              className="flex text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50 px-2 sm:px-3 py-1.5 rounded transition-colors"
            >
              Kembali ke Detail
            </button>
          )}
        </div>
      </header>

            {isListView ? (
        <main className="flex-1 max-w-[1500px] mx-auto w-full p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold uppercase tracking-widest text-[#0d8291]">
              Daftar WO Direview
            </h2>
            <button 
              onClick={() => {
                setLoading(true);
                gasService.clearCache('getReviewedWOs');
                gasService.clearCache('getWorkOrders');
                gasService.clearCache('getReviewDetail');
                setDetailCache({});
                Promise.all([
                  gasService.post('getReviewedWOs'),
                  gasService.post('getWorkOrders')
                ]).then(([resRev, resWo]) => {
                  if (resRev.success) {
                    let merged = resRev.data;
                    if (resWo.success && resWo.data) {
                      const woMap: Record<string, any> = {};
                      resWo.data.forEach((w: any) => {
                        if (w.noWo) woMap[w.noWo] = w;
                      });
                      merged = merged.map((r: any) => {
                        const woInfo = woMap[r.noWo];
                        return {
                          ...r,
                          temuan: r.temuan || (woInfo ? woInfo.temuan : ''),
                          statusWo: r.statusWo || (woInfo ? woInfo.status : ''),
                          foto: r.foto || (woInfo ? woInfo.foto : '')
                        };
                      });
                    }
                    setReviewedWOs(merged);
                  }
                  setLoading(false);
                });
              }}
              className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-[#1a252b] text-gray-300 hover:text-white border border-white/10 px-2 sm:px-3 py-1.5 rounded transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[380px_1fr] xl:grid-cols-[450px_1fr] gap-6 items-start h-[calc(100vh-140px)]">
             {/* KIRI: DAFTAR WO */}
             <div className={cn("flex flex-col gap-4 bg-[#0d161a] border border-white/5 rounded-xl overflow-hidden p-4 h-full", viewingDetail ? "hidden md:flex" : "flex")}>
               <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">Daftar WO</h3>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      showFilters ? 'bg-primary text-black border-primary' : 'bg-[#1a252b] border-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    <Filter className="h-3 w-3" />
                    Filter
                  </button>
               </div>
               
               {showFilters && (
                 <div className="bg-[#1a252b] p-3 rounded-lg border border-white/10 grid grid-cols-1 gap-3 shrink-0">
                   <div>
                     <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">ULP</label>
                     <select 
                       value={ulpFilter}
                       onChange={(e) => setUlpFilter(e.target.value)}
                       className="w-full bg-[#111c22] border border-white/5 rounded px-2 py-1.5 text-xs text-white outline-none"
                     >
                       <option value="Semua">Semua ULP</option>
                       {Array.from(new Set(reviewedWOs.map(w => w.ulp).filter(Boolean))).sort().map((u: any) => (
                         <option key={u} value={u}>{u}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Keputusan Preparator</label>
                     <select 
                       value={keputusanFilter}
                       onChange={(e) => setKeputusanFilter(e.target.value)}
                       className="w-full bg-[#111c22] border border-white/5 rounded px-2 py-1.5 text-xs text-white outline-none"
                     >
                       <option value="Semua">Semua Keputusan</option>
                       {Array.from(new Set(reviewedWOs.map(w => w.approvalPreparator).filter(Boolean))).sort().map((k: any) => (
                         <option key={k} value={k}>{k}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Tanggal</label>
                     <input 
                       type="date"
                       value={dateFilter}
                       onChange={(e) => setDateFilter(e.target.value)}
                       className="w-full bg-[#111c22] border border-white/5 rounded px-2 py-1.5 text-xs text-white outline-none"
                     />
                   </div>
                 </div>
               )}
               
               <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                 {loading ? (
                   <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                 ) : (
                   (()=>{
                      const filteredWOs = reviewedWOs.filter(wo => {
                         if (ulpFilter !== 'Semua' && wo.ulp !== ulpFilter) return false;
                         if (keputusanFilter !== 'Semua' && wo.approvalPreparator !== keputusanFilter) return false;
                         if (dateFilter) {
                            const [yyyy, mm, dd] = dateFilter.split('-');
                            const targetDateStr = `${dd}/${mm}/${yyyy}`; // format: DD/MM/YYYY
                            
                            const displayedDate = formatDate(wo.tanggalRencanakan);
                            if (displayedDate !== targetDateStr) return false;
                         }
                         return true;
                      });

                      if (filteredWOs.length === 0) {
                         return <div className="text-center py-10 text-gray-500 text-xs font-bold uppercase">Belum ada data</div>;
                      }

                      return filteredWOs.map((wo: any, idx) => (
                         <div 
                           key={idx}
                           onClick={() => handleViewDetail(wo)}
                           className={cn(
                             "flex gap-3 bg-[#111c22] border rounded-lg overflow-hidden cursor-pointer hover:border-primary/50 transition-colors p-2.5",
                             viewingDetail?.noWo === wo.noWo ? "border-primary shadow-[0_0_10px_rgba(13,130,145,0.2)]" : "border-white/5 hover:bg-white/5"
                           )}
                         >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-black/50 rounded overflow-hidden flex items-center justify-center relative">
                              {wo.foto ? (
                                <img src={getImageUrl(wo.foto)} alt="WO" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-white/20" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col py-1">
                              <div className="text-[10px] font-mono font-bold text-primary mb-1">NO: {wo.noWo}</div>
                              <div className="text-xs font-bold text-gray-200 line-clamp-2 leading-tight mb-1">{wo.temuan || 'Normal Assessment'}</div>
                              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                <div className={cn("text-[9px] font-bold uppercase tracking-widest", wo.approvalPreparator?.toLowerCase().includes('tidak layak') ? 'text-red-400' : wo.approvalPreparator?.toLowerCase().includes('layak') ? 'text-green-400' : 'text-yellow-400')}>{wo.approvalPreparator || 'Menunggu Approval'}</div>
                                {wo.statusWo && <span className="text-[8px] px-1 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 uppercase tracking-widest">{wo.statusWo}</span>}
                              </div>
                              <div className="flex items-center justify-between mt-auto pt-1">
                                <div className="text-[9px] text-gray-500 line-clamp-1 leading-tight flex gap-1 items-center">
                                  <Map className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{wo.alamat || '-'}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setWoToExport({
                                      noWo: wo.noWo || wo.no_wo || wo['NO. WO'] || wo.id,
                                      id: wo.noWo || wo.id,
                                      ulp: wo.ulp || wo['ULP'],
                                      alamat: wo.alamat || wo['ALAMAT'],
                                      garduInduk: wo.garduInduk || wo.gardu_induk || wo['GARDU INDUK'],
                                      penyulang: wo.penyulang || wo.PENYULANG || wo['PENYULANG'],
                                      noTiang: wo.noTiang || wo.keypoint || wo['NO TIANG'] || wo['KEYPOINT'],
                                      jenisTiang: wo.jenisTiang || wo.jenis_tiang || wo['JENIS TIANG'],
                                      ukuranTiang: wo.ukuranTiang || wo.ukuran_tiang || wo['UKURAN TIANG'],
                                      jenisKonduktor: wo.jenisKonduktor || wo.jenis_konduktor || wo['JENIS KONDUKTOR'],
                                      ukuranKonduktor: wo.ukuranKonduktor || wo.ukuran_konduktor || wo['UKURAN KONDUKTOR'],
                                      koordinat: wo.koordinat || wo.titik_koordinat || wo['TITIK KOORDINAT'],
                                      temuan: wo.temuan || wo['TEMUAN'],
                                      foto: wo.foto || wo.foto_temuan || wo['FOTO TEMUAN'],
                                      instruksi_kerja: wo.instruksi_kerja || wo.instruksiKerja || wo['INSTRUKSI KERJA'] || wo.pekerjaan || wo.temuan
                                    });
                                    setShowExportWoModal(true);
                                  }}
                                  className="px-2 py-0.5 bg-primary/20 hover:bg-primary text-primary hover:text-black border border-primary/30 rounded text-[9px] font-bold uppercase transition-all shrink-0 ml-2 pointer-events-auto"
                                  title="Export Dokumen Work Order"
                                >
                                  Export WO
                                </button>
                              </div>
                            </div>
                         </div>
                      ));
                   })()
                 )}
               </div>
             </div>

             {/* KANAN: DETAIL REVIEW WO */}
             <div className={cn("flex-col bg-[#0d161a] border border-white/5 rounded-xl overflow-hidden shadow-2xl relative h-full", !viewingDetail ? "hidden md:flex" : "flex")}>
                {viewingDetail ? (
                   <div className="absolute inset-0 flex flex-col">
                     {detailLoading && !viewingDetail.details ? (
                       <div className="flex-1 flex flex-col items-center justify-center">
                         <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                         <p className="text-xs uppercase font-bold tracking-widest text-gray-400">Memuat Detail...</p>
                       </div>
                     ) : (
                       <>
                       <div className="p-4 md:hidden border-b border-white/5 bg-[#151c21] flex items-center justify-between sticky top-0 z-10">
                          <button 
                            onClick={() => setViewingDetail(null)}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white transition-colors"
                          >
                            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
                          </button>
                          <div className="text-[10px] font-bold text-gray-500 uppercase">NO. WO: {viewingDetail.noWo}</div>
                       </div>
                       <div className="p-4 md:p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                       {/* Work Order Info */}
                                         {viewingDetail.details?.workOrder && Object.keys(viewingDetail.details.workOrder).length > 0 && (
                                            <section className="relative rounded-xl overflow-hidden mb-6 bg-[#1a252b] border border-white/5 shadow-inner">
                                              <div 
                                                className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-[#202d33] transition-colors bg-[#151c21]"
                                                onClick={() => setIsWoCollapsed(!isWoCollapsed)}
                                              >
                                                <div className="flex items-center gap-3">
                                                  <span className="font-bold text-sm tracking-widest text-[#0d8291] uppercase">Data Work Order Dasar (Eviden)</span>
                                                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[10px] uppercase font-mono backdrop-blur shadow-sm">
                                                    {viewingDetail.noWo}
                                                  </span>
                                                </div>
                                                {isWoCollapsed ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
                                              </div>
                                              
                                              {!isWoCollapsed && (
                                                <div className="border-t border-white/5">
                                                  <div className="aspect-video sm:aspect-[3/1] relative group bg-black/50">
                                                     {(()=>{
                                                       const wo = viewingDetail.details.workOrder;
                                                       const woKeys = Object.keys(wo);
                                                       
                                                       const fotoKey = woKeys.find(k => k.toLowerCase().includes('foto') || k.toLowerCase().includes('thumbnail') || k.toLowerCase().includes('gambar') || k.toLowerCase().includes('eviden'));
                                                       const statusKey = woKeys.find(k => k.toLowerCase().includes('status'));
                                                       const temuanKey = woKeys.find(k => k.toLowerCase().includes('temuan') || k.toLowerCase().includes('deskripsi'));
                       
                                                       const fotoUrl = fotoKey ? getImageUrl(wo[fotoKey]) : null;
                       
                                                       return (
                                                         <>
                                                           {fotoUrl ? (
                                                             <img src={fotoUrl} alt="WO" className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setZoomedImage(fotoUrl)} referrerPolicy="no-referrer" />
                                                           ) : (
                                                             <div className="w-full h-full flex items-center justify-center text-white/20">
                                                               <Camera className="w-12 h-12" />
                                                             </div>
                                                           )}
                                                           <div className="absolute inset-0 bg-gradient-to-t from-[#0d161a] via-[#0d161a]/60 to-transparent pointer-events-none"></div>
                                                           <div className="absolute bottom-4 left-6 right-6">
                                                             <div className="flex items-center justify-between gap-2 mb-2">
                                                               <span className="px-2 py-0.5 rounded border border-white/20 bg-black/50 text-[10px] uppercase tracking-widest font-bold backdrop-blur">
                                                                 {statusKey ? wo[statusKey] : 'MENUNGGU'}
                                                               </span>
                                                               <button
                                                                 type="button"
                                                                 onClick={(e) => {
                                                                   e.stopPropagation();
                                                                   setWoToExport({
                                                                     noWo: viewingDetail.noWo || viewingDetail.no_wo || wo.noWo,
                                                                     tanggal: wo.tanggal || wo.Tanggal || viewingDetail.tanggal,
                                                                     ulp: wo.ulp || wo.ULP || viewingDetail.ulp,
                                                                     garduInduk: wo.garduInduk || wo.gardu_induk || wo['GARDU INDUK'] || viewingDetail.garduInduk,
                                                                     penyulang: wo.penyulang || wo.PENYULANG || wo['PENYULANG'] || viewingDetail.penyulang,
                                                                     alamat: wo.alamat || wo['ALAMAT'] || viewingDetail.alamat,
                                                                     noTiang: wo.noTiang || wo.keypoint || wo['NO TIANG'] || viewingDetail.noTiang || viewingDetail.keypoint,
                                                                     koordinat: wo.koordinat || wo.titik_koordinat || wo['KOORDINAT'] || viewingDetail.koordinat,
                                                                     jenisTiang: wo.jenisTiang || wo.jenis_tiang || wo['JENIS TIANG'] || viewingDetail.jenisTiang,
                                                                     ukuranTiang: wo.ukuranTiang || wo.ukuran_tiang || wo['UKURAN TIANG'] || viewingDetail.ukuranTiang,
                                                                     jenisKonduktor: wo.jenisKonduktor || wo.jenis_konduktor || wo['JENIS KONDUKTOR'] || viewingDetail.jenisKonduktor,
                                                                     ukuranKonduktor: wo.ukuranKonduktor || wo.ukuran_konduktor || wo['UKURAN KONDUKTOR'] || viewingDetail.ukuranKonduktor,
                                                                     temuan: (temuanKey ? wo[temuanKey] : null) || viewingDetail.temuan,
                                                                     foto: wo.foto || wo.foto_temuan || wo.FOTO || viewingDetail.foto,
                                                                     instruksi_kerja: viewingDetail.details?.pekerjaan?.['INSTRUKSI KERJA'] || viewingDetail.instruksi_kerja || wo.instruksi_kerja || wo.instruksiKerja || viewingDetail.temuan || wo.temuan
                                                                   });
                                                                   setShowExportWoModal(true);
                                                                 }}
                                                                 className="flex items-center gap-1.5 px-3 py-1 bg-primary hover:bg-primary-dark text-black text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg pointer-events-auto transition-all"
                                                                 title="Eksport Berkas Work Order"
                                                               >
                                                                 <FileText className="w-3.5 h-3.5" />
                                                                 <span>Export Berkas WO</span>
                                                               </button>
                                                             </div>
                                                             <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight uppercase line-clamp-2">
                                                               {temuanKey ? wo[temuanKey] : 'Normal Assessment'}
                                                             </h2>
                                                           </div>
                                                         </>
                                                       );
                                                     })()}
                                                  </div>
                                                  
                                                  {(()=>{
                                                    const wo = viewingDetail.details.workOrder;
                                                    const woKeys = Object.keys(wo);
                                                    
                                                    const tglKey = woKeys.find(k => k.toLowerCase().includes('tanggal') || k.toLowerCase().includes('tgl') || k.toLowerCase().includes('date'));
                                                    const surveyorKey = woKeys.find(k => k.toLowerCase().includes('surveyor') || k.toLowerCase().includes('asisten'));
                                                    const ulpKey = woKeys.find(k => k.toLowerCase().includes('ulp') || k.toLowerCase().includes('unit'));
                                                    const giKey = woKeys.find(k => k.toLowerCase().includes('gardu induk') || k.toLowerCase().includes('gi'));
                                                    const penyulangKey = woKeys.find(k => k.toLowerCase().includes('penyulang') || k.toLowerCase().includes('feeder'));
                                                    const segmenKey = woKeys.find(k => k.toLowerCase().includes('segmen') || k.toLowerCase().includes('zona'));
                                                    const alamatKey = woKeys.find(k => k.toLowerCase().includes('alamat') || k.toLowerCase().includes('lokasi'));
                                                    const koordinatKey = woKeys.find(k => k.toLowerCase().includes('koordinat'));
                                                    
                                                    const prioritasKey = woKeys.find(k => k.toLowerCase().includes('prioritas'));
                                                    const jenisTiangKey = woKeys.find(k => k.toLowerCase().includes('jenis tiang'));
                                                    const ukuranTiangKey = woKeys.find(k => k.toLowerCase().includes('ukuran tiang'));
                                                    const jenisKonduktorKey = woKeys.find(k => k.toLowerCase().includes('jenis konduktor'));
                                                    const ukuranKonduktorKey = woKeys.find(k => k.toLowerCase().includes('ukuran konduktor'));
                                                    const keypointKey = woKeys.find(k => k.toLowerCase().includes('keypoint'));
                                                    const keteranganKey = woKeys.find(k => k.toLowerCase().includes('keterangan') || (k.toLowerCase() === 'ket' && !k.toLowerCase().includes('preparator')));
                       
                                                    const tglVal = tglKey ? wo[tglKey] : null;
                                                    const formattedTgl = formatDate(tglVal);
                       
                                                    return (
                                                      <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-6 bg-[#0d161a]">
                                                         <div>
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Tanggal</div>
                                                           <div className="text-sm font-mono text-gray-200">{formattedTgl}</div>
                                                         </div>
                                                         <div>
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Surveyor</div>
                                                           <div className="text-sm font-bold text-gray-200">{surveyorKey ? wo[surveyorKey] : '-'}</div>
                                                         </div>
                                                         <div>
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Area ULP</div>
                                                           <div className="text-sm font-bold text-gray-200">{viewingDetail.ulp || (ulpKey ? wo[ulpKey] : '-')}</div>
                                                         </div>
                                                         <div>
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Gardu Induk</div>
                                                           <div className="text-sm font-bold text-gray-200">{viewingDetail.gi || (giKey ? wo[giKey] : '-')}</div>
                                                         </div>
                                                         <div>
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Penyulang</div>
                                                           <div className="text-sm font-bold text-gray-200">{viewingDetail.penyulang || (penyulangKey ? wo[penyulangKey] : '-')}</div>
                                                         </div>
                                                         <div>
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Segmen / Zona</div>
                                                           <div className="text-sm font-bold text-gray-200">{viewingDetail.segmen || (segmenKey ? wo[segmenKey] : '-')}</div>
                                                         </div>
                                                         <div className="col-span-2">
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Map className="w-3 h-3" /> Alamat / Koordinat</div>
                                                           <div className="text-sm text-gray-200 line-clamp-2">{viewingDetail.alamat || (alamatKey ? wo[alamatKey] : '-')}</div>
                                                           {koordinatKey && wo[koordinatKey] && (
                                                             <a 
                                                               href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wo[koordinatKey])}`} 
                                                               target="_blank" 
                                                               rel="noreferrer" 
                                                               className="text-xs font-mono text-[#0d8291] font-bold hover:underline mt-1 inline-block"
                                                             >
                                                               {wo[koordinatKey]}
                                                             </a>
                                                           )}
                                                         </div>
                                                         
                                                         {/* Additional Asset Data that user showed in screenshot */}
                                                         <div>
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Skala Prioritas</div>
                                                           <div className="text-sm font-bold text-white">{prioritasKey ? wo[prioritasKey] : '-'}</div>
                                                         </div>
                                                         <div>
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Jenis Tiang</div>
                                                           <div className="text-sm font-bold text-white">{jenisTiangKey ? wo[jenisTiangKey] : '-'}</div>
                                                         </div>
                                                         <div>
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ukuran Tiang</div>
                                                           <div className="text-sm font-bold text-white">{ukuranTiangKey ? wo[ukuranTiangKey] : '-'}</div>
                                                         </div>
                                                         <div>
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Jenis Konduktor</div>
                                                           <div className="text-sm font-bold text-white">{jenisKonduktorKey ? wo[jenisKonduktorKey] : '-'}</div>
                                                         </div>
                                                         <div className="col-span-2 lg:col-span-1">
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ukuran Konduktor</div>
                                                           <div className="text-sm font-bold text-white">{ukuranKonduktorKey ? wo[ukuranKonduktorKey] : '-'}</div>
                                                         </div>
                                                         <div className="col-span-2 lg:col-span-1">
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Keypoint</div>
                                                           <div className="text-sm font-bold text-white">{keypointKey ? wo[keypointKey] : '-'}</div>
                                                         </div>
                                                         <div className="col-span-2">
                                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Keterangan</div>
                                                           <div className="text-sm text-gray-300">{keteranganKey ? wo[keteranganKey] : '-'}</div>
                                                         </div>
                                                      </div>
                                                    );
                                                  })()}
                                                </div>
                                              )}
                                            </section>
                                         )}
                       
                                         {/* Approval */}
                                         <section>
                                           <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-white/10 pb-2 mb-4">Keputusan Preparator</h3>
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div>
                                               <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Status</div>
                                               <div className={cn("text-xs font-bold uppercase", viewingDetail.details?.approval?.['APPROVAL PREPARATOR']?.toLowerCase().includes('tidak layak') ? 'text-red-400' : viewingDetail.details?.approval?.['APPROVAL PREPARATOR']?.toLowerCase().includes('layak') ? 'text-green-400' : 'text-yellow-400')}>
                                                 {viewingDetail.details?.approval?.['APPROVAL PREPARATOR'] || '-'}
                                               </div>
                                             </div>
                                             <div>
                                               <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Tanggal Direncanakan</div>
                                               <div className="text-xs font-mono">
                                                 {formatDate(viewingDetail.details?.approval?.['TANGGAL DIRENCANAKAN'])}
                                               </div>
                                             </div>
                                             <div className="md:col-span-2">
                                               <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Keterangan</div>
                                               <div className="text-xs">{viewingDetail.details?.approval?.['KET PREPARATOR'] || '-'}</div>
                                             </div>
                                           </div>
                                         </section>
                       
                                         {/* Pekerjaan */}
                                         <section>
                                           <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-white/10 pb-2 mb-4">Pekerjaan</h3>
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div>
                                               <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">SOP Pekerjaan</div>
                                               <div className="text-xs">{viewingDetail.details?.pekerjaan?.['SOP PEKERJAAN'] || '-'}</div>
                                             </div>
                                             <div>
                                               <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Instruksi Kerja (IK)</div>
                                               <div className="text-xs">{viewingDetail.details?.pekerjaan?.['INSTRUKSI KERJA'] || '-'}</div>
                                             </div>
                                             <div className="md:col-span-2">
                                               <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Detail Pekerjaan</div>
                                               <div className="text-xs whitespace-pre-wrap">{viewingDetail.details?.pekerjaan?.['DETAIL PEKERJAAN'] || '-'}</div>
                                             </div>
                                           </div>
                                         </section>
                       
                                         {/* Lokasi */}
                                         <section>
                                           <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-white/10 pb-2 mb-4">Lokasi & Area Sekitar</h3>
                                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                             <div className="space-y-4">
                                               <div>
                                                 <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Area Pekerjaan</div>
                                                 <div className="text-xs">{viewingDetail.details?.area?.['AREA PEKERJAAN'] || '-'}</div>
                                               </div>
                                               {viewingDetail.details?.area?.['FOTO AREA'] && (
                                                 <div className="mt-2">
                                                   <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Foto Area</div>
                                                   <img src={getImageUrl(viewingDetail.details.area['FOTO AREA'])} alt="Area" className="w-full h-32 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setZoomedImage(getImageUrl(viewingDetail.details.area['FOTO AREA']))} referrerPolicy="no-referrer" />
                                                 </div>
                                               )}
                                             </div>
                                             <div className="space-y-4">
                                               <div>
                                                 <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Kondisi Tanah</div>
                                                 <div className="text-xs">{viewingDetail.details?.area?.['KONDISI TANAH'] || '-'}</div>
                                               </div>
                                               {viewingDetail.details?.area?.['FOTO TANAH'] && (
                                                 <div className="mt-2">
                                                   <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Foto Tanah</div>
                                                   <img src={getImageUrl(viewingDetail.details.area['FOTO TANAH'])} alt="Tanah" className="w-full h-32 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setZoomedImage(getImageUrl(viewingDetail.details.area['FOTO TANAH']))} referrerPolicy="no-referrer" />
                                                 </div>
                                               )}
                                             </div>
                                             <div className="space-y-4">
                                               <div>
                                                 <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Jarak Lokasi - Jalan Raya</div>
                                                 <div className="text-xs">{viewingDetail.details?.area?.['JARAK LOKASI-JALAN RAYA'] || '-'} Meter</div>
                                               </div>
                                             </div>
                                           </div>
                                         </section>
                       
                                         {/* Konstruksi */}
                                         <section>
                                           <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-white/10 pb-2 mb-4">Kondisi Konstruksi</h3>
                                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                             <div className="space-y-4">
                                               <div>
                                                 <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">SUTM</div>
                                                 <div className="text-xs">{viewingDetail.details?.konstruksi?.['SUTM'] || '-'}</div>
                                               </div>
                                               {viewingDetail.details?.konstruksi?.['FOTO SUTM'] && (
                                                 <div className="mt-2">
                                                   <img src={getImageUrl(viewingDetail.details.konstruksi['FOTO SUTM'])} alt="SUTM" className="w-full h-32 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setZoomedImage(getImageUrl(viewingDetail.details.konstruksi['FOTO SUTM']))} referrerPolicy="no-referrer" />
                                                 </div>
                                               )}
                                             </div>
                                             <div className="space-y-4">
                                               <div>
                                                 <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Tiang</div>
                                                 <div className="text-xs">{viewingDetail.details?.konstruksi?.['TIANG'] || '-'}</div>
                                               </div>
                                               {viewingDetail.details?.konstruksi?.['FOTO TIANG'] && (
                                                 <div className="mt-2">
                                                   <img src={getImageUrl(viewingDetail.details.konstruksi['FOTO TIANG'])} alt="Tiang" className="w-full h-32 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setZoomedImage(getImageUrl(viewingDetail.details.konstruksi['FOTO TIANG']))} referrerPolicy="no-referrer" />
                                                 </div>
                                               )}
                                             </div>
                                             <div className="space-y-4">
                                               <div>
                                                 <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Konstruksi Lanjut</div>
                                                 <div className="text-xs">{viewingDetail.details?.konstruksi?.['KONSTRUKSI'] || '-'}</div>
                                               </div>
                                               {viewingDetail.details?.konstruksi?.['FOTO KONSTRUKSI'] && (
                                                 <div className="mt-2">
                                                   <img src={getImageUrl(viewingDetail.details.konstruksi['FOTO KONSTRUKSI'])} alt="Konstruksi" className="w-full h-32 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setZoomedImage(getImageUrl(viewingDetail.details.konstruksi['FOTO KONSTRUKSI']))} referrerPolicy="no-referrer" />
                                                 </div>
                                               )}
                                             </div>
                                           </div>
                                         </section>
                       
                                         {/* Materials */}
                                         <section>
                                           <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-white/10 pb-2 mb-4">Material</h3>
                                           {viewingDetail.details?.materials && viewingDetail.details.materials.length > 0 ? (
                                             <div className="overflow-x-auto text-xs">
                                               <table className="w-full border-collapse">
                                                 <thead>
                                                   <tr className="border-b border-white/10 text-gray-500 text-left">
                                                     <th className="py-2 pr-4 font-bold uppercase tracking-wider">Nama Material</th>
                                                     <th className="py-2 pr-4 font-bold uppercase tracking-wider">Spesifikasi</th>
                                                     <th className="py-2 pr-4 font-bold uppercase tracking-wider">Volume</th>
                                                     <th className="py-2 font-bold uppercase tracking-wider">Keterangan</th>
                                                   </tr>
                                                 </thead>
                                                 <tbody>
                                                   {viewingDetail.details.materials.map((m: any, i: number) => (
                                                     <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                                       <td className="py-3 pr-4">{m['NAMA MATERIAL']}</td>
                                                       <td className="py-3 pr-4 text-gray-300">{m['SPESIFIKASI']}</td>
                                                       <td className="py-3 pr-4 font-mono text-primary">{m['VOLUME']}</td>
                                                       <td className="py-3 text-gray-400">{m['KETERANGAN']}</td>
                                                     </tr>
                                                   ))}
                                                 </tbody>
                                               </table>
                                             </div>
                                           ) : (
                                             <div className="text-xs text-gray-500">Tidak ada data material.</div>
                                           )}
                                         </section>
                       
                                         {/* Hazards */}
                                         <section>
                                           <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-white/10 pb-2 mb-4">Identifikasi Bahaya (Hazard)</h3>
                                           {viewingDetail.details?.hazards && viewingDetail.details.hazards.length > 0 ? (
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                               {viewingDetail.details.hazards.map((h: any, i: number) => (
                                                 <div key={i} className="bg-black/30 border border-white/10 rounded-lg p-4 space-y-3">
                                                   <div className="flex gap-4">
                                                     <div className="flex-1">
                                                       <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Nama Hazard</div>
                                                       <div className="text-xs font-semibold text-primary">{h['NAMA HAZARD'] || '-'}</div>
                                                     </div>
                                                     <div className="text-right">
                                                       <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Risiko</div>
                                                       <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider", h['RISIKO']?.toLowerCase() === 'tinggi' ? 'bg-red-500/20 text-red-400' : h['RISIKO']?.toLowerCase() === 'sedang' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400')}>
                                                         {h['RISIKO'] || 'Rendah'}
                                                       </div>
                                                     </div>
                                                   </div>
                                                   <div className="text-xs space-y-2">
                                                     <div><span className="text-gray-500">Ket:</span> {h['KETERANGAN'] || '-'}</div>
                                                     <div><span className="text-gray-500">Potensi:</span> {h['POTENSI'] || '-'}</div>
                                                     <div><span className="text-gray-500">Mitigasi:</span> {h['MITIGASI'] || '-'}</div>
                                                   </div>
                                                   {h['FOTO HAZARD'] && (
                                                     <div className="mt-3">
                                                       <img src={getImageUrl(h['FOTO HAZARD'])} alt="Hazard" className="w-full h-32 object-cover rounded border border-white/10 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setZoomedImage(getImageUrl(h['FOTO HAZARD']))} referrerPolicy="no-referrer" />
                                                     </div>
                                                   )}
                                                 </div>
                                               ))}
                                             </div>
                                           ) : (
                                             <div className="text-xs text-gray-500">Tidak ada hazard teridentifikasi.</div>
                                           )}
                                         </section>
                       
                                       </div>
                                       
                                       {/* Actions Footer */}
                                       <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end">
                                          <button
                                            onClick={() => navigate(`/review-wo?woId=${viewingDetail.noWo}&noWo=${viewingDetail.noWo}&index=${viewingDetail.rowIndex}`)}
                                            className="px-6 py-2.5 bg-primary/20 text-primary border border-primary/50 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-primary hover:text-black transition-colors"
                                          >
                                            Edit Data Review
                                          </button>
                                       </div>
                       </>
                     )}
                   </div>
                ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                     <CheckSquare className="w-16 h-16 mb-4 opacity-20" />
                     <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Pilih WO</p>
                     <p className="text-xs mt-2 opacity-60 max-w-xs mx-auto">Silahkan pilih WO dari daftar di sebelah kiri untuk melihat detail review</p>
                   </div>
                )}
             </div>
          </div>
        </main>
) : (
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 flex flex-col md:flex-row gap-6 items-start">
        
        {/* Sidebar Nav (Desktop) / Horizontal Scroll (Mobile) */}
        <aside className="w-full md:w-64 shrink-0 overflow-x-auto md:overflow-visible hide-scrollbar sticky top-14 pt-2 md:pt-0 bg-[#0a0f12] z-20">
           <div className="flex md:flex-col gap-2 pb-2 md:pb-0 px-1 md:px-0">
             {tabs.map((tab) => {
               const Icon = tab.icon;
               const isActive = activeTab === tab.id;
               return (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap md:whitespace-normal text-left",
                      isActive 
                        ? "bg-primary text-black shadow-[0_0_15px_rgba(255,94,0,0.3)]" 
                        : "bg-[#0d161a] border border-white/5 text-gray-400 hover:text-white hover:border-white/20"
                    )}
                 >
                   <Icon className="w-4 h-4 shrink-0" />
                   <span className="hidden sm:inline-block">{tab.label}</span>
                 </button>
               )
             })}
           </div>
        </aside>

        {/* Tab Content Box */}
        <div className="flex-1 w-full bg-[#0d161a] border border-white/5 rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            
            {/* PEKERJAAN */}
            {activeTab === 'pekerjaan' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Detail Pekerjaan</h2>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">SOP Pekerjaan</label>
                  <select 
                    value={pekerjaan.sop}
                    onChange={(e) => {
                       setPekerjaan({...pekerjaan, sop: e.target.value, instruksi: ''});
                    }}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="">Pilih SOP...</option>
                    {Object.values(dropdownOptions)[5] && Array.from(new Set(Object.values(dropdownOptions)[5] as string[])).map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                 <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Instruksi Kerja (IK)</label>
                  <select 
                    value={pekerjaan.instruksi}
                    onChange={(e) => setPekerjaan({...pekerjaan, instruksi: e.target.value})}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="">Pilih IK...</option>
                    {dropdownRaw.filter(row => Object.values(row)[5] === pekerjaan.sop).map(row => Object.values(row)[6]).filter(Boolean).map((opt, i) => (
                      <option key={i} value={opt as string}>{opt as string}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Detail Pekerjaan</label>
                  <textarea 
                    rows={4} 
                    value={pekerjaan.detail}
                    onChange={(e) => setPekerjaan({...pekerjaan, detail: e.target.value})}
                    placeholder="Jelaskan detail pekerjaan yang akan dilakukan..." 
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  ></textarea>
                </div>
              </div>
            )}

            {/* MATERIAL */}
            {activeTab === 'material' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-widest">Kebutuhan Material</h2>
                  </div>
                  <button 
                    onClick={() => setMaterials([...materials, { nama: '', spesifikasi: '', volume: '', keterangan: '' }])}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Tambah
                  </button>
                </div>

                {materials.map((mat, idx) => (
                  <div key={idx} className="bg-[#1a252b] border border-white/5 p-4 rounded-lg relative">
                    {materials.length > 1 && (
                      <button 
                        onClick={() => setMaterials(materials.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nama Material</label>
                        <select 
                          value={mat.nama} 
                          onChange={(e) => {
                             const newMats = [...materials]; 
                             newMats[idx].nama = e.target.value; 
                             newMats[idx].spesifikasi = ''; // Reset SPESIFIKASI when NAMA changes
                             setMaterials(newMats);
                          }} 
                          className="w-full bg-[#0a0f12] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-primary"
                        >
                          <option value="">-- Pilih Material --</option>
                          {Array.from(new Set(warehouseMaterials.filter(m => {
                              const stock = parseFloat(m['TOTAL STOK'] || m['Total Stok'] || m['STOK'] || m['Stok'] || m['stok'] || 0);
                              return !isNaN(stock) && stock > 0;
                            }).map(m => {
                              const nj = m['NAMA MATERIAL'] || m['NAMA - JENIS'] || m['NAMA'] || '';
                              let name = nj;
                              if (name.includes(' - ')) name = name.split(' - ')[0];
                              else if (name.includes(',')) name = name.split(',')[0];
                              return name.trim();
                          }).filter(v => v !== ''))).map(nama => (
                              <option key={nama} value={nama}>{nama}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Spesifikasi</label>
                        <select 
                          value={mat.spesifikasi} 
                          onChange={(e) => {
                             const newMats = [...materials]; newMats[idx].spesifikasi = e.target.value; setMaterials(newMats);
                          }} 
                          className="w-full bg-[#0a0f12] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-primary"
                        >
                          <option value="">-- Pilih Spesifikasi --</option>
                          {warehouseMaterials
                            .filter(m => {
                              const stock = parseFloat(m['TOTAL STOK'] || m['Total Stok'] || m['STOK'] || m['Stok'] || m['stok'] || 0);
                              return !isNaN(stock) && stock > 0;
                            })
                            .map(m => m['NAMA MATERIAL'] || m['NAMA - JENIS'] || m['NAMA'] || '')
                            .filter(nj => nj.startsWith(mat.nama + ',') || nj === mat.nama || nj.replace(/ - /g, ', ').startsWith(mat.nama + ',') || nj === mat.nama)
                            .map(nj => {
                               let str = nj;
                               if(str.includes(' - ')) str = str.replace(/ - /g, ', ');
                               return str.substring(mat.nama.length).replace(/^,/, '').trim();
                            })
                            .filter(spec => spec !== '')
                            .map(spec => (
                              <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                          Volume {(() => {
                            if (!mat.nama) return null;
                            const targetName1 = mat.spesifikasi ? `${mat.nama}, ${mat.spesifikasi}` : mat.nama;
                            const targetName2 = mat.spesifikasi ? `${mat.nama} - ${mat.spesifikasi}` : mat.nama;
                            const whItem = warehouseMaterials.find(m => {
                              const nj = String(m['NAMA - JENIS'] || m['NAMA MATERIAL'] || m['NAMA'] || '').trim();
                              return nj.toLowerCase() === targetName1.toLowerCase() || nj.toLowerCase() === targetName2.toLowerCase();
                            });
                            return whItem ? <span className="text-primary font-mono ml-1 capitalize">(TOTAL STOK: {whItem['TOTAL STOK'] || whItem['Total Stok'] || whItem['STOK'] || whItem['Stok'] || whItem['stok'] || 0})</span> : null;
                          })()}
                        </label>
                        <input value={mat.volume} onChange={(e) => {
                           const newMats = [...materials]; newMats[idx].volume = e.target.value; setMaterials(newMats);
                        }} type="number" className="w-full bg-[#0a0f12] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-primary" />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Keterangan</label>
                        <input value={mat.keterangan} onChange={(e) => {
                           const newMats = [...materials]; newMats[idx].keterangan = e.target.value; setMaterials(newMats);
                        }} type="text" className="w-full bg-[#0a0f12] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-primary" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

             {activeTab === 'area' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-2">
                  <Map className="w-5 h-5 text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Detail Area Sekitar</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Area Pekerjaan</label>
                    <MultiSelect 
                      options={Object.values(dropdownOptions)[0] ? [...new Set([...(Object.values(dropdownOptions)[0] as string[]), 'Lain-lain'])] : ['Lain-lain']}
                      selected={area.areaPekerjaan}
                      onChange={(val) => setArea({...area, areaPekerjaan: val})}
                      placeholder="Pilih Area Pekerjaan..."
                    />
                    {area.areaPekerjaan.toLowerCase().includes('lain-lain') && (
                      <input 
                        type="text"
                        placeholder="Sebutkan Area Pekerjaan Lainnya..."
                        className="mt-2 w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                        value={lainLain.areaPekerjaan}
                        onChange={(e) => setLainLain({...lainLain, areaPekerjaan: e.target.value})}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Kondisi Tanah</label>
                    <select 
                      value={area.kondisiTanah}
                      onChange={(e) => setArea({...area, kondisiTanah: e.target.value})}
                      className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                    >
                      <option value="">Pilih Kondisi Tanah...</option>
                      {Object.values(dropdownOptions)[1] && [...new Set([...(Object.values(dropdownOptions)[1] as string[]), 'Lain-lain'])].map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {area.kondisiTanah.toLowerCase().includes('lain-lain') && (
                      <input 
                        type="text"
                        placeholder="Sebutkan Kondisi Tanah Lainnya..."
                        className="mt-2 w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                        value={lainLain.kondisiTanah}
                        onChange={(e) => setLainLain({...lainLain, kondisiTanah: e.target.value})}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Foto Area</label>
                    <label className="border-2 border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center bg-[#1a252b]/50 hover:bg-[#1a252b] transition-colors cursor-pointer overflow-hidden relative">
                      {area.fotoAreaBase64 ? (
                        <img src={area.fotoAreaBase64} alt="Preview Area" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-500 mb-2" />
                          <span className="text-xs text-gray-400">Klik untuk upload foto area</span>
                        </>
                      )}
                      <button type="button" onClick={() => handlePhotoUpload('area_area')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </label>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Foto Tanah</label>
                    <label className="border-2 border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center bg-[#1a252b]/50 hover:bg-[#1a252b] transition-colors cursor-pointer overflow-hidden relative">
                      {area.fotoTanahBase64 ? (
                        <img src={area.fotoTanahBase64} alt="Preview Tanah" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-500 mb-2" />
                          <span className="text-xs text-gray-400">Klik untuk upload foto tanah</span>
                        </>
                      )}
                      <button type="button" onClick={() => handlePhotoUpload('area_tanah')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Jarak Lokasi - Jalan Raya (Meter)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      placeholder="Misal: 12.5" 
                      value={area.jarakJalanRaya}
                      onChange={(e) => setArea({...area, jarakJalanRaya: e.target.value})}
                      className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary" 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'konstruksi' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-2">
                  <Cpu className="w-5 h-5 text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Detail Konstruksi</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">SUTM / SUTT</label>
                    <MultiSelect 
                      options={Object.values(dropdownOptions)[2] ? [...new Set([...(Object.values(dropdownOptions)[2] as string[]), 'Lain-lain'])] : ['Lain-lain']}
                      selected={konstruksi.konstruksi1}
                      onChange={(val) => setKonstruksi({...konstruksi, konstruksi1: val})}
                      placeholder="Pilih..."
                    />
                    {konstruksi.konstruksi1.toLowerCase().includes('lain-lain') && (
                      <input 
                        type="text"
                        placeholder="Sebutkan SUTM/SUTT Lainnya..."
                        className="mt-2 w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                        value={lainLain.sutm}
                        onChange={(e) => setLainLain({...lainLain, sutm: e.target.value})}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">TIANG</label>
                    <MultiSelect 
                      options={Object.values(dropdownOptions)[4] ? [...new Set([...(Object.values(dropdownOptions)[4] as string[]), 'Lain-lain'])] : ['Lain-lain']}
                      selected={konstruksi.konstruksi2}
                      onChange={(val) => setKonstruksi({...konstruksi, konstruksi2: val})}
                      placeholder="Pilih Tiang..."
                    />
                    {konstruksi.konstruksi2.toLowerCase().includes('lain-lain') && (
                      <input 
                        type="text"
                        placeholder="Sebutkan Tiang Lainnya..."
                        className="mt-2 w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                        value={lainLain.tiang}
                        onChange={(e) => setLainLain({...lainLain, tiang: e.target.value})}
                      />
                    )}
                  </div>
                   <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">KONSTRUKSI JTM</label>
                    <MultiSelect 
                      options={Object.values(dropdownOptions)[3] ? [...new Set([...(Object.values(dropdownOptions)[3] as string[]), 'Lain-lain'])] : ['Lain-lain']}
                      selected={konstruksi.konstruksi3}
                      onChange={(val) => setKonstruksi({...konstruksi, konstruksi3: val})}
                      placeholder="Pilih..."
                    />
                    {konstruksi.konstruksi3.toLowerCase().includes('lain-lain') && (
                      <input 
                        type="text"
                        placeholder="Sebutkan Konstruksi JTM Lainnya..."
                        className="mt-2 w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                        value={lainLain.konstruksiJtm}
                        onChange={(e) => setLainLain({...lainLain, konstruksiJtm: e.target.value})}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Foto SUTM / SUTT</label>
                    <label className="border-2 border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center bg-[#1a252b]/50 hover:bg-[#1a252b] transition-colors cursor-pointer overflow-hidden relative">
                      {konstruksi.fotoSutmBase64 ? (
                        <img src={konstruksi.fotoSutmBase64} alt="Preview SUTM" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-500 mb-2" />
                          <span className="text-xs text-gray-400">Upload Foto</span>
                        </>
                      )}
                      <button type="button" onClick={() => handlePhotoUpload('konstruksi_sutm')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </label>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Foto TIANG</label>
                    <label className="border-2 border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center bg-[#1a252b]/50 hover:bg-[#1a252b] transition-colors cursor-pointer overflow-hidden relative">
                      {konstruksi.fotoTiangBase64 ? (
                        <img src={konstruksi.fotoTiangBase64} alt="Preview Tiang" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-500 mb-2" />
                          <span className="text-xs text-gray-400">Upload Foto</span>
                        </>
                      )}
                      <button type="button" onClick={() => handlePhotoUpload('konstruksi_tiang')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </label>
                  </div>
                   <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Foto KONSTRUKSI JTM</label>
                    <label className="border-2 border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center bg-[#1a252b]/50 hover:bg-[#1a252b] transition-colors cursor-pointer overflow-hidden relative">
                      {konstruksi.fotoKonstruksiBase64 ? (
                        <img src={konstruksi.fotoKonstruksiBase64} alt="Preview Konstruksi JTM" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-500 mb-2" />
                          <span className="text-xs text-gray-400">Upload Foto</span>
                        </>
                      )}
                      <button type="button" onClick={() => handlePhotoUpload('konstruksi_lanjut')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* HAZARD */}
            {activeTab === 'hazard' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-tertiary" />
                    <h2 className="text-sm font-bold uppercase tracking-widest">Identifikasi Hazard & Mitigasi</h2>
                  </div>
                  <button 
                    onClick={() => setHazards([...hazards, { nama: '', keterangan: '', potensi: '', risiko: '', mitigasi: '', foto: '' }])}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-tertiary/10 text-tertiary hover:bg-tertiary/20 px-2 py-1 rounded transition-colors border border-tertiary/20"
                  >
                    <Plus className="w-3 h-3" /> Tambah
                  </button>
                </div>

                {hazards.map((hz, idx) => (
                  <div key={idx} className="bg-[#1a252b] border border-white/5 p-4 rounded-lg relative">
                    {hazards.length > 1 && (
                      <button 
                        onClick={() => setHazards(hazards.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nama / Jenis Hazard</label>
                        <input value={hz.nama} onChange={(e) => {
                           const newHz = [...hazards]; newHz[idx].nama = e.target.value; setHazards(newHz);
                        }} type="text" className="w-full bg-[#0a0f12] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-tertiary" />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Potensi Bahaya</label>
                        <input value={hz.potensi} onChange={(e) => {
                           const newHz = [...hazards]; newHz[idx].potensi = e.target.value; setHazards(newHz);
                        }} type="text" className="w-full bg-[#0a0f12] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-tertiary" />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Risiko</label>
                        <select value={hz.risiko} onChange={(e) => {
                           const newHz = [...hazards]; newHz[idx].risiko = e.target.value; setHazards(newHz);
                        }} className="w-full bg-[#0a0f12] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-tertiary">
                          <option value="Rendah">Rendah</option>
                          <option value="Sedang">Sedang</option>
                          <option value="Tinggi">Tinggi</option>
                          <option value="Ekstrem">Ekstrem</option>
                        </select>
                      </div>
                       <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tindakan Mitigasi</label>
                        <textarea value={hz.mitigasi} onChange={(e) => {
                           const newHz = [...hazards]; newHz[idx].mitigasi = e.target.value; setHazards(newHz);
                        }} rows={2} className="w-full bg-[#0a0f12] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-tertiary"></textarea>
                      </div>
                      <div className="sm:col-span-2 relative overflow-hidden">
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest mt-2">Foto Hazard</label>
                        <label className="border-2 border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center bg-[#1a252b]/50 hover:bg-[#1a252b] transition-colors cursor-pointer relative">
                          {hz.foto ? (
                            <img src={hz.foto} alt="Preview Hazard" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                          ) : (
                            <>
                              <Camera className="w-6 h-6 text-gray-500 mb-2" />
                              <span className="text-xs text-gray-400">Upload Foto</span>
                            </>
                          )}
                          <button type="button" onClick={() => handlePhotoUpload(`hazard_${idx}`)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* APPROVAL */}
            {activeTab === 'approval' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-2">
                  <ShieldCheck className="w-5 h-5 text-secondary" />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Finalisasi Review & Approval</h2>
                </div>
                
                <div className="bg-secondary/10 border border-secondary/20 rounded p-4 mb-4">
                  <p className="text-xs text-gray-300 leading-relaxed text-justify">
                    Dengan memberikan persetujuan (approval) pada dokumen ini, saya menyatakan bahwa hasil review lapangan (survey) telah dilakukan secara seksama, sesuai dengan Standard Operating Procedure (SOP) pekerjaan PDKB, dan semua identifikasi risiko (hazard) telah dimitigasi.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Tanggal Direncanakan (Pelaksanaan)</label>
                    <input 
                      type="date" 
                      value={approval.tanggalRencana}
                      onChange={(e) => setApproval({...approval, tanggalRencana: e.target.value})}
                      className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-secondary" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Keputusan (Approval Preparator)</label>
                    <select 
                      value={approval.status}
                      onChange={(e) => setApproval({ ...approval, status: e.target.value })}
                      className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-secondary"
                    >
                      <option value="Menunggu Approval">Menunggu Approval</option>
                      <option value="Layak">Layak</option>
                      <option value="Tidak Layak">Tidak Layak</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Pelaksana PDKB</label>
                    <select
                      value={approval.pelaksanaPdkb}
                      onChange={(e) => setApproval({ ...approval, pelaksanaPdkb: e.target.value })}
                      disabled={user?.role !== 'INISIATOR'}
                      className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Pilih Pelaksana PDKB</option>
                      {dropdownOptions['PELAKSANA PDKB']?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      {!dropdownOptions['PELAKSANA PDKB'] && <option value="UP3 WATAMPONE">UP3 WATAMPONE</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">PIC Unit</label>
                    <select
                      value={approval.picUnit}
                      onChange={(e) => setApproval({ ...approval, picUnit: e.target.value })}
                      disabled={user?.role !== 'INISIATOR'}
                      className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Pilih PIC Unit</option>
                      {dropdownOptions['PIC UNIT']?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      {approval.picUnit && (!dropdownOptions['PIC UNIT'] || !dropdownOptions['PIC UNIT'].includes(approval.picUnit)) && (
                        <option value={approval.picUnit}>{approval.picUnit}</option>
                      )}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Catatan / Keterangan Preparator</label>
                    <textarea 
                      rows={3} 
                      value={approval.keterangan}
                      onChange={(e) => setApproval({ ...approval, keterangan: e.target.value })}
                      placeholder="Tambahkan catatan khusus jika ada..." 
                      className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-secondary"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="p-4 border-t border-white/5 bg-[#0a0f12]/80 flex justify-between items-center backdrop-blur">
             <button 
                onClick={prevTab}
                disabled={currentTabIdx === 0}
                className={cn(
                  "px-4 py-2 border rounded text-xs font-bold uppercase tracking-widest transition-colors",
                  currentTabIdx === 0 ? "border-transparent text-gray-600 cursor-not-allowed" : "border-white/10 text-gray-400 hover:bg-white/5"
                )}
              >
                Kembali
              </button>

              {currentTabIdx === tabs.length - 1 ? (
                <button 
                  onClick={handleSubmit} disabled={loading}
                  className="px-6 py-2 bg-secondary text-white rounded text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(13,130,145,0.4)] hover:bg-secondary-dark flex items-center gap-2"
                >
                  {loading ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin block"></span> : 'Submit Form'}
                </button>
              ) : (
                <button 
                  onClick={nextTab}
                  className="px-6 py-2 bg-white/10 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-white/20"
                >
                  Lanjut
                </button>
              )}
          </div>
        </div>

      </main>
      )}

      {photoToEdit && (
        <PhotoEditor 
          initialImage={photoToEdit.base64}
          onSave={applyPhotoEdit}
          onCancel={() => setPhotoToEdit(null)}
        />
      )}

      <ImageZoomModal 
        imageUrl={zoomedImage} 
        onClose={() => setZoomedImage(null)} 
      />

      {/* Export Work Order Modal */}
      {woToExport && (
        <ExportWorkOrderModal
          isOpen={showExportWoModal}
          onClose={() => {
            setShowExportWoModal(false);
            setWoToExport(null);
          }}
          workOrder={woToExport}
        />
      )}
    </div>
  );
}
