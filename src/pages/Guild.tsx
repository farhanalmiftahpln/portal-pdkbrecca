import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, CheckSquare, Users, Package, Calendar, LogOut, ChevronLeft, ChevronRight, Menu, Truck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

export const Guild: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapTab, setMapTab] = useState<'Semua' | 'Rencana' | 'Realisasi'>('Semua');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
  };
  const [photoIndex, setPhotoIndex] = useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const expandedWidth = isMobile ? 200 : 240;
  const collapsedWidth = isMobile ? 56 : 64;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rencana-wo', label: 'Rencana WO', icon: FileText },
    { id: 'realisasi-wo', label: 'Realisasi WO', icon: CheckSquare },
    { id: 'personil', label: 'Personil', icon: Users },
    { id: 'gudang', label: 'Gudang', icon: Package },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#0a0f12] text-gray-200 font-sans flex flex-row">
      {/* Sidebar Navigation */}
      <motion.aside 
        animate={{ width: isExpanded ? expandedWidth : collapsedWidth }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-[#111c22] border-r border-white/5 flex flex-col shrink-0 relative overflow-hidden"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-1/2 -translate-y-1/2 right-[-16px] w-8 h-8 bg-primary text-black rounded-full z-20 hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,94,0,0.5)] flex items-center justify-center border-2 border-[#111c22]"
        >
          {isExpanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        <div className="p-3 md:p-4 border-b border-white/5 h-16 flex items-center justify-center shrink-0">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            {/* Minimal Logo/Icon */}
            <div 
              className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 cursor-pointer md:cursor-default"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Menu className="w-4 h-4 text-primary" />
            </div>
            
            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex flex-col overflow-hidden"
                >
                  <h1 className="text-sm font-black text-white tracking-tight leading-tight">BAKTI PDKB</h1>
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest">{user?.name?.split(' ')[0]}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <nav className="flex-1 p-2 md:p-3 space-y-2 overflow-y-auto overflow-x-hidden flex flex-col items-center">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 w-full rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap overflow-hidden
                ${activeTab === item.id 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}
                ${isExpanded ? 'px-3 py-2.5' : 'p-2 md:p-2.5 justify-center'}`}
              title={item.label}
            >
              <item.icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        <div className="p-2 md:p-3 border-t border-white/5 shrink-0 flex items-center justify-center">
          <button 
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className={`flex items-center gap-3 w-full rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-400/10 transition-colors whitespace-nowrap overflow-hidden
              ${isExpanded ? 'px-3 py-2.5' : 'p-2 md:p-2.5 justify-center'}`}
            title="Keluar"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  Keluar
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 p-3 md:p-6 overflow-hidden bg-gradient-to-br from-[#0a0f12] to-[#0d1418] flex flex-col h-full">
        <div className="md:hidden flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 shrink-0">
           Guild / <span className="text-white">{menuItems.find(m => m.id === activeTab)?.label}</span>
        </div>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full flex-1 flex flex-col min-h-0"
        >
          {activeTab === 'dashboard' ? (
            <div 
              className="flex flex-col md:grid gap-2 md:gap-3 w-full h-full min-h-0 overflow-y-auto md:overflow-hidden pb-4 md:pb-0 pr-1 md:pr-0 scrollbar-thin scrollbar-thumb-white/10"
              style={!isMobile ? {
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gridTemplateRows: 'min-content 1.5fr 0.5fr'
              } : {}}
            >
              {/* Grid 2 (Left) - Row 1 & 2 */}
              <div className="md:col-start-1 md:col-span-1 md:row-start-2 bg-[#111c22]/80 rounded-2xl border border-white/5 flex flex-col p-4 shadow-lg relative overflow-hidden backdrop-blur-sm shrink-0 h-full min-h-0 order-2 md:order-none"
                style={{ minHeight: isMobile ? '200px' : '0' }}>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 shrink-0">Filter Data</h3>
                <div className="w-full shrink-0 mb-4 flex flex-col gap-2">
                   <div className="grid grid-cols-3 gap-2">
                     {['H1', 'H2', 'H3'].map(filter => (
                       <button 
                         key={filter} 
                         onClick={() => toggleFilter(filter)}
                         className={`bg-[#0a0f12]/80 hover:bg-primary/20 ${selectedFilters.includes(filter) ? 'text-black bg-primary border-primary shadow-[0_0_10px_rgba(255,94,0,0.5)]' : 'text-gray-400 hover:text-white border-white/10 hover:border-primary/50'} border text-[10px] md:text-xs font-bold py-1.5 rounded transition-all uppercase tracking-widest`}
                       >
                         {filter}
                       </button>
                     ))}
                   </div>
                   <div className="grid grid-cols-4 gap-2">
                     {['MU', 'MS', 'KDI', 'MMJ', 'PLP', 'PRE', 'WTP', 'BLK'].map(filter => (
                       <button 
                         key={filter} 
                         onClick={() => toggleFilter(filter)}
                         className={`bg-[#0a0f12]/80 hover:bg-primary/20 ${selectedFilters.includes(filter) ? 'text-black bg-primary border-primary shadow-[0_0_10px_rgba(255,94,0,0.5)]' : 'text-gray-400 hover:text-white border-white/10 hover:border-primary/50'} border text-[10px] md:text-xs font-bold py-1.5 rounded transition-all uppercase tracking-widest`}
                       >
                         {filter}
                       </button>
                     ))}
                   </div>
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 shrink-0">Komponen JTM</h3>
                <div className="flex-1 w-full min-h-0 relative -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
  { name: 'KONDUKTOR', total: 400 },
  { name: 'ISOLATOR', total: 300 },
  { name: 'JUMPER', total: 200 },
  { name: 'TIANG', total: 278 },
  { name: 'S&P', total: 189 },
  { name: 'GARDU', total: 239 }
]} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={7} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={30} />
                      <YAxis stroke="#6b7280" fontSize={8} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0a0f12', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px'}} />
                      <Bar dataKey="total" fill="#ff5e00" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grid 1 (Top Right) - Row 1 */}
              <div className="md:col-start-1 md:col-span-3 md:row-start-1 bg-[#111c22]/80 rounded-2xl border border-white/5 p-3 sm:p-4 flex flex-col justify-between shadow-lg relative overflow-hidden backdrop-blur-sm min-h-[140px] md:min-h-0 shrink-0 order-1 md:order-none">
                <h3 className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-widest mb-2 relative z-10 shrink-0">
                  Pencapaian Kinerja
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 relative z-10 min-h-0">
                  <div className="bg-black/20 p-2 sm:p-3 rounded-xl flex flex-col justify-center border border-white/5 min-h-0">
                    <div className="text-[7px] sm:text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5 truncate">JUMLAH TITIK</div>
                    <div className="text-[6px] text-gray-600 mb-1 uppercase tracking-wider hidden sm:block truncate">Realisasi / Target</div>
                    <div className="text-sm sm:text-lg lg:text-xl font-black text-white leading-none mt-auto truncate">124 <span className="text-[8px] sm:text-[10px] text-gray-500 font-normal">/ 150</span></div>
                  </div>
                  <div className="bg-black/20 p-2 sm:p-3 rounded-xl flex flex-col justify-center border border-white/5 min-h-0">
                    <div className="text-[7px] sm:text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5 truncate">SAVING KWH</div>
                    <div className="text-[6px] text-gray-600 mb-1 uppercase tracking-wider hidden sm:block truncate">Realisasi / Target</div>
                    <div className="text-sm sm:text-lg lg:text-xl font-black text-primary leading-none mt-auto truncate">45.2K <span className="text-[8px] sm:text-[10px] text-primary/50 font-normal">/ 50K</span></div>
                  </div>
                  <div className="bg-black/20 p-2 sm:p-3 rounded-xl flex flex-col justify-center border border-white/5 min-h-0">
                    <div className="text-[7px] sm:text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5 truncate">SAVING RP</div>
                    <div className="text-[6px] text-gray-600 mb-1 uppercase tracking-wider hidden sm:block truncate">Realisasi / Target</div>
                    <div className="text-sm sm:text-lg lg:text-xl font-black text-green-500 leading-none mt-auto truncate">1.2M <span className="text-[8px] sm:text-[10px] text-green-500/50 font-normal">/ 1.5M</span></div>
                  </div>
                  <div className="bg-black/20 p-2 sm:p-3 rounded-xl flex flex-col justify-center border border-white/5 min-h-0">
                    <div className="text-[7px] sm:text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5 truncate">SAIDI / SAIFI</div>
                    <div className="text-[6px] text-gray-600 mb-1 uppercase tracking-wider hidden sm:block truncate">Pencapaian</div>
                    <div className="text-sm sm:text-lg lg:text-xl font-black text-blue-500 flex items-baseline gap-1 leading-none mt-auto truncate">
                      0.45 
                      <span className="text-[8px] sm:text-[10px] text-blue-500/50 font-normal shrink-0">/ 0.60</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 3 (Center) - Row 2 */}
              <div 
                className="md:col-start-2 md:col-span-2 md:row-start-2 bg-[#111c22]/80 rounded-2xl border border-white/5 flex flex-col shadow-lg relative overflow-hidden backdrop-blur-sm shrink-0 h-full min-h-0 order-3 md:order-none"
                style={{ minHeight: isMobile ? '300px' : '0' }}
              >
                <div className="absolute top-0 left-0 z-[400] w-full p-3 flex items-center justify-between pointer-events-none">
                   <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                     <h3 className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest bg-[#111c22]/80 px-2 py-1 rounded backdrop-blur-sm border border-white/10 pointer-events-auto">Tracking WO</h3>
                     <div className="flex bg-[#0a0f12]/80 rounded-lg p-0.5 backdrop-blur-sm border border-white/5 pointer-events-auto">
                        {['Semua', 'Rencana', 'Realisasi'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setMapTab(tab)}
                            className={`px-2 py-1 text-[8px] md:text-[10px] font-bold rounded-md transition-all uppercase tracking-wider ${mapTab === tab ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                          >
                            {tab}
                          </button>
                        ))}
                     </div>
                   </div>
                </div>
                <div className="w-full h-full relative z-0" style={{ minHeight: '0' }}>
                  <MapContainer center={[-6.200000, 106.816666]} zoom={11} className="w-full h-full bg-[#0a0f12] outline-none" zoomControl={false}>
                    <TileLayer
                      url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=cb1_3pk7_1_c53bdd5348924d3c13faead4"
                      attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {(mapTab === 'Semua' || mapTab === 'Rencana') && (
                      <Marker position={[-6.21, 106.80]} icon={L.divIcon({ className: 'custom-pin', html: '<div class="w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-full border border-white shadow-[0_0_10px_rgba(239,68,68,0.8)] relative"><div class="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-50"></div></div>', iconSize: [16, 16], iconAnchor: [8, 8] })} />
                    )}
                    {(mapTab === 'Semua' || mapTab === 'Realisasi') && (
                      <Marker position={[-6.18, 106.83]} icon={L.divIcon({ className: 'custom-pin', html: '<div class="w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border border-white shadow-[0_0_10px_rgba(34,197,94,0.8)] relative"><div class="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50"></div></div>', iconSize: [16, 16], iconAnchor: [8, 8] })} />
                    )}
                  </MapContainer>
                </div>
              </div>

              {/* Grid 4 (Right) - Row 2 & 3 */}
              <div className="md:col-start-4 md:col-span-1 md:row-start-1 md:row-span-3 bg-[#111c22]/80 rounded-2xl border border-white/5 flex flex-col p-4 shadow-lg relative overflow-hidden backdrop-blur-sm h-full min-h-0 shrink-0 order-4 md:order-none">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 shrink-0">Progres WO</h3>
                <div className="h-32 w-full shrink-0 -ml-2 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
  { name: 'Mon', rencana: 10, realisasi: 8 },
  { name: 'Tue', rencana: 15, realisasi: 12 },
  { name: 'Wed', rencana: 20, realisasi: 18 },
  { name: 'Thu', rencana: 22, realisasi: 21 },
  { name: 'Fri', rencana: 28, realisasi: 25 },
  { name: 'Sat', rencana: 30, realisasi: 28 },
  { name: 'Sun', rencana: 35, realisasi: 34 }
]} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={8} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b7280" fontSize={8} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{backgroundColor: '#0a0f12', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '9px', paddingTop: '5px'}} />
                      <Line type="monotone" dataKey="rencana" name="Rencana WO" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="realisasi" name="Realisasi" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2 shrink-0">List Rencana WO</h3>
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                  {[
                    { id: 'WO-2023-001', title: 'Perbaikan Tiang Miring', status: 'On Progress' },
                    { id: 'WO-2023-002', title: 'Penggantian Isolator Tembus', status: 'Pending' },
                    { id: 'WO-2023-003', title: 'Pemangkasan Pohon Jaringan', status: 'On Progress' },
                    { id: 'WO-2023-004', title: 'Pemasangan Arrester Baru', status: 'Pending' }
                  ].map((wo, i) => (
                    <div key={i} className="bg-black/30 p-2.5 rounded-lg border border-white/5 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-primary/80">{wo.id}</span>
                        <div className="flex items-center gap-1.5">
                          {wo.status === 'On Progress' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse-slow shadow-[0_0_8px_rgba(250,204,21,0.6)]" style={{ animationDuration: '2s' }}></div>
                          )}
                          <span className={`text-[8px] uppercase tracking-wider font-bold ${wo.status === 'On Progress' ? 'text-yellow-400' : 'text-gray-500'}`}>{wo.status}</span>
                        </div>
                      </div>
                      <span className="text-xs text-white/90 truncate">{wo.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid 5 (Bottom) - Row 3 */}
              <div className="md:col-start-1 md:col-span-3 md:row-start-3 bg-[#111c22]/80 rounded-2xl border border-white/5 flex items-center justify-center p-2 md:p-3 shadow-lg relative overflow-hidden backdrop-blur-sm h-full min-h-0 shrink-0 order-5 md:order-none">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 w-full h-full relative z-10">
                  <div className="bg-black/20 rounded-xl p-2 md:p-2 border border-white/5 flex flex-col justify-center items-center text-center group hover:bg-black/40 transition-colors">
                     <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                     <h4 className="text-[6px] md:text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-0.5 truncate w-full">Jumlah Personil</h4>
                     <div className="text-base md:text-xl font-black text-white leading-none">24 <span className="text-[7px] md:text-[9px] text-gray-500 font-normal">Tim</span></div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2 md:p-2 border border-white/5 flex flex-col justify-center items-center text-center group hover:bg-black/40 transition-colors">
                     <Truck className="w-5 h-5 md:w-6 md:h-6 text-orange-400 mb-1 group-hover:scale-110 transition-transform" />
                     <h4 className="text-[6px] md:text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-0.5 truncate w-full">Jumlah Armada</h4>
                     <div className="text-base md:text-xl font-black text-white leading-none">12 <span className="text-[7px] md:text-[9px] text-gray-500 font-normal">Unit</span></div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2 md:p-2 border border-white/5 flex flex-col justify-center items-center text-center group hover:bg-black/40 transition-colors">
                     <div className="w-5 h-5 md:w-6 md:h-6 mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 w-full h-full"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="16" cy="7.5" r="2.5"/><path d="M8 3.2V15"/></svg>
                     </div>
                     <h4 className="text-[6px] md:text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-0.5 truncate w-full">Kondisi Fisik / Mental</h4>
                     <div className="text-xs md:text-base font-black text-green-400 uppercase tracking-wider leading-none mt-0.5 md:mt-1 truncate">Fit & Siap</div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2 md:p-2 border border-white/5 flex flex-col justify-center items-center text-center group hover:bg-black/40 transition-colors">
                     <div className="w-5 h-5 md:w-6 md:h-6 mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 w-full h-full"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>
                     </div>
                     <h4 className="text-[6px] md:text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-0.5 truncate w-full">Kondisi Cuaca</h4>
                     <div className="text-xs md:text-base font-black text-yellow-400 uppercase tracking-wider leading-none mt-0.5 md:mt-1 truncate">Cerah</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#111c22]/50 border border-white/5 rounded-2xl p-6 md:p-12 h-full flex flex-col items-center justify-center text-center shadow-xl backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                 <div className="w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
              </div>
              
              <div className="relative z-10">
                {React.createElement(menuItems.find(m => m.id === activeTab)?.icon || LayoutDashboard, {
                  className: "w-16 h-16 md:w-20 md:h-20 text-primary/40 mb-6 mx-auto"
                })}
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
                  {menuItems.find(m => m.id === activeTab)?.label}
                </h2>
                <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
                  Modul <span className="text-white font-bold">{menuItems.find(m => m.id === activeTab)?.label}</span> sedang dalam tahap sinkronisasi dengan workspace GUILD Bakti PDKB.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};
