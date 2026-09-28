import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Activity, 
  Award, 
  Calendar, 
  HeartPulse, 
  Plus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { gasService } from '../../services/gasService';
import { getCertDetail, getStatusPdkb } from './personilUtils';
import { InputKesehatanModal } from './InputKesehatanModal';

interface PersonilDetailModalProps {
  person: any | null;
  onClose: () => void;
  personilList: any[];
  onRefreshData: () => void;
}

export const PersonilDetailModal: React.FC<PersonilDetailModalProps> = ({
  person,
  onClose,
  personilList,
  onRefreshData
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [showInputKesehatan, setShowInputKesehatan] = useState(false);

  useEffect(() => {
    if (!person) return;
    const nip = person.NIP || person.nip;
    if (!nip) return;

    setLoadingChart(true);
    gasService.post('getKesehatanChartData', { nip })
      .then(res => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setChartData(res.data);
        } else {
          // Default Radar Data for visually rich display
          const fStatus = String(person['Kesehatan Fisik'] || person['kesehatan_fisik'] || 'SEHAT').toUpperCase();
          const mStatus = String(person['Kesehatan Mental'] || person['kesehatan_mental'] || 'SEHAT').toUpperCase();
          
          const fScore = fStatus.includes('TIDAK') ? 0.5 : fStatus.includes('KURANG') ? 1.2 : 2.0;
          const mScore = mStatus.includes('TIDAK') ? 0.5 : mStatus.includes('KURANG') ? 1.2 : 2.0;

          setChartData([
            { subject: 'Kebugaran', fisik: fScore, mental: mScore, fullMark: 2 },
            { subject: 'Tensi/Kardio', fisik: fScore * 0.95, mental: mScore, fullMark: 2 },
            { subject: 'Fokus & Siap', fisik: fScore, mental: mScore * 0.95, fullMark: 2 },
            { subject: 'Kelenturan/Otot', fisik: fScore * 0.9, mental: mScore, fullMark: 2 },
            { subject: 'Psikologis/Stres', fisik: fScore, mental: mScore * 0.9, fullMark: 2 },
            { subject: 'Kesiapan Bekerja', fisik: fScore, mental: mScore, fullMark: 2 },
          ]);
        }
      })
      .catch(() => {
        setChartData([]);
      })
      .finally(() => {
        setLoadingChart(false);
      });
  }, [person]);

  if (!person) return null;

  const foto = person["FOTO"] || person["Foto"] || person["foto"];
  const nama = person["NAMA"] || person["Nama"] || person["nama"] || '-';
  const jabatan = person["JABATAN"] || person["Jabatan"] || person["jabatan"] || '-';
  const nip = person["NIP"] || person["nip"] || '-';
  const statusPdkb = getStatusPdkb(person);

  const cert2 = getCertDetail(person, 2);
  const cert3 = getCertDetail(person, 3);
  const cert4 = getCertDetail(person, 4);

  const renderCertCard = (lvl: number, cert: ReturnType<typeof getCertDetail>) => {
    const badgeBg =
      lvl === 2 ? 'bg-[#006bb6] text-white' :
      lvl === 3 ? 'bg-[#c50000] text-white' :
      'bg-[#d97706] text-white';

    return (
      <div className="bg-[#141e23] border border-white/5 rounded-lg p-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`px-2 py-0.5 text-[10px] font-black rounded ${badgeBg}`}>
              LEVEL {lvl}
            </span>
            {cert.hasCert ? (
              cert.status === 'EXPIRED' ? (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  EXPIRE
                </span>
              ) : cert.status === 'EXPIRING_SOON' ? (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  AKAN BERAKHIR
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AKTIF
                </span>
              )
            ) : (
              <span className="text-[9px] text-gray-500">Belum Ada</span>
            )}
          </div>

          {cert.hasCert ? (
            <div className="space-y-1 font-mono text-[11px] text-gray-300">
              <div className="text-gray-400 text-[10px] truncate" title={cert.serkom}>
                No: {cert.serkom || '-'}
              </div>
              <div className="text-[10px] text-gray-400">
                Exp: <strong className="text-white">{cert.expDateStr || '-'}</strong>
              </div>
              {cert.monthsLeft !== null && (
                <div className={`text-[10px] ${
                  cert.status === 'EXPIRED' ? 'text-rose-400' :
                  cert.status === 'EXPIRING_SOON' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {cert.status === 'EXPIRED' 
                    ? `Sudah lewat ${Math.abs(cert.daysLeft || 0)} hari` 
                    : `Sisa ${cert.monthsLeft} bulan (${cert.daysLeft} hari)`}
                </div>
              )}
            </div>
          ) : (
            <div className="text-[10px] text-gray-500 italic py-2">
              Tidak memiliki sertifikat level ini
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-[#0d161a] border border-white/10 p-4 sm:p-6 rounded-xl shadow-2xl flex flex-col max-w-4xl w-full mx-auto relative max-h-[95vh] sm:max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-primary rounded-full"></div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest leading-tight">
                Detail Personil & Legalitas PDKB
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Body */}
          <div className="overflow-y-auto overflow-x-hidden flex-1 -mx-2 px-2 sm:mx-0 sm:px-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6 sm:gap-8 pb-4">
              {/* Left Column: Photo & Main Info */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-full aspect-[3/4] max-w-[240px] bg-[#1a252b] rounded-lg flex items-center justify-center border border-white/10 md:sticky top-0 overflow-hidden mx-auto relative">
                  {foto && foto !== '#N/A' && !foto.includes('no-image') ? (
                    <img src={foto} alt={nama} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">NO FOTO</span>
                  )}
                  {/* Status PDKB badge overlay */}
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow border ${
                      statusPdkb === 'AKTIF'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : statusPdkb === 'MUTASI'
                        ? 'bg-amber-600 text-white border-amber-300'
                        : 'bg-rose-700 text-white border-rose-400'
                    }`}>
                      {statusPdkb}
                    </span>
                  </div>
                </div>

                <div className="text-center w-full max-w-[240px] bg-white/5 py-3 px-2 rounded-lg border border-white/5 mx-auto">
                  <div className="text-white font-bold text-sm tracking-wider uppercase">
                    {nama}
                  </div>
                  <div className="text-primary font-bold text-[10px] tracking-widest uppercase mt-1">
                    {jabatan}
                  </div>
                  <div className="text-gray-400 font-mono text-xs mt-0.5">
                    NIP: {nip}
                  </div>
                </div>

                {/* Quick Action Button - Khusus Personil Aktif */}
                {getStatusPdkb(person) === 'AKTIF' ? (
                  <button
                    onClick={() => setShowInputKesehatan(true)}
                    className="w-full max-w-[240px] py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <HeartPulse className="w-4 h-4" />
                    <span>Update Kesehatan</span>
                  </button>
                ) : (
                  <div className="w-full max-w-[240px] py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] text-rose-400 text-center uppercase tracking-wider font-mono">
                    Status: {getStatusPdkb(person)} (Non-Aktif)
                  </div>
                )}
              </div>

              {/* Right Column: Legality, Health, and Full Data */}
              <div className="space-y-6">
                {/* 1. Legalitas Sertifikat Level 2, 3, 4 */}
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Status Sertifikat Kompetensi
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {renderCertCard(2, cert2)}
                    {renderCertCard(3, cert3)}
                    {renderCertCard(4, cert4)}
                  </div>
                </div>

                {/* 2. Kondisi Kesehatan Radar Chart */}
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" /> Kondisi Kesehatan Terkini
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">
                        Fisik: <strong className="text-emerald-400">{person['Kesehatan Fisik'] || person['kesehatan_fisik'] || 'SEHAT'}</strong>
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="text-[10px] text-gray-400">
                        Mental: <strong className="text-emerald-400">{person['Kesehatan Mental'] || person['kesehatan_mental'] || 'SEHAT'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#141e23] p-3 rounded-lg border border-white/5">
                    {loadingChart ? (
                      <div className="flex items-center justify-center h-[260px] text-xs text-gray-500 animate-pulse">
                        Memuat diagram kesehatan...
                      </div>
                    ) : chartData.length > 0 ? (
                      <div className="h-[260px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                            <PolarGrid gridType="polygon" stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 2]} tick={{ fill: '#6b7280', fontSize: 9 }} />
                            <Radar name="Fisik" dataKey="fisik" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                            <Radar name="Mental" dataKey="mental" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0d161a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                              itemStyle={{ fontSize: '11px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-xs text-gray-500">
                        Data kesehatan belum tersedia. Klik "Update Kesehatan" untuk mencatat.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Data Lengkap Personil */}
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                    <FileText className="w-4 h-4 text-gray-400" /> Informasi Data Personil
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {Object.entries(person).map(([key, value]) => {
                      const lcKey = key.toLowerCase();
                      if (lcKey === 'foto' || lcKey === 'kolom 12' || value === '' || value === null) return null;
                      if (lcKey.includes('url gdrive') || lcKey === 'email' || lcKey === 'password') return null;
                      
                      const label = key.replace('Legalitas_', '');
                      return (
                        <div key={key} className="bg-[#141e23] p-2.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                          <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-1 leading-tight">{label}</div>
                          <div className="text-gray-100 font-mono text-xs break-words">{String(value) || '-'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showInputKesehatan && (
        <InputKesehatanModal
          isOpen={showInputKesehatan}
          onClose={() => setShowInputKesehatan(false)}
          personilList={personilList}
          defaultPersonil={person}
          onSuccess={() => {
            onRefreshData();
          }}
        />
      )}
    </>
  );
};
