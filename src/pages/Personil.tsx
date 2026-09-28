import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  HeartPulse, 
  RefreshCw, 
  ChevronRight,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { gasService } from '../services/gasService';
import { PersonilRingkasanTab } from '../components/personil/PersonilRingkasanTab';
import { PersonilDetailTab } from '../components/personil/PersonilDetailTab';
import { PersonilKesehatanTab } from '../components/personil/PersonilKesehatanTab';
import { PersonilDetailModal } from '../components/personil/PersonilDetailModal';
import { getStatusPdkb } from '../components/personil/personilUtils';

export default function Personil() {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'detail' | 'kesehatan'>('ringkasan');
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await gasService.post('getAllPersonil');
      if (res && res.success && Array.isArray(res.data)) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch personil data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      await gasService.post('syncPersonilAndKesehatan', {});
      gasService.clearCache('getAllPersonil');
      gasService.clearCache('getLogKesehatan');
      gasService.clearCache('getKesehatanOverview');
      await fetchData();
    } catch (err) {
      console.error('Failed to sync personil data:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalAktif = data.filter(p => getStatusPdkb(p) === 'AKTIF').length;

  return (
    <div className="min-h-screen bg-[#060b0d] text-gray-200 p-4 sm:p-6 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={() => navigate('/office')}
            className="p-2 sm:p-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-primary/50 hover:bg-white/10 transition-colors shrink-0"
            title="Kembali ke Menu Office"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-primary uppercase font-bold tracking-widest bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                PDKB-TM 20kV
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-xs text-gray-400 font-mono">PLN UP3 Watampone</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase">
              Data Personil & Legalitas
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              {data.length} Total Personil Terdaftar • <span className="text-emerald-400 font-bold">{totalAktif} Aktif Bekerja</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleSyncData}
            disabled={loading || syncing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            title="Sinkronisasikan seluruh data dari Spreadsheet ke Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || syncing ? 'animate-spin text-primary' : ''}`} />
            <span>{syncing ? 'Menyinkronkan...' : loading ? 'Memuat...' : 'Sinkron Data'}</span>
          </button>
        </div>
      </div>

      {/* TOP TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-white/10 mb-8 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('ringkasan')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-t-lg text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'ringkasan'
              ? 'text-primary border-primary bg-primary/10 shadow-[0_4px_12px_rgba(0,188,212,0.15)]'
              : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Ringkasan</span>
        </button>

        <button
          onClick={() => setActiveTab('detail')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-t-lg text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'detail'
              ? 'text-primary border-primary bg-primary/10 shadow-[0_4px_12px_rgba(0,188,212,0.15)]'
              : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Detail Personil</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white">
            {data.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('kesehatan')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-t-lg text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'kesehatan'
              ? 'text-primary border-primary bg-primary/10 shadow-[0_4px_12px_rgba(0,188,212,0.15)]'
              : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Laporan Kesehatan</span>
        </button>
      </div>

      {/* TAB CONTENTS */}
      {loading && data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
          <span className="text-sm font-mono tracking-widest uppercase">Memuat Data Personil & Legalitas...</span>
        </div>
      ) : (
        <>
          {activeTab === 'ringkasan' && (
            <PersonilRingkasanTab 
              personilList={data} 
              onSelectPerson={setSelectedPerson} 
            />
          )}

          {activeTab === 'detail' && (
            <PersonilDetailTab 
              personilList={data} 
              onSelectPerson={setSelectedPerson} 
            />
          )}

          {activeTab === 'kesehatan' && (
            <PersonilKesehatanTab 
              personilList={data} 
              onRefreshData={fetchData} 
            />
          )}
        </>
      )}

      {/* PERSONIL DETAIL & RADAR CHART MODAL */}
      {selectedPerson && (
        <PersonilDetailModal
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
          personilList={data}
          onRefreshData={fetchData}
        />
      )}
    </div>
  );
}
