import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Activity, 
  Smile, 
  Frown, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  RefreshCw, 
  Search, 
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import { gasService } from '../../services/gasService';
import { computeHealthOverview, getStatusPdkb } from './personilUtils';
import { InputKesehatanModal } from './InputKesehatanModal';

interface PersonilKesehatanTabProps {
  personilList: any[];
  onRefreshData: () => void;
}

export const PersonilKesehatanTab: React.FC<PersonilKesehatanTabProps> = ({
  personilList,
  onRefreshData
}) => {
  const [logList, setLogList] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [searchLog, setSearchLog] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SEHAT' | 'KURANG_SEHAT' | 'TIDAK_SEHAT'>('ALL');

  // Hanya personil PDKB berstatus AKTIF yang dihitung dan dapat diupdate kesehatannya
  const activePersonilList = personilList.filter(p => getStatusPdkb(p) === 'AKTIF');

  // Compute overview from active personil list
  const overview = computeHealthOverview(activePersonilList);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await gasService.post('getLogKesehatan', { limit: 100 });
      if (res && res.success && Array.isArray(res.data)) {
        setLogList(res.data);
      }
    } catch (err) {
      console.error('Failed to load log kesehatan:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const total = overview.total || 1;
  const fisikPctSehat = Math.round((overview.fisik.SEHAT / total) * 100);
  const fisikPctKurang = Math.round((overview.fisik.KURANG_SEHAT / total) * 100);
  const fisikPctTidak = Math.round((overview.fisik.TIDAK_SEHAT / total) * 100);

  const mentalPctSehat = Math.round((overview.mental.SEHAT / total) * 100);
  const mentalPctKurang = Math.round((overview.mental.KURANG_SEHAT / total) * 100);
  const mentalPctTidak = Math.round((overview.mental.TIDAK_SEHAT / total) * 100);

  // Filtered log list
  const filteredLogs = logList.filter(log => {
    const nama = String(log.NAMA || log.nama || log.name || '').toLowerCase();
    const nip = String(log.NIP || log.nip || '').toLowerCase();
    const query = searchLog.toLowerCase().trim();

    const matchesSearch = !query || nama.includes(query) || nip.includes(query);
    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;

    const f = String(log['STATUS FISIK'] || log.status_fisik || log.statusFisik || '').toUpperCase();
    const m = String(log['STATUS MENTAL'] || log.status_mental || log.statusMental || '').toUpperCase();

    if (statusFilter === 'SEHAT') {
      return f.includes('SEHAT') && !f.includes('KURANG') && !f.includes('TIDAK') &&
             m.includes('SEHAT') && !m.includes('KURANG') && !m.includes('TIDAK');
    }
    if (statusFilter === 'KURANG_SEHAT') {
      return f.includes('KURANG') || m.includes('KURANG');
    }
    if (statusFilter === 'TIDAK_SEHAT') {
      return f.includes('TIDAK') || m.includes('TIDAK');
    }

    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-4 bg-primary rounded-full"></div>
          <h2 className="text-xs font-bold text-white uppercase tracking-widest">
            Overview Kesehatan Personil
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              gasService.clearCache('getLogKesehatan');
              gasService.clearCache('getAllPersonil');
              onRefreshData();
              fetchLogs();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold tracking-wider transition-colors border border-white/5"
            title="Refresh Data Kesehatan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
            <span>Sinkron Data</span>
          </button>
          <button
            onClick={() => setShowInputModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-black text-xs font-bold tracking-wider transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Input Pemeriksaan</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW CARDS: KESEHATAN FISIK & KESEHATAN MENTAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. KESEHATAN FISIK */}
        <div className="bg-[#121b20] border border-blue-500/20 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Kesehatan Fisik</h3>
                  <p className="text-[10px] text-gray-400">Kondisi fisik operasional personil</p>
                </div>
              </div>
              <span className="text-xs font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded">
                Total {overview.total} Personil Aktif
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Sehat */}
              <div className="p-3 rounded-lg bg-[#0e171b] border border-emerald-500/20 text-center">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Sehat
                </div>
                <div className="text-2xl font-mono font-extrabold text-white">
                  {overview.fisik.SEHAT}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  {fisikPctSehat}%
                </div>
              </div>

              {/* Kurang Sehat */}
              <div className="p-3 rounded-lg bg-[#0e171b] border border-amber-500/20 text-center">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Kurang Sehat
                </div>
                <div className="text-2xl font-mono font-extrabold text-white">
                  {overview.fisik.KURANG_SEHAT}
                </div>
                <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                  {fisikPctKurang}%
                </div>
              </div>

              {/* Tidak Sehat */}
              <div className="p-3 rounded-lg bg-[#0e171b] border border-rose-500/20 text-center">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                  <XCircle className="w-3 h-3" /> Tidak Sehat
                </div>
                <div className="text-2xl font-mono font-extrabold text-white">
                  {overview.fisik.TIDAK_SEHAT}
                </div>
                <div className="text-[10px] text-rose-400 font-mono mt-0.5">
                  {fisikPctTidak}%
                </div>
              </div>
            </div>
          </div>

          {/* Ratio bar */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 font-mono">
              <span>Distribusi Kondisi Fisik</span>
              <span>{overview.fisik.SEHAT} dari {overview.total} Fit</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex">
              <div style={{ width: `${fisikPctSehat}%` }} className="bg-emerald-500 h-full" title={`Sehat: ${overview.fisik.SEHAT}`}></div>
              <div style={{ width: `${fisikPctKurang}%` }} className="bg-amber-500 h-full" title={`Kurang Sehat: ${overview.fisik.KURANG_SEHAT}`}></div>
              <div style={{ width: `${fisikPctTidak}%` }} className="bg-rose-500 h-full" title={`Tidak Sehat: ${overview.fisik.TIDAK_SEHAT}`}></div>
            </div>
          </div>
        </div>

        {/* 2. KESEHATAN MENTAL */}
        <div className="bg-[#121b20] border border-emerald-500/20 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Smile className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Kesehatan Mental</h3>
                  <p className="text-[10px] text-gray-400">Tingkat fokus, stres & kesiapan psikologis</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">
                Total {overview.total} Personil Aktif
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Sehat */}
              <div className="p-3 rounded-lg bg-[#0e171b] border border-emerald-500/20 text-center">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Sehat
                </div>
                <div className="text-2xl font-mono font-extrabold text-white">
                  {overview.mental.SEHAT}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  {mentalPctSehat}%
                </div>
              </div>

              {/* Kurang Sehat */}
              <div className="p-3 rounded-lg bg-[#0e171b] border border-amber-500/20 text-center">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Kurang Sehat
                </div>
                <div className="text-2xl font-mono font-extrabold text-white">
                  {overview.mental.KURANG_SEHAT}
                </div>
                <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                  {mentalPctKurang}%
                </div>
              </div>

              {/* Tidak Sehat */}
              <div className="p-3 rounded-lg bg-[#0e171b] border border-rose-500/20 text-center">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                  <XCircle className="w-3 h-3" /> Tidak Sehat
                </div>
                <div className="text-2xl font-mono font-extrabold text-white">
                  {overview.mental.TIDAK_SEHAT}
                </div>
                <div className="text-[10px] text-rose-400 font-mono mt-0.5">
                  {mentalPctTidak}%
                </div>
              </div>
            </div>
          </div>

          {/* Ratio bar */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 font-mono">
              <span>Distribusi Kondisi Mental</span>
              <span>{overview.mental.SEHAT} dari {overview.total} Siap</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex">
              <div style={{ width: `${mentalPctSehat}%` }} className="bg-emerald-500 h-full" title={`Sehat: ${overview.mental.SEHAT}`}></div>
              <div style={{ width: `${mentalPctKurang}%` }} className="bg-amber-500 h-full" title={`Kurang Sehat: ${overview.mental.KURANG_SEHAT}`}></div>
              <div style={{ width: `${mentalPctTidak}%` }} className="bg-rose-500 h-full" title={`Tidak Sehat: ${overview.mental.TIDAK_SEHAT}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* DAFTAR LOG RIWAYAT KESEHATAN */}
      <div className="bg-[#121b20] border border-white/5 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                Log Riwayat Pemeriksaan Kesehatan
              </h3>
              <p className="text-[10px] text-gray-400">
                Pencatatan riwayat di sheet <span className="text-primary font-mono">LOG KESEHATAN</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center bg-[#0a1014] p-1 rounded-lg border border-white/5">
              {(['ALL', 'SEHAT', 'KURANG_SEHAT', 'TIDAK_SEHAT'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setStatusFilter(mode)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    statusFilter === mode
                      ? 'bg-primary text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {mode === 'ALL' ? 'Semua' : mode === 'SEHAT' ? 'Sehat' : mode === 'KURANG_SEHAT' ? 'Kurang Sehat' : 'Tidak Sehat'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Cari log nama / NIP..."
                value={searchLog}
                onChange={e => setSearchLog(e.target.value)}
                className="bg-[#0a1014] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Table of Health Logs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-gray-400 uppercase tracking-widest font-mono bg-[#0e161b]">
                <th className="py-2.5 px-3">Tanggal / Waktu</th>
                <th className="py-2.5 px-3">Personil</th>
                <th className="py-2.5 px-3">Status Fisik</th>
                <th className="py-2.5 px-3">Status Mental</th>
                <th className="py-2.5 px-3">Tanda Vital</th>
                <th className="py-2.5 px-3">Catatan / Keluhan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingLogs ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                      <span>Memuat log pemeriksaan kesehatan...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
                    Belum ada riwayat pemeriksaan kesehatan yang tercatat. Klik tombol <strong>Input Pemeriksaan</strong> untuk menambahkan.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const tgl = log.TANGGAL || log.tanggal || log.created_at || '-';
                  const nama = log.NAMA || log.nama || log.name || '-';
                  const nip = log.NIP || log.nip || '-';
                  const fisik = String(log['STATUS FISIK'] || log.status_fisik || log.statusFisik || 'SEHAT').toUpperCase();
                  const mental = String(log['STATUS MENTAL'] || log.status_mental || log.statusMental || 'SEHAT').toUpperCase();
                  const sistole = log.SISTOLE || log.sistole;
                  const diastole = log.DIASTOLE || log.diastole;
                  const nadi = log.NADI || log.nadi;
                  const suhu = log.SUHU || log.suhu;
                  const ket = log.KETERANGAN || log.keterangan || log.keluhan || '-';

                  const renderBadge = (st: string) => {
                    if (st.includes('KURANG')) {
                      return (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          KURANG SEHAT
                        </span>
                      );
                    }
                    if (st.includes('TIDAK')) {
                      return (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          TIDAK SEHAT
                        </span>
                      );
                    }
                    return (
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        SEHAT
                      </span>
                    );
                  };

                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-mono text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span>{tgl}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{nama}</div>
                        <div className="text-[10px] text-gray-400 font-mono">NIP: {nip}</div>
                      </td>
                      <td className="py-3 px-3">{renderBadge(fisik)}</td>
                      <td className="py-3 px-3">{renderBadge(mental)}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-300">
                        {sistole && diastole ? (
                          <div>TD: {sistole}/{diastole} mmHg</div>
                        ) : null}
                        {nadi && <div>Nadi: {nadi} bpm</div>}
                        {suhu && <div>Suhu: {suhu}°C</div>}
                        {!sistole && !nadi && !suhu && <span className="text-gray-500">-</span>}
                      </td>
                      <td className="py-3 px-3 text-gray-300 max-w-xs truncate" title={ket}>
                        {ket}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input Health Modal */}
      {showInputModal && (
        <InputKesehatanModal
          isOpen={showInputModal}
          onClose={() => setShowInputModal(false)}
          personilList={activePersonilList}
          onSuccess={() => {
            fetchLogs();
            onRefreshData();
          }}
        />
      )}
    </div>
  );
};
