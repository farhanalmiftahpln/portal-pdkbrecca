import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Calendar as CalendarIcon, Send, RefreshCw, Camera, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { gasService } from "../services/gasService";
import { useAuthStore } from "../store/useAuthStore";

const parseDate = (dateStr: string) => {
  if (!dateStr) return new Date("");
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
      } else if (parts[0].length === 4) {
        return new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00`);
      }
    }
  }
  return new Date(dateStr);
};

const formatDate = (dateStr: string) => {
  const d = parseDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatLongDate = (dateStr: string) => {
   const d = parseDate(dateStr);
   if (isNaN(d.getTime())) return dateStr;
   const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
   const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
   return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export default function Laporan() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [workPlans, setWorkPlans] = useState<any[]>([]);

  // Form State
  const [activeTab, setActiveTab] = useState<"WA" | "JUMAT">("WA");
  const [harianDate, setHarianDate] = useState("");
  const [sulmapanaDate, setSulmapanaDate] = useState("");
  const [jumlahPersonil, setJumlahPersonil] = useState("");

  const [jumatDate, setJumatDate] = useState("");
  const [jumatTL, setJumatTL] = useState("");
  const [jumatNipTL, setJumatNipTL] = useState("");
  const [jumatJabatanTL, setJumatJabatanTL] = useState("");
  const [personilList, setPersonilList] = useState<any[]>([]);
  const [jumatFotos, setJumatFotos] = useState({
    mobilCrew: "",
    mobilPeralatan: "",
    pembersihan1: "",
    pembersihan2: "",
    pembersihan3: "",
    pembersihan4: "",
    olahraga1: "",
    olahraga2: "",
    eviden1: "",
    eviden2: "",
    ssSheet: "",
    daftarHadir: ""
  });
  
  const [jumatSOP, setJumatSOP] = useState("");
  const [jumatIK, setJumatIK] = useState("");
  const [dropdownOptions, setDropdownOptions] = useState<any>({});
  const [dropdownRaw, setDropdownRaw] = useState<any[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"HARIAN" | "SULMAPANA" | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await gasService.post("getWorkPlans");
    if (res.success && res.data) {
      setWorkPlans(res.data);
    }
    const personilRes = await gasService.post("getAllPersonil");
    if (personilRes.success && personilRes.data) {
       setPersonilList(personilRes.data);
       const tl = personilRes.data.find((p: any) => p["JABATAN"]?.toUpperCase() === "TL PDKB" || p["Jabatan"]?.toUpperCase() === "TL PDKB");
       if (tl) {
          setJumatTL(tl["NAMA"] || tl["Nama"] || "");
          setJumatNipTL(tl["NIP"] || "");
          setJumatJabatanTL(tl["JABATAN"] || tl["Jabatan"] || "");
       }
    }
    const dropdownRes = await gasService.getOptions();
    if (dropdownRes.success && dropdownRes.data) {
       setDropdownOptions(dropdownRes.data.dropdownData || {});
       setDropdownRaw(dropdownRes.data.dropdownRaw || []);
    }
    setLoading(false);
  };

  const getFilteredData = (selectedDate: string) => {
    if (!selectedDate) return [];
    const parts = selectedDate.split("-");
    const formattedFilterDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    
    return workPlans.filter(p => {
       const pDateStr = p["TANGGAL DIRENCANAKAN"] ? formatDate(p["TANGGAL DIRENCANAKAN"]) : "";
       return pDateStr === formattedFilterDate;
    });
  };

  const generateHarianText = (data: any[], date: string) => {
    let text = `Rencana Kerja Harian PDKB Recca\n\nTanggal : ${date}\n⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️\n\n`;
    
    data.forEach((item, index) => {
       const ktg = item["KATEGORI"] || "-";
       const ulp = item["ULP"] || "-";
       const pny = item["PENYULANG"] || "-";
       const seg = item["SEGMEN"] || "-";
       const loc = item["ALAMAT"] || "-";
       let coord = item["TITIK KOORDINAT"] || "";
       const pek = item["DETAIL PEKERJAAN"] || "-";

       // Clean up coordinate for URL, e.g. replacing any spaces or weird formatting
       coord = coord.trim().replace(/\s+/g, '');
       const mapsUrl = coord ? `https://www.google.com/maps/search/?api=1&query=${coord}` : '-';

       text += `🚩 ${index + 1}\n`;
       text += `#️⃣ Kategori : ${ktg}\n`;
       text += `🏛️ ULP : ${ulp}\n`;
       text += `📈 Penyulang : ${pny}\n`;
       text += `📊 Segmen : ${seg}\n`;
       text += `📍 Lokasi : ${loc}\n`;
       text += `${mapsUrl}\n`;
       text += `🪜 Pekerjaan : ${pek}\n`;
       text += `------------------------------\n`;
    });

    return text;
  };

  const generateSulmapanaText = (data: any[], date: string, prs: string) => {
    let text = `Assalamualaikum. Wr. Wb.\nBerikut kami Laporkan Rencana pekerjaan PDKB TM Berjarak UP3 WATAMPONE\n\n`;
    text += `Jumlah Personil PDKB TM :\n* Berjarak : ${prs} Orang\n* Sentuh Langsung : 0 Orang\n\n`;
    text += `Hari & Tanggal : ${formatLongDate(date)}\n\n`;
    text += `Rincian Pekerjaan sbb :\n`;

    // Grouping by Detail, ULP, Penyulang, Alamat
    const grouped: any = {};
    data.forEach(item => {
       const pek = item["DETAIL PEKERJAAN"] || "-";
       const ulp = item["ULP"] || "-";
       const pny = item["PENYULANG"] || "-";
       const loc = item["ALAMAT"] || "-";
       
       const key = `${pek}_${ulp}_${pny}_${loc}`;
       if (!grouped[key]) {
          grouped[key] = {
             pek, ulp, pny, loc, count: 0
          };
       }
       grouped[key].count += 1;
    });

    Object.values(grouped).forEach((group: any, index) => {
       text += `${index + 1}. MB : ${group.pek} : ${group.count} Titik\n`;
       text += `* ULP : ${group.ulp}\n`;
       text += `* Penyulang : ${group.pny}\n`;
       text += `* Lokasi : ${group.loc}\n\n`;
    });

    text += `Demikian kami laporkan rencana kegiatan hari ini.\nTerimakasih`;

    return text;
  };

  const handleBuatHarian = () => {
    if (!harianDate) return alert("Pilih tanggal terlebih dahulu");
    setModalType("HARIAN");
    setModalOpen(true);
  };

  const handleBuatSulmapana = () => {
    if (!sulmapanaDate) return alert("Pilih tanggal terlebih dahulu");
    if (!jumlahPersonil || isNaN(Number(jumlahPersonil))) return alert("Masukkan jumlah personil dengan benar (angka)");
    setModalType("SULMAPANA");
    setModalOpen(true);
  };

  const handleSendWA = () => {
    const data = getFilteredData(modalType === "HARIAN" ? harianDate : sulmapanaDate);
    const dateSelected = modalType === "HARIAN" ? harianDate : sulmapanaDate;
    
    let text = "";
    if (modalType === "HARIAN") {
       text = generateHarianText(data, formatDate(dateSelected));
    } else if (modalType === "SULMAPANA") {
       text = generateSulmapanaText(data, dateSelected, jumlahPersonil);
    }

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
    setModalOpen(false);
  };

  const handlePhotoUploadJumat = (fieldKey: keyof typeof jumatFotos) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setJumatFotos((prev) => ({ ...prev, [fieldKey]: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSimpanDataJumat = async () => {
    if (!jumatDate) return alert("Pilih tanggal terlebih dahulu");
    setLoadingSave(true);
    try {
       const payload = {
          tanggal: formatLongDate(jumatDate),
          tanggalRaw: jumatDate,
          judulSOP: jumatSOP,
          judulIK: jumatIK,
          mobilCrew: jumatFotos.mobilCrew,
          mobilAlat: jumatFotos.mobilPeralatan,
          alat1: jumatFotos.pembersihan1,
          alat2: jumatFotos.pembersihan2,
          alat3: jumatFotos.pembersihan3,
          alat4: jumatFotos.pembersihan4,
          olahraga1: jumatFotos.olahraga1,
          olahraga2: jumatFotos.olahraga2,
          review1: jumatFotos.eviden1,
          review2: jumatFotos.eviden2,
          ssReview: jumatFotos.ssSheet,
          absenReview: jumatFotos.daftarHadir,
       };
       const res = await gasService.post("saveDataJumat", payload);
       if (res.success) {
          alert("Data berhasil disimpan ke Spreadsheet!");
       } else {
          alert("Gagal menyimpan data: " + res.error);
       }
    } catch (e: any) {
       alert("Error: " + e.message);
    } finally {
       setLoadingSave(false);
    }
  };

  const handleBuatSlideJumat = async () => {
    if (!jumatDate) return alert("Pilih tanggal terlebih dahulu");
    if (!jumatFotos.ssSheet) return alert("Harap upload Screenshot SS SHEET terlebih dahulu sebelum Generate Slide");
    setLoading(true);
    try {
       const payload = {
          tanggal: formatLongDate(jumatDate),
          tanggalRaw: jumatDate,
          namaTL: jumatTL,
          nipTL: jumatNipTL,
          jabatanTL: jumatJabatanTL,
          judulSOP: jumatSOP,
          judulIK: jumatIK,
          
          mobilCrew: jumatFotos.mobilCrew,
          mobilAlat: jumatFotos.mobilPeralatan,
          alat1: jumatFotos.pembersihan1,
          alat2: jumatFotos.pembersihan2,
          alat3: jumatFotos.pembersihan3,
          alat4: jumatFotos.pembersihan4,
          olahraga1: jumatFotos.olahraga1,
          olahraga2: jumatFotos.olahraga2,
          review1: jumatFotos.eviden1,
          review2: jumatFotos.eviden2,
          ssReview: jumatFotos.ssSheet,
          absenReview: jumatFotos.daftarHadir,
          
          newFileName: `KEGIATAN JUMAT PDKB WTP - ${formatLongDate(jumatDate).toUpperCase()}`
       };
       // Here we would call the gas action "generateSlideJumat" which creates a slide
       const res = await gasService.post("generateSlideJumat", payload);
       if (res.success) {
          alert("Slide berhasil dibuat!");
       } else {
          alert("Gagal membuat slide: " + res.error);
       }
    } catch (e: any) {
       alert("Error: " + e.message);
    } finally {
       setLoading(false);
    }
  };

  const filteredDataInModal = useMemo(() => {
     return getFilteredData(modalType === "HARIAN" ? harianDate : sulmapanaDate);
  }, [modalOpen, harianDate, sulmapanaDate, workPlans]);

  return (
    <div className="min-h-screen bg-[#0a1014] text-white flex flex-col font-sans">
      <header className="h-14 border-b border-[#0d8291]/30 bg-[#0d161a] flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/office')}
            className="w-8 h-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-widest text-white uppercase leading-tight">Laporan PDKB</h1>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest">PDKB RECCA</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">GENERATE LAPORAN</h2>
            <p className="text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest mt-1">
              Buat laporan pekerjaan
            </p>
          </div>
          <button
              onClick={() => { gasService.clearCache('getWorkPlans'); fetchData(); }}
              className="mt-4 sm:mt-0 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 border border-white/10 focus:outline-none transition-colors w-fit"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh Data
            </button>
        </div>

        <div className="flex border-b border-white/5">
          <button 
            onClick={() => setActiveTab('WA')} 
            className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'WA' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            WA GROUP
          </button>
          <button 
            onClick={() => setActiveTab('JUMAT')} 
            className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'JUMAT' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            JUMAT RUTIN
          </button>
        </div>

        {activeTab === 'WA' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Section Laporan Harian */}
             <div className="bg-[#0d161a] p-6 rounded-xl border border-white/5 flex flex-col gap-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-3xl rounded-full"></div>
               <div>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-white/10 pb-2 mb-4">LAPORAN HARIAN PIDIST</h3>
                  <p className="text-xs text-gray-400 mb-4">Masukkan Tanggal Work Plan dan Kirim ke Grup WA.</p>
               </div>
               <div className="flex flex-col gap-4">
                  <div>
                     <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 block">Tanggal Pekerjaan</label>
                     <div className="relative">
                        <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input 
                           type="date"
                           value={harianDate}
                           onChange={(e) => setHarianDate(e.target.value)}
                           className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary/50 text-white [color-scheme:dark]"
                        />
                     </div>
                  </div>
               </div>
               <div className="mt-auto pt-4">
                  <button
                     onClick={handleBuatHarian}
                     disabled={loading}
                     className="w-full py-3 bg-gradient-to-r from-secondary to-primary text-black font-bold uppercase tracking-widest text-[11px] rounded-lg shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:shadow-[0_0_25px_rgba(255,94,0,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     <Send className="w-4 h-4" /> BUAT LAPORAN
                  </button>
               </div>
             </div>
  
             {/* Section Laporan Sulmapana */}
             <div className="bg-[#0d161a] p-6 rounded-xl border border-white/5 flex flex-col gap-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary/20 blur-3xl rounded-full"></div>
               <div>
                  <h3 className="text-sm font-bold text-tertiary uppercase tracking-widest border-b border-white/10 pb-2 mb-4">LAPORAN SULMAPANA</h3>
                  <p className="text-xs text-gray-400 mb-4">Masukkan Tanggal Work Plan dan Jumlah Personil lalu Kirim ke Grup WA</p>
               </div>
               <div className="flex flex-col gap-4">
                  <div>
                     <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 block">Tanggal Pekerjaan</label>
                     <div className="relative">
                        <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input 
                           type="date"
                           value={sulmapanaDate}
                           onChange={(e) => setSulmapanaDate(e.target.value)}
                           className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-tertiary/50 text-white [color-scheme:dark]"
                        />
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 block">Jumlah Personil (Berjarak)</label>
                     <input 
                        type="number"
                        value={jumlahPersonil}
                        onChange={(e) => setJumlahPersonil(e.target.value)}
                        placeholder="Contoh: 7"
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-tertiary/50 text-white placeholder-gray-600"
                     />
                  </div>
               </div>
               <div className="mt-auto pt-4">
                  <button
                     onClick={handleBuatSulmapana}
                     disabled={loading}
                     className="w-full py-3 bg-tertiary text-black font-bold uppercase tracking-widest text-[11px] rounded-lg shadow-[0_0_15px_rgba(255,208,0,0.3)] hover:shadow-[0_0_25px_rgba(255,208,0,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none"
                  >
                     <Send className="w-4 h-4" /> BUAT LAPORAN
                  </button>
               </div>
             </div>
          </div>
        )}

        {activeTab === 'JUMAT' && (
          <div className="flex flex-col gap-6 mt-2">
            <div className="bg-[#0d161a] p-6 rounded-xl border border-white/5 flex flex-col gap-6 shadow-xl relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-3xl rounded-full"></div>
              <div>
                <h3 className="text-sm font-bold text-[#ff5e00] uppercase tracking-widest border-b border-white/10 pb-2 mb-4">GENERAL INFO</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 block">Tanggal</label>
                   <div className="relative">
                      <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input 
                         type="date"
                         value={jumatDate}
                         onChange={(e) => setJumatDate(e.target.value)}
                         className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary/50 text-white [color-scheme:dark]"
                      />
                   </div>
                </div>
                <div>
                   <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 block">Nama TL PDKB</label>
                   <input 
                      type="text"
                      readOnly
                      value={jumatTL}
                      placeholder="Memuat data TL..."
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-gray-400 cursor-not-allowed outline-none"
                   />
                </div>
              </div>
            </div>

            <div className="bg-[#0d161a] p-6 rounded-xl border border-white/5 flex flex-col gap-6 shadow-xl relative">
              <div className="absolute top-0 left-0 w-24 h-24 bg-tertiary/20 blur-3xl rounded-full pointer-events-none"></div>
              <div>
                <h3 className="text-sm font-bold text-[#ff5e00] uppercase tracking-widest border-b border-white/10 pb-2 mb-4">PEMBERSIHAN KENDARAAN OPERASIONAL</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { key: 'mobilCrew', label: 'Mobil Crew' },
                  { key: 'mobilPeralatan', label: 'Mobil Peralatan' }
                ].map(item => (
                  <div key={item.key} className="flex flex-col">
                    <label className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">
                      <span className="block truncate">{item.label}</span>
                      <span className="text-[7px] text-[#ff5e00] font-normal normal-case tracking-normal block mt-0.5 leading-none">*Disarankan Foto Landscape</span>
                    </label>
                    <div 
                      onClick={() => handlePhotoUploadJumat(item.key as keyof typeof jumatFotos)}
                      className="mt-1 aspect-square border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-colors cursor-pointer relative overflow-hidden"
                    >
                      {jumatFotos[item.key as keyof typeof jumatFotos] ? (
                        <img src={jumatFotos[item.key as keyof typeof jumatFotos]} alt={item.label} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-500 mb-2" />
                          <span className="text-[9px] text-center text-gray-500 px-2 uppercase tracking-widest">Upload Foto</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d161a] p-6 rounded-xl border border-white/5 flex flex-col gap-6 shadow-xl relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-3xl rounded-full pointer-events-none"></div>
              <div>
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-white/10 pb-2 mb-4">PEMBERSIHAN PERALATAN</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { key: 'pembersihan1', label: 'Pembersihan Alat 1' },
                  { key: 'pembersihan2', label: 'Pembersihan Alat 2' },
                  { key: 'pembersihan3', label: 'Pembersihan Alat 3' },
                  { key: 'pembersihan4', label: 'Pembersihan Alat 4' }
                ].map(item => (
                  <div key={item.key} className="flex flex-col">
                    <label className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block truncate" title={item.label}>
                      {item.label}
                    </label>
                    <div 
                      onClick={() => handlePhotoUploadJumat(item.key as keyof typeof jumatFotos)}
                      className="mt-1 aspect-square border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-colors cursor-pointer relative overflow-hidden"
                    >
                      {jumatFotos[item.key as keyof typeof jumatFotos] ? (
                        <img src={jumatFotos[item.key as keyof typeof jumatFotos]} alt={item.label} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-500 mb-2" />
                          <span className="text-[9px] text-center text-gray-500 px-2 uppercase tracking-widest">Upload Foto</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d161a] p-6 rounded-xl border border-white/5 flex flex-col gap-6 shadow-xl relative">
              <div className="absolute top-0 left-0 w-24 h-24 bg-secondary/20 blur-3xl rounded-full pointer-events-none"></div>
              <div>
                <h3 className="text-sm font-bold text-[#ff5e00] uppercase tracking-widest border-b border-white/10 pb-2 mb-4">OLAHRAGA</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { key: 'olahraga1', label: 'Olahraga 1' },
                  { key: 'olahraga2', label: 'Olahraga 2' }
                ].map(item => (
                  <div key={item.key} className="flex flex-col">
                    <label className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">
                      <span className="block truncate">{item.label}</span>
                      <span className="text-[7px] text-[#ff5e00] font-normal normal-case tracking-normal block mt-0.5 leading-none">*Disarankan Foto Landscape</span>
                    </label>
                    <div 
                      onClick={() => handlePhotoUploadJumat(item.key as keyof typeof jumatFotos)}
                      className="mt-1 aspect-square border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-colors cursor-pointer relative overflow-hidden"
                    >
                      {jumatFotos[item.key as keyof typeof jumatFotos] ? (
                        <img src={jumatFotos[item.key as keyof typeof jumatFotos]} alt={item.label} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-500 mb-2" />
                          <span className="text-[9px] text-center text-gray-500 px-2 uppercase tracking-widest">Upload Foto</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d161a] p-6 rounded-xl border border-white/5 flex flex-col gap-6 shadow-xl relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/20 blur-3xl rounded-full pointer-events-none"></div>
              <div>
                <h3 className="text-sm font-bold text-[#ff5e00] uppercase tracking-widest border-b border-white/10 pb-2 mb-4">REVIEW SOP/IK</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">SOP</label>
                  <select
                    value={jumatSOP}
                    onChange={(e) => {
                       setJumatSOP(e.target.value);
                       setJumatIK("");
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
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Judul IK</label>
                  <select
                    value={jumatIK}
                    onChange={(e) => setJumatIK(e.target.value)}
                    className="w-full bg-[#1a252b] border border-white/10 rounded p-2.5 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="">Pilih IK...</option>
                    {dropdownRaw.filter(row => Object.values(row)[5] === jumatSOP).map(row => Object.values(row)[6]).filter(Boolean).map((opt, i) => (
                      <option key={i} value={opt as string}>{opt as string}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: 'eviden1', label: 'Eviden 1' },
                  { key: 'eviden2', label: 'Eviden 2' },
                  { key: 'ssSheet', label: 'SS Sheet' },
                  { key: 'daftarHadir', label: 'Daftar Hadir' }
                ].map(item => (
                  <div key={item.key} className="flex flex-col">
                    <label className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">
                      <span className="block truncate">{item.label}</span>
                      {['eviden1', 'eviden2'].includes(item.key) && (
                        <span className="text-[7px] text-[#ff5e00] font-normal normal-case tracking-normal block mt-0.5 leading-none">*Disarankan Foto Landscape</span>
                      )}
                    </label>
                    <div 
                      onClick={() => handlePhotoUploadJumat(item.key as keyof typeof jumatFotos)}
                      className="mt-1 aspect-square border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-colors cursor-pointer relative overflow-hidden"
                    >
                      {jumatFotos[item.key as keyof typeof jumatFotos] ? (
                        <img src={jumatFotos[item.key as keyof typeof jumatFotos]} alt={item.label} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-500 mb-2" />
                          <span className="text-[9px] text-center text-gray-500 px-2 uppercase tracking-widest">Upload Foto</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                  <button
                     onClick={handleSimpanDataJumat}
                     disabled={loadingSave || loading}
                     className="w-full sm:w-auto py-3 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold uppercase tracking-widest text-[11px] rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     {loadingSave ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                     SIMPAN DATA SPREADSHEET
                  </button>
                  <button
                     onClick={handleBuatSlideJumat}
                     disabled={loadingSave || loading}
                     className="w-full sm:w-auto py-3 px-8 bg-gradient-to-r from-secondary to-primary text-black font-bold uppercase tracking-widest text-[11px] rounded-lg shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:shadow-[0_0_25px_rgba(255,94,0,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                     GENERATE SLIDE JUMAT
                  </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Preview */}
      {modalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
            <div className="bg-[#0d161a] border border-white/10 rounded-xl w-full max-w-2xl relative z-10 p-6 flex flex-col gap-6 shadow-2xl max-h-[90vh]">
               <div>
                  <h3 className="text-lg font-bold text-white tracking-tight uppercase border-b border-white/10 pb-4">
                     Konfirmasi Laporan: <span className={modalType === "HARIAN" ? "text-primary" : "text-tertiary"}>LAPORAN {modalType}</span>
                  </h3>
                  <div className="mt-4 text-xs text-gray-400 border-l-2 border-primary/50 pl-3">
                     Ditemukan <span className="font-bold text-white">{filteredDataInModal.length}</span> pekerjaan di WORK PLAN untuk tanggal {modalType === "HARIAN" ? formatDate(harianDate) : formatDate(sulmapanaDate)}
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar border border-white/5 rounded-lg bg-black/30 p-4 font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {filteredDataInModal.length === 0 ? "Tidak ada rencana pekerjaan di tanggal tersebut." : (
                     modalType === "HARIAN" 
                        ? generateHarianText(filteredDataInModal, formatDate(harianDate))
                        : generateSulmapanaText(filteredDataInModal, sulmapanaDate, jumlahPersonil)
                  )}
               </div>

               <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                     onClick={() => setModalOpen(false)}
                     className="px-4 py-2 border border-white/10 rounded-lg text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
                  >
                     BATAL
                  </button>
                  <button
                     onClick={handleSendWA}
                     disabled={filteredDataInModal.length === 0}
                     className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 focus:outline-none ${modalType === 'HARIAN' ? 'bg-primary text-black hover:bg-primary/90' : 'bg-tertiary text-black hover:bg-tertiary/90'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                     <Send className="w-3 h-3" /> KIRIM WHATSAPP
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
