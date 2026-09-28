import React, { useState, useEffect, useRef, useCallback } from "react";
const TRACKING_STEPS = ["START", "PERSIAPAN", "PELAKSANAAN", "EVALUASI"];
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { gasService } from "../services/gasService";
import { CollageEditor } from "../components/CollageEditor";
import { ArrowLeft,
  Search,
  Calendar,
  MapPin,
  ChevronRight,
  AlignLeft,
  ShieldCheck,
  Activity,
  Zap,
  Building,
  Eye,
  CheckCircle2,
  Circle,
  Clock,
  Camera,
  Trash2,
  Plus,
  Package,
  RefreshCw,
  LayoutDashboard,
  Filter,
  X,
  TriangleAlert,
  Upload,
  AlertCircle,
  FileText } from "lucide-react";
import { cn, formatDate, formatDateTime } from "../lib/utils";
import { format } from "date-fns";
import ImageZoomModal from "../components/ImageZoomModal";
import { ExportSp2bSp3bModal } from "../components/export/ExportSp2bSp3bModal";
import { ExportWorkOrderModal } from "../components/export/ExportWorkOrderModal";




const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; // Compress more aggressively
        const MAX_HEIGHT = 400;
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
        
        // Output compressed base64 (jpeg, 0.5 quality)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
        console.log("Compressed image size: ", Math.round(compressedBase64.length / 1024), "KB");
        resolve(compressedBase64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};


const LINEAR_STATES = [
  { step: "START", value: "Waiting", label: "Menunggu" },
  { step: "START", value: "Menuju Lokasi", label: "Menuju Lokasi" },
  { step: "PERSIAPAN", value: "Gelar Peralatan & Briefing", label: "Gelar Peralatan & Briefing", backfill: { step: "START", value: "Tiba di Lokasi" } },
  { step: "PELAKSANAAN", value: "Pekerjaan dilaksanakan", label: "Pekerjaan dilaksanakan" },
  { step: "PELAKSANAAN", value: "Pekerjaan Selesai", label: "Pekerjaan Selesai" },
  { step: "CLOSING", value: "SELESAI", label: "SELESAI" }
];

const getCurrentLinearIndex = (trackingData: any) => {
  if (!trackingData) return 0;
  const progres = (trackingData["PROGRES"] || "").toUpperCase();
  if (progres === "PLANNING" || progres === "PEMBUATAN DOKUMEN") {
    return 0;
  }
  if (trackingData["CLOSING"]?.toUpperCase() === "SELESAI" || progres === "SELESAI") return 5;
  
  const pel = trackingData["PELAKSANAAN"]?.toUpperCase() || "";
  if (pel.includes("SELESAI")) return 4;
  if (pel.includes("DILAKSANAKAN") || pel.includes("DIHENTIKAN") || pel.includes("AMBIL ALIH")) return 3;
  
  const per = trackingData["PERSIAPAN"]?.toUpperCase() || "";
  if (per.includes("GELAR") || per.includes("BRIEFING")) return 2;
  
  const start = trackingData["START"]?.toUpperCase() || "";
  if (start.includes("TIBA")) return 1; // Needs to do Gelar Peralatan
  if (start.includes("MENUJU")) return 1;
  
  return 0;
};

const getGeneratedHistory = (trackingData: any) => {
  if (!trackingData) return [];
  const progres = (trackingData["PROGRES"] || "").toUpperCase();
  if (progres === "PLANNING" || progres === "PEMBUATAN DOKUMEN") {
    return [];
  }

  const stepsDef = [
    { id: "MENUJU LOKASI", column: "START", labelEnd: "Menuju Lokasi" },
    { id: "TIBA DI LOKASI", column: "START", labelEnd: "Tiba di Lokasi" },
    { id: "GELAR PERALATAN & BRIEFING", column: "PERSIAPAN", labelEnd: "Gelar Peralatan & Briefing" },
    { id: "SIAP DIMULAI", column: "PERSIAPAN", labelEnd: "Siap Dimulai" },
    { id: "PEKERJAAN DILAKSANAKAN", column: "PELAKSANAAN", labelEnd: "Pekerjaan dilaksanakan" },
    { id: "PEKERJAAN SELESAI", column: "PELAKSANAAN", labelEnd: "Pekerjaan Selesai" }
  ];

  const valStart = (trackingData["START"] || "").toUpperCase();
  const valPers = (trackingData["PERSIAPAN"] || "").toUpperCase();
  const valPelak = (trackingData["PELAKSANAAN"] || "").toUpperCase();
  const valClosing = (trackingData["CLOSING"] || "").toUpperCase();

  let currentIndex = -1;
  if (valClosing === "SELESAI" || valPelak.includes("SELESAI") || valPelak.includes("DIHENTIKAN") || valPelak.includes("AMBIL ALIH")) {
    currentIndex = 5;
    if (valPelak.includes("DIHENTIKAN")) stepsDef[5].labelEnd = "Pekerjaan Dihentikan";
    if (valPelak.includes("AMBIL ALIH")) stepsDef[5].labelEnd = "Pekerjaan Diambil Alih";
  } else if (valPelak.includes("DILAKSANAKAN")) {
    currentIndex = 4;
  } else if (valPers.includes("SIAP DIMULAI")) {
    currentIndex = 3;
  } else if (valPers.includes("GELAR") || valPers.includes("BRIEFING")) {
    currentIndex = 2;
  } else if (valStart.includes("TIBA")) {
    currentIndex = 1;
  } else if (valStart.includes("MENUJU")) {
    currentIndex = 0;
  }

  if (currentIndex === -1) {
    return [];
  }

  let finalTimeline: any[] = [];

  for (let i = 0; i < stepsDef.length; i++) {
    const def = stepsDef[i];
    let state = "pending";
    if (i < currentIndex) state = "completed";
    if (i === currentIndex) {
      if (i === 5) state = "completed";
      else state = "active";
    }

    let tsTime = trackingData[`TS_${def.labelEnd.toUpperCase()}`];
    
    let foto = trackingData.lampiranSteps?.[def.labelEnd]?.["FOTO PROGRES"] || 
               trackingData.lampiranSteps?.[def.labelEnd]?.["FOTO PEKERJAAN"] || 
               trackingData.lampiranSteps?.[`CL_${def.column}`]?.["FOTO PROGRES"] || 
               trackingData.lampiranSteps?.[def.labelEnd]?.["FOTO SEBELUM"] || 
               trackingData[`FOTO ${def.column}`];

    if (def.labelEnd.toUpperCase().includes("SELESAI")) {
      foto = trackingData.lampiranSteps?.CL_PELAKSANAAN?.["Foto Selesai"] ||
             trackingData.lampiranSteps?.CL_PELAKSANAAN?.["FOTO SELESAI"] ||
             trackingData["FOTO SELESAI"] ||
             trackingData.foto_selesai ||
             foto;
    }

    let foto1 = trackingData.lampiranSteps?.[`CL_${def.column}`]?.["FOTO PROSES 1"];
    let foto2 = trackingData.lampiranSteps?.[`CL_${def.column}`]?.["FOTO PROSES 2"];

    let ket = trackingData[`Keterangan ${def.column}`] || trackingData[`KETERANGAN ${def.column}`] || "";

    finalTimeline.push({
      status: def.labelEnd,
      state: state, // 'pending', 'active', 'completed'
      tanggal: tsTime,
      keterangan: (state !== "pending") ? ket : "",
      foto: (state !== "pending") ? foto : null,
      foto1: (state !== "pending") ? foto1 : null,
      foto2: (state !== "pending") ? foto2 : null,
      aktor: ""
    });

    // Check SWA insertion after the current active step
    if (i === currentIndex && trackingData["SWA"]) {
      const swaAktif = trackingData["STATUS SWA"] !== "PEKERJAAN DILANJUTKAN";
      
      finalTimeline.push({
        status: "SWA: " + trackingData["SWA"],
        state: "swa_active",
        tanggal: trackingData["TS_SWA"] || trackingData["SWA_TIME"],
        keterangan: trackingData[`Keterangan ${trackingData["SWA"]}`] || trackingData["Keterangan SWA"] || trackingData["SWA"],
        foto: trackingData[trackingData["SWA"]] || trackingData["FOTO SWA"],
        foto1: null,
        foto2: null,
        aktor: ""
      });

      if (!swaAktif) {
        finalTimeline.push({
          status: "PEKERJAAN DILANJUTKAN",
          state: "swa_cleared",
          tanggal: trackingData["TS_SWA_CLEARED_TIME"] || trackingData["SWA_CLEARED_TIME"],
          keterangan: "Status SWA telah dihapus dan pekerjaan dilanjutkan.",
          foto: null,
          foto1: null,
          foto2: null,
          aktor: ""
        });
      }
    }
  }

  return finalTimeline;
};

export default function WorkPlan() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [workPlans, setWorkPlans] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterProgres, setFilterProgres] = useState("");
  const [filterStatusBerkas, setFilterStatusBerkas] = useState("");
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<any>(null);
  const [showExportSpModal, setShowExportSpModal] = useState(false);
  const [showExportWoModal, setShowExportWoModal] = useState(false);
  const [currentReviewDetail, setCurrentReviewDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [collageBase64, setCollageBase64] = useState<string>("");
  const [isTrackingMode, setIsTrackingMode] = useState(false);
  const [activeTrackingStepIndex, setActiveTrackingStepIndex] = useState(0);
  const [trackingData, setTrackingData] = useState<any>({});
  const [syncingSpreadsheet, setSyncingSpreadsheet] = useState(false);

  const [visibleCount, setVisibleCount] = useState(15);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 15);
      }
    }, { rootMargin: "200px" });
    if (node) observerRef.current.observe(node);
  }, [loading]);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(15);
  }, [searchQuery, filterTanggal, filterProgres, filterStatusBerkas]);

  useEffect(() => {
    if (Object.keys(trackingData).length > 0) {
      const progres = (trackingData["PROGRES"] || "").toUpperCase();
      if (progres === "PLANNING" || progres === "PEMBUATAN DOKUMEN") {
        setActiveTrackingStepIndex(0);
        return;
      }
      let targetIndex = 0;
      for (let i = 0; i < TRACKING_STEPS.length; i++) {
        const step = TRACKING_STEPS[i];
        const val = trackingData[step];
        targetIndex = i;
        if (!val || ![
            "ON SITE",
            "SIAP DIMULAI",
            "PEKERJAAN SELESAI",
            "SELESAI",
            "DIBATALKAN",
            "PEKERJAAN DIHENTIKAN",
            "TIBA DI LOKASI",
            "GELAR PERALATAN & BRIEFING"
          ].includes(val.trim().toUpperCase())) {
          break; // Stop at the first uncompleted step
        }
      }
      setActiveTrackingStepIndex(targetIndex);
    } else {
      setActiveTrackingStepIndex(0);
    }
  }, [trackingData, TRACKING_STEPS]);

  const [berkasActions, setBerkasActions] = useState<Record<string, string>>(
    {},
  );
  const [savingTracking, setSavingTracking] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showSWAModal, setShowSWAModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [swaOption, setSwaOption] = useState("");
  const [swaKeterangan, setSwaKeterangan] = useState("");
  const [swaFoto, setSwaFoto] = useState<any>(null);
  const [savingSWA, setSavingSWA] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);

  useEffect(() => {
    fetchWorkPlans();
  }, []);

  const handleSyncSpreadsheet = async () => {
    try {
      setSyncingSpreadsheet(true);
      const res = await gasService.syncWorkPlans();
      if (res.success) {
        gasService.clearCache("getWorkPlans");
        gasService.clearCache("getWorkPlanDetail");
        gasService.clearCache("getTracking");
        await fetchWorkPlans();
        if (selectedPlanDetail) {
          const noWo = selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"];
          if (noWo) {
            loadDetail(noWo);
            if (isTrackingMode) {
              loadTracking(noWo, true);
            }
          }
        }
        alert(res.message || "Sinkronisasi Work Plans dari Spreadsheet berhasil!");
      } else {
        alert(res.message || "Gagal sinkronisasi data Work Plans.");
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan sinkronisasi: ${err.message || err}`);
    } finally {
      setSyncingSpreadsheet(false);
    }
  };

  const fetchWorkPlans = async () => {
    const cached = gasService.getCached("getWorkPlans");
    if (cached && cached.success && cached.data) {
       let data = cached.data;
       data.sort((a: any, b: any) => {
         const dateA = parseDate(a["TANGGAL DIRENCANAKAN"] || "");
         const dateB = parseDate(b["TANGGAL DIRENCANAKAN"] || "");
         if (dateB.getTime() !== dateA.getTime()) {
           return dateB.getTime() - dateA.getTime();
         }
         const numA = parseInt(String(a["NO. WO"] || "").replace(/\D/g, ""), 10) || 0;
         const numB = parseInt(String(b["NO. WO"] || "").replace(/\D/g, ""), 10) || 0;
         return numB - numA;
       });
       setWorkPlans(data);
       setLoading(false);
    } else {
       setLoading(true);
    }
    const res = await gasService.post("getWorkPlans", {}, false, true);
    if (res.success && res.data) {
      let data = res.data;

      // Sort specifically by TANGGAL DIRENCANAKAN descending, then by NO. WO descending
      data.sort((a: any, b: any) => {
        // TANGGAL DIRENCANAKAN format can be DD/MM/YYYY or YYYY-MM-DD
        const dateA = parseDate(a["TANGGAL DIRENCANAKAN"] || "");
        const dateB = parseDate(b["TANGGAL DIRENCANAKAN"] || "");
        if (dateB.getTime() !== dateA.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        const numA = parseInt(String(a["NO. WO"] || "").replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(String(b["NO. WO"] || "").replace(/\D/g, ""), 10) || 0;
        return numB - numA;
      });

      setWorkPlans(data);

      setSelectedPlanDetail(prev => {
        if (!prev) return prev;
        const selNoWo = prev["NO. WO"] || prev["NO WO"];
        const updatedWp = data.find((item: any) => (item["NO. WO"] || item["NO WO"]) === selNoWo);
        return updatedWp || prev;
      });
    }
    setLoading(false);
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          return new Date(
            parseInt(parts[2]),
            parseInt(parts[1]) - 1,
            parseInt(parts[0]),
          );
        }
      }
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
  };

  
  const STATUS_HISTORY_MAP: Record<string, string[]> = {
    START: ["Menuju Lokasi", "Tiba di Lokasi"],
    PERSIAPAN: ["Gelar Peralatan & Briefing"],
    PELAKSANAAN: ["Pekerjaan dilaksanakan", "Pekerjaan Selesai"],
  };

  const [trackingOptions, setTrackingOptions] = useState<any>({
    START: ["Waiting", "Menuju Lokasi", "Tiba di Lokasi"],
    PERSIAPAN: ["Waiting", "Gelar Peralatan & Briefing", "Siap Dimulai"],
    PELAKSANAAN: ["Waiting", "Pekerjaan dilaksanakan", "Pekerjaan Selesai"],
    SWA: ["Pending", "Dibatalkan", "ISHOMA", "Dihentikan Sementara", "Pihak-3 Ambil Alih"],
    PROGRESS: ["PLANNING", "PEMBUATAN DOKUMEN", "PROSES EKSEKUSI", "SELESAI", "PENDING", "CANCEL"]
  });

  useEffect(() => {
    if (isTrackingMode) {
      gasService.post("getTrackingOptions").then((res) => {
        if (res.success && res.data) setTrackingOptions(res.data);
      });
    }
  }, [isTrackingMode]);

  const [activeStepInput, setActiveStepInput] = useState<string | null>(null);
  const [stepInputValue, setStepInputValue] = useState("");
  const [stepInputKeterangan, setStepInputKeterangan] = useState("");
  const [stepInputFoto, setStepInputFoto] = useState<{
    base64: string;
    mime: string;
    name: string;
  } | null>(null);
  const [stepInputFotoSebelum, setStepInputFotoSebelum] = useState<{
    base64: string;
    mime: string;
    name: string;
  } | null>(null);
  const [stepInputFotoProses1, setStepInputFotoProses1] = useState<{
    base64: string;
    mime: string;
    name: string;
  } | null>(null);
  const [stepInputFotoProses2, setStepInputFotoProses2] = useState<{
    base64: string;
    mime: string;
    name: string;
  } | null>(null);

  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  const [trackingInputCache, setTrackingInputCache] = useState<
    Record<
      string,
      {
        value: string;
        keterangan: string;
        foto: any;
        fotoSebelum: any;
        fotoProses1: any;
        fotoProses2: any;
      }
    >
  >(() => {
    try {
      const saved = localStorage.getItem("trackingInputCache");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse tracking cache", e);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem("trackingInputCache", JSON.stringify(trackingInputCache));
    } catch (e) {
      console.error("Failed to save tracking cache", e);
    }
  }, [trackingInputCache]);

  const openStepModal = (step: string, currentValue: string) => {
    const cached = trackingInputCache[step];
    setActiveStepInput(step);
    if (cached) {
      setStepInputValue(cached.value || currentValue);
      setStepInputKeterangan(cached.keterangan);
      setStepInputFoto(cached.foto);
      setStepInputFotoSebelum(cached.fotoSebelum);
      setStepInputFotoProses1(cached.fotoProses1);
      setStepInputFotoProses2(cached.fotoProses2);
    } else {
      setStepInputValue(currentValue);
      setStepInputKeterangan("");
      setStepInputFoto(null);
      setStepInputFotoSebelum(null);
      setStepInputFotoProses1(null);
      setStepInputFotoProses2(null);
    }
  };

  const closeStepModal = () => {
    if (activeStepInput) {
      setTrackingInputCache((prev) => ({
        ...prev,
        [activeStepInput]: {
          value: stepInputValue,
          keterangan: stepInputKeterangan,
          foto: stepInputFoto,
          fotoSebelum: stepInputFotoSebelum,
          fotoProses1: stepInputFotoProses1,
          fotoProses2: stepInputFotoProses2,
        },
      }));
    }
    setActiveStepInput(null);
  };

  const [berkasActionModal, setBerkasActionModal] = useState<{
    key: string;
    open: boolean;
  } | null>(null);
  const [updatingBerkas, setUpdatingBerkas] = useState(false);

  const handleFotoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "default" | "sebelum" | "proses1" | "proses2" = "default",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.65);
            const [meta, base64] = compressedDataUrl.split(",");
            const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
            const newFoto = { base64, mime, name: file.name };
            if (type === "sebelum") setStepInputFotoSebelum(newFoto);
            else if (type === "proses1") setStepInputFotoProses1(newFoto);
            else if (type === "proses2") setStepInputFotoProses2(newFoto);
            else setStepInputFoto(newFoto);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const saveInlinePelaksanaanFotos = async (
    noWo: string,
    stepValue: string,
  ) => {
    if (
      !stepInputFotoSebelum &&
      !stepInputFotoProses1 &&
      !stepInputFotoProses2
    ) {
      alert("Pilih minimal 1 foto untuk diunggah");
      return;
    }
    setSavingTracking(true);
    const payload = {
      noWo,
      stepName: "PELAKSANAAN",
      stepValue,
      keterangan: "",
      fotoSebelumBase64: stepInputFotoSebelum?.base64,
      fotoSebelumName: stepInputFotoSebelum?.name,
      fotoProses1Base64: stepInputFotoProses1?.base64,
      fotoProses1Name: stepInputFotoProses1?.name,
      fotoProses2Base64: stepInputFotoProses2?.base64,
      fotoProses2Name: stepInputFotoProses2?.name,
    };

    const res = await gasService.post("updateTracking", payload);
    if (res.success) {
      alert("Foto Pelaksanaan berhasil diunggah");
      // Fetch tracking again
      gasService.post("getTracking", { noWo }).then((r) => {
        if (r.success && r.data) setTrackingData(r.data);
      });
    } else {
      alert("Gagal mengunggah foto: " + (res.message || res.error || JSON.stringify(res)));
    }
    setSavingTracking(false);
  };

  const handleDirectEvidenUpload = async (
    slotKey: "sebelum" | "proses1" | "proses2" | "selesai",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPlanDetail) return;
    const noWo = selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"];
    if (!noWo) return;

    setUploadingSlot(slotKey);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.70);

            // Optimistic update
            setTrackingData((prev: any) => {
              if (!prev) return prev;
              const next = { ...prev };
              if (!next.lampiranSteps) next.lampiranSteps = {};
              if (!next.lampiranSteps.CL_PELAKSANAAN) next.lampiranSteps.CL_PELAKSANAAN = {};

              if (slotKey === "sebelum") {
                next.lampiranSteps.CL_PELAKSANAAN["Foto Sebelum"] = compressedDataUrl;
                next["FOTO SEBELUM"] = compressedDataUrl;
                next.foto_sebelum = compressedDataUrl;
              } else if (slotKey === "proses1") {
                next.lampiranSteps.CL_PELAKSANAAN["Foto Proses 1"] = compressedDataUrl;
                next["FOTO PROSES 1"] = compressedDataUrl;
                next.foto_proses1 = compressedDataUrl;
              } else if (slotKey === "proses2") {
                next.lampiranSteps.CL_PELAKSANAAN["Foto Proses 2"] = compressedDataUrl;
                next["FOTO PROSES 2"] = compressedDataUrl;
                next.foto_proses2 = compressedDataUrl;
              } else if (slotKey === "selesai") {
                next.lampiranSteps.CL_PELAKSANAAN["Foto Selesai"] = compressedDataUrl;
                next["FOTO SELESAI"] = compressedDataUrl;
                next.foto_selesai = compressedDataUrl;
                next["FOTO PELAKSANAAN"] = compressedDataUrl;
              }
              return next;
            });

            // Send to backend
            const payload: any = { noWo };
            if (slotKey === "sebelum") payload.fotoSebelumBase64 = compressedDataUrl;
            if (slotKey === "proses1") payload.fotoProses1Base64 = compressedDataUrl;
            if (slotKey === "proses2") payload.fotoProses2Base64 = compressedDataUrl;
            if (slotKey === "selesai") {
              payload.fotoSelesaiBase64 = compressedDataUrl;
              payload.fotoPelaksanaanBase64 = compressedDataUrl;
            }

            const res = await gasService.post("uploadEvidenPelaksanaan", payload);
            if (res.success) {
              const r = await gasService.post("getTracking", { noWo });
              if (r.success && r.data) setTrackingData(r.data);
            } else {
              alert("Gagal mengunggah foto: " + (res.message || res.error || ""));
            }
            setUploadingSlot(null);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
      setUploadingSlot(null);
    }
  };

  
  const saveTrackingDirectly = async (stepName: string, stepValue: string) => {
    setSavingTracking(true);
    let payload = {
      noWo: selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"],
      stepName,
      stepValue,
      keterangan: "",
    };
    const res = await gasService.post("updateTracking", payload);
    if (res.success) {
      alert("Progres berhasil diperbarui");

      // Auto-progress Backfill for LINEAR_STATES
      const currState = LINEAR_STATES.find(s => s.step === stepName && s.value === stepValue);
      if (currState && currState.backfill) {
        await gasService.post("updateTracking", {
          noWo: payload.noWo,
          stepName: currState.backfill.step,
          stepValue: currState.backfill.value,
          keterangan: ""
        });
      }

      // Auto-progress
      if (stepName === "PERSIAPAN" && stepValue.toUpperCase() === "SIAP DIMULAI") {
        await gasService.post("updateTracking", {
          noWo: payload.noWo,
          stepName: "PELAKSANAAN",
          stepValue: "PEKERJAAN DILAKSANAKAN",
          keterangan: ""
        });
      }
      fetchWorkPlans();
      gasService.post("getTracking", { noWo: payload.noWo }).then((r) => {
        if (r.success && r.data) setTrackingData(r.data);
      });
    } else {
      alert("Gagal mengupdate progres: " + (res.message || res.error || JSON.stringify(res)));
    }
    setSavingTracking(false);
  };

  const saveTracking = async (stepName: string, stepValue: string) => {
    setSavingTracking(true);

    // Check if this step needs keterangan and we didn't provide one? Actually, we'll just gather whatever is in state.

    let payload = {
      noWo: selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"],
      stepName,
      stepValue,
      keterangan: stepInputKeterangan,
      fotoBase64: stepInputFoto?.base64,
      fotoMime: stepInputFoto?.mime,
      fotoName: stepInputFoto?.name,
      fotoSebelumBase64: stepInputFotoSebelum?.base64,
      fotoSebelumName: stepInputFotoSebelum?.name,
      fotoProses1Base64: stepInputFotoProses1?.base64,
      fotoProses1Name: stepInputFotoProses1?.name,
      fotoProses2Base64: stepInputFotoProses2?.base64,
      fotoProses2Name: stepInputFotoProses2?.name,
      fotoSelesaiBase64: (stepName === "PELAKSANAAN" && (stepValue.toUpperCase().includes("SELESAI"))) ? stepInputFoto?.base64 : undefined,
    };

    const res = await gasService.post("updateTracking", payload);
    if (res.success) {
      alert("Progres berhasil diperbarui");
      setTrackingInputCache((prev) => {
        const next = { ...prev };
        delete next[stepName];
        return next;
      });
      setActiveStepInput(null);
      setStepInputValue("");
      setStepInputKeterangan("");
      setStepInputFoto(null);
      setStepInputFotoSebelum(null);
      setStepInputFotoProses1(null);
      setStepInputFotoProses2(null);
      

      // Auto-progress Backfill for LINEAR_STATES
      const currState = LINEAR_STATES.find(s => s.step === stepName && s.value === stepValue);
      if (currState && currState.backfill) {
        await gasService.post("updateTracking", {
          noWo: payload.noWo,
          stepName: currState.backfill.step,
          stepValue: currState.backfill.value,
          keterangan: ""
        });
      }

      // Auto-progress
      if (stepName === "PERSIAPAN" && stepValue.toUpperCase() === "SIAP DIMULAI") {
        await gasService.post("updateTracking", {
          noWo: payload.noWo,
          stepName: "PELAKSANAAN",
          stepValue: "PEKERJAAN DILAKSANAKAN",
          keterangan: ""
        });
      }

      fetchWorkPlans();
      // Fetch tracking again
      gasService.post("getTracking", { noWo: payload.noWo }).then((r) => {
        if (r.success && r.data) setTrackingData(r.data);
      });
    } else {
      alert("Gagal mengupdate progres: " + (res.message || res.error || JSON.stringify(res)));
    }
    setSavingTracking(false);
  };

  const handleUpdateBerkasAction = async (action: string) => {
    if (!berkasActionModal || !selectedPlanDetail) return;

    setUpdatingBerkas(true);
    const noWo = selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"];
    const payload = {
      noWo,
      type: berkasActionModal.key,
      action,
    };

    const res = await gasService.post("updateBerkasAction", payload);
    if (res.success) {
      alert(
        `Berhasil mengupdate aksi berkas ${berkasActionModal.key} menjadi ${action}`,
      );
      setBerkasActionModal(null);
      // Reload workplans and detail to reflect changes if necessary
      loadDetail(noWo);
    } else {
      alert("Gagal mengupdate aksi berkas: " + (res.message || res.error || JSON.stringify(res)));
    }
    setUpdatingBerkas(false);
  };



  const loadTracking = async (noWo: string, forceRefresh = false) => {
    setIsTrackingMode(true);
    if (forceRefresh) {
      gasService.clearCache("getTracking");
    }
    const cachedTracking = !forceRefresh ? gasService.getCached("getTracking", { noWo }) : null;

    if (cachedTracking && cachedTracking.success && cachedTracking.data) {
       const curProg = (selectedPlanDetail?.["PROGRES"] || "").toUpperCase();
       if (curProg === "PLANNING" || curProg === "PEMBUATAN DOKUMEN") {
         cachedTracking.data["PROGRES"] = curProg;
         cachedTracking.data["CLOSING"] = "Waiting";
         cachedTracking.data["PELAKSANAAN"] = "Waiting";
         cachedTracking.data["PERSIAPAN"] = "Waiting";
         cachedTracking.data["START"] = "Waiting";
       }
       setTrackingData(cachedTracking.data);
    } else {
       setLoadingDetail(true);
    }

    const res = await gasService.post("getTracking", { noWo }, false, true);
    if (res.success && res.data) {
      setTrackingData(res.data);
    } else if (!cachedTracking || !cachedTracking.success) {
      setTrackingData({});
    }
    setLoadingDetail(false);
  };

  const loadDetail = async (noWo: string) => {
    const cachedDetail = gasService.getCached("getWorkPlanDetail", { noWo });
    const cachedBerkas = gasService.getCached("getBerkasActions", { noWo });

    if (cachedDetail && cachedDetail.success && cachedDetail.data) {
       setSelectedPlanDetail(cachedDetail.data);
       if (cachedBerkas && cachedBerkas.success && cachedBerkas.data) {
          setBerkasActions(cachedBerkas.data);
       }
    } else {
       setLoadingDetail(true);
    }

    const [res, resBerkas] = await Promise.all([
      gasService.post("getWorkPlanDetail", { noWo }),
      gasService.post("getBerkasActions", { noWo }),
    ]);

    if (res.success && res.data) {
      setSelectedPlanDetail(res.data);
    } else if (!cachedDetail || !cachedDetail.success) {
      alert("Gagal memuat detail Work Plan: " + ((res.message || res.error || JSON.stringify(res)) || "Error"));
    }

    if (resBerkas.success && resBerkas.data) {
      setBerkasActions(resBerkas.data);
    } else if (!cachedBerkas || !cachedBerkas.success) {
      setBerkasActions({});
    }

    setLoadingDetail(false);
  };

  const filteredPlans = workPlans.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !p["NO. WO"]?.toString().toLowerCase().includes(q) &&
        !p["ULP"]?.toString().toLowerCase().includes(q) &&
        !p["TEMUAN"]?.toString().toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filterTanggal) {
      const parts = filterTanggal.split("-");
      if (parts.length === 3) {
        const formattedFilterDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        const pDateStr = p["TANGGAL DIRENCANAKAN"]
          ? formatDate(p["TANGGAL DIRENCANAKAN"])
          : "";
        if (pDateStr !== formattedFilterDate) {
          return false;
        }
      }
    }
    if (
      filterProgres &&
      p["PROGRES"]?.toString().toUpperCase() !== filterProgres.toUpperCase()
    ) {
      return false;
    }
    if (
      filterStatusBerkas &&
      p["STATUS BERKAS"]?.toString().toUpperCase() !==
        filterStatusBerkas.toUpperCase()
    ) {
      return false;
    }
    return true;
  });

  const uniqueTanggal = Array.from(
    new Set(workPlans.map((p) => p["TANGGAL DIRENCANAKAN"]).filter(Boolean)),
  );
  const uniqueStatusBerkas = Array.from(
    new Set(
      workPlans
        .map((p) => p["STATUS BERKAS"]?.toString().toUpperCase())
        .filter(Boolean),
    ),
  );
  const listProgres = [
    "PLANNING",
    "PEMBUATAN DOKUMEN",
    "PROSES EKSEKUSI",
    "SELESAI",
    "PENDING",
    "CANCEL",
  ];

  const getTrackingInputRequirements = (step: string | null, value: string) => {
    let needsKeterangan = false;
    let needsFoto = false;
    let needsMultipleFotos = false;
    if (!step || !value)
      return { needsKeterangan, needsFoto, needsMultipleFotos };

    const val = value.trim();

    if (step === "START") {
      if (val === "Pending" || val === "Dibatalkan") {
        needsKeterangan = true;
        needsFoto = true;
      }
    } else if (step === "PERSIAPAN") {
      if (val === "Pending" || val === "Dibatalkan") {
        needsKeterangan = true;
        needsFoto = true;
      } else if (val === "Briefing & Doa" || val === "Gelar Peralatan & Briefing") {
        needsFoto = true;
      }
    } else if (step === "PELAKSANAAN") {
      if (
        val === "Dihentikan Sementara" ||
        val === "Pihak-3 Ambil Alih" ||
        val === "Pekerjaan Dihentikan"
      ) {
        needsKeterangan = true;
        needsFoto = true;
      } else if (val.toUpperCase() === "PEKERJAAN SELESAI" || val.toUpperCase() === "SELESAI") {
        needsFoto = true;
      }
    }
    return { needsKeterangan, needsFoto, needsMultipleFotos };
  };

  const isAllowedToUpdate =
    (user?.jabatan || "").toUpperCase().includes("KEPALA REGU") ||
    (user?.jabatan || "").toUpperCase().includes("PENGAWAS K3") ||
    (user?.role || "").toUpperCase().includes("KEPALA REGU") ||
    (user?.role || "").toUpperCase().includes("PENGAWAS K3");

  const statusBerkas =
    selectedPlanDetail?.["STATUS BERKAS"]?.toUpperCase() || "";
  const canUpdateProgress =
    isAllowedToUpdate && statusBerkas.includes("DOKUMEN LENGKAP");

  const formatTime = (timeStr: any) => {
    if (!timeStr) return "--:--";
    if (typeof timeStr === "string") {
      if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) return timeStr.substring(0, 5); // HH:mm
      if (timeStr.match(/^\d{2}:\d{2}$/)) return timeStr; // HH:mm
      if (timeStr.includes("T") || timeStr.includes("1899")) {
        try {
          const d = new Date(timeStr);
          // if invalid date, try to parse just the time?
          if (isNaN(d.getTime())) {
             return String(timeStr).substring(0, 5);
          }
          return d
            .toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
            .replace(/\./g, ":");
        } catch (e) {}
      }
    }
    return String(timeStr).substring(0, 5);
  };

  const { needsKeterangan, needsFoto, needsMultipleFotos } =
    getTrackingInputRequirements(activeStepInput, stepInputValue);

  
  
  const renderEvaluasi = () => {
    const sebelumUrl =
      trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["Foto Sebelum"] ||
      trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["FOTO SEBELUM"] ||
      trackingData?.["FOTO SEBELUM"] ||
      trackingData?.foto_sebelum ||
      "";

    const proses1Url =
      trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["Foto Proses 1"] ||
      trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["FOTO PROSES 1"] ||
      trackingData?.["FOTO PROSES 1"] ||
      trackingData?.foto_proses1 ||
      "";

    const proses2Url =
      trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["Foto Proses 2"] ||
      trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["FOTO PROSES 2"] ||
      trackingData?.["FOTO PROSES 2"] ||
      trackingData?.foto_proses2 ||
      "";

    const sesudahUrl =
      trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["Foto Selesai"] ||
      trackingData?.lampiranSteps?.CL_PELAKSANAAN?.["FOTO SELESAI"] ||
      trackingData?.["FOTO SELESAI"] ||
      trackingData?.foto_selesai ||
      (trackingData?.["PELAKSANAAN"]?.toUpperCase().includes("SELESAI")
        ? trackingData?.["FOTO PELAKSANAAN"] || trackingData?.foto_pelaksanaan
        : "") ||
      "";

    const evidenSlots = [
      {
        key: "sebelum" as const,
        label: "FOTO SEBELUM",
        sublabel: "Kondisi sebelum pekerjaan dimulai",
        url: sebelumUrl,
        required: true,
      },
      {
        key: "proses1" as const,
        label: "FOTO PROSES 1",
        sublabel: "Tahap proses pelaksanaan 1",
        url: proses1Url,
        required: false,
      },
      {
        key: "proses2" as const,
        label: "FOTO PROSES 2",
        sublabel: "Tahap proses pelaksanaan 2",
        url: proses2Url,
        required: false,
      },
      {
        key: "selesai" as const,
        label: "FOTO SELESAI",
        sublabel: "Kondisi setelah pekerjaan selesai",
        url: sesudahUrl,
        required: true,
      },
    ];

    const filledCount = [sebelumUrl, proses1Url, proses2Url, sesudahUrl].filter(Boolean).length;

    return (
      <div className="bg-[#1a252b] border border-white/10 rounded-xl p-4 sm:p-6 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" /> Evaluasi & Hasil Realisasi
          </h3>
          <span className="text-[11px] text-gray-400">
            Status Eviden: <span className="font-semibold text-white">{filledCount} dari 4</span> foto tersedia
          </span>
        </div>

        {/* 4-SLOT FOTO EVIDEN GRID */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-primary" />
              Dokumentasi Foto Eviden (4 Slot)
            </label>
            <span className="text-[10px] text-gray-400">
              Format: JPG/PNG (Otomatis dikompresi)
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {evidenSlots.map((slot) => {
              const hasPhoto = Boolean(slot.url);
              const isUploading = uploadingSlot === slot.key;

              return (
                <div
                  key={slot.key}
                  className={cn(
                    "flex flex-col rounded-xl border bg-[#0d161a] p-3 transition-all",
                    hasPhoto
                      ? "border-white/15 hover:border-primary/40 shadow-sm"
                      : "border-dashed border-white/15 hover:border-primary/30"
                  )}
                >
                  {/* Slot Title & Badge */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold text-gray-200 tracking-wider uppercase truncate">
                      {slot.label}
                    </span>
                    {hasPhoto ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/15 text-green-400 border border-green-500/30 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Ada
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Belum
                      </span>
                    )}
                  </div>

                  {/* Thumbnail / Upload Area */}
                  <div className="relative w-full aspect-square bg-[#0a0f12] rounded-lg overflow-hidden flex items-center justify-center border border-white/5">
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center p-2 text-center">
                        <RefreshCw className="w-6 h-6 text-primary animate-spin mb-1.5" />
                        <span className="text-[10px] text-gray-300 font-semibold">Mengunggah...</span>
                      </div>
                    ) : hasPhoto ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={slot.url}
                          alt={slot.label}
                          className="w-full h-full object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200"
                          onClick={() => setZoomedImage(slot.url)}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setZoomedImage(slot.url)}
                            className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-colors text-xs font-semibold flex items-center gap-1 shadow"
                            title="Lihat Foto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isAllowedToUpdate && (
                            <label
                              className="p-1.5 bg-primary/80 hover:bg-primary text-black rounded-lg cursor-pointer backdrop-blur-sm transition-colors text-xs font-semibold flex items-center gap-1 shadow"
                              title="Ganti Foto"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleDirectEvidenUpload(slot.key, e)}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    ) : (
                      <label
                        className={cn(
                          "w-full h-full flex flex-col items-center justify-center p-3 text-center transition-all",
                          isAllowedToUpdate
                            ? "cursor-pointer hover:bg-white/5"
                            : "cursor-not-allowed opacity-60"
                        )}
                      >
                        <Camera className="w-6 h-6 text-gray-500 mb-1" />
                        <span className="text-[10px] font-semibold text-gray-400">
                          {isAllowedToUpdate ? "Unggah Foto" : "Belum Tersedia"}
                        </span>
                        <span className="text-[8px] text-gray-500 mt-0.5 leading-tight">
                          {slot.sublabel}
                        </span>
                        {isAllowedToUpdate && (
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleDirectEvidenUpload(slot.key, e)}
                          />
                        )}
                      </label>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    {hasPhoto ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setZoomedImage(slot.url)}
                          className="text-gray-400 hover:text-white flex items-center gap-1 text-[10px] transition-colors"
                        >
                          <Eye className="w-3 h-3 text-primary" /> Perbesar
                        </button>
                        {isAllowedToUpdate && (
                          <label className="text-primary hover:underline cursor-pointer flex items-center gap-1 text-[10px]">
                            <span>Ganti</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleDirectEvidenUpload(slot.key, e)}
                            />
                          </label>
                        )}
                      </>
                    ) : (
                      <span className="text-[9px] text-gray-500 italic">
                        {slot.required ? "*Wajib diisi" : "Opsional"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2X2 COLLAGE EDITOR SECTION */}
        <div className="border-t border-white/10 pt-5 mt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
              Preview Grid Foto Realisasi (2x2 Auto-Collage)
            </h4>
            <span className="text-[10px] text-gray-400">
              Geser atau cubit pada kanvas untuk menyesuaikan posisi tiap foto
            </span>
          </div>

          <CollageEditor
            sebelum={sebelumUrl}
            sesudah={sesudahUrl}
            proses1={proses1Url}
            proses2={proses2Url}
            onGridReady={setCollageBase64}
          />
        </div>

        <div className="space-y-4 mt-6">
          <p className="text-xs text-gray-400 leading-relaxed border-t border-white/10 pt-4">
            Pastikan semua tahapan pekerjaan telah dilakukan sesuai SOP dan IK. Dengan mengklik Selesaikan Pekerjaan, sistem akan menyimpan grid Foto Realisasi di atas dan menutup Work Order ini.
          </p>
          {isAllowedToUpdate && (
            <button
              onClick={async () => {
                setConfirmDialog({
                  message: "Apakah Anda yakin ingin menyelesaikan pekerjaan ini dan mengirim notifikasi?",
                  onConfirm: async () => {
                    setConfirmDialog(null);
                    setLoadingDetail(true);
                    try {
                      const noWo = selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"];
                      const res = await gasService.post("selesaikanPekerjaan", {
                        noWo,
                        isCanceled: false,
                        collageBase64: collageBase64,
                        collageName: noWo + " - REALISASI.jpg",
                        fotoSelesaiBase64: sesudahUrl || undefined,
                      });
                      if (res.success) {
                        alert("Pekerjaan berhasil diselesaikan dan notifikasi terkirim!");
                        gasService.clearCache("getWorkPlans");
                        gasService.clearCache("getTracking");
                        await fetchWorkPlans();
                      } else {
                        alert("Gagal: " + (res.message || res.error || JSON.stringify(res)));
                      }
                    } catch (err: any) {
                      alert("Error: " + err.message);
                    } finally {
                      setLoadingDetail(false);
                    }
                  },
                });
              }}
              disabled={loadingDetail || !collageBase64}
              className="w-full py-3 bg-green-500 text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-green-400 transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50"
            >
              {loadingDetail ? "Menyiapkan Laporan..." : "Selesaikan Pekerjaan"}
            </button>
          )}
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-[#0a1014] flex flex-col font-sans">
      <header className="h-14 border-b border-[#0d8291]/30 bg-[#0d161a] flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isTrackingMode) setIsTrackingMode(false);
              else if (selectedPlanDetail) setSelectedPlanDetail(null);
              else navigate("/office");
            }}
            className="w-8 h-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-widest text-white uppercase leading-tight">
              Work Plan
            </h1>
            {selectedPlanDetail && (
              <span className="text-[9px] text-primary uppercase tracking-widest font-mono">
                NO. WO:{" "}
                {selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"]}
              </span>
            )}
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
        </div>
      </header>

      <main className="flex-1 max-w-[1500px] mx-auto w-full p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold uppercase tracking-widest text-[#0d8291]">
            Daftar Work Plan
          </h2>
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
              onClick={() => {
                setLoading(true);
                gasService.clearCache("getWorkPlans");
                gasService.clearCache("getTracking");
                gasService.clearCache("getWorkPlanDetail");
                fetchWorkPlans();
                if (selectedPlanDetail) {
                  const noWo = selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"];
                  if (noWo) {
                    loadDetail(noWo);
                    if (isTrackingMode) {
                      loadTracking(noWo, true);
                    }
                  }
                }
              }}
              disabled={loading || syncingSpreadsheet}
              className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-[#1a252b] text-gray-300 hover:text-white border border-white/10 px-2 sm:px-3 py-1.5 rounded transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[380px_1fr] xl:grid-cols-[450px_1fr] gap-6 items-start h-[calc(100vh-140px)]">
          {/* KIRI: DAFTAR PLAN */}
          <div className={cn("flex flex-col gap-4 bg-[#0d161a] border border-white/5 rounded-xl overflow-hidden p-4 h-full", selectedPlanDetail ? "hidden md:flex" : "flex")}>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">Daftar Plan</h3>
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
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Cari</label>
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Cari NO WO / ULP..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#111c22] border border-white/5 rounded pl-7 px-2 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Status Berkas</label>
                  <select
                    value={filterStatusBerkas}
                    onChange={(e) => setFilterStatusBerkas(e.target.value)}
                    className="w-full bg-[#111c22] border border-white/5 rounded px-2 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">Semua Status Berkas</option>
                    {uniqueStatusBerkas.map((s, i) => (
                      <option key={i} value={s as string}>{s as string}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Progres</label>
                  <select
                    value={filterProgres}
                    onChange={(e) => setFilterProgres(e.target.value)}
                    className="w-full bg-[#111c22] border border-white/5 rounded px-2 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">Semua Progres</option>
                    {listProgres.map((p, i) => (
                      <option key={i} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={filterTanggal}
                    onChange={(e) => setFilterTanggal(e.target.value)}
                    className="w-full bg-[#111c22] border border-white/5 rounded px-2 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : filteredPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                    <Activity className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Belum Ada Work Plan</p>
                </div>
              ) : (
                <>
                {filteredPlans.slice(0, visibleCount).map((wp: any, index) => {
                  const isLast = index === Math.min(filteredPlans.length, visibleCount) - 1;
                  return (
                  <div
                    ref={isLast ? lastElementRef : null}
                    key={index}
                    onClick={() => {
                      if (selectedPlanDetail && (selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"]) === (wp["NO. WO"] || wp["NO WO"])) {
                        setSelectedPlanDetail(null);
                        setTrackingData({});
                        setIsTrackingMode(false);
                      } else {
                        setSelectedPlanDetail(wp);
                        setTrackingData({});
                        setIsTrackingMode(false);
                      }
                    }}
                    className={cn(
                      "bg-[#1a252b] border rounded-lg overflow-hidden flex flex-col cursor-pointer transition-all hover:border-primary/50 relative group",
                      (selectedPlanDetail?.["NO. WO"] || selectedPlanDetail?.["NO WO"]) === (wp["NO. WO"] || wp["NO WO"])
                        ? "border-primary shadow-[0_0_15px_rgba(255,94,0,0.2)]"
                        : "border-white/5"
                    )}
                  >
                    <div className="h-32 bg-black/40 relative overflow-hidden">
                      <img loading="lazy"
                        src={wp["FOTO TEMUAN"] || "https://images.unsplash.com/photo-1541888052115-46b5398288e2?auto=format&fit=crop&w=400&q=80"}
                        alt="Temuan"
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a252b] via-transparent to-transparent" />
                      
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {wp["STATUS BERKAS"] && (
                          <div
                            className={cn(
                              "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur",
                              wp["STATUS BERKAS"]?.toLowerCase().includes("dokumen lengkap")
                                ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                : wp["STATUS BERKAS"]?.toLowerCase().includes("pemberkasan")
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                                : wp["STATUS BERKAS"]?.toLowerCase().includes("pembuatan dokumen")
                                ? "bg-red-500/20 text-red-400 border border-red-500/20"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/20"
                            )}
                          >
                            {wp["STATUS BERKAS"] || "PROSES"}
                          </div>
                        )}
                        {wp["PROGRES"] && (
                          <div
                            className={cn(
                              "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur",
                              wp["PROGRES"]?.toLowerCase().includes("selesai")
                                ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                : wp["PROGRES"]?.toLowerCase().includes("cancel")
                                ? "bg-red-500/20 text-red-400 border border-red-500/20"
                                : wp["PROGRES"]?.toLowerCase().includes("pending") || wp["PROGRES"]?.toLowerCase().includes("proses eksekusi") || wp["PROGRES"]?.toLowerCase().includes("pembuatan dokumen")
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                                : "bg-primary/20 text-primary border border-primary/20"
                            )}
                          >
                            PROGRES: {wp["PROGRES"]}
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded backdrop-blur">
                        <Calendar className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-mono">{formatDate(wp["TANGGAL DIRENCANAKAN"])}</span>
                      </div>
                    </div>
                    
                    <div className="p-3 flex flex-col flex-1">
                      <div className="flex flex-col mb-2">
                        <span className="text-[10px] text-primary font-mono uppercase tracking-widest">{wp["NO. WO"] || wp["NO WO"]}</span>
                        <span className="text-xs font-bold text-white uppercase mt-1 line-clamp-2 leading-tight">{wp["DETAIL PEKERJAAN"] || wp["TEMUAN"] || "-"}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-y-1 mt-auto pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Building className="w-3 h-3 text-gray-500" />
                          <span className="text-[10px] text-gray-300 truncate">{wp["ULP"] || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="text-[10px] text-gray-300 truncate">{wp["SEGMEN"] || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
                })}
                </>
              )}
            </div>
          </div>

          {/* KANAN: DETAIL PLAN */}
          <div className={cn("flex flex-col bg-[#0d161a] border border-white/5 rounded-xl overflow-hidden shadow-2xl h-full relative", !selectedPlanDetail ? "hidden md:flex" : "flex")}>
            {selectedPlanDetail ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 backdrop-blur-md rounded-t-xl z-20">
                  <div>
                    <h2 className="text-lg font-bold text-primary uppercase tracking-widest">Detail Work Plan</h2>
                    <p className="text-xs text-gray-400 font-mono mt-1">Sesuai data Work Order</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      let progres = selectedPlanDetail?.["PROGRES"]?.toUpperCase() || "";
                      const isPlanningWp = progres.includes("PLANN") || progres.includes("DOKUMEN");
                      if (!isPlanningWp && trackingData && trackingData["CLOSING"]?.toUpperCase() === "SELESAI") {
                        progres = "SELESAI";
                      }
                      let btnLabel = "MULAI PROGRES";
                      let btnDisabled = true;
                      let btnClass = "bg-black/40 text-gray-500 border-white/10 cursor-not-allowed";

                      if (isAllowedToUpdate) {
                        if (statusBerkas.includes("DOKUMEN LENGKAP")) {
                          if (progres.includes("SELESAI")) {
                            btnLabel = "PROGRES SELESAI";
                            btnClass = "bg-green-500/20 text-green-500 border-green-500/50";
                            btnDisabled = false; // ALLOW CLICK TO VIEW
                          } else if (isPlanningWp) {
                            btnLabel = "MULAI PROGRES";
                            btnDisabled = false;
                            btnClass = "bg-primary text-black border-primary hover:bg-primary/90";
                          } else {
                            btnLabel = "LANJUTKAN PROGRES";
                            btnDisabled = false;
                            btnClass = "bg-amber-500 text-black border-amber-500 hover:bg-amber-500/90 tracking-widest";
                          }
                        }
                      } else {
                        btnLabel = "LIHAT PROGRES";
                        btnClass = "bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30";
                        btnDisabled = false;
                      }

                      return (
                        <button
                          disabled={btnDisabled || savingTracking}
                          onClick={async () => {
                            const noWo = selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"];
                            if (btnLabel === "PROGRES SELESAI" || btnLabel === "LIHAT PROGRES") {
                              loadTracking(noWo);
                            } else if (btnLabel === "MULAI PROGRES") {
                              setSavingTracking(true);
                              try {
                                const payload = { noWo, stepName: "START", stepValue: "Menuju Lokasi", keterangan: "" };
                                await gasService.post("updateTracking", payload);
                              } catch (error) {
                                console.error("Failed to start progres", error);
                              } finally {
                                gasService.clearCache("getTracking");
                                setSavingTracking(false);
                                loadTracking(noWo);
                              }
                            } else {
                              loadTracking(noWo);
                            }
                          }}
                          className={"px-4 py-2 font-bold text-[10px] uppercase tracking-widest rounded-lg transition-colors border flex items-center justify-center " + btnClass + (savingTracking ? " opacity-50 cursor-wait" : "")}
                        >
                          {savingTracking ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
                          {btnLabel}
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => setIsTrackingMode(false)}
                      className={`px-4 py-2 font-bold text-[10px] uppercase tracking-widest rounded-lg transition-colors border ${
                        !isTrackingMode ? "bg-white text-black border-white" : "bg-black/40 text-gray-400 border-white/10 hover:text-white"
                      }`}
                    >
                      <Eye className="w-4 h-4 mr-2 inline-block" />
                      Detail
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {isTrackingMode ? (
                    // START OF TRACKING VIEW
                    <div className="p-4 sm:p-6 space-y-6">
                      <div className="flex flex-col gap-6">
                        
{/* SWA Top Button */}
{isAllowedToUpdate && (
  <div className="flex justify-end -mb-2">
    <button
      onClick={() => setShowSWAModal(true)}
      className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
    >
      <ShieldCheck className="w-4 h-4" />
      {trackingData?.["SWA"] ? "Ubah SWA" : "Laporkan SWA"}
    </button>
  </div>
)}

{/* Progress Stepper */}

                        <div className="flex items-center justify-between relative before:absolute before:top-1/2 before:-translate-y-1/2 before:left-0 before:right-0 before:h-0.5 before:bg-white/5">
                          {TRACKING_STEPS.map((step, idx) => {
                            const isPast = idx < activeTrackingStepIndex;
                            const isActive = idx === activeTrackingStepIndex;
                            return (
                              <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                                    isPast ? "bg-primary border-primary text-black" : isActive ? "bg-[#1a252b] border-primary text-primary" : "bg-[#1a252b] border-white/10 text-gray-500"
                                  }`}
                                >
                                  {isPast ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                                </div>
                                <span className={`text-[9px] font-bold tracking-widest uppercase ${isPast || isActive ? "text-white" : "text-gray-500"}`}>{step}</span>
                              </div>
                            );
                          })}
                        </div>

                        

{/* Update Status WO */}
{activeTrackingStepIndex < TRACKING_STEPS.length - 1 && (
<div className="bg-[#1a252b] border border-white/10 rounded-xl p-4 sm:p-6 text-center shadow-xl">
  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center justify-center gap-2">
    <Activity className="w-4 h-4" /> Update Status WO
  </h3>
  {(() => {
    const history = getGeneratedHistory(trackingData);
    
    let latest = null;
    const clIndex = getCurrentLinearIndex(trackingData);
    if (clIndex > 0 && clIndex < LINEAR_STATES.length) {
      const stateObj = LINEAR_STATES[clIndex];
      // try to find it in history
      latest = history.find(h => h.status.toUpperCase() === stateObj.label.toUpperCase() || h.status.toUpperCase() === stateObj.value.toUpperCase());
    }
    if (!latest && history.length > 0) {
      latest = history[history.length - 1];
    }

    return (
      <div className="flex flex-col items-center gap-4">
        {latest ? (
          <div className="flex flex-col items-center gap-2 mb-2 p-4 bg-black/20 rounded-lg border border-white/5 w-full max-w-sm">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Status Terakhir:</span>
            <span className="text-sm font-bold text-white uppercase tracking-widest">{latest.status}</span>
            {latest.foto && (
              <img loading="lazy" src={latest.foto} className="w-16 h-16 object-cover rounded mt-2 border border-white/10" referrerPolicy="no-referrer" />
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic mb-4">Belum ada status terbaru</p>
        )}
        
        {isAllowedToUpdate && (
          <button
            onClick={() => setShowUpdateStatusModal(true)}
            className="w-full max-w-sm px-4 py-3 bg-primary text-black rounded-lg font-bold text-xs uppercase tracking-widest transition-colors hover:bg-primary/90 shadow-[0_0_15px_rgba(45,212,191,0.2)]"
          >
            Update Status
          </button>
        )}
        
        {latest?.status?.toUpperCase() === "PEKERJAAN DILAKSANAKAN" && isAllowedToUpdate && (
          <div className="flex flex-col gap-4 mt-6 w-full max-w-sm bg-black/20 p-4 rounded-xl border border-white/5">
            <h4 className="text-[10px] uppercase font-bold text-primary tracking-widest border-b border-white/10 pb-2 flex items-center justify-center gap-2">
              <Camera className="w-3 h-3" /> Upload Eviden Pelaksanaan
            </h4>
            
            {/* Foto Sebelum */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                Foto Sebelum
              </label>
              <label className="h-16 border-2 border-dashed border-white/10 rounded-lg p-2 flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-colors cursor-pointer relative overflow-hidden group">
                {stepInputFotoSebelum?.base64 ? (
                  <>
                    <img loading="lazy" src={stepInputFotoSebelum.base64} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-4 h-4 text-white mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Ganti Foto</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-gray-500 mb-1" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pilih Foto</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const base64 = await convertFileToBase64(file);
                      setStepInputFotoSebelum({ base64, mime: file.type, name: file.name });
                    }
                  }}
                />
              </label>
            </div>

            {/* Foto Proses 1 */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                Foto Proses 1
              </label>
              <label className="h-16 border-2 border-dashed border-white/10 rounded-lg p-2 flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-colors cursor-pointer relative overflow-hidden group">
                {stepInputFotoProses1?.base64 ? (
                  <>
                    <img loading="lazy" src={stepInputFotoProses1.base64} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-4 h-4 text-white mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Ganti Foto</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-gray-500 mb-1" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pilih Foto</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const base64 = await convertFileToBase64(file);
                      setStepInputFotoProses1({ base64, mime: file.type, name: file.name });
                    }
                  }}
                />
              </label>
            </div>

            {/* Foto Proses 2 */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                Foto Proses 2
              </label>
              <label className="h-16 border-2 border-dashed border-white/10 rounded-lg p-2 flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-colors cursor-pointer relative overflow-hidden group">
                {stepInputFotoProses2?.base64 ? (
                  <>
                    <img loading="lazy" src={stepInputFotoProses2.base64} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-4 h-4 text-white mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Ganti Foto</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-gray-500 mb-1" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pilih Foto</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const base64 = await convertFileToBase64(file);
                      setStepInputFotoProses2({ base64, mime: file.type, name: file.name });
                    }
                  }}
                />
              </label>
            </div>
            
            <button
              onClick={async () => {
                if (!stepInputFotoSebelum && !stepInputFotoProses1 && !stepInputFotoProses2) {
                   alert("Pilih minimal satu foto untuk diupload!");
                   return;
                }
                setSavingTracking(true);
                const payload = {
                  noWo: selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"],
                  fotoSebelumBase64: stepInputFotoSebelum?.base64,
                  fotoSebelumMime: stepInputFotoSebelum?.mime,
                  fotoProses1Base64: stepInputFotoProses1?.base64,
                  fotoProses1Mime: stepInputFotoProses1?.mime,
                  fotoProses2Base64: stepInputFotoProses2?.base64,
                  fotoProses2Mime: stepInputFotoProses2?.mime,
                };
                
                const res = await gasService.post("uploadEvidenPelaksanaan", payload);
                if (res.success) {
                  alert("Eviden berhasil disimpan!");
                  setStepInputFotoSebelum(null);
                  setStepInputFotoProses1(null);
                  setStepInputFotoProses2(null);
                  // refresh tracking
                  fetchWorkPlans();
                } else {
                  alert("Gagal menyimpan eviden: " + (res.message || res.error || JSON.stringify(res) || "Unknown error"));
                }
                setSavingTracking(false);
              }}
              disabled={savingTracking}
              className="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest transition-colors hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.2)] disabled:opacity-50"
            >
              {savingTracking ? "Menyimpan..." : "Simpan Eviden"}
            </button>
          </div>
        )}
      </div>
    );
  })()}
</div>
)}

{/* History */}

<div className="bg-[#1a252b] border border-white/10 rounded-xl p-4 sm:p-6">
  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
    <Activity className="w-4 h-4" /> Riwayat Progres
  </h3>
  {(() => {
    const history = getGeneratedHistory(trackingData);
    if (history.length > 0) {
      return (
        <div className="space-y-4">
                    {history.map((h: any, i: number) => {
            let IconCmp = Clock;
            let iconColorCls = "text-gray-500 bg-white/5 border border-white/10";
            let lineCls = "bg-white/5";
            let textColorCls = "text-gray-400";
            
            if (h.state === "completed") {
              IconCmp = CheckCircle2;
              iconColorCls = "text-green-500 bg-green-500/10 border border-green-500/20";
              lineCls = "bg-green-500/20";
              textColorCls = "text-gray-200";
            } else if (h.state === "active") {
              IconCmp = Zap;
              iconColorCls = "text-orange-500 bg-orange-500/10 border border-orange-500/20";
              lineCls = "bg-orange-500/20";
              textColorCls = "text-white font-extrabold";
            } else if (h.state === "swa_active") {
              IconCmp = TriangleAlert;
              iconColorCls = "text-red-500 bg-red-500/10 border border-red-500/20";
              lineCls = "bg-red-500/20";
              textColorCls = "text-red-400 font-extrabold";
            } else if (h.state === "swa_cleared") {
              IconCmp = TriangleAlert;
              iconColorCls = "text-green-400 bg-green-400/10 border border-green-400/20";
              lineCls = "bg-green-400/20";
              textColorCls = "text-green-400 font-extrabold";
            }
            
            return (
            <div key={i} className="flex gap-4 p-3 bg-black/20 rounded-lg border border-white/5 relative">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColorCls}`}>
                  <IconCmp className="w-4 h-4" />
                </div>
                {i < history.length - 1 && <div className={`w-0.5 h-full absolute top-11 bottom-[-1rem] left-7 ${lineCls}`} />}
              </div>
              <div className="flex flex-col w-full">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className={`text-xs uppercase tracking-widest ${textColorCls}`}>{h.status}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{formatDateTime(h.tanggal)}</span>
                </div>
                <span className="text-[10px] text-gray-400 mb-2">{h.aktor}</span>
                {h.keterangan && <p className="text-xs text-gray-300 bg-black/40 p-2 rounded">{h.keterangan}</p>}
                {(h.foto || h.foto1 || h.foto2) && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {[h.foto, h.foto1, h.foto2].filter(Boolean).map((url: string, idx) => (
                      <img loading="lazy"
                        key={idx}
                        onClick={() => setZoomedImage(url)}
                        src={url}
                        alt="Bukti Progres"
                        className="h-16 w-16 object-cover rounded border border-white/10 cursor-pointer hover:opacity-80"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )})}
        </div>
      );
    } else {
      return <p className="text-xs text-gray-500 italic">Belum ada riwayat progres</p>;
    }
  })()}
</div>


                        {/* EVALUASI */}
                        {activeTrackingStepIndex === TRACKING_STEPS.length - 1 && renderEvaluasi()}
                      </div>
                    </div>
                    // END OF TRACKING VIEW
                  ) : (
                    // START OF DETAIL VIEW
                    <div className="p-4 sm:p-6 space-y-8">
                      {/* INFORMASI UMUM */}
                      <section>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-white/10 pb-2 mb-4">Informasi Umum</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                          {Object.keys(selectedPlanDetail).sort((a, b) => {
                            const priority = ["FOTO TEMUAN", "SOP PEKERJAAN", "INSTRUKSI KERJA", "DETAIL PEKERJAAN"];
                            const aUpper = a.toUpperCase().trim();
                            const bUpper = b.toUpperCase().trim();
                            const aIndex = priority.indexOf(aUpper);
                            const bIndex = priority.indexOf(bUpper);
                            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                            if (aIndex !== -1) return -1;
                            if (bIndex !== -1) return 1;
                            return 0;
                          }).map((key, i) => {
                            const excludes = ["NO. WO", "NO WO", "FOTO GDRIVE", "WP", "IBPPR", "JSA", "SP2B", "SP3B", "TAILGATE SESSION", "STATUS BERKAS", "PROGRES"];
                            if (excludes.includes(key.toUpperCase().trim())) return null;

                            const rawVal = selectedPlanDetail[key];
                            if (!key || key.startsWith("_") || rawVal === undefined || rawVal === null || rawVal === "") return null;
                            const val = String(rawVal);

                            const isImage = typeof rawVal === "string" && rawVal.startsWith("http") && (rawVal.includes("lh3.googleusercontent.com") || rawVal.includes("drive.google.com") || rawVal.includes("png") || rawVal.includes("jpg") || rawVal.includes("jpeg"));

                            return (
                              <div key={i} className={cn("flex flex-col", ["FOTO TEMUAN", "SOP PEKERJAAN", "INSTRUKSI KERJA", "DETAIL PEKERJAAN", "KETERANGAN"].includes(key.toUpperCase().trim()) ? "md:col-span-2" : "")}>
                                <span className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-widest border-b border-white/5 pb-1">{key}</span>
                                {isImage ? (
                                  <div onClick={() => setZoomedImage(rawVal)} className="mt-2 block hover:opacity-80 transition-opacity cursor-pointer group">
                                    <img loading="lazy" src={rawVal} alt={key} className="w-full h-40 object-cover rounded-lg border border-white/10 transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                                  </div>
                                ) : key.toUpperCase().trim() === "TITIK KOORDINAT" ? (
                                  <a href={`https://maps.google.com/?q=${encodeURIComponent(val)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary mt-1 whitespace-pre-wrap hover:underline inline-flex items-center gap-1">
                                    {val} ↗
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-200 mt-1 whitespace-pre-wrap">{key.toUpperCase().includes("TANGGAL") || key.toUpperCase() === "TGL" || key.toUpperCase().includes("DATE") ? formatDate(val) : val}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>

                      {/* DOKUMEN & PEMBERKASAN */}
                      <section>
                        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Dokumen & Pemberkasan</h3>
                          <span className="text-[11px] text-gray-400 font-medium">
                            Klik komponen kartu untuk membuka formulir ekspor
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {["WP", "IBPPR", "JSA", "SP2B", "SP3B", "TAILGATE SESSION", "STATUS BERKAS", "PROGRES"].map((key, i) => {
                            const rawVal = selectedPlanDetail[key] ?? selectedPlanDetail[key.toLowerCase()];
                            if (rawVal === undefined || rawVal === null) {
                              if (key !== "SP2B" && key !== "SP3B") return null;
                            }
                            const val = String(rawVal || "SIAP CETAK");

                            const isWoSimpdkb = key === "SP2B";
                            const isSpSimpdkb = key === "SP3B";
                            const displayLabel = isWoSimpdkb ? "WO SIMPDKB" : isSpSimpdkb ? "SP2B & SP3B SIMPDKB" : key;

                            const handleClick = () => {
                              if (isWoSimpdkb) {
                                setShowExportWoModal(true);
                              } else if (isSpSimpdkb || key === "WP") {
                                setShowExportSpModal(true);
                              }
                            };

                            return (
                              <div
                                key={i}
                                onClick={handleClick}
                                className={cn(
                                  "bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col justify-between transition-all group",
                                  isWoSimpdkb
                                    ? "cursor-pointer hover:border-primary/50 hover:bg-primary/10 shadow-sm"
                                    : isSpSimpdkb
                                    ? "cursor-pointer hover:border-tertiary/50 hover:bg-tertiary/10 shadow-sm"
                                    : key === "WP"
                                    ? "cursor-pointer hover:border-white/20 hover:bg-white/5"
                                    : ""
                                )}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className={cn(
                                      "text-[10px] uppercase font-bold tracking-widest",
                                      isWoSimpdkb
                                        ? "text-primary group-hover:text-primary-light"
                                        : isSpSimpdkb
                                        ? "text-tertiary group-hover:text-tertiary-light"
                                        : "text-gray-500"
                                    )}
                                  >
                                    {displayLabel}
                                  </span>
                                  {isWoSimpdkb && (
                                    <span className="flex items-center gap-1 text-[9px] text-primary uppercase font-bold tracking-widest bg-primary/15 px-2 py-0.5 rounded border border-primary/30 group-hover:bg-primary group-hover:text-black transition-colors">
                                      <FileText className="w-3 h-3" />
                                      <span>Export WO</span>
                                    </span>
                                  )}
                                  {isSpSimpdkb && (
                                    <span className="flex items-center gap-1 text-[9px] text-tertiary uppercase font-bold tracking-widest bg-tertiary/15 px-2 py-0.5 rounded border border-tertiary/30 group-hover:bg-tertiary group-hover:text-black transition-colors">
                                      <FileText className="w-3 h-3" />
                                      <span>Export SP</span>
                                    </span>
                                  )}
                                  {key === "WP" && (
                                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                                      Dokumen
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={cn(
                                    "text-xs font-bold leading-tight uppercase",
                                    key === "STATUS BERKAS" && val.toLowerCase().includes("dokumen lengkap")
                                      ? "text-green-400"
                                      : key === "STATUS BERKAS" && (val.toLowerCase().includes("approval dokumen") || val.toLowerCase().includes("pemberkasan"))
                                      ? "text-yellow-400"
                                      : key === "STATUS BERKAS" && val.toLowerCase().includes("pembuatan dokumen")
                                      ? "text-red-400"
                                      : key === "PROGRES" && val.toLowerCase().includes("selesai")
                                      ? "text-green-400"
                                      : key === "PROGRES" && val.toLowerCase().includes("cancel")
                                      ? "text-red-400"
                                      : key === "PROGRES" && (val.toLowerCase().includes("pending") || val.toLowerCase().includes("proses eksekusi") || val.toLowerCase().includes("pembuatan dokumen"))
                                      ? "text-yellow-400"
                                      : isWoSimpdkb
                                      ? "text-primary group-hover:text-white"
                                      : isSpSimpdkb
                                      ? "text-tertiary group-hover:text-white"
                                      : "text-white"
                                  )}
                                >
                                  {val}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    </div>
                    // END OF DETAIL VIEW
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 relative z-10 bg-[#0d161a] rounded-xl">
                <LayoutDashboard className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest text-center">Pilih Work Plan untuk melihat detail</p>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Berkas Action Modal */}
      {berkasActionModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-[#0d161a] border border-white/10 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4 text-center">
              Aksi Berkas {berkasActionModal.key}
            </h3>
            <p className="text-xs text-gray-400 text-center mb-6">
              Silakan pilih aksi selanjutnya untuk dokumen ini.
            </p>
            <div className="flex flex-col gap-3">
              <button
                disabled={updatingBerkas}
                onClick={() => handleUpdateBerkasAction("PENDING")}
                className="w-full py-3 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-amber-500/30 transition-colors disabled:opacity-50"
              >
                Pending
              </button>
              <button
                disabled={updatingBerkas}
                onClick={() => handleUpdateBerkasAction("CETAK")}
                className="w-full py-3 bg-blue-500/20 text-blue-500 border border-blue-500/30 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                Cetak
              </button>
              <button
                disabled={updatingBerkas}
                onClick={() => handleUpdateBerkasAction("APPROVAL")}
                className="w-full py-3 bg-green-500/20 text-green-500 border border-green-500/30 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-green-500/30 transition-colors disabled:opacity-50"
              >
                Approval
              </button>
              <button
                disabled={updatingBerkas}
                onClick={() => setBerkasActionModal(null)}
                className="w-full py-3 mt-2 bg-transparent text-gray-500 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Option Modal */}
      {activeStepInput && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-[#0d161a] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">
              Update {activeStepInput}
            </h3>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 bg-black/20 p-3 rounded-lg border border-white/5">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest text-center">
                  Status Terpilih
                </label>
                <div className="text-sm font-bold text-primary uppercase tracking-widest text-center">
                  {stepInputValue}
                </div>
              </div>

              {needsKeterangan && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                    Keterangan (Opsional)
                  </label>
                  <textarea
                    value={stepInputKeterangan}
                    onChange={(e) => setStepInputKeterangan(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded p-3 text-xs text-white outline-none focus:border-primary w-full transition-all min-h-[60px]"
                    placeholder="Masukkan keterangan..."
                  />
                </div>
              )}

              {needsFoto && !needsMultipleFotos && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                    Foto Eviden (Opsional)
                  </label>
                  <label className="h-32 border-2 border-dashed border-white/10 rounded-lg p-3 flex flex-col items-center justify-center bg-[#1a252b]/50 hover:bg-[#1a252b] transition-colors cursor-pointer relative overflow-hidden group">
                    {stepInputFoto?.base64 ? (
                      <>
                        <img loading="lazy"
                          src={stepInputFoto.base64}
                          alt="Preview"
                          className="absolute inset-0 w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-xs text-white uppercase font-bold tracking-widest">
                            Ganti Foto
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="text-xs text-gray-400 text-center px-4">
                          Klik untuk upload foto atau ambil gambar
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFotoChange(e, "default")}
                      className="hidden"
                    />
                  </label>
                  {stepInputFoto && (
                    <div className="flex items-center justify-between px-1 mt-1">
                      <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Foto siap diunggah
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStepInputFoto(null);
                        }}
                        className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  disabled={savingTracking}
                  onClick={closeStepModal}
                  className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  disabled={
                    savingTracking ||
                    !stepInputValue
                  }
                  onClick={() => saveTracking(activeStepInput, stepInputValue)}
                  className="px-4 py-2 bg-primary text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingTracking ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      
{/* Update Status Modal */}
{showUpdateStatusModal && (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
    <div className="bg-[#0d161a] border border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
      <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2 shrink-0">
        <Activity className="w-5 h-5" />
        Pilih Status Pekerjaan
      </h3>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
        {(() => {
          if (activeTrackingStepIndex >= TRACKING_STEPS.length - 1) {
             return <p className="text-xs text-gray-500 italic">Tahapan eksekusi telah selesai. Silakan lakukan Evaluasi.</p>;
          }
          
          const step = TRACKING_STEPS[activeTrackingStepIndex];
          const options = (trackingOptions[step] || []).filter((opt: string) => opt.toUpperCase() !== "WAITING");
          
          if (options.length === 0) return <p className="text-xs text-gray-500 italic">Tidak ada opsi status tersedia untuk tahap {step}.</p>;

          return (
            <div key={step} className="space-y-2">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">Tahap: {step}</h4>
              <div className="grid grid-cols-2 gap-2">
                {options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => {
                      setShowUpdateStatusModal(false);
                      const req = getTrackingInputRequirements(step, opt);
                      if (req.needsFoto || req.needsMultipleFotos || req.needsKeterangan) {
                        openStepModal(step, opt);
                      } else {
                        saveTrackingDirectly(step, opt);
                      }
                    }}
                    className="px-3 py-3 bg-black/40 border border-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest text-center transition-colors hover:border-primary/50 hover:bg-primary/10 shadow-sm"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5 shrink-0">
        <button
          onClick={() => setShowUpdateStatusModal(false)}
          className="px-4 py-2 border border-white/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
)}

{/* SWA Modal */}

      {showSWAModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0d161a] border border-red-500/50 rounded-xl max-w-md w-full p-6 shadow-[0_0_20px_rgba(239,68,68,0.2)] flex flex-col max-h-[90vh]">
            <h3 className="text-sm font-bold uppercase tracking-widest text-red-500 mb-6 flex items-center gap-2 shrink-0">
              <TriangleAlert className="w-5 h-5" />
              SWA - Stop Work Authority
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
            {trackingData?.SWA && trackingData.SWA.toUpperCase() !== "DIBATALKAN" && trackingData?.["STATUS SWA"] !== "PEKERJAAN DILANJUTKAN" && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="text-xs uppercase font-bold tracking-widest text-red-500 mb-2">Status SWA Aktif:</div>
                <div className="text-sm font-bold text-white mb-4">{trackingData.SWA}</div>
                <button
                  disabled={savingSWA}
                  onClick={async () => {
                    setConfirmDialog({
                      message: "Apakah Anda yakin ingin menghapus status SWA dan melanjutkan pekerjaan?",
                      onConfirm: async () => {
                        setConfirmDialog(null);
                        setSavingSWA(true);
                        const res = await gasService.post("clearSWA", { noWo: selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"] });
                        if (res.success) {
                          gasService.clearCache("getTracking");
                          setShowSWAModal(false);
                          loadTracking(selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"]);
                        } else {
                          alert("Gagal menghapus SWA: " + (res.message || res.error || JSON.stringify(res)));
                        }
                        setSavingSWA(false);
                      }
                    });
                  }}
                  className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  {savingSWA ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Hapus Status SWA
                </button>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold tracking-widest text-gray-400 mb-2">Opsi SWA <span className="text-red-500">*</span></label>
                <div className="flex flex-col gap-2">
                  {(trackingOptions["SWA"] || []).map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => setSwaOption(opt)}
                      className={cn(
                        "px-3 py-2 border rounded-lg text-xs font-bold uppercase tracking-widest transition-colors text-left text-[10px]",
                        swaOption === opt ? "bg-red-500/20 border-red-500 text-red-500" : "bg-black/40 border-white/10 text-gray-400 hover:border-red-500/30 hover:text-red-400"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-widest text-gray-400 mb-2">Foto Eviden <span className="text-red-500">*</span></label>
                <label className="h-24 border-2 border-dashed border-white/10 rounded-lg p-2 flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-colors cursor-pointer relative overflow-hidden group">
                  {swaFoto?.base64 ? (
                    <>
                      <img loading="lazy" src={swaFoto.base64} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                        <span className="text-[9px] text-white font-bold tracking-widest">GANTI FOTO</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-gray-600 mb-2" />
                      <span className="text-[9px] text-gray-500 text-center uppercase tracking-widest">Upload Foto</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const dataUrl = await convertFileToBase64(file);
                          const [meta, base64] = dataUrl.split(',');
                          const mime = meta.match(/:(.*?);/)?.[1] || file.type || 'image/jpeg';
                          setSwaFoto({
                            file,
                            base64,
                            mime,
                            name: file.name
                          });
                        } catch (err) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSwaFoto({
                              file,
                              base64: reader.result?.toString().split(',')[1] || '',
                              mime: file.type,
                              name: file.name
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }} 
                    className="hidden" 
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-widest text-gray-400 mb-2">Keterangan <span className="text-red-500">*</span></label>
                <textarea
                  value={swaKeterangan}
                  onChange={(e) => setSwaKeterangan(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500/50 min-h-[80px]"
                  placeholder="Detail SWA..."
                />
              </div>
            </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5 shrink-0">
              <button
                onClick={() => setShowSWAModal(false)}
                className="px-4 py-2 border border-white/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
              <button
                disabled={savingSWA || !swaOption || !swaKeterangan || !swaFoto?.base64}
                onClick={async () => {
                  setSavingSWA(true);
                  const payload = {
                    noWo: selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"],
                    swaOption,
                    keterangan: swaKeterangan,
                    fotoBase64: swaFoto.base64,
                    fotoMime: swaFoto.mime,
                    fotoName: swaFoto.name,
                  };
                  const res = await gasService.post("submitSWA", payload);
                  if (res.success) {
                    gasService.clearCache("getTracking");
                    setShowSWAModal(false);
                    setSwaOption("");
                    setSwaKeterangan("");
                    setSwaFoto(null);
                    loadTracking(selectedPlanDetail["NO. WO"] || selectedPlanDetail["NO WO"]);
                  } else {
                    alert("Gagal: " + (res.message || res.error || JSON.stringify(res)));
                  }
                  setSavingSWA(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingSWA ? "Menyimpan..." : "Submit SWA"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Loading Overlay for Detail */}
      {loadingDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-xs uppercase font-bold tracking-widest text-primary">
            Memuat Detail Plan...
          </p>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0d161a] border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">Konfirmasi</h3>
            <p className="text-xs text-gray-400 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 border border-white/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors text-white"
              >
                Batal
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-primary text-black rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      <ImageZoomModal
        imageUrl={zoomedImage}
        onClose={() => setZoomedImage(null)}
      />

      {/* Export SP2B & SP3B Modal */}
      {selectedPlanDetail && (
        <ExportSp2bSp3bModal
          isOpen={showExportSpModal}
          onClose={() => setShowExportSpModal(false)}
          workPlan={selectedPlanDetail}
          reviewWoDetail={currentReviewDetail}
        />
      )}

      {/* Export Work Order Modal */}
      {selectedPlanDetail && (
        <ExportWorkOrderModal
          isOpen={showExportWoModal}
          onClose={() => setShowExportWoModal(false)}
          workOrder={{
            ...selectedPlanDetail,
            noWo: selectedPlanDetail.no_wo || selectedPlanDetail.noWo || selectedPlanDetail.id,
            id: selectedPlanDetail.id || selectedPlanDetail.no_wo || selectedPlanDetail.noWo,
            ulp: selectedPlanDetail.ulp,
            alamat: selectedPlanDetail.alamat,
            garduInduk: selectedPlanDetail.gardu_induk || selectedPlanDetail.garduInduk,
            penyulang: selectedPlanDetail.penyulang,
            jenisTiang: selectedPlanDetail.jenis_tiang || selectedPlanDetail.jenisTiang,
            ukuranTiang: selectedPlanDetail.ukuran_tiang || selectedPlanDetail.ukuranTiang,
            jenisKonduktor: selectedPlanDetail.jenis_konduktor || selectedPlanDetail.jenisKonduktor,
            ukuranKonduktor: selectedPlanDetail.ukuran_konduktor || selectedPlanDetail.ukuranKonduktor,
            instruksi_kerja: selectedPlanDetail.instruksi_kerja || selectedPlanDetail.pekerjaan || selectedPlanDetail.detail_pekerjaan,
            temuan: selectedPlanDetail.temuan || selectedPlanDetail.detail_pekerjaan,
            foto: selectedPlanDetail.foto_temuan || selectedPlanDetail.foto,
            foto_temuan: selectedPlanDetail.foto_temuan || selectedPlanDetail.foto,
            koordinat: selectedPlanDetail.titik_koordinat || selectedPlanDetail.koordinat,
            titik_koordinat: selectedPlanDetail.titik_koordinat || selectedPlanDetail.koordinat,
            noTiang: selectedPlanDetail.keypoint || selectedPlanDetail.noTiang || selectedPlanDetail.no_tiang || '',
            tanggal: selectedPlanDetail.tanggal_direncanakan || selectedPlanDetail.tanggal
          }}
        />
      )}
    </div>
  );
}
