const fs = require('fs');

const content = `import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gasService } from "../services/gasService";
import { formatDate } from "../lib/utils";
import {
  LogIn, Filter, Activity, Zap, DollarSign,
  AlertTriangle, Lightbulb, RefreshCw, CheckCircle2,
  Users, Sun, Truck, Tool, Shield, X
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Map markers setup
const createCustomIcon = (status: string) => {
  let color = "#9ca3af"; // default gray
  let pulseClass = "";
  
  if (status === "PLANNING") color = "#f97316"; // orange
  if (status === "PROSES EKSEKUSI") {
    color = "#eab308"; // yellow
    pulseClass = "marker-pulse";
  }
  if (status === "SWA") color = "#ef4444"; // red
  if (status === "SELESAI") color = "#22c55e"; // green

  return L.divIcon({
    className: "custom-leaflet-icon",
    html: \`<div class="relative w-4 h-4">
             \${pulseClass ? \`<div class="absolute inset-0 rounded-full bg-[\${color}] opacity-75 animate-ping"></div>\` : ''}
             <div class="relative w-4 h-4 rounded-full border-2 border-white shadow-md" style="background-color: \${color}"></div>
           </div>\`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight="bold">
      {\`\${(percent * 100).toFixed(0)}%\`}
    </text>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const currentYear = new Date().getFullYear().toString();
  
  const [filters, setFilters] = useState({
    tanggal: '',
    bulan: '',
    tahun: currentYear,
    ulp: '',
    gi: '',
    penyulang: '',
    sop: '',
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await gasService.post("getDashboardStats", { filters });
      if (res.success) {
        setStats(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  // Keep alive ping
  useEffect(() => {
    const keepAliveInterval = setInterval(() => {
      gasService.post("getDashboardStats", { filters }).then((data) => {
         if (data && data.success) {
            setStats(data.data);
         }
      }).catch(e => console.error("Keep-alive error", e));
    }, 10 * 60 * 1000);

    return () => clearInterval(keepAliveInterval);
  }, [filters]);

  if (loading && !stats) {
    return (
      <div className="h-screen w-screen bg-[#05080a] flex flex-col items-center justify-center text-white">
        <Activity className="w-12 h-12 text-[#0d8291] animate-spin mb-4" />
        <p className="text-gray-400 font-mono">MEMUAT DASHBOARD...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#05080a] p-2 flex flex-col gap-2 font-sans text-white text-sm">
      <style>{\`
        .leaflet-container {
           background: #0d161a !important;
           border-radius: 0.5rem;
           width: 100%;
           height: 100%;
           z-index: 10;
        }
      \`}</style>
      
      {/* Grid 1: Header */}
      <header className="h-14 bg-[#0d161a] border border-white/10 rounded-xl flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0d8291] to-[#044a53] flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold tracking-wider text-[#0d8291]">PORTAL PDKB RECCA</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Dashboard Operasional</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/10 text-xs font-mono"
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
         <div className="absolute top-16 right-4 w-72 bg-[#121c22] border border-white/10 rounded-xl shadow-2xl p-4 z-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#0d8291] text-xs font-mono">FILTER DATA</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
               <div>
                  <label className="text-[10px] text-gray-500 uppercase">Tahun</label>
                  <select 
                     className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs mt-1 outline-none"
                     value={filters.tahun}
                     onChange={(e) => setFilters({...filters, tahun: e.target.value})}
                  >
                     <option value="2026">2026</option>
                     <option value="2025">2025</option>
                  </select>
               </div>
               <button onClick={() => setShowFilters(false)} className="w-full bg-[#0d8291] text-white py-1.5 rounded text-xs mt-2">Terapkan</button>
            </div>
         </div>
      )}

      {/* Main Grid Container (12 cols x 10 rows) */}
      <main className="flex-1 grid grid-cols-12 grid-rows-10 gap-2 min-h-0">
         
         {/* LEFT COLUMN */}
         
         {/* Grid 10: Rencana Kerja */}
         <div className="col-span-3 row-start-1 row-end-4 bg-[#0d161a] border border-white/10 rounded-xl p-3 flex flex-col">
            <h2 className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wider shrink-0">Rencana Kerja (Hari Ini)</h2>
            <div className="grid grid-cols-2 gap-2 flex-1">
               <div className="bg-white/5 rounded-lg p-2 flex flex-col justify-center items-center">
                  <span className="text-2xl font-bold text-[#0d8291]">{stats?.rencanaHarian?.titik || 0}</span>
                  <span className="text-[10px] text-gray-500 uppercase text-center">Titik</span>
               </div>
               <div className="bg-white/5 rounded-lg p-2 flex flex-col justify-center items-center">
                  <span className="text-2xl font-bold text-blue-400">{stats?.rencanaHarian?.personil || 0}</span>
                  <span className="text-[10px] text-gray-500 uppercase text-center">Personil</span>
               </div>
               <div className="bg-white/5 rounded-lg p-2 flex flex-col justify-center items-center">
                  <span className="text-xl font-bold text-yellow-400">{(stats?.rencanaHarian?.kwh/1000)?.toFixed(1) || 0}k</span>
                  <span className="text-[10px] text-gray-500 uppercase text-center">Est. kWh</span>
               </div>
               <div className="bg-white/5 rounded-lg p-2 flex flex-col justify-center items-center">
                  <span className="text-xl font-bold text-green-400">{(stats?.rencanaHarian?.rp / 1000000)?.toFixed(1) || 0}M</span>
                  <span className="text-[10px] text-gray-500 uppercase text-center">Est. Rp</span>
               </div>
            </div>
         </div>

         {/* Grid 11: List WP */}
         <div className="col-span-3 row-start-4 row-end-10 bg-[#0d161a] border border-white/10 rounded-xl p-3 flex flex-col overflow-hidden">
            <h2 className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wider shrink-0">List Work Plan</h2>
            <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/10 pr-1 space-y-2">
               {stats?.workPlans?.map((wp: any, i: number) => (
                  <div key={i} className="bg-[#121c22] p-2 rounded-lg border border-white/5 text-xs">
                     <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[#0d8291]">{wp.noWo}</span>
                        <span className={\`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase
                           \${wp.status === 'PLANNING' ? 'bg-orange-500/20 text-orange-400' : 
                             wp.status === 'PROSES EKSEKUSI' ? 'bg-yellow-500/20 text-yellow-400' : 
                             wp.status === 'SWA' ? 'bg-red-500/20 text-red-400' : 
                             'bg-green-500/20 text-green-400'}
                        \`}>{wp.status}</span>
                     </div>
                     <p className="text-gray-300 text-[10px]">{wp.detail}</p>
                  </div>
               ))}
            </div>
         </div>


         {/* MIDDLE COLUMN */}

         {/* Grid 2-5 Container */}
         <div className="col-span-6 row-start-1 row-end-2 flex gap-2">
            {/* Grid 2 */}
            <div className="flex-1 bg-[#0d161a] border border-white/10 rounded-xl p-2 flex flex-col justify-center relative overflow-hidden">
               <h2 className="text-[9px] text-gray-500 uppercase font-bold absolute top-1.5 left-2">Real. Titik</h2>
               <div className="mt-3 flex items-end gap-1">
                  <span className="text-xl font-bold leading-none">{stats?.realisasiTitik || 0}</span>
                  <span className="text-[9px] text-gray-500 mb-0.5">/ {stats?.targetTitik || 0}</span>
               </div>
               <div className="w-full bg-white/10 h-1 mt-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0d8291]" style={{ width: \`\${Math.min(100, ((stats?.realisasiTitik || 0)/(stats?.targetTitik || 1)) * 100)}%\`}}></div>
               </div>
            </div>
            
            {/* Grid 3 */}
            <div className="flex-1 bg-[#0d161a] border border-white/10 rounded-xl p-2 flex flex-col justify-center relative overflow-hidden">
               <h2 className="text-[9px] text-gray-500 uppercase font-bold absolute top-1.5 left-2">Saving kWh</h2>
               <div className="mt-3 flex items-end gap-1">
                  <span className="text-lg font-bold leading-none text-yellow-400">{(stats?.savingKwh || 0).toLocaleString()}</span>
               </div>
               <div className="text-[8px] text-gray-500 mt-0.5">T: {(stats?.targetKwh || 0).toLocaleString()}</div>
               <div className="w-full bg-white/10 h-1 mt-0.5 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400" style={{ width: \`\${Math.min(100, ((stats?.savingKwh || 0)/(stats?.targetKwh || 1)) * 100)}%\`}}></div>
               </div>
            </div>

            {/* Grid 4 */}
            <div className="flex-1 bg-[#0d161a] border border-white/10 rounded-xl p-2 flex flex-col justify-center relative overflow-hidden">
               <h2 className="text-[9px] text-gray-500 uppercase font-bold absolute top-1.5 left-2">Saving Rp</h2>
               <div className="mt-3 flex items-end gap-1">
                  <span className="text-lg font-bold leading-none text-green-400">{((stats?.savingRp || 0)/1000000).toFixed(1)}M</span>
               </div>
               <div className="text-[8px] text-gray-500 mt-0.5">T: {((stats?.targetRp || 0)/1000000).toFixed(1)}M</div>
               <div className="w-full bg-white/10 h-1 mt-0.5 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400" style={{ width: \`\${Math.min(100, ((stats?.savingRp || 0)/(stats?.targetRp || 1)) * 100)}%\`}}></div>
               </div>
            </div>

            {/* Grid 5 */}
            <div className="flex-1 bg-[#0d161a] border border-white/10 rounded-xl p-2 flex flex-col justify-center relative overflow-hidden">
               <h2 className="text-[9px] text-gray-500 uppercase font-bold absolute top-1.5 left-2">SAIDI/SAIFI</h2>
               <div className="mt-3 flex items-end gap-2 justify-center">
                  <div className="text-center">
                     <div className="text-sm font-bold text-red-400 leading-none">{stats?.saidi || 0}</div>
                     <div className="text-[8px] text-gray-500">SAIDI</div>
                  </div>
                  <div className="text-center">
                     <div className="text-sm font-bold text-orange-400 leading-none">{stats?.saifi || 0}</div>
                     <div className="text-[8px] text-gray-500">SAIFI</div>
                  </div>
               </div>
            </div>
         </div>

         {/* Grid 9: Map Chart */}
         <div className="col-span-6 row-start-2 row-end-10 bg-[#0d161a] border border-white/10 rounded-xl p-1 relative z-0">
            <MapContainer 
              center={[-5.1476, 119.4327]} 
              zoom={13} 
              zoomControl={false}
              className="w-full h-full rounded-lg"
            >
               <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
               />
               {stats?.mapData?.map((pt: any, i: number) => (
                  <Marker 
                     key={i} 
                     position={[pt.lat, pt.lng]}
                     icon={createCustomIcon(pt.status)}
                  >
                     <Popup className="custom-popup">
                        <div className="text-gray-800 font-mono text-xs font-bold">{pt.id}</div>
                        <div className="text-xs">{pt.status}</div>
                     </Popup>
                  </Marker>
               ))}
            </MapContainer>
         </div>


         {/* RIGHT COLUMN */}

         {/* Grid 6: Bar SOP */}
         <div className="col-start-10 col-end-13 row-start-1 row-end-4 bg-[#0d161a] border border-white/10 rounded-xl p-2 flex flex-col">
            <h2 className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider shrink-0 text-center">SOP Pekerjaan</h2>
            <div className="flex-1 min-h-0 text-[9px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.chartSOP || []} margin={{ top: 15, right: 0, left: -25, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                     <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 8 }} axisLine={false} tickLine={false} />
                     <YAxis tick={{ fill: '#9ca3af', fontSize: 8 }} axisLine={false} tickLine={false} />
                     <RechartsTooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#121c22', border: '1px solid #ffffff10', fontSize: '9px' }} />
                     <Legend wrapperStyle={{ fontSize: '8px' }} iconSize={6} />
                     <Bar dataKey="value" name="Jumlah" radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#fff', fontSize: 8 }}>
                        {(stats?.chartSOP || []).map((entry: any, index: number) => (
                           <Cell key={\`cell-\${index}\`} fill={entry.fill} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Grid 7: Donut */}
         <div className="col-start-10 col-end-13 row-start-4 row-end-7 bg-[#0d161a] border border-white/10 rounded-xl p-2 flex flex-col">
            <h2 className="text-[10px] font-bold text-gray-400 mb-0 uppercase tracking-wider shrink-0 text-center">Kategori Pekerjaan</h2>
            <div className="flex-1 min-h-0 relative text-[9px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                     <Pie
                        data={stats?.chartKategori || []}
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        outerRadius="75%"
                        dataKey="value"
                        paddingAngle={2}
                        labelLine={false}
                        label={renderCustomizedLabel}
                     >
                        {(stats?.chartKategori || []).map((entry: any, index: number) => (
                           <Cell key={\`cell-\${index}\`} fill={entry.fill} />
                        ))}
                     </Pie>
                     <RechartsTooltip contentStyle={{ backgroundColor: '#121c22', border: '1px solid #ffffff10', fontSize: '9px' }} />
                     <Legend wrapperStyle={{ fontSize: '8px' }} iconSize={6} layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Grid 8: Bar Penyulang */}
         <div className="col-start-10 col-end-13 row-start-7 row-end-11 bg-[#0d161a] border border-white/10 rounded-xl p-2 flex flex-col">
            <h2 className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider shrink-0 text-center">Berdasarkan Penyulang</h2>
            <div className="flex-1 min-h-0 text-[9px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.chartPenyulang || []} layout="vertical" margin={{ top: 0, right: 20, left: -25, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 8 }} axisLine={false} tickLine={false} width={50} />
                     <RechartsTooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#121c22', border: '1px solid #ffffff10', fontSize: '9px' }} />
                     <Legend wrapperStyle={{ fontSize: '8px' }} iconSize={6} />
                     <Bar dataKey="value" name="Jumlah" radius={[0, 2, 2, 0]} label={{ position: 'right', fill: '#fff', fontSize: 8 }}>
                        {(stats?.chartPenyulang || []).map((entry: any, index: number) => (
                           <Cell key={\`cell-\${index}\`} fill={entry.fill} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>


         {/* BOTTOM FULL WIDTH EXCEPT RIGHT */}
         
         {/* Grid 12: Kondisi */}
         <div className="col-span-9 row-start-10 row-end-11 bg-[#0d161a] border border-white/10 rounded-xl p-2 flex items-center justify-around">
            {stats?.kondisiHarian?.map((k: any, i: number) => (
               <div key={i} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#0d8291]">
                     {i === 0 && <Users className="w-3.5 h-3.5" />}
                     {i === 1 && <Sun className="w-3.5 h-3.5" />}
                     {i === 2 && <Truck className="w-3.5 h-3.5" />}
                     {i === 3 && <Tool className="w-3.5 h-3.5" />}
                     {i === 4 && <Shield className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                     <div className="text-[8px] text-gray-500 uppercase">{k.label}</div>
                     <div className="text-[11px] font-bold text-gray-200 leading-none">{k.status}</div>
                  </div>
               </div>
            ))}
         </div>

      </main>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Rewrote Dashboard.tsx for Grid System");
