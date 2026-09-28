import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, User as UserIcon, Activity, Settings, LogOut, Camera, Shield, Briefcase, MapPin, HeartPulse, CheckCircle, X, RefreshCw, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { gasService } from '../services/gasService';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'settings'>('info');
  const [legalitasData, setLegalitasData] = useState<any>(null);
  const [loadingLegalitas, setLoadingLegalitas] = useState(false);

  const cleanLegalitasEntries = React.useMemo(() => {
    if (!legalitasData || typeof legalitasData !== 'object') return [];
    const excludedKeys = new Set([
      'nama',
      'name',
      'nip',
      'userid',
      'user_id',
      'jabatan',
      'role',
      'bidang',
      'unit',
      'grade',
      'foto',
      'photo',
      'email',
      'email korporat',
      'email iam',
      'password',
      'password iam',
      'pin',
      'url gdrive',
      'url_gdrive',
      'kolom 12',
      'lv. 2',
      'lv. 3',
      'lv. 4'
    ]);

    const seen = new Set<string>();
    const list: [string, any][] = [];

    for (const [key, value] of Object.entries(legalitasData)) {
      if (value === '' || value === null || value === undefined) continue;
      const lower = key.toLowerCase().trim();
      
      // Exclude duplicate profile identity or sensitive credentials
      if (
        excludedKeys.has(lower) ||
        lower.includes('email') ||
        lower.includes('password') ||
        lower.includes('gdrive') ||
        lower === 'nama' ||
        lower === 'nip' ||
        lower === 'jabatan' ||
        lower === 'grade' ||
        lower === 'foto'
      ) {
        continue;
      }

      if (seen.has(lower)) continue;
      seen.add(lower);
      list.push([key, value]);
    }
    return list;
  }, [legalitasData]);

  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [emailIam, setEmailIam] = useState('');
  const [passwordIam, setPasswordIam] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [showKesehatanModal, setShowKesehatanModal] = useState(false);
  const [kesehatanForm, setKesehatanForm] = useState<{items: string[], fisikItems: string[], mentalItems: string[], personil: string[]} | null>(null);
  const [kesehatanAnswers, setKesehatanAnswers] = useState<Record<string, boolean>>({});
  const [statusFisik, setStatusFisik] = useState<'SEHAT' | 'KURANG SEHAT' | 'TIDAK SEHAT'>('SEHAT');
  const [statusMental, setStatusMental] = useState<'SEHAT' | 'KURANG SEHAT' | 'TIDAK SEHAT'>('SEHAT');
  const [sistole, setSistole] = useState('');
  const [diastole, setDiastole] = useState('');
  const [nadi, setNadi] = useState('');
  const [suhu, setSuhu] = useState('');
  const [catatanKesehatan, setCatatanKesehatan] = useState('');
  const [loadingKesehatan, setLoadingKesehatan] = useState(false);
  const [submittingKesehatan, setSubmittingKesehatan] = useState(false);
  const [personilName, setPersonilName] = useState(user?.name || '');

  const defaultFisikList = [
    'Demam / Suhu Tubuh Tinggi',
    'Flu / Batuk / Radang Tenggorokan',
    'Pusing / Sakit Kepala / Vertigo',
    'Nyeri Dada / Sesak Nafas',
    'Nyeri Otot / Pegal Berat / Cidera',
    'Gangguan Lambung / Mual / Diare'
  ];

  const defaultMentalList = [
    'Insomnia / Kurang Tidur (< 5 Jam)',
    'Cemas / Khawatir Berlebihan',
    'Stres Beban Kerja Berat',
    'Sulit Fokus / Konsentrasi Menurun',
    'Kelelahan Emosional / Burnout'
  ];

  const isPDKB = user?.bidang === 'PDKB' || user?.role?.includes('PDKB') || user?.role === 'PREPARATOR' || user?.role === 'PELAKSANA';

  React.useEffect(() => {
    if (showKesehatanModal && !kesehatanForm) {
      setLoadingKesehatan(true);
      gasService.post('getKesehatanForm').then(res => {
        if (res.success && res.data && res.data.fisikItems?.length) {
          setKesehatanForm(res.data);
          const initialAnswers: Record<string, boolean> = {};
          res.data.items?.forEach((item: string) => {
            initialAnswers[item] = false;
          });
          setKesehatanAnswers(initialAnswers);
        } else {
          // Fallback to standard PDKB health checklist
          setKesehatanForm({
            items: [...defaultFisikList, ...defaultMentalList],
            fisikItems: defaultFisikList,
            mentalItems: defaultMentalList,
            personil: [user?.name || '']
          });
        }
        setPersonilName(user?.name || '');
        setLoadingKesehatan(false);
      }).catch(() => {
        setKesehatanForm({
          items: [...defaultFisikList, ...defaultMentalList],
          fisikItems: defaultFisikList,
          mentalItems: defaultMentalList,
          personil: [user?.name || '']
        });
        setLoadingKesehatan(false);
      });
    }
  }, [showKesehatanModal, kesehatanForm, user?.name]);

  const handleToggleKesehatan = (item: string, isMental: boolean = false) => {
    setKesehatanAnswers(prev => {
      const next = { ...prev, [item]: !prev[item] };
      // Auto adjust suggested status if issues checked
      const hasFisikIssues = Object.entries(next).some(([k, v]) => v && defaultFisikList.includes(k));
      const hasMentalIssues = Object.entries(next).some(([k, v]) => v && defaultMentalList.includes(k));
      if (hasFisikIssues && statusFisik === 'SEHAT') setStatusFisik('KURANG SEHAT');
      if (hasMentalIssues && statusMental === 'SEHAT') setStatusMental('KURANG SEHAT');
      return next;
    });
  };

  const handleSubmitKesehatan = async () => {
    setSubmittingKesehatan(true);
    const res = await gasService.post('submitKesehatan', {
      nip: user?.nip,
      nama: personilName || user?.name,
      name: personilName || user?.name,
      statusFisik,
      statusMental,
      sistole: sistole || null,
      diastole: diastole || null,
      nadi: nadi || null,
      suhu: suhu || null,
      keterangan: catatanKesehatan || (statusFisik === 'SEHAT' && statusMental === 'SEHAT' ? 'Kondisi Sehat & Siap Bekerja' : 'Pemeriksaan mandiri'),
      answers: kesehatanAnswers,
      tanggal: new Date().toISOString().split('T')[0]
    });
    setSubmittingKesehatan(false);
    if (res.success) {
      gasService.clearCache('getAllPersonil');
      gasService.clearCache('getLogKesehatan');
      gasService.clearCache('getKesehatanOverview');
      setShowKesehatanModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      alert("Gagal update kesehatan: " + (res.message || res.error || JSON.stringify(res)));
    }
  };

  React.useEffect(() => {
    if (isPDKB && user?.nip) {
      setLoadingLegalitas(true);
      import('../services/gasService').then(({ gasService }) => {
        // the backend should be configured to return data from Personil sheet (typically we map E-J as legalitas)
        gasService.post('getPersonilDetail', { nip: user.nip }).then(res => {
          if (res.success && res.data) {
            setLegalitasData(res.data);
          }
          setLoadingLegalitas(false);
        });
      });
    }
  }, [isPDKB, user?.nip]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdate = async () => {
    if (!password && !pin && !emailIam && !passwordIam) {
      alert('Masukkan setidaknya satu data yang ingin diubah.');
      return;
    }
    
    setUpdating(true);
    // Dynamic import to avoid gasService mock issues if not needed yet or explicitly imported above
    const { gasService } = await import('../services/gasService');
    const res = await gasService.post('updateSecurity', { 
      nip: user?.nip, 
      password, 
      pin,
      emailIam,
      passwordIam
    });

    if (res.success) {
      setShowSuccess(true);
      setPassword('');
      setPin('');
      setEmailIam('');
      setPasswordIam('');
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      alert('Gagal update: ' + (res.message || res.error || JSON.stringify(res)));
    }
    setUpdating(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0f12] text-white flex flex-col font-sans mb-10 md:mb-0">
      {/* Top Header */}
      <header className="h-14 border-b border-[#0d8291]/30 bg-[#0d161a] flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/office')}
            className="w-8 h-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-bold tracking-widest text-white uppercase">Profile</h1>
        </div>
        <button
          onClick={() => {
            if (isPDKB && user?.nip) {
              setLoadingLegalitas(true);
              import('../services/gasService').then(({ gasService }) => {
                gasService.clearCache('getPersonilDetail');
                gasService.post('getPersonilDetail', { nip: user.nip }).then(res => {
                  if (res.success && res.data) {
                    setLegalitasData(res.data);
                  }
                  setLoadingLegalitas(false);
                });
              });
            }
          }}
          disabled={loadingLegalitas}
          className="p-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loadingLegalitas ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 flex flex-col gap-6">
        
        {/* Profile Header */}
        <div className="bg-[#0d161a] rounded-xl border border-white/5 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="relative group cursor-pointer">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-secondary to-primary p-1">
              <div className="w-full h-full rounded-full bg-[#0a0f12] flex items-center justify-center border-4 border-[#0d161a] overflow-hidden">
                {legalitasData?.FOTO || legalitasData?.Foto || user?.photoUrl ? (
                  <img src={legalitasData?.FOTO || legalitasData?.Foto || user?.photoUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-4xl font-black text-white">{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1a252b] border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-primary transition-all shadow-lg">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left z-10">
            <div className="inline-block px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded text-[10px] font-bold uppercase tracking-widest mb-2">
              {user?.role || 'User'}
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-1">{user?.name || '-'}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-400 uppercase tracking-widest">
              <span className="flex items-center justify-center sm:justify-start gap-1"><Briefcase className="w-3 h-3" /> {user?.bidang || '-'}</span>
              <span className="hidden sm:inline text-gray-600">•</span>
              <span className="flex items-center justify-center sm:justify-start gap-1"><MapPin className="w-3 h-3" /> {user?.unit || '-'}</span>
            </div>
          </div>
        </div>

        {isPDKB && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(255,94,0,0.1)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-primary/20 text-primary">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Update Kesehatan</h3>
                <p className="text-[10px] text-gray-400">Wajib diisi sebelum memulai pekerjaan (SOP PDKB)</p>
              </div>
            </div>
            <button onClick={() => setShowKesehatanModal(true)} className="px-4 py-2 bg-primary text-black text-xs font-bold uppercase tracking-widest rounded hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
              Update Now
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 uppercase tracking-widest text-[11px] font-bold">
          <button 
            onClick={() => setActiveTab('info')}
            className={cn(
              "px-4 py-3 border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'info' ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-300"
            )}
          >
            <UserIcon className="w-3 h-3" /> Personil Info
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "px-4 py-3 border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'settings' ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-300"
            )}
          >
            <Settings className="w-3 h-3" /> Pengaturan
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-[#0d161a] rounded-xl border border-white/5 p-4 sm:p-6 shadow-xl flex-1">
          {activeTab === 'info' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">User ID</div>
                  <div className="font-mono text-sm text-gray-200 bg-[#1a252b] p-2 rounded border border-white/5">{user?.nip || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Role / Peran</div>
                  <div className="font-sans font-bold text-sm text-gray-200 bg-[#1a252b] p-2 rounded border border-white/5">{user?.role || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Bidang</div>
                  <div className="font-sans font-bold text-sm text-gray-200 bg-[#1a252b] p-2 rounded border border-white/5">{user?.bidang || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Unit Kerja</div>
                  <div className="font-sans font-bold text-sm text-gray-200 bg-[#1a252b] p-2 rounded border border-white/5">{user?.unit || '-'}</div>
                </div>
              </div>
              
              {isPDKB && (
                <>
                  <div className="border-t border-white/5 my-4"></div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Legalitas & Kualifikasi PDKB
                    </h3>
                    {legalitasData?.['STATUS PDKB'] && (
                      <span className={cn(
                        "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border font-mono",
                        String(legalitasData['STATUS PDKB']).toUpperCase() === 'AKTIF'
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      )}>
                        Status: {String(legalitasData['STATUS PDKB'])}
                      </span>
                    )}
                  </div>

                  {loadingLegalitas ? (
                    <div className="text-xs text-gray-500 animate-pulse py-4 text-center">Memuat data legalitas PDKB...</div>
                  ) : cleanLegalitasEntries.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {cleanLegalitasEntries.map(([key, value]) => {
                        const isUrl = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
                        const isStatus = key.toUpperCase().includes('STATUS');
                        const isExpire = key.toUpperCase().includes('EXPIRE') || key.toUpperCase().includes('BERLAKU');

                        return (
                          <div key={key} className="bg-[#1a252b] border border-white/5 p-3 rounded-lg flex flex-col justify-between hover:border-white/10 transition-colors">
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 flex items-center justify-between">
                              <span>{key}</span>
                              {isExpire && <span className="text-[9px] text-amber-400 font-mono">Masa Berlaku</span>}
                            </div>
                            {isUrl ? (
                              <a
                                href={value}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium mt-0.5"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Lihat Dokumen</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <div className={cn(
                                "font-bold text-sm tracking-tight",
                                isStatus ? "text-primary" : isExpire ? "text-amber-300 font-mono" : "text-gray-200"
                              )}>
                                {String(value) || '-'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 py-3 bg-[#1a252b] border border-white/5 rounded-lg text-center">
                      Data legalitas PDKB belum tersedia atau sedang disinkronkan.
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-1 h-4 bg-tertiary"></div>
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Update Data Pribadi</h3>
               </div>
               
               <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Email IAM</label>
                    <input type="email" value={emailIam} onChange={(e) => setEmailIam(e.target.value)} placeholder="Masukkan Email IAM" className="w-full bg-[#1a252b] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                 </div>
                 <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Password IAM</label>
                    <input type="text" value={passwordIam} onChange={(e) => setPasswordIam(e.target.value)} placeholder="Masukkan Password IAM" className="w-full bg-[#1a252b] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                 </div>
                 <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Password Aplikasi</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password baru" className="w-full bg-[#1a252b] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                 </div>
                 <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">PIN Aplikasi</label>
                    <input 
                      type="text" 
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={pin} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 6) setPin(val);
                      }} 
                      placeholder="Masukkan 6 digit PIN baru" 
                      className="w-full bg-[#1a252b] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary tracking-widest font-mono" 
                    />
                 </div>
                 <button disabled={updating} onClick={handleUpdate} className="px-4 py-2 bg-[#1a252b] border border-white/10 text-white text-[11px] font-bold uppercase tracking-widest rounded hover:bg-white/5 transition-colors">
                   {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                 </button>
               </div>

               <div className="border-t border-white/5 my-6"></div>

               <div>
                 <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 text-[11px] font-bold uppercase tracking-widest rounded transition-colors w-full justify-center sm:justify-start sm:w-auto"
                 >
                   <LogOut className="w-3 h-3" /> Logout Akun
                 </button>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Kesehatan */}
      {showKesehatanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0d161a] border border-white/10 p-6 rounded-xl shadow-2xl flex flex-col max-w-lg w-full mx-auto relative max-h-[90vh]">
            <button 
              onClick={() => setShowKesehatanModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-5 bg-primary"></div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Update Data Kesehatan</h2>
            </div>

            {loadingKesehatan ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full"></div>
              </div>
            ) : !kesehatanForm ? (
              <div className="py-6 text-center text-sm text-gray-400 whitespace-pre-wrap">Gagal memuat form/sheet.</div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-5 form-scrollbar">
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Nama Personil</label>
                  <div className="w-full bg-[#1a252b]/50 border border-white/5 rounded px-3 py-2 text-sm text-gray-200 font-semibold cursor-not-allowed">
                    {personilName || "Tidak Diketahui"}
                  </div>
                </div>

                {/* Status Fisik & Mental Badges Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-white/5 bg-[#141e23]">
                    <label className="block text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">Status Fisik</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['SEHAT', 'KURANG SEHAT', 'TIDAK SEHAT'] as const).map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusFisik(st)}
                          className={`py-1.5 px-1 text-[9px] font-bold rounded uppercase tracking-wider transition-colors border text-center ${
                            statusFisik === st
                              ? st === 'SEHAT'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm'
                                : st === 'KURANG SEHAT'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-sm'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-sm'
                              : 'bg-black/30 text-gray-400 border-white/5 hover:border-white/10'
                          }`}
                        >
                          {st.replace(' ', '\n')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-white/5 bg-[#141e23]">
                    <label className="block text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2">Status Mental</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['SEHAT', 'KURANG SEHAT', 'TIDAK SEHAT'] as const).map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusMental(st)}
                          className={`py-1.5 px-1 text-[9px] font-bold rounded uppercase tracking-wider transition-colors border text-center ${
                            statusMental === st
                              ? st === 'SEHAT'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm'
                                : st === 'KURANG SEHAT'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-sm'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-sm'
                              : 'bg-black/30 text-gray-400 border-white/5 hover:border-white/10'
                          }`}
                        >
                          {st.replace(' ', '\n')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vital Signs (Optional) */}
                <div className="p-3 rounded-lg border border-white/5 bg-[#141e23]">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Tanda Vital (Opsional)</label>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-[9px] text-gray-500 block mb-1">Sistole</span>
                      <input 
                        type="number"
                        placeholder="120"
                        value={sistole}
                        onChange={e => setSistole(e.target.value)}
                        className="w-full bg-[#1a252b] border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 block mb-1">Diastole</span>
                      <input 
                        type="number"
                        placeholder="80"
                        value={diastole}
                        onChange={e => setDiastole(e.target.value)}
                        className="w-full bg-[#1a252b] border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 block mb-1">Nadi (bpm)</span>
                      <input 
                        type="number"
                        placeholder="75"
                        value={nadi}
                        onChange={e => setNadi(e.target.value)}
                        className="w-full bg-[#1a252b] border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 block mb-1">Suhu (°C)</span>
                      <input 
                        type="number"
                        step="0.1"
                        placeholder="36.5"
                        value={suhu}
                        onChange={e => setSuhu(e.target.value)}
                        className="w-full bg-[#1a252b] border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Checklist Kondisi Fisik */}
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Checklist Keluhan Fisik</label>
                  <div className="space-y-1.5">
                    {kesehatanForm.fisikItems?.map((item, idx) => (
                      <label key={`fisik-${idx}`} className="flex items-start gap-2.5 p-2 rounded-lg border border-white/5 bg-[#1a252b]/50 cursor-pointer hover:bg-white/5 transition-colors group">
                        <input
                          type="checkbox"
                          checked={!!kesehatanAnswers[item]}
                          onChange={() => handleToggleKesehatan(item, false)}
                          className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary bg-black/50 mt-0.5"
                        />
                        <span className="text-xs text-gray-300 group-hover:text-white transition-colors">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Checklist Kondisi Mental */}
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Checklist Keluhan Mental</label>
                  <div className="space-y-1.5">
                    {kesehatanForm.mentalItems?.map((item, idx) => (
                      <label key={`mental-${idx}`} className="flex items-start gap-2.5 p-2 rounded-lg border border-white/5 bg-[#1a252b]/50 cursor-pointer hover:bg-white/5 transition-colors group">
                        <input
                          type="checkbox"
                          checked={!!kesehatanAnswers[item]}
                          onChange={() => handleToggleKesehatan(item, true)}
                          className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary bg-black/50 mt-0.5"
                        />
                        <span className="text-xs text-gray-300 group-hover:text-white transition-colors">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Catatan / Keterangan */}
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Catatan / Keluhan Tambahan</label>
                  <textarea
                    rows={2}
                    value={catatanKesehatan}
                    onChange={e => setCatatanKesehatan(e.target.value)}
                    placeholder="Contoh: Kondisi prima, siap bekerja berjarak..."
                    className="w-full bg-[#1a252b] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-[#0d161a] pb-1">
                  <button 
                    onClick={() => setShowKesehatanModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold uppercase tracking-widest rounded transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmitKesehatan}
                    disabled={submittingKesehatan}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-black text-xs font-bold uppercase tracking-widest rounded transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
                  >
                    {submittingKesehatan ? 'Menyimpan...' : 'Simpan Update'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Toast / Modal Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a252b] border border-green-500/30 p-6 rounded-xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-auto animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 text-center uppercase tracking-tight">Perubahan Tersimpan!</h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              Data keamanan Anda berhasil diperbarui.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 text-xs font-bold uppercase tracking-widest rounded transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
