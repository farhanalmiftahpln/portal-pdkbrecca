import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  Layers, 
  UserCheck, 
  UploadCloud, 
  ExternalLink,
  FileCheck2,
  FolderOpen
} from 'lucide-react';
import { 
  formatDateDDMMYYYY, 
  calculateHMinus1, 
  formatThreeDigitWo,
  getRomanMonth 
} from '../../utils/exportTemplateUtils';
import { 
  generateExactSp2bSp3bPdf, 
  Sp2bSp3bPdfData, 
  AssignedPersonRow 
} from '../../utils/exactPdfTemplateGenerator';
import { gasService } from '../../services/gasService';

interface ExportSp2bSp3bModalProps {
  isOpen: boolean;
  onClose: () => void;
  workPlan: any;
  reviewWoDetail?: any;
}

export type TaskType = 
  | 'PENGAWAS PEKERJAAN' 
  | 'PENGAWAS K3' 
  | 'LINEMAN' 
  | 'GROUNDMAN' 
  | 'OJT' 
  | 'TIDAK HADIR';

const TASK_OPTIONS: TaskType[] = [
  'PENGAWAS PEKERJAAN',
  'PENGAWAS K3',
  'LINEMAN',
  'GROUNDMAN',
  'OJT',
  'TIDAK HADIR'
];

interface AssignedPerson {
  nama: string;
  nip: string;
  noSerkomLv2: string;
  noSerkomLv3: string;
  statusKesehatan?: string;
  isReadyHealth?: boolean;
  tugas: TaskType;
}

const DEFAULT_SP_TEMPLATE_DOC_ID = '1kdpZFjeu356d-vF16ph9oZhuPKHZAueBdO3mDmr7lso';
const TARGET_DRIVE_FOLDER_ID = '1urqblbRHzJroJ5i8VjCIpb0iDkBrQNF6';
const TARGET_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${TARGET_DRIVE_FOLDER_ID}?usp=sharing`;

// Helper to format ADA / TIDAK ADA in clean uppercase
function formatAdaTidakAda(val?: string): string {
  if (!val) return 'TIDAK ADA';
  const s = String(val).trim().toUpperCase();
  if (s.includes('TIDAK') || s === 'NO' || s === 'NONE') return 'TIDAK ADA';
  if (s.includes('ADA') || s === 'YA' || s === 'YES') return 'ADA';
  return s;
}

export const ExportSp2bSp3bModal: React.FC<ExportSp2bSp3bModalProps> = ({
  isOpen,
  onClose,
  workPlan,
  reviewWoDetail
}) => {
  // Document mode
  const [docType, setDocType] = useState<'BUNDLE' | 'SP2B' | 'SP3B'>('BUNDLE');

  // Google Docs Template ID
  const [templateDocId, setTemplateDocId] = useState(() => {
    return localStorage.getItem('pln_sp_template_doc_id') || DEFAULT_SP_TEMPLATE_DOC_ID;
  });

  // Input fields (default empty / blank as requested)
  const [inputNoSp2b, setInputNoSp2b] = useState('');
  const [inputNoWo, setInputNoWo] = useState('');
  const [inputNoTiang, setInputNoTiang] = useState('');
  const [durasiPekerjaan, setDurasiPekerjaan] = useState('3'); // in hours
  const [tingkatKesulitan, setTingkatKesulitan] = useState<'MUDAH' | 'SEDANG' | 'SULIT'>('SEDANG');
  const [opsiSiap, setOpsiSiap] = useState<'MAMPU' | 'TIDAK MAMPU'>('MAMPU');

  // Officials
  const [preparatorName, setPreparatorName] = useState('AKMAL FADIL');
  const [asmanName, setAsmanName] = useState('BAKHTIAR');
  const [asmanBidang, setAsmanBidang] = useState('ASMAN JARINGAN DAN KONSTRUKSI');

  // Personil & Health States
  const [assignedPersonnel, setAssignedPersonnel] = useState<AssignedPerson[]>([]);
  const [personilReadyCount, setPersonilReadyCount] = useState<number>(0);
  const [totalActivePersonnel, setTotalActivePersonnel] = useState<number>(0);
  const [isLoadingPersonil, setIsLoadingPersonil] = useState(false);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string; fileUrl?: string; downloadUrl?: string } | null>(null);

  // Review WO Detail Area
  const areaData = useMemo(() => {
    const defaultArea = {
      kondisiTanah: 'Kering',
      jarakJalanRaya: '5 Meter',
      opsiBangunan: 'TIDAK ADA',
      opsiPohon: 'ADA',
      opsiJalan: 'Perlu Rambu K3 & Traffic Cone'
    };

    if (!reviewWoDetail) return defaultArea;

    const area = reviewWoDetail.area || reviewWoDetail.details?.area || reviewWoDetail || {};
    return {
      kondisiTanah: area['KONDISI TANAH'] || area.kondisiTanah || area.kondisi_tanah || defaultArea.kondisiTanah,
      jarakJalanRaya: area['JARAK LOKASI-JALAN RAYA'] || area['JARAK LOKASI - JALAN RAYA'] || area.jarakJalanRaya || area.jarak_jalan_raya || defaultArea.jarakJalanRaya,
      opsiBangunan: formatAdaTidakAda(area['OPSI BANGUNAN'] || area.opsiBangunan || area.opsi_bangunan),
      opsiPohon: formatAdaTidakAda(area['OPSI POHON'] || area.opsiPohon || area.opsi_pohon),
      opsiJalan: area['OPSI JALAN'] || area.opsiJalan || area.opsi_jalan || defaultArea.opsiJalan
    };
  }, [reviewWoDetail]);

  // Load personil, roles & health data
  useEffect(() => {
    if (!isOpen || !workPlan) return;

    // Default input fields blank as requested by user
    setInputNoWo('');
    setInputNoSp2b('');
    setInputNoTiang(workPlan.noTiang || workPlan['NO. TIANG'] || workPlan['NO TIANG'] || workPlan.no_tiang || workPlan.keypoint || workPlan['KEYPOINT'] || '');

    async function loadData() {
      setIsLoadingPersonil(true);
      try {
        const pRes = await gasService.post('getAllPersonil');
        const hRes = await gasService.post('getLogKesehatan');
        const rolesRes = await gasService.post('getExportTemplateData', {});

        if (rolesRes && rolesRes.success && rolesRes.data) {
          if (rolesRes.data.preparator) setPreparatorName(rolesRes.data.preparator);
          if (rolesRes.data.asman) setAsmanName(rolesRes.data.asman);
          if (rolesRes.data.asmanBidang) setAsmanBidang(rolesRes.data.asmanBidang);
        }

        const rawPersonil: any[] = (pRes && pRes.success && Array.isArray(pRes.data)) ? pRes.data : [];
        const healthLogs: any[] = (hRes && hRes.success && Array.isArray(hRes.data)) ? hRes.data : [];

        const planDateStr = formatDateDDMMYYYY(workPlan.tanggal_direncanakan || workPlan.tanggal || new Date());

        const activePersons = rawPersonil.filter((p: any) => {
          const cert = String(p.sertifikat_kompetensi || p['STATUS PDKB'] || p.status || 'AKTIF').toUpperCase().trim();
          return !cert.includes('TIDAK') && !cert.includes('NON') && !cert.includes('PASIF') && !cert.includes('MUTASI') && !cert.includes('EXPIRED');
        });

        setTotalActivePersonnel(activePersons.length);

        let readyCount = 0;
        const initialList: AssignedPerson[] = activePersons.slice(0, 10).map((p: any, idx: number) => {
          const pName = String(p.NAMA || p.nama || '').trim();
          const pNip = String(p.NIP || p.nip || '').trim();

          const healthRecord = healthLogs.find((h: any) => {
            const hDate = formatDateDDMMYYYY(h.tanggal || h.Tanggal || h.date);
            const hNip = String(h.nip || h.NIP || '').trim();
            const hName = String(h.nama || h.Nama || h.name || '').trim();
            const matchPerson = (pNip && hNip === pNip) || (pName && hName.toLowerCase() === pName.toLowerCase());
            return matchPerson && (hDate === planDateStr);
          });

          let isReady = true;
          let statusText = 'Sehat (Siap)';

          if (healthRecord) {
            const sf = String(healthRecord.status_fisik || '').toUpperCase().trim();
            const sm = String(healthRecord.status_mental || '').toUpperCase().trim();

            if (sf.includes('TIDAK') || sm.includes('TIDAK')) {
              isReady = false;
              statusText = 'Tidak Sehat';
            } else if (sf.includes('KURANG') || sm.includes('KURANG')) {
              statusText = 'Kurang Sehat (Layak)';
              isReady = true;
            } else {
              statusText = 'Sehat';
              isReady = true;
            }
          }

          if (isReady) readyCount++;

          let defaultTask: TaskType = 'LINEMAN';
          if (idx === 0) defaultTask = 'PENGAWAS PEKERJAAN';
          else if (idx === 1) defaultTask = 'PENGAWAS K3';
          else if (idx >= 6) defaultTask = 'GROUNDMAN';

          return {
            nama: pName || `Personil PDKB ${idx + 1}`,
            nip: pNip || `1990010${idx + 1}`,
            noSerkomLv2: String(p.no_serkom_lv2 || p['NO SERKOM LV2'] || `SERKOM-LV2-${idx + 1}`).trim(),
            noSerkomLv3: String(p.no_serkom_lv3 || p['NO SERKOM LV3'] || `SERKOM-LV3-${idx + 1}`).trim(),
            statusKesehatan: statusText,
            isReadyHealth: isReady,
            tugas: defaultTask
          };
        });

        // Fill up to 10 if less than 10
        while (initialList.length < 10) {
          const idx = initialList.length;
          initialList.push({
            nama: `Personil PDKB ${idx + 1}`,
            nip: `1990010${idx + 1}`,
            noSerkomLv2: `SERKOM-LV2-${idx + 1}`,
            noSerkomLv3: `SERKOM-LV3-${idx + 1}`,
            statusKesehatan: 'Sehat (Siap)',
            isReadyHealth: true,
            tugas: idx === 0 ? 'PENGAWAS PEKERJAAN' : (idx === 1 ? 'PENGAWAS K3' : 'LINEMAN')
          });
          readyCount++;
        }

        setAssignedPersonnel(initialList);
        setPersonilReadyCount(readyCount);
      } catch (err) {
        console.error('Failed to load personil/roles:', err);
      } finally {
        setIsLoadingPersonil(false);
      }
    }

    loadData();
  }, [isOpen, workPlan]);

  if (!isOpen || !workPlan) return null;

  // Extracted variables
  const bulanRomawi = getRomanMonth();
  const tahunSaatIni = new Date().getFullYear().toString();
  const instruksiKerja = workPlan.instruksi_kerja || workPlan['INSTRUKSI KERJA'] || workPlan.instruksi || workPlan['INSTRUKSI'] || workPlan.pekerjaan || workPlan['PEKERJAAN'] || workPlan.jenisPekerjaan || workPlan['JENIS PEKERJAAN'] || 'PEMELIHARAAN JARINGAN DISTRIBUSI 20kV';
  const jenisPekerjaan = workPlan.jenis_pekerjaan || workPlan['JENIS PEKERJAAN'] || instruksiKerja;
  const tanggalDirencanakanRaw = workPlan.tanggal_direncanakan || workPlan['TANGGAL DIRENCANAKAN'] || workPlan.tanggal || workPlan['TANGGAL'] || new Date();
  const tanggalDirencanakanFormatted = formatDateDDMMYYYY(tanggalDirencanakanRaw);
  const tanggalHMinus1 = calculateHMinus1(tanggalDirencanakanRaw);

  const rawUlp = workPlan.ulp || workPlan['ULP'] || 'WATAMPONE';
  const ulpFormatted = rawUlp.toUpperCase().startsWith('ULP') ? rawUlp : `ULP ${rawUlp}`;
  const alamat = workPlan.alamat || workPlan['ALAMAT'] || '-';
  const garduInduk = workPlan.gardu_induk || workPlan.garduInduk || workPlan['GARDU INDUK'] || '-';
  const penyulang = workPlan.penyulang || workPlan['PENYULANG'] || '-';
  const jenisTiang = workPlan.jenis_tiang || workPlan.jenisTiang || workPlan['JENIS TIANG'] || 'BETON';
  const ukuranTiang = workPlan.ukuran_tiang || workPlan.ukuranTiang || workPlan['UKURAN TIANG'] || '12';
  const jenisKonduktor = workPlan.jenis_konduktor || workPlan.jenisKonduktor || workPlan['JENIS KONDUKTOR'] || 'AAAC-S';
  const ukuranKonduktor = workPlan.ukuran_konduktor || workPlan.ukuranKonduktor || workPlan['UKURAN KONDUKTOR'] || '150';
  const fotoUrl = workPlan.foto_temuan || workPlan['FOTO TEMUAN'] || workPlan.foto || workPlan['FOTO'] || '';
  const koordinat = workPlan.titik_koordinat || workPlan['TITIK KOORDINAT'] || workPlan.koordinat || '';

  // Extract PP & PK3 from current table assignment
  const personPengawasPekerjaan = assignedPersonnel.find(p => p.tugas === 'PENGAWAS PEKERJAAN');
  const personPengawasK3 = assignedPersonnel.find(p => p.tugas === 'PENGAWAS K3');

  const namaPP = personPengawasPekerjaan?.nama || 'PENGAWAS PEKERJAAN';
  const noLv3PP = personPengawasPekerjaan?.noSerkomLv3 || '12345678-L3';
  const namaPK3 = personPengawasK3?.nama || 'PENGAWAS K3';
  const noLv3PK3 = personPengawasK3?.noSerkomLv3 || '87654321-L3';

  const getProfilString = (p: AssignedPerson) => {
    if (!p) return '-';
    let noSertifikat = p.noSerkomLv2;
    if (p.tugas === 'PENGAWAS PEKERJAAN' || p.tugas === 'PENGAWAS K3') {
      noSertifikat = p.noSerkomLv3 || p.noSerkomLv2;
    }
    return `${p.nama}-${p.nip}\n(No Sertifikat : ${noSertifikat || '-'})`;
  };

  const handleTaskChange = (index: number, newTask: TaskType) => {
    setAssignedPersonnel(prev => {
      const next = [...prev];
      next[index] = { ...next[index], tugas: newTask };
      return next;
    });
  };

  // Helper download base64
  const downloadBase64Pdf = (base64Data: string, filename: string) => {
    try {
      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    } catch (e) {
      console.error('Download base64 error:', e);
    }
  };

  // Main Export Handler using Google Docs Template (Option 1)
  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    // Format nama file: "[NAMA BERKAS]-[NO. WO].pdf"
    let prefix = 'SP2B_SP3B';
    if (docType === 'SP2B') prefix = 'SP2B';
    if (docType === 'SP3B') prefix = 'SP3B';

    const cleanDateStr = tanggalDirencanakanFormatted.replace(/[\/\-\s]/g, '');
    const fileName = inputNoWo ? `${prefix}-${inputNoWo}.pdf` : `${prefix}-${cleanDateStr}.pdf`;

    try {
      if (templateDocId) {
        localStorage.setItem('pln_sp_template_doc_id', templateDocId.trim());
      }

      setExportProgress('Menghubungi Google Docs Template & me-replace placeholder SP2B/SP3B...');

      const rawEntries: Record<string, string> = {
        'INPUT NO. SP2B': inputNoSp2b || '',
        'INPUT NO. WO': inputNoWo || '',
        'BULAN': bulanRomawi,
        'TAHUN': tahunSaatIni,
        'tanggal_direncanakan': tanggalDirencanakanFormatted,
        'h-1.tanggal_direncanakan': tanggalHMinus1,
        'instruksi_kerja': instruksiKerja,
        'jenis_pekerjaan': instruksiKerja, // identik sesuai permintaan
        'ulp': ulpFormatted,
        'alamat': alamat,
        'INPUT NO. TIANG': inputNoTiang || '',
        'gardu_induk': garduInduk,
        'penyulang': penyulang,
        'jenis_tiang': jenisTiang,
        'ukuran_tiang': ukuranTiang,
        'jenis_konduktor': jenisKonduktor,
        'ukuran_konduktor': ukuranKonduktor,
        'area.KONDISI TANAH': areaData.kondisiTanah,
        'area. JARAK LOKASI-JALAN RAYA': areaData.jarakJalanRaya,
        'area.JARAK LOKASI-JALAN RAYA': areaData.jarakJalanRaya,
        'PERSONIL READY': `${personilReadyCount}`,
        'DURASI PEKERJAAN': `${durasiPekerjaan}`,
        'TINGKAT KESULITAN': tingkatKesulitan,
        'OPSI BANGUNAN': formatAdaTidakAda(areaData.opsiBangunan),
        'OPSI POHON': formatAdaTidakAda(areaData.opsiPohon),
        'OPSI SIAP': opsiSiap,
        'OPSI JALAN': areaData.opsiJalan,
        'user_name.user_role=PREPARATOR': preparatorName,
        'user_name.user_role=ASMAN': asmanName,
        'user_bidang.user_role=ASMAN': asmanBidang,
        'nama_pp': namaPP,
        'no_lv3_pp': noLv3PP,
        'nama_pk3': namaPK3,
        'no_lv3_pk3': noLv3PK3,
        'paraf_preparator': '',
        'paraf_asman': '',
        'paraf_tlpdkb': ''
      };

      const replacements: Record<string, string> = {};
      for (const [k, v] of Object.entries(rawEntries)) {
        replacements[k] = v;
        replacements[`{{${k}}}`] = v;
        replacements[`[${k}]`] = v;
      }

      // Add 10 Personil rows replacements (nama_p, nip_p, no_sertifikat_p, tugas_p, ttd_p)
      for (let i = 1; i <= 10; i++) {
        const p = assignedPersonnel[i - 1];
        const nama = p?.nama || '';
        const nip = p?.nip || '';
        let cert = p?.noSerkomLv2 || '';
        if (p && (p.tugas === 'PENGAWAS PEKERJAAN' || p.tugas === 'PENGAWAS K3')) {
          cert = p.noSerkomLv3 || p.noSerkomLv2 || '';
        }
        const tugas = p?.tugas || (p ? 'LINEMAN' : '');
        const profil = p ? getProfilString(p) : '';

        replacements[`nama_p${i}`] = nama;
        replacements[`{{nama_p${i}}}`] = nama;
        replacements[`nip_p${i}`] = nip;
        replacements[`{{nip_p${i}}}`] = nip;
        replacements[`no_sertifikat_p${i}`] = cert;
        replacements[`{{no_sertifikat_p${i}}}`] = cert;
        replacements[`tugas_p${i}`] = tugas;
        replacements[`{{tugas_p${i}}}`] = tugas;
        replacements[`ttd_p${i}`] = '';
        replacements[`{{ttd_p${i}}}`] = '';
        replacements[`profil_p${i}`] = profil;
        replacements[`{{profil_p${i}}}`] = profil;
      }

      const imageReplacements: Record<string, string> = {
        'foto_temuan': fotoUrl || '',
        'CAPTURE MAP': ''
      };

      const personnelListForPayload = assignedPersonnel.map(p => ({
        nama: p.nama,
        nip: p.nip,
        noSerkomLv2: p.noSerkomLv2,
        noSerkomLv3: p.noSerkomLv3,
        tugas: p.tugas
      }));

      const gDocRes: any = await gasService.post('exportFromGoogleDocTemplate', {
        templateDocId: templateDocId.trim() || DEFAULT_SP_TEMPLATE_DOC_ID,
        folderId: TARGET_DRIVE_FOLDER_ID,
        fileName,
        docType: docType || 'SP2B_SP3B',
        replacements,
        personnelList: personnelListForPayload,
        rawReplacements: {
          inputNoSp2b: inputNoSp2b || '',
          inputNoWo: inputNoWo || '',
          bulan: bulanRomawi,
          tahun: tahunSaatIni,
          tanggalDirencanakan: tanggalDirencanakanFormatted,
          tanggalHMinus1: tanggalHMinus1,
          instruksiKerja,
          jenisPekerjaan: instruksiKerja,
          ulp: ulpFormatted,
          alamat,
          inputNoTiang: inputNoTiang || '',
          garduInduk,
          penyulang,
          jenisTiang,
          ukuranTiang,
          jenisKonduktor,
          ukuranKonduktor,
          kondisiTanah: areaData.kondisiTanah,
          jarakJalanRaya: areaData.jarakJalanRaya,
          personilReady: personilReadyCount,
          durasiPekerjaan,
          tingkatKesulitan,
          opsiBangunan: areaData.opsiBangunan,
          opsiPohon: areaData.opsiPohon,
          opsiSiap,
          opsiJalan: areaData.opsiJalan,
          preparator: preparatorName,
          asman: asmanName,
          asmanBidang: asmanBidang,
          namaPP: namaPP,
          noLv3PP: noLv3PP,
          namaPK3: namaPK3,
          noLv3PK3: noLv3PK3,
          koordinat,
          fotoUrl
        },
        imageReplacements
      });

      if (gDocRes && gDocRes.success) {
        if (gDocRes.pdfBase64) {
          downloadBase64Pdf(gDocRes.pdfBase64, fileName);
        }

        setExportResult({
          success: true,
          message: `Dokumen "${fileName}" berhasil digenerate dari Google Docs Template resmi dan tersimpan di Google Drive.`,
          fileUrl: gDocRes.fileUrl || `https://drive.google.com/file/d/${gDocRes.fileId}/view`,
          downloadUrl: gDocRes.downloadUrl
        });
      } else {
        console.warn('Apps Script template export error:', gDocRes?.error);
        const errMsg = gDocRes?.message || gDocRes?.error || 'Gagal mengekspor dari Google Docs Template resmi.';
        setExportResult({
          success: false,
          message: errMsg
        });
      }

    } catch (err: any) {
      console.error('Export error:', err);
      setExportResult({
        success: false,
        message: `Terjadi kendala saat export dari Google Docs Template: ${err.message || 'Gagal memproses template'}`
      });
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b1317] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                Dokumen SP2B & SP3B
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-sm custom-scrollbar">

          {/* Result Alert */}
          {exportResult && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              exportResult.success 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold">{exportResult.message}</p>
                <div className="flex items-center gap-4 mt-2">
                  {exportResult.fileUrl && (
                    <a
                      href={exportResult.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold text-primary underline hover:text-white"
                    >
                      Buka Dokumen di Google Drive <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {exportResult.downloadUrl && (
                    <a
                      href={exportResult.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold text-emerald-400 underline hover:text-emerald-300"
                    >
                      Download File Langsung <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Parameter Input */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Layers className="w-4 h-4" />
              1. Parameter Penomoran & Kondisi Lapangan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  NO. SP2B-SP3B SIMPDKB <span className="text-primary font-mono">(3 Digit)</span>
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={inputNoSp2b}
                  onChange={(e) => setInputNoSp2b(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="001"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  NO. WO SIMPDKB
                </label>
                <input
                  type="text"
                  value={inputNoWo}
                  onChange={(e) => setInputNoWo(e.target.value)}
                  placeholder="001"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  NO. TIANG
                </label>
                <input
                  type="text"
                  value={inputNoTiang}
                  onChange={(e) => setInputNoTiang(e.target.value)}
                  placeholder="Contoh: T.15"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  DURASI PEKERJAAN <span className="text-gray-500 font-normal">(Jam)</span>
                </label>
                <input
                  type="text"
                  value={durasiPekerjaan}
                  onChange={(e) => setDurasiPekerjaan(e.target.value)}
                  placeholder="3"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-primary"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  TINGKAT KESULITAN
                </label>
                <select
                  value={tingkatKesulitan}
                  onChange={(e) => setTingkatKesulitan(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-primary"
                >
                  <option value="MUDAH">MUDAH</option>
                  <option value="SEDANG">SEDANG</option>
                  <option value="SULIT">SULIT</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  KESIAPAN TIM
                </label>
                <select
                  value={opsiSiap}
                  onChange={(e) => setOpsiSiap(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-primary"
                >
                  <option value="MAMPU">MAMPU</option>
                  <option value="TIDAK MAMPU">TIDAK MAMPU</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Personil Ready & Penugasan Personil */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  2. Penugasan Personil
                </h3>
              </div>
              <div className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded self-start sm:self-auto">
                Ready: {personilReadyCount} / {totalActivePersonnel} Aktif
              </div>
            </div>

            {isLoadingPersonil ? (
              <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs">Memuat personil dan riwayat kesehatan...</span>
              </div>
            ) : (
              <div className="overflow-x-auto border border-white/10 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-gray-400 border-b border-white/10 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 w-8 text-center">No</th>
                      <th className="p-2.5">Personil (Nama & NIP)</th>
                      <th className="p-2.5">Kondisi Kesehatan</th>
                      <th className="p-2.5 w-44">TUGAS (Dropdown)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {assignedPersonnel.map((p, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="p-2.5 text-center font-mono text-gray-500">{idx + 1}</td>
                        <td className="p-2.5">
                          <div className="font-bold text-white">{p.nama}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{p.nip}</div>
                        </td>
                        <td className="p-2.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold ${
                            p.isReadyHealth ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {p.isReadyHealth ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {p.statusKesehatan}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <select
                            value={p.tugas}
                            onChange={(e) => handleTaskChange(idx, e.target.value as TaskType)}
                            className="w-full bg-black/60 border border-white/15 rounded px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-primary"
                          >
                            {TASK_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Pejabat Pengesahan */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              3. Pejabat Pengesahan Dokumen
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  PREPARATOR
                </label>
                <input
                  type="text"
                  value={preparatorName}
                  onChange={(e) => setPreparatorName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  KEPALA OPERASI
                </label>
                <input
                  type="text"
                  value={asmanName}
                  onChange={(e) => setAsmanName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#090f13] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-400 font-mono">
            Target Berkas: <strong className="text-white">
              {docType === 'BUNDLE' ? 'SP2B_SP3B' : docType}-{(inputNoWo || '001')}.pdf
            </strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Tutup
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-black text-xs font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <UploadCloud className="w-4 h-4 text-black" />}
              <span>{isExporting ? (exportProgress || 'Memproses...') : 'Export & Simpan ke Google Drive'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
