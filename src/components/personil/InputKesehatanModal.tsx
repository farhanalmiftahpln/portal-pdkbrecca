import React, { useState } from 'react';
import { X, HeartPulse, CheckCircle2, AlertCircle } from 'lucide-react';
import { gasService } from '../../services/gasService';
import { getStatusPdkb } from './personilUtils';

interface InputKesehatanModalProps {
  isOpen: boolean;
  onClose: () => void;
  personilList: any[];
  defaultPersonil?: any;
  onSuccess: () => void;
}

export const InputKesehatanModal: React.FC<InputKesehatanModalProps> = ({
  isOpen,
  onClose,
  personilList,
  defaultPersonil,
  onSuccess
}) => {
  // Hanya personil PDKB berstatus AKTIF yang dapat diinput kesehatannya
  const activePersonilList = personilList.filter(p => getStatusPdkb(p) === 'AKTIF');

  const [selectedNip, setSelectedNip] = useState(() => {
    if (defaultPersonil && getStatusPdkb(defaultPersonil) === 'AKTIF') {
      return defaultPersonil?.NIP || defaultPersonil?.nip || '';
    }
    return activePersonilList[0]?.NIP || activePersonilList[0]?.nip || '';
  });
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [statusFisik, setStatusFisik] = useState<'SEHAT' | 'KURANG SEHAT' | 'TIDAK SEHAT'>('SEHAT');
  const [statusMental, setStatusMental] = useState<'SEHAT' | 'KURANG SEHAT' | 'TIDAK SEHAT'>('SEHAT');
  const [sistole, setSistole] = useState('');
  const [diastole, setDiastole] = useState('');
  const [nadi, setNadi] = useState('');
  const [suhu, setSuhu] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentPerson = activePersonilList.find(
    p => (p.NIP || p.nip) === selectedNip
  ) || (defaultPersonil && getStatusPdkb(defaultPersonil) === 'AKTIF' ? defaultPersonil : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNip || !currentPerson) {
      setErrorMsg('Pilih personil aktif terlebih dahulu');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await gasService.post('submitKesehatan', {
        nip: selectedNip,
        nama: currentPerson?.NAMA || currentPerson?.Nama || '',
        name: currentPerson?.NAMA || currentPerson?.Nama || '',
        tanggal,
        statusFisik,
        statusMental,
        sistole: sistole || null,
        diastole: diastole || null,
        nadi: nadi || null,
        suhu: suhu || null,
        keterangan: keterangan || (statusFisik === 'SEHAT' && statusMental === 'SEHAT' ? 'Kondisi Sehat & Fit' : 'Pemeriksaan Rutin')
      });

      if (res && res.success) {
        gasService.clearCache('getAllPersonil');
        gasService.clearCache('getLogKesehatan');
        gasService.clearCache('getKesehatanOverview');
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res?.message || res?.error || 'Gagal menyimpan pemeriksaan kesehatan');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0d161a] border border-white/10 p-5 sm:p-6 rounded-xl shadow-2xl flex flex-col max-w-lg w-full mx-auto relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-5 bg-primary rounded-full"></div>
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                Input Pemeriksaan Kesehatan
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-white/5 p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pilih Personil */}
          <div>
            <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
              Pilih Personil
            </label>
            <select
              value={selectedNip}
              onChange={e => setSelectedNip(e.target.value)}
              className="w-full bg-[#1a252b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            >
              <option value="">-- Pilih Personil Aktif --</option>
              {activePersonilList.map((p, idx) => (
                <option key={idx} value={p.NIP || p.nip}>
                  {p.NAMA || p.Nama} (NIP: {p.NIP || p.nip})
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal Pemeriksaan */}
          <div>
            <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
              Tanggal Pemeriksaan
            </label>
            <input 
              type="date"
              value={tanggal}
              onChange={e => setTanggal(e.target.value)}
              className="w-full bg-[#1a252b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
              required
            />
          </div>

          {/* Status Fisik & Mental Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status Fisik */}
            <div className="p-3 rounded-lg border border-white/5 bg-[#141e23]">
              <label className="block text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">
                Status Fisik
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['SEHAT', 'KURANG SEHAT', 'TIDAK SEHAT'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFisik(st)}
                    className={`py-1.5 px-1 text-[9px] font-bold rounded uppercase tracking-wider transition-colors border text-center ${
                      statusFisik === st
                        ? st === 'SEHAT'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : st === 'KURANG SEHAT'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                        : 'bg-black/30 text-gray-400 border-white/5 hover:border-white/10'
                    }`}
                  >
                    {st.replace(' ', '\n')}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Mental */}
            <div className="p-3 rounded-lg border border-white/5 bg-[#141e23]">
              <label className="block text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2">
                Status Mental
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['SEHAT', 'KURANG SEHAT', 'TIDAK SEHAT'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusMental(st)}
                    className={`py-1.5 px-1 text-[9px] font-bold rounded uppercase tracking-wider transition-colors border text-center ${
                      statusMental === st
                        ? st === 'SEHAT'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : st === 'KURANG SEHAT'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                        : 'bg-black/30 text-gray-400 border-white/5 hover:border-white/10'
                    }`}
                  >
                    {st.replace(' ', '\n')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tanda Vital */}
          <div className="p-3 rounded-lg border border-white/5 bg-[#141e23]">
            <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
              Tanda Vital (Opsional)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-[9px] text-gray-500 block mb-1">Sistole (mmHg)</span>
                <input 
                  type="number"
                  placeholder="120"
                  value={sistole}
                  onChange={e => setSistole(e.target.value)}
                  className="w-full bg-[#1a252b] border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <span className="text-[9px] text-gray-500 block mb-1">Diastole (mmHg)</span>
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

          {/* Catatan / Keluhan */}
          <div>
            <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
              Catatan / Keluhan / Hasil Diagnosa
            </label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              placeholder="Contoh: Kondisi sehat, tensi normal, siap bertugas..."
              className="w-full bg-[#1a252b] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold uppercase tracking-widest rounded transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary hover:bg-primary-dark text-black text-xs font-bold uppercase tracking-widest rounded transition-colors disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center gap-1.5"
            >
              {submitting ? (
                <>Menyimpan...</>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Simpan Hasil
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
