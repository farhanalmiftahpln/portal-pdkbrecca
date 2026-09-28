import React, { useState, useEffect } from "react";
import { gasService } from "../services/gasService";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import {
  Bell,
  UserCircle,
  FileText,
  CheckSquare,
  Calendar,
  Activity,
  BarChart2,
  Users,
  Package,
  Archive,
  ChevronRight,
  Zap,
  DollarSign,
  Lightbulb,
} from "lucide-react";

export default function Office() {
  const { user, logout } = useAuthStore();
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const currentYear = new Date().getFullYear().toString();
  const currentMonth = new Date().getMonth() + 1;
  const currentSemester = currentMonth <= 6 ? '1' : '2';

  const MONTH_NAMES_ID = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const [filters] = useState({
    tanggal: '',
    bulan: currentMonth.toString(),
    tahun: currentYear,
    ulp: '',
    gi: '',
    penyulang: '',
    sop: '',
    semester: currentSemester
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      const res = await gasService.post("getDashboardStats", { filters });
      if (res.success) {
        setStats(res.data);
      }
      setLoadingStats(false);
    };
    fetchStats();
  }, [filters]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    colorClass,
    borderClass,
  }: any) => (
    <div
      className={`bg-[#0d161a] p-3 sm:p-4 rounded-xl border-l-4 ${borderClass} shadow-xl flex flex-col justify-between overflow-hidden`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-[10px] sm:text-[11px] text-gray-400 uppercase font-medium leading-tight">
          {title}
        </div>
        <Icon className={`h-4 w-4 shrink-0 ml-2 ${colorClass}`} />
      </div>
      <div
        className="text-base sm:text-lg lg:text-xl font-black text-white break-words leading-tight"
        title={String(value)}
      >
        {value}
      </div>
    </div>
  );
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const menus = [
    { title: "Work Order", icon: FileText, path: "/work-order" },
    { title: "Review WO", icon: CheckSquare, path: "/review-wo" },
    { title: "Work Plan", icon: Calendar, path: "/work-plan" },
    { title: "Realisasi Kerja", icon: Activity, path: "/realisasi" },
    { title: "Laporan", icon: BarChart2, path: "/laporan" },
    { title: "Data Personil", icon: Users, path: "/personil" },
    { title: "Warehouse", icon: Package, path: "/warehouse" },
    { title: "Arsip PDKB", icon: Archive, path: "/arsip" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0a0f12] text-white flex flex-col font-sans">
      {/* Top Navigation Bar Component */}
      <header className="h-14 border-b border-[#0d8291]/30 bg-[#0d161a] flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src="https://lh3.googleusercontent.com/d/1N2E29tQtPDW9kN82rA4R1W8NqSKLq-xg"
            alt="Portal PDKB Recca Logo"
            className="h-8 sm:h-10 w-auto object-contain cursor-pointer"
            onClick={() => navigate("/")}
            referrerPolicy="no-referrer"
          />
          <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white uppercase">
            PORTAL <span className="text-primary">PDKB</span> RECCA
          </h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-0.5 bg-white/5 rounded border border-white/10 font-bold uppercase tracking-widest">
              {user?.role || "Guest"}
            </span>
            <span className="font-bold text-tertiary">
              {user?.name || "User"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-gray-400 hover:text-white transition-colors">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-[#0d161a]"></span>
            </button>
            <div className="relative">
              <button
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-secondary to-primary border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/50"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              ></button>

              {showProfileMenu && (
                <div className="origin-top-right absolute right-0 mt-3 w-48 rounded bg-[#1a252b] border border-white/10 shadow-xl ring-1 ring-black ring-opacity-5 divide-y divide-white/5 focus:outline-none">
                  <div className="py-2">
                    <button
                      onClick={() => navigate("/profil")}
                      className="group flex items-center px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 hover:bg-white/5 hover:text-white w-full text-left"
                    >
                      <UserCircle className="mr-3 h-4 w-4 text-gray-500 group-hover:text-primary" />
                      Profil
                    </button>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="group flex items-center px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 w-full text-left"
                    >
                      <span className="mr-3 h-4 w-4 flex items-center justify-center">
                        ⏻
                      </span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-6">
        {/* Dashboard Kinerja Section */}
        <div>
          <div className="flex items-center justify-between mb-4 mt-2">
            <div className="flex items-center gap-3">
              
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Kinerja & Kontribusi Bulan {MONTH_NAMES_ID[currentMonth]} {currentYear}
              </h3>
            </div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-[10px] font-bold text-primary hover:text-primary-dark uppercase tracking-widest flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded transition-colors"
            >
              DASHBOARD
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title={
                <span>
                  Jumlah Titik <br />
                  <span className="text-[9px] text-gray-500 capitalize">
                    (Realisasi / Target)
                  </span>
                </span>
              }
              value={loadingStats ? "..." : `${stats?.realisasiTitik || 0} / ${stats?.targetTitik || 0}`}
              icon={Activity}
              borderClass="border-blue-500"
              colorClass="text-blue-400"
            />
            <StatCard
              title={
                <span>
                  Saving kWh <br />
                  <span className="text-[9px] text-gray-500 capitalize">
                    (Realisasi / Target)
                  </span>
                </span>
              }
              value={loadingStats ? "..." : `${stats?.savingKwh ? stats.savingKwh.toLocaleString("id-ID") : 0} / ${stats?.targetKwh ? stats.targetKwh.toLocaleString("id-ID") : 0}`}
              icon={Zap}
              borderClass="border-yellow-500"
              colorClass="text-yellow-400"
            />
            <StatCard
              title={
                <span>
                  Saving Rp <br />
                  <span className="text-[9px] text-gray-500 capitalize">
                    (Realisasi / Target)
                  </span>
                </span>
              }
              value={loadingStats ? "..." : `Rp ${stats?.savingRp ? stats.savingRp.toLocaleString("id-ID") : 0} / ${stats?.targetRp ? stats.targetRp.toLocaleString("id-ID") : 0}`}
              icon={DollarSign}
              borderClass="border-green-500"
              colorClass="text-green-400"
            />
            <StatCard
              title={
                <span>
                  SAIDI / SAIFI <br />
                  <span className="text-[9px] text-gray-500 capitalize">
                    (Pencapaian)
                  </span>
                </span>
              }
              value={loadingStats ? "..." : `${stats?.saidi ? stats.saidi.toFixed(2) : "0"} / ${stats?.saifi ? stats.saifi.toFixed(2) : "0"}`}
              icon={Lightbulb}
              borderClass="border-purple-500"
              colorClass="text-purple-400"
            />
          </div>
        </div>

        {/* Menu Section */}
        <div>
          <div className="flex items-center gap-3 mb-4 mt-2">
            <div className="w-1.5 h-4 bg-primary"></div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              MENU UTAMA
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {menus.map((menu, idx) => {
              const Icon = menu.icon;
              return (
                <button
                  key={idx}
                  onClick={() => navigate(menu.path)}
                  className="group bg-[#0d161a] p-4 rounded-xl border border-white/5 hover:border-primary/50 transition-all shadow-xl hover:shadow-[0_0_15px_rgba(255,94,0,0.15)] flex flex-col items-start justify-between h-28 relative overflow-hidden focus:outline-none"
                >
                  <div className="text-gray-400 group-hover:text-primary transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 flex w-full items-center justify-between text-left">
                    <span className="font-bold text-gray-300 uppercase tracking-tight text-[11px] group-hover:text-white transition-colors leading-tight">
                      {menu.title}
                    </span>
                  </div>
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Bottom Ticker / Info */}
      <footer className="h-8 bg-[#0d161a] border-t border-white/5 flex items-center px-4 overflow-hidden shrink-0 hidden md:flex">
        <div className="bg-primary text-black text-[9px] font-bold px-2 py-0.5 rounded mr-4 shrink-0 uppercase tracking-widest">
          News
        </div>
        <div className="text-[10px] text-gray-400 whitespace-nowrap animate-pulse">
          <span className="mx-4 text-white">
            [Info] Work Plan untuk Minggu berjalan telah disetujui oleh ASMAN
          </span>
          <span className="mx-4 text-gray-500">•</span>
          <span className="mx-4">
            [Update] Maintenance server dijadwalkan pada hari Sabtu pukul 22:00
            WITA
          </span>
          <span className="mx-4 text-gray-500">•</span>
          <span className="mx-4">
            [Stats] Peningkatan efisiensi PDKB bulan ini mencapai 12.4%
          </span>
        </div>
      </footer>
    </div>
  );
}
