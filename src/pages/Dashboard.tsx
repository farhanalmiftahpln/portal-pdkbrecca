import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { gasService } from "../services/gasService";
import { formatDate } from "../lib/utils";
import {
  LogIn, Filter, Activity, Zap, DollarSign,
  AlertTriangle, Lightbulb, RefreshCw, CheckCircle2,
  Users, Sun, Moon, Truck, Wrench, Shield, X, Calendar, ChevronDown, ChevronUp, Minimize2, Maximize2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart, Line
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const CARTO_API_KEY = "cb1_3pk7_2_e3a95b1d690c01f43736ae3c";

// Auto-focus helper to automatically focus map view prioritizing PROSES EKSEKUSI > PLANNING > SELESAI
function MapAutoFocus({ points }: { points: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0 || !map) return;

    // Filter valid coordinates
    const validPoints = points.filter(
      p => typeof p.lat === 'number' && !isNaN(p.lat) && typeof p.lng === 'number' && !isNaN(p.lng)
    );
    if (validPoints.length === 0) return;

    // Priority 1: PROSES EKSEKUSI
    const prosesPoints = validPoints.filter(p => {
      const s = String(p.status || '').toUpperCase();
      return s.includes('PROSES') || s.includes('EKSEKUSI');
    });

    // Priority 2: PLANNING
    const planningPoints = validPoints.filter(p => {
      const s = String(p.status || '').toUpperCase();
      return s.includes('PLAN') || s.includes('RENCANA');
    });

    // Priority 3: SELESAI
    const selesaiPoints = validPoints.filter(p => {
      const s = String(p.status || '').toUpperCase();
      return s.includes('SELESAI') || s.includes('APPROVE') || s.includes('DONE');
    });

    // Choose target cluster by priority
    const targetPoints = prosesPoints.length > 0
      ? prosesPoints
      : (planningPoints.length > 0 ? planningPoints : (selesaiPoints.length > 0 ? selesaiPoints : validPoints));

    if (targetPoints.length === 1) {
      map.flyTo([targetPoints[0].lat, targetPoints[0].lng], 14, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    } else if (targetPoints.length > 1) {
      const bounds = L.latLngBounds(targetPoints.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, {
        padding: [35, 35],
        maxZoom: 14,
        animate: true,
        duration: 1.2
      });
    }
  }, [points, map]);

  return null;
}

// Map markers setup
const getStatusColor = (status: string) => {
  const s = String(status || '').toUpperCase().trim();
  if (s === "PLANNING" || s === "RENCANA") return "#f97316"; // orange
  if (s === "PROSES EKSEKUSI" || s.includes("EKSEKUSI")) return "#eab308"; // yellow
  if (s === "SELESAI" || s === "APPROVE") return "#22c55e"; // green
  if (s === "PENDING" || s.includes("PENDING") || s.includes("TUNDA") || s === "CANCEL" || s.includes("CANCEL") || s.includes("BATAL") || s === "SWA") {
    return "#ef4444"; // red
  }
  return "#0d8291";
};

const createCustomIcon = (status: string) => {
  const stUpper = String(status || '').toUpperCase().trim();
  let color = "#9ca3af"; // default gray
  let pulseClass = "";
  
  if (stUpper === "PLANNING" || stUpper === "RENCANA") color = "#f97316"; // orange
  if (stUpper === "PROSES EKSEKUSI" || stUpper.includes("EKSEKUSI")) {
    color = "#eab308"; // yellow
    pulseClass = "marker-pulse";
  }
  if (stUpper === "SWA") color = "#ef4444"; // red
  if (stUpper === "SELESAI" || stUpper === "APPROVE") color = "#22c55e"; // green
  if (stUpper === "PENDING" || stUpper.includes("PENDING") || stUpper.includes("TUNDA")) {
    color = "#ef4444"; // red
  }
  if (stUpper === "CANCEL" || stUpper.includes("CANCEL") || stUpper.includes("BATAL")) {
    color = "#ef4444"; // red
  }

  return L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div class="relative w-4 h-4">
             ${pulseClass ? `<div class="absolute inset-0 rounded-full opacity-75 animate-ping" style="background-color: ${color}"></div>` : ''}
             <div class="relative w-4 h-4 rounded-full border-2 border-white shadow-md" style="background-color: ${color}"></div>
           </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
  if (!value) return null; // hide 0 or empty labels
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {value}
    </text>
  );
};

// Robust date parsing helper for Indonesian spreadsheets (WITA GMT+8)
export const parseLocalDate = (tglRaw: any) => {
  if (!tglRaw) return null;
  if (typeof tglRaw === 'string') {
    const trimmed = tglRaw.trim();
    if (!trimmed) return null;

    if (trimmed.includes('T')) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const hasTimezone = trimmed.endsWith('Z') || /[+-]\d{2}(:?\d{2})?$/.test(trimmed);
        if (hasTimezone) {
          const witaDate = new Date(d.getTime() + 8 * 3600 * 1000);
          const yyyy = witaDate.getUTCFullYear();
          const mm = String(witaDate.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(witaDate.getUTCDate()).padStart(2, '0');
          return { year: yyyy, month: witaDate.getUTCMonth() + 1, day: witaDate.getUTCDate(), ymd: `${yyyy}-${mm}-${dd}` };
        } else {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return { year: yyyy, month: d.getMonth() + 1, day: d.getDate(), ymd: `${yyyy}-${mm}-${dd}` };
        }
      }
    } else if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        let y = 0, m = 0, d = 0;
        if (parts[0].trim().length === 4) {
          y = parseInt(parts[0].trim(), 10);
          m = parseInt(parts[1].trim(), 10);
          d = parseInt(parts[2].trim(), 10);
        } else {
          d = parseInt(parts[0].trim(), 10);
          m = parseInt(parts[1].trim(), 10);
          y = parseInt(parts[2].trim(), 10);
          if (y < 100) y += 2000;
          if (m > 12 && d <= 12) { const tmp = d; d = m; m = tmp; }
        }
        const mm = String(m).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return { year: y, month: m, day: d, ymd: `${y}-${mm}-${dd}` };
      }
    } else if (trimmed.includes('-')) {
      const datePart = trimmed.split(' ')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
        let y = 0, m = 0, d = 0;
        if (parts[0].trim().length === 4) {
          y = parseInt(parts[0].trim(), 10);
          m = parseInt(parts[1].trim(), 10);
          d = parseInt(parts[2].trim(), 10);
        } else {
          d = parseInt(parts[0].trim(), 10);
          m = parseInt(parts[1].trim(), 10);
          y = parseInt(parts[2].trim(), 10);
          if (y < 100) y += 2000;
          if (m > 12 && d <= 12) { const tmp = d; d = m; m = tmp; }
        }
        const mm = String(m).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return { year: y, month: m, day: d, ymd: `${y}-${mm}-${dd}` };
      }
    }
  } else if (tglRaw instanceof Date) {
    const yyyy = tglRaw.getFullYear();
    const mm = String(tglRaw.getMonth() + 1).padStart(2, '0');
    const dd = String(tglRaw.getDate()).padStart(2, '0');
    return { year: yyyy, month: tglRaw.getMonth() + 1, day: tglRaw.getDate(), ymd: `${yyyy}-${mm}-${dd}` };
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('portal_theme');
    return saved ? saved === 'dark' : true;
  });

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('portal_theme', next ? 'dark' : 'light');
      return next;
    });
  };
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = (now.getMonth() + 1).toString();
  
  // Date helpers for Rencana Kerja - Synchronized with WITA (UTC+8) UP3 Watampone
  const getTodayString = () => {
    const now = new Date();
    const witaNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 3600000));
    const y = witaNow.getFullYear();
    const m = String(witaNow.getMonth() + 1).padStart(2, '0');
    const d = String(witaNow.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1];
      const d = parts[2];
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  };

  const todayStr = useMemo(() => getTodayString(), []);
  // Default to today's date for Rencana Kerja & List Work Plan (independent of FILTER DATA)
  const [rencanaTanggal, setRencanaTanggal] = useState<string>(todayStr);
  const isToday = rencanaTanggal === todayStr;
  const [isPenyulangMinimized, setIsPenyulangMinimized] = useState<boolean>(false);

  // Work plans loaded directly from sheet WORK PLAN in spreadsheet WORK_PLAN
  const [workPlans, setWorkPlans] = useState<any[]>(() => {
    try {
      const cached = gasService.getCached("getWorkPlans");
      return (cached && cached.data) ? cached.data : (Array.isArray(cached) ? cached : []);
    } catch (e) {
      return [];
    }
  });

  // Work orders loaded directly from sheet WorkOrders in spreadsheet WORK_ORDER
  const [workOrders, setWorkOrders] = useState<any[]>(() => {
    try {
      const cached = gasService.getCached("getWorkOrders");
      return (cached && cached.data) ? cached.data : (Array.isArray(cached) ? cached : []);
    } catch (e) {
      return [];
    }
  });

  // Reviewed work orders loaded directly from sheet WorkOrders
  const [reviewedWOs, setReviewedWOs] = useState<any[]>(() => {
    try {
      const cached = gasService.getCached("getReviewedWOs");
      return (cached && cached.data) ? cached.data : (Array.isArray(cached) ? cached : []);
    } catch (e) {
      return [];
    }
  });

  const [filters, setFilters] = useState({
    tanggal: '',
    bulan: currentMonth,
    semester: '',
    tahun: currentYear,
    ulp: '',
    gi: '',
    penyulang: '',
    sop: '',
  });

  const MONTH_NAMES_UPPER: Record<string, string> = {
    "1": "JANUARI", "2": "FEBRUARI", "3": "MARET", "4": "APRIL",
    "5": "MEI", "6": "JUNI", "7": "JULI", "8": "AGUSTUS",
    "9": "SEPTEMBER", "10": "OKTOBER", "11": "NOVEMBER", "12": "DESEMBER"
  };

  const fetchDashboardData = async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const payloadFilters = {
        ...filters,
        bulan: filters.bulan ? (MONTH_NAMES_UPPER[filters.bulan] || filters.bulan) : ''
      };

      const [statsRes, wpRes, woRes, revRes] = await Promise.all([
        gasService.post("getDashboardStats", { filters: payloadFilters }),
        gasService.post("getWorkPlans"),
        gasService.post("getWorkOrders"),
        gasService.post("getReviewedWOs")
      ]);
      if (statsRes && statsRes.success) {
        setStats(statsRes.data);
      }
      if (wpRes && wpRes.success && wpRes.data) {
        setWorkPlans(wpRes.data);
      }
      if (woRes && woRes.success && woRes.data) {
        setWorkOrders(woRes.data);
      }
      if (revRes && revRes.success && revRes.data) {
        setReviewedWOs(revRes.data);
      }
      setLastRefreshed(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // Clear cache on manual refresh to force fetching the newest data from GAS
      gasService.clearCache("getDashboardStats");
      gasService.clearCache("getWorkPlans");
      gasService.clearCache("getWorkOrders");
      gasService.clearCache("getReviewedWOs");
      await fetchDashboardData(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  // Auto-refresh berkala setiap 1 Menit (60.000 ms) di background tanpa reload halaman
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      // Clear cache stats agar data terupdate secara berkala dari spreadsheet
      gasService.clearCache("getDashboardStats");
      fetchDashboardData(true).catch(e => console.error("Auto-refresh error", e));
    }, 60 * 1000);

    return () => clearInterval(autoRefreshInterval);
  }, [filters]);

  const recentWOsArray = Array.isArray(stats?.recentWOs) ? stats.recentWOs : (stats?.recentWOs?.data || []);

  // Unified list of all planned work orders (combining WORK_PLAN sheet, stats.workPlans, and reviewedWOs with scheduled date)
  const allWorkPlans = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Primary work plans from sheet WORK_PLAN or stats.workPlans
    const primaryWp = workPlans.length > 0 ? workPlans : (stats?.workPlans || []);
    primaryWp.forEach((wp: any) => {
      const noWo = String(wp['NO. WO'] || wp['noWo'] || '').trim();
      const tgl = wp['TANGGAL DIRENCANAKAN'] || wp['tanggalRencanakan'] || wp['tanggal_direncanakan'] || wp['tanggalRencana'] || wp['TANGGAL RENCANA'] || wp['tanggal'] || '';
      const key = noWo || `wp-${map.size}`;
      map.set(key, {
        ...wp,
        'NO. WO': wp['NO. WO'] || wp['noWo'] || noWo,
        'TANGGAL DIRENCANAKAN': tgl,
      });
    });

    // 2. Add from reviewedWOs if planned date exists
    reviewedWOs.forEach((rev: any) => {
      const noWo = String(rev.noWo || '').trim();
      if (noWo && rev.tanggalRencanakan) {
        if (!map.has(noWo)) {
          map.set(noWo, {
            'NO. WO': rev.noWo,
            'TANGGAL DIRENCANAKAN': rev.tanggalRencanakan,
            'ULP': rev.ulp || '-',
            'GARDU INDUK': rev.gi || '',
            'PENYULANG': rev.penyulang || '',
            'SEGMEN': rev.segmen || '',
            'TEMUAN': rev.temuan || '',
            'ALAMAT': rev.alamat || '',
            'PROGRES': rev.approvalPreparator === 'Layak' ? 'PLANNING' : (rev.approvalPreparator || 'PLANNING'),
            'DETAIL PEKERJAAN': rev.temuan || '',
            'TITIK KOORDINAT': rev.koordinat || ''
          });
        } else {
          const existing = map.get(noWo);
          if (!existing['TANGGAL DIRENCANAKAN']) {
            existing['TANGGAL DIRENCANAKAN'] = rev.tanggalRencanakan;
          }
        }
      }
    });

    return Array.from(map.values());
  }, [workPlans, stats?.workPlans, reviewedWOs]);

  // Filter WORK PLAN strictly by TANGGAL DIRENCANAKAN (independent of survey date)
  const filteredWorkPlans = useMemo(() => {
    if (!allWorkPlans || allWorkPlans.length === 0) return [];

    if (!rencanaTanggal) {
      return allWorkPlans;
    }

    return allWorkPlans.filter((wp: any) => {
      const tglRaw = wp['TANGGAL DIRENCANAKAN'] || wp['tanggalRencanakan'] || wp['tanggal_direncanakan'] || wp['tanggalRencana'] || wp['TANGGAL RENCANA'] || wp['tanggal'] || '';
      if (!tglRaw) return false;

      const parsed = parseLocalDate(tglRaw);

      if (!parsed) {
        return String(tglRaw).includes(rencanaTanggal);
      }
      return parsed.ymd === rencanaTanggal || String(tglRaw).includes(rencanaTanggal);
    });
  }, [allWorkPlans, rencanaTanggal]);

  // Map exact realisasi savings (kWh & Rp) by NO. WO if available
  const realisasiSavingsMap = useMemo(() => {
    const map: Record<string, { kwh: number; rp: number }> = {};
    if (recentWOsArray && recentWOsArray.length > 0) {
      recentWOsArray.forEach((r: any[]) => {
        const noWo = String(r[0] || '').trim();
        if (noWo) {
          map[noWo] = {
            kwh: parseFloat(r[27]) || 0,
            rp: parseFloat(r[28]) || 0,
          };
        }
      });
    }
    return map;
  }, [recentWOsArray]);

  // Calculate Rencana Kerja (Titik, Personil, Est. kWh, Est. Rp) strictly from filteredWorkPlans (independent of FILTER DATA)
  const rencanaKerjaData = useMemo(() => {
    const titikCount = filteredWorkPlans.length;

    let kwhSum = 0;
    let rpSum = 0;

    if (titikCount > 0) {
      filteredWorkPlans.forEach((wp: any) => {
        const noWo = String(wp['NO. WO'] || wp['noWo'] || '').trim();
        if (realisasiSavingsMap[noWo] && realisasiSavingsMap[noWo].kwh > 0) {
          kwhSum += realisasiSavingsMap[noWo].kwh;
          rpSum += realisasiSavingsMap[noWo].rp;
        } else {
          // Standard estimation per point in PDKB Watampone
          kwhSum += 1400;
          rpSum += 1530000;
        }
      });
    }

    const personilCount = titikCount > 0 ? (titikCount > 5 ? 16 : 8) : 0;

    // Formatting kWh
    let kwhDisplay = '0';
    if (kwhSum >= 1000000) {
      kwhDisplay = `${(kwhSum / 1000000).toFixed(2)}M`;
    } else if (kwhSum >= 1000) {
      kwhDisplay = `${(kwhSum / 1000).toFixed(1)}k`;
    } else if (kwhSum > 0) {
      kwhDisplay = kwhSum.toLocaleString('id-ID');
    }

    // Formatting Rp
    let rpDisplay = '0';
    if (rpSum >= 1000000000) {
      rpDisplay = `${(rpSum / 1000000000).toFixed(2)}Milyar`;
    } else if (rpSum >= 1000000) {
      rpDisplay = `${(rpSum / 1000000).toFixed(1)} jt`;
    } else if (rpSum >= 1000) {
      rpDisplay = `${(rpSum / 1000).toFixed(0)}k`;
    } else if (rpSum > 0) {
      rpDisplay = rpSum.toLocaleString('id-ID');
    }

    return {
      titik: titikCount,
      personil: personilCount,
      kwhText: kwhDisplay,
      rpText: rpDisplay,
    };
  }, [filteredWorkPlans, realisasiSavingsMap]);

  // Points for map plotting
  const mapPoints = useMemo(() => {
    const points: any[] = [];
    const sourceWps = filteredWorkPlans.length > 0 ? filteredWorkPlans : allWorkPlans;
    if (sourceWps && sourceWps.length > 0) {
      sourceWps.forEach((wp: any) => {
        const coordStr = wp['TITIK KOORDINAT'] || wp['koordinat'] || '';
        if (coordStr && coordStr.includes(',')) {
          const parts = coordStr.split(',');
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            points.push({
              lat,
              lng,
              title: `#${wp['NO. WO'] || wp['noWo'] || ''} - ${wp['ULP'] || wp['ulp'] || ''}`,
              desc: wp['DETAIL PEKERJAAN'] || wp['detail'] || wp['TEMUAN'] || wp['temuan'] || '',
              status: wp['PROGRES'] || wp['progres'] || 'PLANNING'
            });
          }
        }
      });
    }

    if (points.length === 0 && recentWOsArray && recentWOsArray.length > 0) {
      recentWOsArray.forEach((r: any[]) => {
        if (r[12] && r[12].includes(',')) {
          const parts = r[12].split(',');
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            points.push({
              lat,
              lng,
              title: `${r[4]} - ${r[6]}`,
              desc: r[8],
              status: r[31]
            });
          }
        }
      });
    }
    return points;
  }, [filteredWorkPlans, stats?.workPlans, recentWOsArray]);

  // Mapping NO. WO -> SOP Pekerjaan from Realisasi & Work Plans
  const noWoToSopMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (recentWOsArray && recentWOsArray.length > 0) {
      const headers = stats?.recentWOs?.headers || [];
      const noWoIdx = headers.findIndex((h: string) => h.includes("NO. WO") || h.includes("NO WO"));
      const sopIdx = headers.findIndex((h: string) => h.includes("SOP"));
      if (noWoIdx !== -1 && sopIdx !== -1) {
        recentWOsArray.forEach((r: any[]) => {
          const nw = String(r[noWoIdx] || '').trim();
          const s = String(r[sopIdx] || '').trim().toUpperCase();
          if (nw && s) map[nw] = s;
        });
      }
    }
    (workPlans || []).forEach((wp: any) => {
      const nw = String(wp['NO. WO'] || wp['noWo'] || '').trim();
      const s = String(wp['SOP PEKERJAAN'] || wp['sop'] || '').trim().toUpperCase();
      if (nw && s && !map[nw]) map[nw] = s;
    });
    return map;
  }, [recentWOsArray, stats?.recentWOs, workPlans]);

  // Helper to infer SOP from description/temuan text
  const getSopFromText = (txt: string) => {
    const t = String(txt || "").toUpperCase();
    if (t.includes("ISOLATOR")) return "ISOLATOR";
    if (t.includes("JUMPER")) return "JUMPER";
    if (t.includes("GARDU") || t.includes("TRAFO")) return "GARDU";
    if (t.includes("TIANG")) return "TIANG";
    if (
      t.includes("FCO") ||
      t.includes("LBS") ||
      t.includes("RECLOSER") ||
      t.includes("PROTEKSI") ||
      t.includes("SWITCHING") ||
      t.includes("ARRESTER") ||
      t.includes("FUSE")
    )
      return "SWITCHING & PROTEKSI";
    if (
      t.includes("KONDUKTOR") ||
      t.includes("FASA") ||
      t.includes("POHON") ||
      t.includes("ANDONGAN") ||
      t.includes("SUTM") ||
      t.includes("KAWAT") ||
      t.includes("TALI")
    )
      return "KONDUKTOR";
    return "";
  };

  // Target year for Work Order in SOP and ULP diagrams (strictly by Year only)
  const targetWoYear = useMemo(() => {
    if (filters.tahun) return String(filters.tahun);
    if (filters.tanggal) {
      const p = parseLocalDate(filters.tanggal);
      if (p) return String(p.year);
      const parts = String(filters.tanggal).split(/[-/]/);
      if (parts.length >= 3) return parts[0].length === 4 ? parts[0] : parts[2];
    }
    return currentYear;
  }, [filters.tahun, filters.tanggal, currentYear]);

  // Stacked Bar Chart data for SOP Pekerjaan (Grid 6) sourced from sheet WorkOrders in WORK_ORDER
  const chartSopData = useMemo(() => {
    const realisasiMap: Record<string, number> = {};
    if (stats?.chartSop && Array.isArray(stats.chartSop)) {
      stats.chartSop.forEach((item: any) => {
        if (item && item.name && item.name !== 'Kosong' && item.name !== 'Belum Ada Data') {
          const key = String(item.name).trim().toUpperCase();
          realisasiMap[key] = item.realisasi ?? item.value ?? 0;
        }
      });
    }

    const woMap: Record<string, number> = {};
    const sourceWo = workOrders.length > 0 ? workOrders : [];
    
    sourceWo.forEach((wo: any) => {
      const tglRaw = wo['tanggal'] || wo['TANGGAL SURVEI'] || wo['tgl'] || '';
      const parsedDate = parseLocalDate(tglRaw);

      // Work Order is strictly filtered by the target Year (never by month, day, or semester)
      if (targetWoYear) {
        if (parsedDate) {
          if (String(parsedDate.year) !== targetWoYear) return;
        } else if (typeof tglRaw === 'string' && !tglRaw.includes(targetWoYear)) {
          return;
        }
      }

      if (filters.ulp) {
        const u = String(wo['ulp'] || wo['ULP'] || '');
        if (!u.toLowerCase().includes(filters.ulp.toLowerCase())) return;
      }

      if (filters.gi) {
        const g = String(wo['garduInduk'] || wo['GARDU INDUK'] || '');
        if (!g.toLowerCase().includes(filters.gi.toLowerCase())) return;
      }

      if (filters.penyulang) {
        const p = String(wo['penyulang'] || wo['PENYULANG'] || '');
        if (!p.toLowerCase().includes(filters.penyulang.toLowerCase())) return;
      }

      const nwKey = String(wo['noWo'] || wo['NO. WO'] || '').trim();
      let sopName = noWoToSopMap[nwKey] || getSopFromText(wo['kategori']) || getSopFromText(wo['temuan']) || 'LAINNYA';
      sopName = sopName.toUpperCase().trim();

      if (filters.sop) {
        if (!sopName.toLowerCase().includes(filters.sop.toLowerCase())) return;
      }

      if (sopName) {
        woMap[sopName] = (woMap[sopName] || 0) + 1;
      }
    });

    const allKeys = Array.from(new Set([...Object.keys(realisasiMap), ...Object.keys(woMap)]));
    if (allKeys.length === 0) {
      return (stats?.chartSop || []).map((s: any) => {
        const real = s.realisasi ?? s.value ?? 0;
        const total = s.totalWo ?? s.value ?? 0;
        const woRemaining = s.workOrder ?? Math.max(0, total - real);
        return {
          name: s.name,
          realisasi: real,
          workOrder: woRemaining === 0 ? 0.0001 : woRemaining,
          workOrderActual: woRemaining,
          totalWo: total,
        };
      });
    }

    return allKeys.map(key => {
      const real = realisasiMap[key] || 0;
      const total = woMap[key] !== undefined ? Math.max(woMap[key], real) : real;
      const woRemaining = Math.max(0, total - real);
      return {
        name: key,
        realisasi: real,
        workOrder: woRemaining === 0 ? 0.0001 : woRemaining,
        workOrderActual: woRemaining,
        totalWo: total
      };
    });
  }, [stats?.chartSop, workOrders, noWoToSopMap, filters, targetWoYear]);

  // Stacked Bar Chart data for ULP (Grid 8) sourced from sheet WorkOrders in WORK_ORDER
  const chartUlpData = useMemo(() => {
    const realisasiMap: Record<string, number> = {};
    if (stats?.chartUlp && Array.isArray(stats.chartUlp)) {
      stats.chartUlp.forEach((item: any) => {
        if (item && item.name && item.name !== 'Kosong' && item.name !== 'Belum Ada Data') {
          const key = String(item.name).trim().toUpperCase();
          realisasiMap[key] = item.realisasi ?? item.value ?? 0;
        }
      });
    }

    const woMap: Record<string, number> = {};
    const sourceWo = workOrders.length > 0 ? workOrders : [];
    
    sourceWo.forEach((wo: any) => {
      const tglRaw = wo['tanggal'] || wo['TANGGAL SURVEI'] || wo['tgl'] || '';
      const parsedDate = parseLocalDate(tglRaw);

      // Work Order is strictly filtered by the target Year (never by month, day, or semester)
      if (targetWoYear) {
        if (parsedDate) {
          if (String(parsedDate.year) !== targetWoYear) return;
        } else if (typeof tglRaw === 'string' && !tglRaw.includes(targetWoYear)) {
          return;
        }
      }

      if (filters.ulp) {
        const u = String(wo['ulp'] || wo['ULP'] || '');
        if (!u.toLowerCase().includes(filters.ulp.toLowerCase())) return;
      }

      if (filters.gi) {
        const g = String(wo['garduInduk'] || wo['GARDU INDUK'] || '');
        if (!g.toLowerCase().includes(filters.gi.toLowerCase())) return;
      }

      if (filters.penyulang) {
        const p = String(wo['penyulang'] || wo['PENYULANG'] || '');
        if (!p.toLowerCase().includes(filters.penyulang.toLowerCase())) return;
      }

      if (filters.sop) {
        const nwKey = String(wo['noWo'] || wo['NO. WO'] || '').trim();
        const sopName = noWoToSopMap[nwKey] || getSopFromText(wo['kategori']) || getSopFromText(wo['temuan']) || '';
        if (!sopName.toLowerCase().includes(filters.sop.toLowerCase())) return;
      }

      const ulpName = String(wo['ulp'] || wo['ULP'] || '').toUpperCase().trim();
      if (ulpName) {
        woMap[ulpName] = (woMap[ulpName] || 0) + 1;
      }
    });

    const allKeys = Array.from(new Set([...Object.keys(realisasiMap), ...Object.keys(woMap)]));
    if (allKeys.length === 0) {
      return (stats?.chartUlp || []).map((u: any) => {
        const real = u.realisasi ?? u.value ?? 0;
        const total = u.totalWo ?? u.value ?? 0;
        const woRemaining = u.workOrder ?? Math.max(0, total - real);
        return {
          name: u.name,
          realisasi: real,
          workOrder: woRemaining === 0 ? 0.0001 : woRemaining,
          workOrderActual: woRemaining,
          totalWo: total
        };
      });
    }

    return allKeys.map(key => {
      const real = realisasiMap[key] || 0;
      const total = woMap[key] !== undefined ? Math.max(woMap[key], real) : real;
      const woRemaining = Math.max(0, total - real);
      return {
        name: key,
        realisasi: real,
        workOrder: woRemaining === 0 ? 0.0001 : woRemaining,
        workOrderActual: woRemaining,
        totalWo: total
      };
    });
  }, [stats?.chartUlp, workOrders, noWoToSopMap, filters, targetWoYear]);

  // Composite Chart data for PENYULANG (Bar: Work Order, Line: Realisasi WO)
  const chartPenyulangData = useMemo(() => {
    const realisasiMap: Record<string, number> = {};
    
    // 1. Gather Realisasi from stats.chartStatus or recentWOsArray
    if (stats?.chartStatus && Array.isArray(stats.chartStatus)) {
      stats.chartStatus.forEach((item: any) => {
        if (item && item.name && item.name !== 'Kosong' && item.name !== 'Belum Ada Data') {
          const key = String(item.name).trim().toUpperCase();
          realisasiMap[key] = item.value || 0;
        }
      });
    }

    if (Object.keys(realisasiMap).length === 0 && recentWOsArray && recentWOsArray.length > 0) {
      recentWOsArray.forEach((row: any[]) => {
        const p = String(row[6] || '').trim().toUpperCase();
        if (p) {
          realisasiMap[p] = (realisasiMap[p] || 0) + 1;
        }
      });
    }

    // 2. Gather Work Orders for Penyulang filtered strictly by Year
    const woMap: Record<string, number> = {};
    const sourceWo = workOrders.length > 0 ? workOrders : [];
    
    sourceWo.forEach((wo: any) => {
      const tglRaw = wo['tanggal'] || wo['TANGGAL SURVEI'] || wo['tgl'] || '';
      const parsedDate = parseLocalDate(tglRaw);

      if (targetWoYear) {
        if (parsedDate) {
          if (String(parsedDate.year) !== targetWoYear) return;
        } else if (typeof tglRaw === 'string' && !tglRaw.includes(targetWoYear)) {
          return;
        }
      }

      if (filters.ulp) {
        const u = String(wo['ulp'] || wo['ULP'] || '');
        if (!u.toLowerCase().includes(filters.ulp.toLowerCase())) return;
      }

      if (filters.gi) {
        const g = String(wo['garduInduk'] || wo['GARDU INDUK'] || '');
        if (!g.toLowerCase().includes(filters.gi.toLowerCase())) return;
      }

      if (filters.penyulang) {
        const p = String(wo['penyulang'] || wo['PENYULANG'] || '');
        if (!p.toLowerCase().includes(filters.penyulang.toLowerCase())) return;
      }

      if (filters.sop) {
        const nwKey = String(wo['noWo'] || wo['NO. WO'] || '').trim();
        const sopName = noWoToSopMap[nwKey] || getSopFromText(wo['kategori']) || getSopFromText(wo['temuan']) || '';
        if (!sopName.toLowerCase().includes(filters.sop.toLowerCase())) return;
      }

      const pName = String(wo['penyulang'] || wo['PENYULANG'] || '').toUpperCase().trim();
      if (pName) {
        woMap[pName] = (woMap[pName] || 0) + 1;
      }
    });

    const allKeys = Array.from(new Set([...Object.keys(realisasiMap), ...Object.keys(woMap)]));
    
    // Sort so active penyulangs appear nicely
    allKeys.sort((a, b) => {
      const realA = realisasiMap[a] || 0;
      const realB = realisasiMap[b] || 0;
      if (realB !== realA) return realB - realA;
      return (woMap[b] || 0) - (woMap[a] || 0);
    });

    const items = allKeys.map(key => ({
      name: key,
      realisasi: realisasiMap[key] || 0,
      workOrder: woMap[key] || 0,
    }));

    if (items.length > 14) {
      const active = items.filter(it => it.realisasi > 0 || it.workOrder > 0);
      return active.length > 0 ? active.slice(0, 14) : items.slice(0, 14);
    }

    return items;
  }, [stats?.chartStatus, recentWOsArray, workOrders, noWoToSopMap, filters, targetWoYear]);

  // Custom Tooltip for Penyulang Composite Chart
  const renderPenyulangTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      const realisasi = Number(data?.realisasi ?? 0);
      const workOrder = Number(data?.workOrder ?? 0);
      const persentase = workOrder > 0 ? ((realisasi / workOrder) * 100).toFixed(1) : (realisasi > 0 ? '100' : '0');

      return (
        <div className={`${isDark ? 'bg-[#121c22] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-xl'} border p-2.5 rounded-lg shadow-2xl text-xs z-50 min-w-[170px]`}>
          <div className={`font-bold ${isDark ? 'text-white border-white/10' : 'text-slate-900 border-slate-100'} mb-2 border-b pb-1.5 flex items-center justify-between gap-3`}>
            <span className="truncate font-mono">{label || data?.name}</span>
            <span className="text-[9px] font-mono text-[#0d8291] font-bold bg-[#0d8291]/15 px-1.5 py-0.5 rounded border border-[#0d8291]/30 shrink-0">
              {persentase}% Realisasi
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-slate-600'} text-[11px]`}>
                <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b] shrink-0"></span>
                Work Order (Bar):
              </span>
              <span className="font-bold font-mono text-amber-500">{workOrder.toLocaleString()} WO</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-slate-600'} text-[11px]`}>
                <span className="w-2.5 h-0.5 bg-[#2dd4bf] shrink-0"></span>
                Realisasi WO (Line):
              </span>
              <span className="font-bold font-mono text-[#0d8291]">{realisasi.toLocaleString()} Titik</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Tooltip custom untuk Stacked Bar Chart (Realisasi WO & Work Order)
  const renderCustomStackedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      const realisasi = Number(data?.realisasi ?? 0);
      const workOrder = Number(data?.workOrderActual ?? data?.workOrder ?? 0);
      const total = Number(data?.totalWo ?? (realisasi + workOrder));
      const persentase = total > 0 ? ((realisasi / total) * 100).toFixed(1) : '0';

      return (
        <div className={`${isDark ? 'bg-[#121c22] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-xl'} border p-2.5 rounded-lg shadow-2xl text-xs z-50 min-w-[175px]`}>
          <div className={`font-bold ${isDark ? 'text-white border-white/10' : 'text-slate-900 border-slate-100'} mb-2 border-b pb-1.5 flex items-center justify-between gap-3`}>
            <span className="truncate">{label || data?.name}</span>
            <span className="text-[10px] font-mono text-[#0d8291] font-bold bg-[#0d8291]/15 px-1.5 py-0.5 rounded border border-[#0d8291]/30 shrink-0">
              {persentase}% Realisasi
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-slate-600'} text-[11px]`}>
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0d8291] shrink-0"></span>
                Realisasi WO:
              </span>
              <span className="font-bold font-mono text-[#0d8291]">{realisasi.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-slate-600'} text-[11px]`}>
                <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b] shrink-0"></span>
                Work Order:
              </span>
              <span className="font-bold font-mono text-amber-500">{workOrder.toLocaleString()}</span>
            </div>
            <div className={`flex items-center justify-between gap-4 ${isDark ? 'text-gray-400 border-white/10' : 'text-slate-500 border-slate-100'} pt-1.5 border-t text-[11px]`}>
              <span>Total Work Order:</span>
              <span className={`font-bold font-mono ${boldValueClass}`}>{total.toLocaleString()} WO</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Stacked Bar Value Label: [Realisasi WO] / [Work Order]
  // Colors match diagram: Teal for Realisasi (#2dd4bf), Amber for Work Order (#fbbf24)
  const renderVerticalBarLabel = (props: any) => {
    const { x, y, width, index } = props;
    const item = chartSopData[index];
    if (!item) return null;
    const realisasi = item.realisasi ?? 0;
    const totalWo = item.totalWo ?? (realisasi + (item.workOrderActual ?? 0));
    const posX = (x ?? 0) + (width ?? 0) / 2;
    const posY = Math.max(10, (y ?? 0) - 4);

    return (
      <text
        x={posX}
        y={posY}
        textAnchor="middle"
        className="select-none font-mono"
        style={{ fontSize: '8px', fontWeight: 'bold' }}
      >
        <tspan fill="#2dd4bf">{realisasi.toLocaleString()}</tspan>
        <tspan fill="#9ca3af"> / </tspan>
        <tspan fill="#fbbf24">{totalWo.toLocaleString()}</tspan>
      </text>
    );
  };

  const renderHorizontalBarLabel = (props: any) => {
    const { x, y, width, height, index } = props;
    const item = chartUlpData[index];
    if (!item) return null;
    const realisasi = item.realisasi ?? 0;
    const totalWo = item.totalWo ?? (realisasi + (item.workOrderActual ?? 0));
    const posX = (x ?? 0) + (width ?? 0) + 4;
    const posY = (y ?? 0) + (height ?? 0) / 2 + 3;

    return (
      <text
        x={posX}
        y={posY}
        textAnchor="start"
        className="select-none font-mono"
        style={{ fontSize: '8px', fontWeight: 'bold' }}
      >
        <tspan fill="#2dd4bf">{realisasi.toLocaleString()}</tspan>
        <tspan fill="#9ca3af"> / </tspan>
        <tspan fill="#fbbf24">{totalWo.toLocaleString()}</tspan>
      </text>
    );
  };

  if (loading && !stats) {
    return (
      <div className="h-screen w-screen bg-[#05080a] flex flex-col items-center justify-center text-white">
        <Activity className="w-12 h-12 text-[#0d8291] animate-spin mb-4" />
        <p className="text-gray-400 font-mono">MEMUAT DASHBOARD...</p>
      </div>
    );
  }

  // Theme styling helpers:
  const cardClass = isDark 
    ? "bg-[#0d161a] border-white/10 text-white" 
    : "bg-white border-slate-200 text-slate-800 shadow-sm";
  const cardSubClass = isDark 
    ? "bg-white/5" 
    : "bg-slate-100/90 border border-slate-200";
  const itemCardClass = isDark
    ? "bg-[#121c22] border-white/5 hover:border-white/10 text-white"
    : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs";
  const titleClass = isDark ? "text-gray-400" : "text-slate-600 font-bold";
  const mutedClass = isDark ? "text-gray-500" : "text-slate-500";
  const boldValueClass = isDark ? "text-white" : "text-slate-900";
  const chartTextColor = isDark ? "#9ca3af" : "#475569";
  const chartGridColor = isDark ? "#ffffff10" : "#e2e8f0";

  return (
    <div className={`h-screen w-screen overflow-hidden ${isDark ? 'theme-dark bg-[#05080a] text-white' : 'theme-light bg-[#edf2f7] text-slate-800'} p-2 flex flex-col gap-2 font-sans text-sm box-border transition-colors duration-300`}>
      <style>{`
        .leaflet-container {
           background: ${isDark ? '#0d161a' : '#f8fafc'} !important;
           border-radius: 0.5rem;
           width: 100%;
           height: 100%;
           z-index: 10;
        }
        .theme-light select,
        .theme-light input {
           background-color: #ffffff !important;
           color: #0f172a !important;
           border-color: #cbd5e1 !important;
        }
        .theme-light select option {
           background-color: #ffffff !important;
           color: #0f172a !important;
        }
      `}</style>
      
      {/* Grid 1: Header */}
      <header className={`h-14 ${cardClass} rounded-xl flex items-center justify-between px-4 shrink-0 border`}>
        <div className="flex items-center gap-3">
          <img
            src="https://lh3.googleusercontent.com/d/1N2E29tQtPDW9kN82rA4R1W8NqSKLq-xg"
            alt="Logo Portal PDKB Recca"
            className="h-9 w-auto object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-bold tracking-wider text-[#0d8291] leading-tight text-base sm:text-lg">DASHBOARD</h1>
            <p className={`text-[10px] ${mutedClass} uppercase tracking-widest font-semibold`}>PORTAL PDKB RECCA</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Label Informasi Filter Periode: BULAN & TAHUN */}
          <div 
            id="label-filter-bulan-tahun"
            className={`flex items-center gap-2 ${isDark ? 'bg-[#0c1418]/80 border-[#0d8291]/30 hover:border-[#0d8291]/50' : 'bg-slate-50 border-slate-300 hover:border-[#0d8291]/50'} px-2.5 py-1.5 rounded-lg text-xs font-mono shadow-sm transition-colors cursor-pointer border`}
            onClick={() => setShowFilters(true)}
            title="Klik untuk mengubah filter periode"
          >
            <Calendar className="w-3.5 h-3.5 text-[#0d8291] shrink-0" />
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className={`${isDark ? 'text-gray-400' : 'text-slate-500'} text-[10px] uppercase font-bold tracking-wider`}>BULAN:</span>
              <span className={`${isDark ? 'text-gray-100' : 'text-slate-800'} font-bold uppercase`}>{filters.bulan ? (MONTH_NAMES_UPPER[filters.bulan] || filters.bulan) : 'SEMUA BULAN'}</span>
              <span className={`${isDark ? 'text-gray-600' : 'text-slate-400'} font-bold mx-0.5`}>|</span>
              <span className={`${isDark ? 'text-gray-400' : 'text-slate-500'} text-[10px] uppercase font-bold tracking-wider`}>TAHUN:</span>
              <span className="text-[#2dd4bf] font-bold">{filters.tahun || 'SEMUA TAHUN'}</span>
            </div>
          </div>

          {/* Tombol Manual Refresh dengan indikator status sinkronisasi */}
          <button
            id="btn-manual-refresh"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border text-xs font-mono font-medium shadow-sm ${
              isRefreshing
                ? 'opacity-75 cursor-wait ' + (isDark ? 'bg-white/10 border-white/20 text-[#2dd4bf]' : 'bg-slate-100 border-slate-300 text-[#0d8291]')
                : isDark 
                ? 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10 hover:border-[#0d8291]/50' 
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 hover:border-[#0d8291]/50'
            }`}
            title={`Klik untuk sinkronisasi data terbaru • Terakhir update: ${lastRefreshed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • Auto-refresh 1 menit aktif`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0d8291] ${isRefreshing ? 'animate-spin text-[#2dd4bf]' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'MEMUAT...' : 'REFRESH'}</span>
          </button>

          {/* Tombol Toggle Mode Gelap/Terang */}
          <button
            id="btn-toggle-theme"
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border text-xs font-mono font-medium shadow-sm ${
              isDark 
                ? 'bg-white/5 hover:bg-white/10 text-amber-400 border-white/10' 
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
            title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-gray-200">TERANG</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span className="text-slate-800">GELAP</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-sm'} px-3 py-1.5 rounded-lg transition-colors border text-xs font-mono`}
          >
            <Filter className="w-3.5 h-3.5" />
            FILTER DATA
          </button>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 bg-[#0d8291] hover:bg-[#0a6b78] px-3 py-1.5 rounded-lg transition-colors text-white text-xs font-mono"
          >
            <LogIn className="w-3.5 h-3.5" />
            LOGIN
          </button>
        </div>
      </header>

      {/* FILTER PANEL OVERLAY */}
      {showFilters && (
         <div className={`absolute top-16 right-4 w-80 ${isDark ? 'bg-[#121c22] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-2xl'} border rounded-xl shadow-2xl p-4 z-50 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10`}>
            <div className={`flex justify-between items-center mb-4 sticky top-0 ${isDark ? 'bg-[#121c22]' : 'bg-white'} pb-2 z-10 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
              <h3 className="font-bold text-[#0d8291] text-xs font-mono">FILTER DATA</h3>
              <button onClick={() => setShowFilters(false)} className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
               <div className="grid grid-cols-2 gap-2">
                  <div>
                     <label className={`text-[10px] ${mutedClass} uppercase`}>Tanggal</label>
                     <input 
                        type="date"
                        className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white [color-scheme:dark]' : 'bg-slate-50 border-slate-300 text-slate-800 [color-scheme:light]'} border rounded px-2 py-1.5 text-xs mt-1 outline-none`}
                        value={filters.tanggal}
                        onChange={(e) => setFilters({...filters, tanggal: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className={`text-[10px] ${mutedClass} uppercase`}>Tahun</label>
                     <select 
                        className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'} border rounded px-2 py-1.5 text-xs mt-1 outline-none`}
                        value={filters.tahun}
                        onChange={(e) => setFilters({...filters, tahun: e.target.value})}
                     >
                        <option value="">Semua Tahun</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-2">
                  <div>
                     <label className={`text-[10px] ${mutedClass} uppercase`}>Bulan</label>
                     <select 
                        className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'} border rounded px-2 py-1.5 text-xs mt-1 outline-none`}
                        value={filters.bulan}
                        onChange={(e) => setFilters({...filters, bulan: e.target.value})}
                     >
                        <option value="">Semua Bulan</option>
                        <option value="1">Januari</option>
                        <option value="2">Februari</option>
                        <option value="3">Maret</option>
                        <option value="4">April</option>
                        <option value="5">Mei</option>
                        <option value="6">Juni</option>
                        <option value="7">Juli</option>
                        <option value="8">Agustus</option>
                        <option value="9">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                     </select>
                  </div>
                  <div>
                     <label className={`text-[10px] ${mutedClass} uppercase`}>Semester</label>
                     <select 
                        className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'} border rounded px-2 py-1.5 text-xs mt-1 outline-none`}
                        value={filters.semester}
                        onChange={(e) => setFilters({...filters, semester: e.target.value})}
                     >
                        <option value="">Semua Semester</option>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                     </select>
                  </div>
               </div>

               <div>
                  <label className={`text-[10px] ${mutedClass} uppercase`}>ULP</label>
                  <select 
                     className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'} border rounded px-2 py-1.5 text-xs mt-1 outline-none`}
                     value={filters.ulp}
                     onChange={(e) => setFilters({...filters, ulp: e.target.value})}
                  >
                     <option value="">Semua ULP</option>
                     <option value="Makassar Selatan">Makassar Selatan</option>
                     <option value="Makassar Utara">Makassar Utara</option>
                     <option value="Panakkukang">Panakkukang</option>
                     <option value="Mattoanging">Mattoanging</option>
                     <option value="Maros">Maros</option>
                     <option value="Pangkep">Pangkep</option>
                  </select>
               </div>

               <div>
                  <label className={`text-[10px] ${mutedClass} uppercase`}>Gardu Induk (GI)</label>
                  <input 
                     type="text"
                     placeholder="Nama GI..."
                     className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'} border rounded px-2 py-1.5 text-xs mt-1 outline-none`}
                     value={filters.gi}
                     onChange={(e) => setFilters({...filters, gi: e.target.value})}
                  />
               </div>

               <div>
                  <label className={`text-[10px] ${mutedClass} uppercase`}>Penyulang</label>
                  <input 
                     type="text"
                     placeholder="Nama Penyulang..."
                     className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'} border rounded px-2 py-1.5 text-xs mt-1 outline-none`}
                     value={filters.penyulang}
                     onChange={(e) => setFilters({...filters, penyulang: e.target.value})}
                  />
               </div>

               <div>
                  <label className={`text-[10px] ${mutedClass} uppercase`}>SOP Pekerjaan</label>
                  <select 
                     className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'} border rounded px-2 py-1.5 text-xs mt-1 outline-none`}
                     value={filters.sop}
                     onChange={(e) => setFilters({...filters, sop: e.target.value})}
                  >
                     <option value="">Semua SOP</option>
                     <option value="Pemeliharaan">Pemeliharaan</option>
                     <option value="Perbaikan">Perbaikan</option>
                     <option value="Inspeksi">Inspeksi</option>
                     <option value="Penggantian">Penggantian</option>
                  </select>
               </div>

               <div className={`pt-2 flex gap-2 border-t ${isDark ? 'border-white/5' : 'border-slate-100'} mt-4`}>
                  <button 
                     onClick={() => setFilters({
                        tanggal: '', bulan: currentMonth, semester: '', tahun: currentYear, ulp: '', gi: '', penyulang: '', sop: ''
                     })} 
                     className={`flex-1 ${isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} py-2 rounded text-xs transition-colors`}
                  >
                     Reset
                  </button>
                  <button 
                     onClick={() => setShowFilters(false)} 
                     className="flex-1 bg-[#0d8291] text-white py-2 rounded text-xs transition-colors hover:bg-opacity-80 font-bold"
                  >
                     Terapkan
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Main Container - FLEX LAYOUT FOR STABILITY */}
      <main className="flex-1 flex gap-2 min-h-0">
         
         {/* Left & Middle Wrap (75%) */}
         <div className="w-3/4 flex flex-col gap-2 min-w-0 h-full">
            
            {/* Top section (Grid 10,11 + Grid 2-5,9) */}
            <div className="flex-1 flex gap-2 min-h-0">
               
               {/* Left Column (1/3 of the 75% = 25% of total) */}
               <div className="w-1/3 flex flex-col gap-2 min-w-0">
                  {/* Grid 10: Rencana Kerja */}
                  <div id="grid-rencana-kerja" className={`${cardClass} rounded-xl p-3 flex flex-col shrink-0 border`}>
                     <div className="flex items-center justify-between gap-1 mb-2">
                        <h2 className={`text-[11px] font-bold ${titleClass} uppercase tracking-wider shrink-0`}>
                           Rencana Kerja
                        </h2>

                        {/* Tombol Memilih Tanggal Rencana Kerja */}
                        <div className="flex items-center gap-1">
                           <div className="relative flex items-center">
                              <input 
                                 type="date"
                                 id="picker-rencana-tanggal"
                                 value={rencanaTanggal}
                                 onClick={(e) => {
                                    try {
                                       (e.currentTarget as any).showPicker?.();
                                    } catch(err) {}
                                 }}
                                 onChange={(e) => setRencanaTanggal(e.target.value)}
                                 className={`absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 ${isDark ? '[color-scheme:dark]' : '[color-scheme:light]'}`}
                                 title="Klik untuk memilih tanggal"
                              />
                              <button
                                 type="button"
                                 id="btn-pilih-tanggal-rencana"
                                 onClick={() => {
                                    const input = document.getElementById('picker-rencana-tanggal') as HTMLInputElement;
                                    if (input) {
                                       try {
                                          input.showPicker?.();
                                       } catch(e) {
                                          input.focus();
                                       }
                                    }
                                 }}
                                 className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
                                    isToday
                                       ? 'bg-[#0d8291]/20 text-[#2dd4bf] border-[#0d8291]/50 hover:bg-[#0d8291]/30'
                                       : rencanaTanggal
                                       ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30'
                                       : isDark 
                                       ? 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                                       : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                 }`}
                              >
                                 <Calendar className="w-3 h-3 text-[#0d8291] shrink-0" />
                                 <span className="font-semibold whitespace-nowrap">
                                    {isToday 
                                       ? `Hari ini (${formatDateDisplay(rencanaTanggal)})` 
                                       : rencanaTanggal 
                                       ? formatDateDisplay(rencanaTanggal) 
                                       : 'Semua Tanggal'}
                                 </span>
                                 <ChevronDown className="w-2.5 h-2.5 opacity-60 shrink-0" />
                              </button>
                           </div>

                           {!isToday && (
                              <button
                                 type="button"
                                 id="btn-reset-hari-ini"
                                 onClick={() => setRencanaTanggal(todayStr)}
                                 className={`px-1.5 py-0.5 rounded text-[9px] transition-colors whitespace-nowrap border ${
                                    isDark
                                       ? 'bg-white/5 hover:bg-[#0d8291]/20 border-white/10 hover:border-[#0d8291]/30 text-gray-300 hover:text-[#2dd4bf]'
                                       : 'bg-slate-100 hover:bg-[#0d8291]/10 border-slate-300 hover:border-[#0d8291]/40 text-slate-700 hover:text-[#0d8291]'
                                 }`}
                                 title="Kembali ke Hari Ini"
                              >
                                 Hari ini
                              </button>
                           )}

                           {rencanaTanggal && (
                              <button
                                 type="button"
                                 id="btn-reset-semua-tanggal"
                                 onClick={() => setRencanaTanggal('')}
                                 className={`px-1.5 py-0.5 rounded text-[9px] transition-colors whitespace-nowrap border ${
                                    isDark
                                       ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400 hover:text-white'
                                       : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900'
                                 }`}
                                 title="Tampilkan Semua Tanggal"
                              >
                                 Semua
                              </button>
                           )}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-2">
                        <div className={`${cardSubClass} rounded-lg p-2 flex flex-col justify-center items-center shadow-2xs`}>
                           <span className="text-xl font-bold text-[#0d8291]">{rencanaKerjaData.titik}</span>
                           <span className={`text-[9px] ${mutedClass} uppercase font-medium`}>Titik</span>
                        </div>
                        <div className={`${cardSubClass} rounded-lg p-2 flex flex-col justify-center items-center shadow-2xs`}>
                           <span className="text-xl font-bold text-blue-500">{rencanaKerjaData.personil}</span>
                           <span className={`text-[9px] ${mutedClass} uppercase font-medium`}>Personil</span>
                        </div>
                        <div className={`${cardSubClass} rounded-lg p-2 flex flex-col justify-center items-center shadow-2xs`}>
                           <span className="text-lg font-bold text-amber-500">{rencanaKerjaData.kwhText}</span>
                           <span className={`text-[9px] ${mutedClass} uppercase font-medium`}>Est. kWh</span>
                        </div>
                        <div className={`${cardSubClass} rounded-lg p-2 flex flex-col justify-center items-center shadow-2xs`}>
                           <span className="text-lg font-bold text-emerald-500">{rencanaKerjaData.rpText}</span>
                           <span className={`text-[9px] ${mutedClass} uppercase font-medium`}>Est. Rp</span>
                        </div>
                     </div>
                  </div>

                  {/* Grid 11: List WP */}
                  <div id="grid-list-work-plan" className={`flex-1 ${cardClass} rounded-xl p-3 flex flex-col min-h-0 border`}>
                     <div className="flex items-center justify-between mb-2 shrink-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                           <h2 className={`text-[11px] font-bold ${titleClass} uppercase tracking-wider truncate`}>List Work Plan</h2>
                           {rencanaTanggal && (
                              <span className={`text-[9px] ${mutedClass} font-mono hidden sm:inline`}>
                                 ({isToday ? 'Hari ini' : formatDateDisplay(rencanaTanggal)})
                              </span>
                           )}
                        </div>
                        <span className="text-[9px] text-[#0d8291] font-bold bg-[#0d8291]/10 px-2 py-0.5 rounded border border-[#0d8291]/20 shrink-0">
                           {filteredWorkPlans.length} WO
                        </span>
                     </div>
                     <div className={`flex-1 overflow-y-auto scrollbar-thin ${isDark ? 'scrollbar-thumb-white/10' : 'scrollbar-thumb-slate-300'} pr-1 space-y-2`}>
                        {filteredWorkPlans.length === 0 ? (
                           <div className={`h-full flex flex-col items-center justify-center ${mutedClass} text-xs py-8 text-center px-4`}>
                              <Calendar className="w-7 h-7 text-gray-400 mb-1.5 opacity-40" />
                              <p className={`${mutedClass} font-medium`}>
                                 Tidak ada work plan untuk {rencanaTanggal ? (isToday ? 'hari ini' : formatDateDisplay(rencanaTanggal)) : 'filter ini'}
                              </p>
                              {rencanaTanggal && (
                                 <button
                                    type="button"
                                    onClick={() => setRencanaTanggal('')}
                                    className="mt-2 text-[10px] text-[#0d8291] hover:underline font-semibold"
                                 >
                                    Tampilkan semua tanggal
                                 </button>
                              )}
                           </div>
                        ) : (
                           filteredWorkPlans.slice(0, 100).map((wp: any, i: number) => {
                              const noWo = wp['NO. WO'] || wp['noWo'] || '';
                              const ulp = wp['ULP'] || wp['ulp'] || '-';
                              const penyulang = wp['PENYULANG'] || wp['penyulang'] || '';
                              const progres = String(wp['PROGRES'] || wp['progres'] || wp['KONFIRMASI'] || 'PLANNING').toUpperCase().trim();
                              const detail = wp['DETAIL PEKERJAAN'] || wp['detail'] || wp['TEMUAN'] || wp['temuan'] || wp['INSTRUKSI KERJA'] || '-';
                              const tgl = wp['TANGGAL DIRENCANAKAN'] || wp['tanggal'] || '';
                              const parsedTgl = parseLocalDate(tgl);
                              const formattedDate = parsedTgl 
                                 ? `${String(parsedTgl.day).padStart(2, '0')}/${String(parsedTgl.month).padStart(2, '0')}/${parsedTgl.year}` 
                                 : (tgl ? String(tgl).slice(0, 10) : '-');

                              return (
                                 <div key={i} className={`${itemCardClass} p-2 rounded-lg border text-xs flex flex-col gap-1 transition-colors`}>
                                    <div className="flex justify-between items-start">
                                       <span className="font-mono text-[#0d8291] font-bold text-[10px]">
                                          #{noWo} • {ulp}
                                       </span>
                                       <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0
                                          ${progres === 'PLANNING' ? 'bg-orange-500/20 text-orange-500' : 
                                            progres === 'PROSES EKSEKUSI' || progres === 'PELAKSANAAN' ? 'bg-yellow-500/20 text-yellow-600' : 
                                            progres === 'SWA' || progres === 'CANCEL' ? 'bg-red-500/20 text-red-500' : 
                                            progres === 'SELESAI' || progres === 'APPROVE' ? 'bg-green-500/20 text-green-600' :
                                            'bg-blue-500/20 text-blue-500'}
                                       `}>
                                          {progres}
                                       </span>
                                    </div>
                                    <p className={`${isDark ? 'text-gray-300' : 'text-slate-700'} text-[10px] leading-tight line-clamp-2`}>{detail}</p>
                                    <div className={`flex items-center justify-between text-[9px] ${mutedClass} mt-0.5`}>
                                       <span className="truncate max-w-[120px]">{penyulang}</span>
                                       <span>{formattedDate}</span>
                                    </div>
                                 </div>
                              );
                           })
                        )}
                     </div>
                  </div>
               </div>

               {/* Middle Column (2/3 of the 75% = 50% of total) */}
               <div className="w-2/3 flex flex-col gap-2 min-w-0">
                  {/* Grid 2-5 Container */}
                  <div className="h-24 shrink-0 flex gap-2">
                     {/* Grid 2 */}
                     <div className={`flex-1 ${cardClass} rounded-xl p-3 flex flex-col justify-center border`}>
                        <div className={`text-[10px] ${mutedClass} uppercase font-bold tracking-wider mb-1`}>Real. Titik</div>
                        <div className="flex items-end gap-1 mb-1.5">
                           <span className={`text-2xl font-bold leading-none ${boldValueClass}`}>{stats?.realisasiTitik || 0}</span>
                           <span className={`text-xs ${mutedClass} mb-0.5`}>/ {stats?.targetTitik || 0}</span>
                        </div>
                        <div className={`w-full ${isDark ? 'bg-white/10' : 'bg-slate-200'} h-1.5 rounded-full overflow-hidden`}>
                           <div className="h-full bg-[#0d8291]" style={{ width: `${Math.min(100, ((stats?.realisasiTitik || 0)/(stats?.targetTitik || 1)) * 100)}%`}}></div>
                        </div>
                     </div>
                     
                     {/* Grid 3 */}
                     <div className={`flex-1 ${cardClass} rounded-xl p-3 flex flex-col justify-center border`}>
                        <div className={`text-[10px] ${mutedClass} uppercase font-bold tracking-wider mb-1`}>Saving kWh</div>
                        <div className="flex items-end gap-1 mb-1.5">
                           <span className="text-xl font-bold leading-none text-amber-500">{(stats?.savingKwh || 0).toLocaleString()}</span>
                        </div>
                        <div className={`flex items-center justify-between text-[9px] ${mutedClass} mb-0.5`}>
                           <span>Target:</span>
                           <span>{(stats?.targetKwh || 0).toLocaleString()}</span>
                        </div>
                        <div className={`w-full ${isDark ? 'bg-white/10' : 'bg-slate-200'} h-1.5 rounded-full overflow-hidden`}>
                           <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, ((stats?.savingKwh || 0)/(stats?.targetKwh || 1)) * 100)}%`}}></div>
                        </div>
                     </div>

                     {/* Grid 4 */}
                     <div className={`flex-1 ${cardClass} rounded-xl p-3 flex flex-col justify-center border`}>
                        <div className={`text-[10px] ${mutedClass} uppercase font-bold tracking-wider mb-1`}>Saving Rp</div>
                        <div className="flex items-end gap-1 mb-1.5">
                           <span className="text-xl font-bold leading-none text-emerald-500">{((stats?.savingRp || 0)/1000000).toFixed(1)} jt</span>
                        </div>
                        <div className={`flex items-center justify-between text-[9px] ${mutedClass} mb-0.5`}>
                           <span>Target:</span>
                           <span>{((stats?.targetRp || 0)/1000000).toFixed(1)} jt</span>
                        </div>
                        <div className={`w-full ${isDark ? 'bg-white/10' : 'bg-slate-200'} h-1.5 rounded-full overflow-hidden`}>
                           <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, ((stats?.savingRp || 0)/(stats?.targetRp || 1)) * 100)}%`}}></div>
                        </div>
                     </div>

                     {/* Grid 5 */}
                     <div className={`flex-1 ${cardClass} rounded-xl p-3 flex flex-col justify-center border`}>
                        <div className={`text-[10px] ${mutedClass} uppercase font-bold tracking-wider text-center mb-2`}>SAIDI / SAIFI</div>
                        <div className="flex items-end gap-4 justify-center flex-1">
                           <div className="text-center">
                              <div className="text-xl font-bold text-red-500 leading-none mb-1">{Number(stats?.saidi || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              <div className={`text-[9px] ${mutedClass} font-semibold`}>SAIDI</div>
                           </div>
                           <div className="text-center">
                              <div className="text-xl font-bold text-orange-500 leading-none mb-1">{Number(stats?.saifi || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              <div className={`text-[9px] ${mutedClass} font-semibold`}>SAIFI</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Grid 9: Map Chart */}
                  <div className={`flex-1 ${cardClass} rounded-xl p-1 relative min-h-0 border`}>
                     <div className="absolute inset-1 rounded-lg overflow-hidden">
                        <MapContainer 
                           center={[-5.1476, 119.4327]} 
                           zoom={13} 
                           zoomControl={false}
                           className="w-full h-full"
                        >
                           <MapAutoFocus points={mapPoints} />
                           <TileLayer
                              key={isDark ? 'dark-tiles' : 'light-tiles'}
                              url={isDark 
                                 ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`
                                 : `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`
                              }
                              subdomains="abcd"
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                           />
                           {mapPoints.map((pt: any, i: number) => (
                              <Marker 
                                 key={i} 
                                 position={[pt.lat, pt.lng]}
                                 icon={createCustomIcon(pt.status)}
                              >
                                 <Popup className="custom-popup">
                                    <div className="text-gray-800 font-mono text-xs font-bold">{pt.title}</div>
                                    <div className="text-xs">{pt.desc}</div>
                                    <div className="text-xs font-bold mt-1" style={{ color: getStatusColor(pt.status) }}>{pt.status}</div>
                                 </Popup>
                              </Marker>
                           ))}
                        </MapContainer>
                     </div>

                     {/* Floating Grid Melayang di Bagian Bawah Maps: Penyulang (Realisasi WO & Work Order) */}
                     <div 
                        id="floating-grid-penyulang"
                        className={`absolute bottom-2 left-2 right-2 z-[1000] ${
                           isDark 
                              ? 'bg-[#091014]/75 border-white/15 text-gray-200' 
                              : 'bg-white/85 border-slate-300 text-slate-800 shadow-xl'
                        } backdrop-blur-md border rounded-xl shadow-2xl transition-all duration-300 overflow-hidden ${
                           isPenyulangMinimized ? 'py-1 px-2.5' : 'p-2 px-2.5'
                        }`}
                     >
                        <div 
                           className="flex items-center justify-between gap-2 cursor-pointer select-none"
                           onClick={() => setIsPenyulangMinimized(!isPenyulangMinimized)}
                        >
                           <div className="flex items-center gap-2 min-w-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#0d8291] animate-pulse shrink-0"></div>
                              <h4 className={`text-[10px] font-bold ${isDark ? 'text-gray-200' : 'text-slate-800'} uppercase tracking-wider truncate font-mono`}>
                                 PENYULANG <span className={`${mutedClass} font-normal`}>| Realisasi WO & Work Order</span>
                              </h4>
                           </div>

                           <div className="flex items-center gap-3 shrink-0">
                              {/* Mini Legend */}
                              <div className="flex items-center gap-2 text-[9px]">
                                 <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-sm bg-[#f59e0b]"></span>
                                    <span className={`${isDark ? 'text-gray-300' : 'text-slate-600'} font-medium`}>WO (Bar)</span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                    <span className="w-2.5 h-0.5 bg-[#2dd4bf] rounded-full"></span>
                                    <span className={`${isDark ? 'text-gray-300' : 'text-slate-600'} font-medium`}>Realisasi (Line)</span>
                                 </div>
                              </div>

                              <button
                                 type="button"
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    setIsPenyulangMinimized(!isPenyulangMinimized);
                                 }}
                                 className={`p-0.5 ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'} rounded transition-colors`}
                                 title={isPenyulangMinimized ? "Perbesar Diagram" : "Kecilkan Diagram"}
                              >
                                 {isPenyulangMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                           </div>
                        </div>

                        {!isPenyulangMinimized && (
                           <div className="h-20 w-full mt-1">
                              {chartPenyulangData.length === 0 ? (
                                 <div className={`h-full flex items-center justify-center ${mutedClass} text-[10px] font-mono`}>
                                    Tidak ada data penyulang untuk filter ini
                                 </div>
                              ) : (
                                 <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartPenyulangData} margin={{ top: 4, right: 8, left: -26, bottom: 14 }}>
                                       <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff08" : "#0000000a"} vertical={false} />
                                       <XAxis 
                                          dataKey="name" 
                                          stroke="#9ca3af" 
                                          fontSize={7.5} 
                                          tickLine={false} 
                                          interval={0}
                                          angle={-18}
                                          textAnchor="end"
                                       />
                                       <YAxis stroke="#9ca3af" fontSize={8} tickLine={false} allowDecimals={false} width={22} />
                                       <RechartsTooltip content={renderPenyulangTooltip} />
                                       <Bar dataKey="workOrder" name="Work Order" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={18} />
                                       <Line 
                                          type="monotone" 
                                          dataKey="realisasi" 
                                          name="Realisasi WO" 
                                          stroke="#0d8291" 
                                          strokeWidth={1.75} 
                                          dot={{ r: 2, fill: "#2dd4bf", stroke: "#0d8291", strokeWidth: 1 }} 
                                          activeDot={{ r: 4, fill: "#2dd4bf" }} 
                                       />
                                    </ComposedChart>
                                 </ResponsiveContainer>
                              )}
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Bottom span: Grid 12 (Ringkas & Proporsional) */}
            <div className={`h-10 ${cardClass} rounded-xl px-3 py-1 flex items-center justify-around shrink-0 border`}>
               {(stats?.kondisiHarian || [
                  { label: 'Personil', status: 'FIT 100%' },
                  { label: 'Cuaca', status: 'Cerah' },
                  { label: 'Kendaraan', status: 'Aman' },
                  { label: 'Peralatan', status: 'Lengkap' },
                  { label: 'SOP', status: 'Dipatuhi' }
               ]).map((k: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                     <div className={`w-6 h-6 rounded-full ${isDark ? 'bg-white/5 text-[#0d8291]' : 'bg-teal-50 text-[#0d8291]'} flex items-center justify-center shrink-0`}>
                        {i === 0 && <Users className="w-3.5 h-3.5" />}
                        {i === 1 && <Sun className="w-3.5 h-3.5" />}
                        {i === 2 && <Truck className="w-3.5 h-3.5" />}
                        {i === 3 && <Wrench className="w-3.5 h-3.5" />}
                        {i === 4 && <Shield className="w-3.5 h-3.5" />}
                     </div>
                     <div className="leading-tight">
                        <div className={`text-[8px] ${mutedClass} uppercase tracking-wider`}>{k.label}</div>
                        <div className={`text-[11px] font-bold ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>{k.status}</div>
                     </div>
                  </div>
               ))}
            </div>

         </div>

         {/* Right Column (25%) */}
         <div className="w-1/4 flex flex-col gap-2 min-w-0 h-full">
            
            {/* Grid 6: Bar SOP (Stacked) */}
            <div className={`flex-[1.2] ${cardClass} rounded-xl p-3 flex flex-col min-h-0 border`}>
               <div className="flex items-center justify-between mb-2 shrink-0">
                  <h2 className={`text-[11px] font-bold ${titleClass} uppercase tracking-wider`}>SOP Pekerjaan</h2>
                  <span className={`text-[9px] font-medium ${isDark ? 'text-gray-400 bg-white/5 border-white/5' : 'text-slate-600 bg-slate-100 border-slate-200'} px-1.5 py-0.5 rounded border`}>Stacked</span>
               </div>
               <div className="flex-1 relative min-h-0">
                  <div className="absolute inset-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartSopData} margin={{ top: 18, right: 10, left: -25, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff10" : "#0000000f"} vertical={false} />
                           <XAxis 
                              dataKey="name" 
                              tick={{ fill: '#9ca3af', fontSize: 8 }} 
                              axisLine={false} 
                              tickLine={false}
                              interval={0}
                              tickFormatter={(v: string) => {
                                 if (v === 'SWITCHING & PROTEKSI') return 'PROTEKSI';
                                 if (v.length > 7) return v.slice(0, 6) + '..';
                                 return v;
                              }}
                           />
                           <YAxis tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} />
                           <RechartsTooltip content={renderCustomStackedTooltip} cursor={{ fill: isDark ? '#ffffff05' : '#00000005' }} />
                           <Legend 
                              wrapperStyle={{ fontSize: '9px', paddingTop: '4px' }} 
                              iconSize={8} 
                              formatter={(value) => <span className={`${isDark ? 'text-gray-300' : 'text-slate-700'} font-medium text-[9px]`}>{value}</span>}
                           />
                           <Bar 
                              dataKey="realisasi" 
                              name="Realisasi WO" 
                              stackId="sopStack" 
                              fill="#0d8291" 
                           />
                           <Bar 
                              dataKey="workOrder" 
                              name="Work Order" 
                              stackId="sopStack" 
                              fill="#f59e0b" 
                              radius={[4, 4, 0, 0]} 
                              label={renderVerticalBarLabel}
                           />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>

            {/* Grid 7: Donut */}
            <div className={`flex-1 ${cardClass} rounded-xl p-3 flex flex-col min-h-0 border`}>
               <h2 className={`text-[11px] font-bold ${titleClass} mb-1 uppercase tracking-wider text-center shrink-0`}>Kategori Pekerjaan</h2>
               <div className="flex-1 relative min-h-0">
                  <div className="absolute inset-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                           <Pie
                              data={stats?.chartKategori || []}
                              cx="50%"
                              cy="50%"
                              innerRadius="45%"
                              outerRadius="80%"
                              dataKey="value"
                              paddingAngle={3}
                              labelLine={false}
                              label={renderCustomizedLabel}
                           >
                              {(stats?.chartKategori || []).map((entry: any, index: number) => (
                                 <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#0ea5e9', '#ef4444', '#8b5cf6'][index % 5]} />
                              ))}
                           </Pie>
                           <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#121c22' : '#ffffff', borderColor: isDark ? '#ffffff15' : '#e2e8f0', color: isDark ? '#ffffff' : '#1e293b', fontSize: '10px', borderRadius: '8px' }} />
                           <Legend wrapperStyle={{ fontSize: '9px' }} iconSize={8} layout="horizontal" verticalAlign="bottom" align="center" />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>

            {/* Grid 8: Bar ULP (Stacked) */}
            <div className={`flex-[1.2] ${cardClass} rounded-xl p-3 flex flex-col min-h-0 border`}>
               <div className="flex items-center justify-between mb-2 shrink-0">
                  <h2 className={`text-[11px] font-bold ${titleClass} uppercase tracking-wider`}>Berdasarkan ULP</h2>
                  <span className={`text-[9px] font-medium ${isDark ? 'text-gray-400 bg-white/5 border-white/5' : 'text-slate-600 bg-slate-100 border-slate-200'} px-1.5 py-0.5 rounded border`}>Stacked</span>
               </div>
               <div className="flex-1 relative min-h-0">
                  <div className="absolute inset-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartUlpData} layout="vertical" margin={{ top: 0, right: 55, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff10" : "#0000000f"} horizontal={false} />
                           <XAxis type="number" hide />
                           <YAxis 
                              dataKey="name" 
                              type="category" 
                              tick={{ fill: '#9ca3af', fontSize: 8 }} 
                              axisLine={false} 
                              tickLine={false} 
                              width={80} 
                           />
                           <RechartsTooltip content={renderCustomStackedTooltip} cursor={{ fill: isDark ? '#ffffff05' : '#00000005' }} />
                           <Legend 
                              wrapperStyle={{ fontSize: '9px', paddingTop: '4px' }} 
                              iconSize={8} 
                              formatter={(value) => <span className={`${isDark ? 'text-gray-300' : 'text-slate-700'} font-medium text-[9px]`}>{value}</span>}
                           />
                           <Bar 
                              dataKey="realisasi" 
                              name="Realisasi WO" 
                              stackId="ulpStack" 
                              fill="#0d8291" 
                           />
                           <Bar 
                              dataKey="workOrder" 
                              name="Work Order" 
                              stackId="ulpStack" 
                              fill="#f59e0b" 
                              radius={[0, 4, 4, 0]} 
                              label={renderHorizontalBarLabel}
                           />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>

         </div>

      </main>
    </div>
  );
}
