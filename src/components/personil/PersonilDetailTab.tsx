import React, { useState } from 'react';
import { Search, Filter, Users, CheckCircle } from 'lucide-react';
import { extractLevels, getStatusPdkb, getCertDetail } from './personilUtils';

interface PersonilDetailTabProps {
  personilList: any[];
  onSelectPerson: (person: any) => void;
}

export const PersonilDetailTab: React.FC<PersonilDetailTabProps> = ({
  personilList,
  onSelectPerson
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AKTIF' | 'MUTASI' | 'TIDAK AKTIF'>('ALL');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'LV.2' | 'LV.3' | 'LV.4'>('ALL');

  const filteredList = personilList.filter(person => {
    const nama = String(person.NAMA || person.Nama || '').toLowerCase();
    const nip = String(person.NIP || '').toLowerCase();
    const jabatan = String(person.JABATAN || person.Jabatan || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesQuery = !q || nama.includes(q) || nip.includes(q) || jabatan.includes(q);
    if (!matchesQuery) return false;

    const statusPdkb = getStatusPdkb(person);
    if (statusFilter !== 'ALL' && statusPdkb !== statusFilter) return false;

    if (levelFilter !== 'ALL') {
      const levels = extractLevels(person);
      if (!levels.includes(levelFilter)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search & Filter Controls */}
      <div className="bg-[#121b20] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama personil, NIP, atau jabatan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a1014] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status PDKB Filter */}
          <div className="flex items-center bg-[#0a1014] p-1 rounded-lg border border-white/5">
            <span className="text-[10px] text-gray-500 uppercase font-bold px-2 hidden sm:inline">Status:</span>
            {(['ALL', 'AKTIF', 'MUTASI', 'TIDAK AKTIF'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                  statusFilter === st
                    ? 'bg-primary text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'Semua' : st}
              </button>
            ))}
          </div>

          {/* Level Filter */}
          <div className="flex items-center bg-[#0a1014] p-1 rounded-lg border border-white/5">
            <span className="text-[10px] text-gray-500 uppercase font-bold px-2 hidden sm:inline">Level:</span>
            {(['ALL', 'LV.2', 'LV.3', 'LV.4'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                  levelFilter === lvl
                    ? 'bg-primary text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {lvl === 'ALL' ? 'Semua' : lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      {filteredList.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-sm">
          Tidak ada personil yang sesuai dengan pencarian atau filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-6 sm:gap-y-10 align-top">
          {filteredList.map((person, idx) => {
            const levels = extractLevels(person);
            const foto = person["FOTO"] || person["Foto"] || person["foto"];
            const nama = person["NAMA"] || person["Nama"] || person["nama"] || 'NAMA PERSONIL';
            const jabatan = person["JABATAN"] || person["Jabatan"] || person["jabatan"] || 'PERSONIL';
            const statusPdkb = getStatusPdkb(person);

            return (
              <div 
                key={idx} 
                className="relative group cursor-pointer hover:scale-[1.03] transition-transform duration-300 w-full max-w-[300px] mx-auto filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)]"
                onClick={() => onSelectPerson(person)}
              >
                <div 
                  className="bg-[#d2eef2] border-[3px] border-[#a0d2d8] relative flex flex-col h-full min-h-[240px] sm:min-h-[390px]"
                  style={{ 
                    clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' 
                  }}
                >
                  {/* STATUS PDKB INDICATOR BADGE (Top Center / Overlay) */}
                  <div className="absolute top-1 right-2 z-30">
                    <span 
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-md border ${
                        statusPdkb === 'AKTIF'
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : statusPdkb === 'MUTASI'
                          ? 'bg-amber-600 text-white border-amber-300'
                          : 'bg-rose-700 text-white border-rose-400'
                      }`}
                    >
                      {statusPdkb === 'AKTIF' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      )}
                      {statusPdkb}
                    </span>
                  </div>

                  {/* Top Banner Wrapper */}
                  <div className="absolute top-2 left-2 right-2 z-10 filter drop-shadow-sm sm:drop-shadow-md">
                    <div 
                      className="bg-[#0b6b78] flex items-center justify-center py-1.5 sm:py-3 border border-t-[rgba(255,255,255,0.2)] border-b-[rgba(0,0,0,0.2)]"
                      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                    >
                      <span className="text-white font-black text-[11px] sm:text-[16px] tracking-wider uppercase drop-shadow-[1px_2px_2px_rgba(0,0,0,0.5)] truncate px-2">
                        {jabatan}
                      </span>
                    </div>
                    
                    {/* Levels Badges */}
                    <div className="flex flex-wrap gap-1 sm:gap-2 px-1.5 sm:px-3 -mt-[6px] sm:-mt-[9px] relative z-20 justify-center sm:justify-start">
                      {levels.length === 0 ? (
                        <div className="px-1.5 sm:px-2 py-0.5 font-bold text-[8px] sm:text-[9px] bg-gray-600/90 text-white rounded">
                          NON-LEVEL
                        </div>
                      ) : (
                        levels.map((lvl, lidx) => (
                          <div 
                            key={lidx} 
                            className={`px-1.5 sm:px-3 py-0.5 sm:py-1 font-black text-[9px] sm:text-[11px] shadow-[0_2px_4px_rgba(0,0,0,0.4)] border border-white/60 rounded-sm sm:rounded-md
                              ${lvl.toLowerCase().includes('lv.2') ? 'bg-[#006bb6] text-white' : 
                                lvl.toLowerCase().includes('lv.3') ? 'bg-[#c50000] text-white' : 
                                lvl.toLowerCase().includes('lv.4') ? 'bg-[#d97706] text-white' : 'bg-gray-600 text-white'
                              }`}
                          >
                            {lvl}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Photo Area */}
                  <div className="flex-1 flex justify-center items-end px-2 pt-20 sm:pt-32 pb-10 sm:pb-16">
                    {foto && foto !== '#N/A' && !foto.includes('no-image') ? (
                      <img 
                        src={foto} 
                        alt={nama} 
                        className="w-full h-auto max-h-[140px] sm:max-h-[250px] object-contain drop-shadow"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 sm:w-24 h-16 sm:h-24 mb-4 sm:mb-10 bg-black/10 rounded-full flex items-center justify-center border-2 sm:border-4 border-[#0b6b78]/20">
                        <span className="text-[#0b6b78]/50 font-bold text-[8px] sm:text-xs uppercase tracking-widest text-center px-1 sm:px-2">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Banner Wrapper */}
                  <div className="absolute bottom-2 left-2 right-2 z-10 filter drop-shadow-sm sm:drop-shadow-md group-hover:drop-shadow-lg transition-all">
                     <div 
                      className="bg-gradient-to-b from-[#ffffff] to-[#cccccc] border border-t-white border-b-gray-400 flex items-center justify-center py-2 sm:py-3"
                      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                     >
                       <span className="text-black font-black text-[9px] sm:text-sm tracking-widest uppercase truncate px-1 sm:px-2 text-center">
                         {nama}
                       </span>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
