import React, { useState } from 'react';
import { 
  Users, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { getCertDetail, getStatusPdkb, CertDetail } from './personilUtils';

interface PersonilRingkasanTabProps {
  personilList: any[];
  onSelectPerson: (person: any) => void;
}

export const PersonilRingkasanTab: React.FC<PersonilRingkasanTabProps> = ({
  personilList,
  onSelectPerson
}) => {
  const [filterExpLevel, setFilterExpLevel] = useState<'ALL' | 'EXPIRING' | 'EXPIRED' | 'ACTIVE'>('ALL');
  const [searchTable, setSearchTable] = useState('');

  // 1. Status PDKB Counts
  const statusCounts = {
    AKTIF: 0,
    MUTASI: 0,
    TIDAK_AKTIF: 0,
    TOTAL: personilList.length
  };

  personilList.forEach(p => {
    const st = getStatusPdkb(p);
    if (st === 'AKTIF') statusCounts.AKTIF++;
    else if (st === 'MUTASI') statusCounts.MUTASI++;
    else statusCounts.TIDAK_AKTIF++;
  });

  // 2. Sertifikat Counts & Expiry by Level
  interface LevelStats {
    totalHolders: number;
    active: number;
    expiringSoon: number;
    expired: number;
    none: number;
  }

  const certStats: Record<2 | 3 | 4, LevelStats> = {
    2: { totalHolders: 0, active: 0, expiringSoon: 0, expired: 0, none: 0 },
    3: { totalHolders: 0, active: 0, expiringSoon: 0, expired: 0, none: 0 },
    4: { totalHolders: 0, active: 0, expiringSoon: 0, expired: 0, none: 0 }
  };

  personilList.forEach(p => {
    [2, 3, 4].forEach(lvl => {
      const level = lvl as 2 | 3 | 4;
      const cert = getCertDetail(p, level);
      if (cert.hasCert) {
        certStats[level].totalHolders++;
        if (cert.status === 'EXPIRED') {
          certStats[level].expired++;
        } else if (cert.status === 'EXPIRING_SOON') {
          certStats[level].expiringSoon++;
        } else {
          certStats[level].active++;
        }
      } else {
        certStats[level].none++;
      }
    });
  });

  // Filter table data
  const filteredPersonil = personilList.filter(p => {
    const nama = String(p.NAMA || p.Nama || '').toLowerCase();
    const nip = String(p.NIP || '').toLowerCase();
    const query = searchTable.toLowerCase().trim();
    const matchesSearch = !query || nama.includes(query) || nip.includes(query);

    if (!matchesSearch) return false;

    if (filterExpLevel === 'ALL') return true;

    const cert2 = getCertDetail(p, 2);
    const cert3 = getCertDetail(p, 3);
    const cert4 = getCertDetail(p, 4);

    if (filterExpLevel === 'EXPIRING') {
      return cert2.status === 'EXPIRING_SOON' || cert3.status === 'EXPIRING_SOON' || cert4.status === 'EXPIRING_SOON';
    }
    if (filterExpLevel === 'EXPIRED') {
      return cert2.status === 'EXPIRED' || cert3.status === 'EXPIRED' || cert4.status === 'EXPIRED';
    }
    if (filterExpLevel === 'ACTIVE') {
      return cert2.status === 'ACTIVE' || cert3.status === 'ACTIVE' || cert4.status === 'ACTIVE';
    }

    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. STATUS PERSONIL PDKB SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-primary rounded-full"></div>
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">
              Status Keanggotaan PDKB
            </h2>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            Total {statusCounts.TOTAL} Personil
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Card Total */}
          <div className="bg-[#121b20] border border-white/5 rounded-xl p-4 relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Total Personil</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {statusCounts.TOTAL}
            </div>
            <div className="text-[10px] text-gray-500 mt-1 font-mono">Tercatat di sistem</div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent"></div>
          </div>

          {/* Card AKTIF */}
          <div className="bg-[#121b20] border border-emerald-500/20 rounded-xl p-4 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                PDKB Aktif
              </span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {statusCounts.AKTIF}
            </div>
            <div className="text-[10px] text-gray-400 mt-1 font-mono">
              {statusCounts.TOTAL > 0 ? Math.round((statusCounts.AKTIF / statusCounts.TOTAL) * 100) : 0}% dari total
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent"></div>
          </div>

          {/* Card MUTASI */}
          <div className="bg-[#121b20] border border-amber-500/20 rounded-xl p-4 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Mutasi
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Pindah
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
              {statusCounts.MUTASI}
            </div>
            <div className="text-[10px] text-gray-400 mt-1 font-mono">
              Personil mutasi kerja
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-transparent"></div>
          </div>

          {/* Card TIDAK AKTIF */}
          <div className="bg-[#121b20] border border-white/5 rounded-xl p-4 relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                Tidak Aktif
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Non-Aktif
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-300 font-mono">
              {statusCounts.TIDAK_AKTIF}
            </div>
            <div className="text-[10px] text-gray-500 mt-1 font-mono">
              Status purna/non-operasional
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* 2. JUMLAH KEPEMILIKAN SERTIFIKAT */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-1.5 h-4 bg-primary rounded-full"></div>
          <h2 className="text-xs font-bold text-white uppercase tracking-widest">
            Kepemilikan Sertifikat Kompetensi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {([2, 3, 4] as const).map(level => {
            const stats = certStats[level];
            const activeHolder = personilList.filter(p => getStatusPdkb(p) === 'AKTIF').length;
            const pct = activeHolder > 0 ? Math.round((stats.totalHolders / activeHolder) * 100) : 0;
            const levelColor = 
              level === 2 ? 'border-blue-500/30 text-blue-400' :
              level === 3 ? 'border-red-500/30 text-red-400' :
              'border-amber-500/30 text-amber-400';
            const badgeBg =
              level === 2 ? 'bg-[#006bb6] text-white' :
              level === 3 ? 'bg-[#c50000] text-white' :
              'bg-[#d97706] text-white';

            return (
              <div 
                key={level} 
                className="bg-[#121b20] border border-white/5 rounded-xl p-4 sm:p-5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 text-xs font-black rounded ${badgeBg} shadow-sm`}>
                    LEVEL {level}
                  </span>
                  <Award className={`w-4 h-4 ${levelColor.split(' ')[1]}`} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                    {stats.totalHolders}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    Personil Pemegang
                  </span>
                </div>
                {/* Micro progress bar */}
                <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      level === 2 ? 'bg-blue-500' : level === 3 ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2 text-[10px] text-gray-500 font-mono">
                  <span>Cakupan personil: {pct}%</span>
                  <span>Total {statusCounts.TOTAL} Org</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. STATUS MASA BERLAKU SERTIFIKAT (AKTIF, AKAN BERAKHIR <= 5 BULAN, EXPIRE) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-primary rounded-full"></div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">
                Status Masa Berlaku Sertifikat per Level
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Monitoring sertifikat <span className="text-emerald-400 font-bold">AKTIF</span>, <span className="text-amber-400 font-bold">AKAN BERAKHIR (≤ 5 Bulan)</span>, dan <span className="text-rose-400 font-bold">EXPIRE</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([2, 3, 4] as const).map(level => {
            const stats = certStats[level];
            const badgeBg =
              level === 2 ? 'bg-[#006bb6] text-white' :
              level === 3 ? 'bg-[#c50000] text-white' :
              'bg-[#d97706] text-white';

            return (
              <div 
                key={level}
                className="bg-[#121b20] border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-black rounded ${badgeBg}`}>
                        LEVEL {level}
                      </span>
                      <span className="text-xs font-bold text-gray-300">
                        {level === 2 ? 'Pelaksana Utama' : level === 3 ? 'Pengawas Pekerjaan' : 'Pengawas K3/Ahli'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {/* Status AKTIF (> 5 Bulan) */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e171b] border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">MASIH AKTIF</div>
                          <div className="text-[9px] text-gray-400 font-mono">&gt; 5 Bulan dari Hari Ini</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold font-mono text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded">
                        {stats.active}
                      </div>
                    </div>

                    {/* Status AKAN BERAKHIR (<= 5 Bulan) */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e171b] border border-amber-500/20">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">AKAN BERAKHIR</div>
                          <div className="text-[9px] text-amber-400/80 font-mono">≤ 5 Bulan dari Hari Ini</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold font-mono text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded">
                        {stats.expiringSoon}
                      </div>
                    </div>

                    {/* Status EXPIRE */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e171b] border border-rose-500/20">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">EXPIRE</div>
                          <div className="text-[9px] text-rose-400/80 font-mono">Sudah Kadaluarsa</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold font-mono text-rose-400 px-2 py-0.5 bg-rose-500/10 rounded">
                        {stats.expired}
                      </div>
                    </div>

                    {/* Belum Ada / Tidak Memiliki */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/20 text-gray-500 text-xs">
                      <span>Belum Memiliki Sertifikat</span>
                      <span className="font-mono font-bold">{stats.none} Personil</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. TABEL MATRIX MONITORING SERTIFIKAT PER PERSONIL */}
      <div className="bg-[#121b20] border border-white/5 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">
              Daftar Rinci Masa Berlaku Sertifikat Personil
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center bg-[#0a1014] p-1 rounded-lg border border-white/5">
              {(['ALL', 'ACTIVE', 'EXPIRING', 'EXPIRED'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterExpLevel(mode)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    filterExpLevel === mode 
                      ? 'bg-primary text-black' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {mode === 'ALL' ? 'Semua' : mode === 'ACTIVE' ? 'Aktif' : mode === 'EXPIRING' ? 'Akan Berakhir' : 'Expire'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Cari personil / NIP..."
                value={searchTable}
                onChange={e => setSearchTable(e.target.value)}
                className="bg-[#0a1014] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-gray-400 uppercase tracking-widest font-mono bg-[#0e161b]">
                <th className="py-2.5 px-3">Personil</th>
                <th className="py-2.5 px-3">Status PDKB</th>
                <th className="py-2.5 px-3">Level 2</th>
                <th className="py-2.5 px-3">Level 3</th>
                <th className="py-2.5 px-3">Level 4</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPersonil.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
                    Tidak ada personil yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredPersonil.map((person, idx) => {
                  const nama = person.NAMA || person.Nama || '-';
                  const nip = person.NIP || '-';
                  const jabatan = person.JABATAN || person.Jabatan || 'PDKB';
                  const statusPdkb = getStatusPdkb(person);

                  const cert2 = getCertDetail(person, 2);
                  const cert3 = getCertDetail(person, 3);
                  const cert4 = getCertDetail(person, 4);

                  const renderCertBadge = (cert: CertDetail) => {
                    if (!cert.hasCert) {
                      return <span className="text-[10px] text-gray-600 font-mono">-</span>;
                    }
                    if (cert.status === 'EXPIRED') {
                      return (
                        <div className="inline-flex flex-col">
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            EXPIRE ({cert.expDateStr || 'Kadaluarsa'})
                          </span>
                          {cert.daysLeft !== null && (
                            <span className="text-[9px] text-rose-400/80 font-mono mt-0.5">
                              Lewat {Math.abs(cert.daysLeft)} hari
                            </span>
                          )}
                        </div>
                      );
                    }
                    if (cert.status === 'EXPIRING_SOON') {
                      return (
                        <div className="inline-flex flex-col">
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            AKAN BERAKHIR
                          </span>
                          <span className="text-[9px] text-amber-300 font-mono mt-0.5">
                            {cert.expDateStr} ({cert.monthsLeft} bln)
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div className="inline-flex flex-col">
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          AKTIF
                        </span>
                        {cert.expDateStr && (
                          <span className="text-[9px] text-gray-400 font-mono mt-0.5">
                            Exp: {cert.expDateStr}
                          </span>
                        )}
                      </div>
                    );
                  };

                  return (
                    <tr 
                      key={idx} 
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => onSelectPerson(person)}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-white group-hover:text-primary transition-colors">
                          {nama}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          NIP: {nip} • {jabatan}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                          statusPdkb === 'AKTIF' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                            : statusPdkb === 'MUTASI' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {statusPdkb === 'AKTIF' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                          {statusPdkb}
                        </span>
                      </td>
                      <td className="py-3 px-3">{renderCertBadge(cert2)}</td>
                      <td className="py-3 px-3">{renderCertBadge(cert3)}</td>
                      <td className="py-3 px-3">{renderCertBadge(cert4)}</td>
                      <td className="py-3 px-3 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onSelectPerson(person); }}
                          className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Lihat Detail Legalitas"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
