import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  CheckCircle2, 
  Loader2, 
  UploadCloud,
  ExternalLink,
  FileCheck2
} from 'lucide-react';
import { 
  getRomanMonth, 
  formatDateDDMMYYYY, 
  formatThreeDigitWo,
  getStaticMapImageUrl
} from '../../utils/exportTemplateUtils';
import { generateExactWorkOrderPdf, WorkOrderPdfData } from '../../utils/exactPdfTemplateGenerator';
import { gasService } from '../../services/gasService';

interface ExportWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: any;
  preparatorName?: string;
  asmanName?: string;
}

const DEFAULT_WO_TEMPLATE_DOC_ID = '17le09DrRAqCtmdBQWtWqsD-KO-2td3eTSVXn_mg5r_o';
const TARGET_DRIVE_FOLDER_ID = '1urqblbRHzJroJ5i8VjCIpb0iDkBrQNF6';
const TARGET_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${TARGET_DRIVE_FOLDER_ID}?usp=sharing`;

export const ExportWorkOrderModal: React.FC<ExportWorkOrderModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  preparatorName = 'AKMAL FADIL',
  asmanName = 'BAKHTIAR'
}) => {
  // Template ID state
  const [templateDocId, setTemplateDocId] = useState(() => {
    return localStorage.getItem('pln_wo_template_doc_id') || DEFAULT_WO_TEMPLATE_DOC_ID;
  });

  // Input fields
  const [inputNoWo, setInputNoWo] = useState('');
  const [inputNoTiang, setInputNoTiang] = useState('');
  const [customInstruksi, setCustomInstruksi] = useState('');
  const [preparator, setPreparator] = useState(preparatorName);
  const [asman, setAsman] = useState(asmanName);
  const [enrichedData, setEnrichedData] = useState<any>(null);

  // States
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string; fileUrl?: string; downloadUrl?: string } | null>(null);

  // Default values computation
  useEffect(() => {
    if (workOrder) {
      const defaultDigit = formatThreeDigitWo(workOrder.noWo || workOrder['NO. WO'] || workOrder.no_wo || workOrder.id);
      setInputNoWo(defaultDigit);
      setInputNoTiang(workOrder.noTiang || workOrder['NO. TIANG'] || workOrder['NO TIANG'] || workOrder.keypoint || workOrder['KEYPOINT'] || '');
      const initialInstruksi =
        workOrder.instruksi_kerja || 
        workOrder['INSTRUKSI KERJA'] ||
        workOrder.instruksiKerja || 
        workOrder.pekerjaan || 
        workOrder['PEKERJAAN'] ||
        workOrder.jenisPekerjaan || 
        workOrder['JENIS PEKERJAAN'] ||
        workOrder.details?.pekerjaan?.['INSTRUKSI KERJA'] || 
        '';
      if (initialInstruksi) {
        setCustomInstruksi(initialInstruksi);
      }
    }
  }, [workOrder]);

  // Fetch full data enrichment from getWorkPlanDetail directly
  useEffect(() => {
    async function fetchFullData() {
      if (!workOrder) return;
      const targetNoWo = String(workOrder.noWo || workOrder['NO. WO'] || workOrder.no_wo || workOrder.id || '').trim();
      if (!targetNoWo) return;

      try {
        const res = await gasService.post('getWorkPlanDetail', { noWo: targetNoWo });
        if (res && res.success && res.data) {
          const d = res.data;
          setEnrichedData({
            instruksiKerja: d['INSTRUKSI KERJA'] || d.instruksi_kerja,
            ulp: d['ULP'] || d.ulp,
            garduInduk: d['GARDU INDUK'] || d.gardu_induk,
            penyulang: d['PENYULANG'] || d.penyulang,
            jenisTiang: d['JENIS TIANG'] || d.jenis_tiang,
            ukuranTiang: d['UKURAN TIANG'] || d.ukuran_tiang,
            jenisKonduktor: d['JENIS KONDUKTOR'] || d.jenis_konduktor,
            ukuranKonduktor: d['UKURAN KONDUKTOR'] || d.ukuran_konduktor,
            alamat: d['ALAMAT'] || d.alamat,
            koordinat: d['TITIK KOORDINAT'] || d.koordinat,
            foto: d['FOTO TEMUAN'] || d.foto,
            noTiang: d['KEYPOINT'] || d.keypoint || d['NO. TIANG']
          });
          if (d['INSTRUKSI KERJA']) {
            setCustomInstruksi(d['INSTRUKSI KERJA']);
          }
          if (d['KEYPOINT']) {
            setInputNoTiang(d['KEYPOINT']);
          }
        }
      } catch (err) {
        console.warn('Enrichment work order failed:', err);
      }
    }

    if (isOpen) {
      fetchFullData();
    }
  }, [isOpen, workOrder]);

  // Update input values when enriched data becomes available
  useEffect(() => {
    if (enrichedData) {
      if (enrichedData.instruksiKerja) {
        setCustomInstruksi(enrichedData.instruksiKerja);
      }
      if (enrichedData.noTiang && !inputNoTiang) {
        setInputNoTiang(enrichedData.noTiang);
      }
    }
  }, [enrichedData]);

  // Fetch actual user roles if available
  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await gasService.post('getExportTemplateData', {});
        if (res && res.success && res.data) {
          if (res.data.preparator) setPreparator(res.data.preparator);
          if (res.data.asman) setAsman(res.data.asman);
        }
      } catch (err) {}
    }
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  if (!isOpen || !workOrder) return null;

  // Variables according to instructions
  const bulanRomawi = getRomanMonth();
  const tahunSaatIni = new Date().getFullYear().toString();
  const tanggalSurveyRaw = workOrder.tanggal || workOrder.Tanggal || workOrder.tanggal_survey || new Date();
  const tanggalSurveyFormatted = formatDateDDMMYYYY(tanggalSurveyRaw);

  const rawUlp = workOrder.ulp || workOrder['ULP'] || enrichedData?.ulp || 'WATAMPONE';
  const ulpFormatted = rawUlp.toUpperCase().startsWith('ULP') ? rawUlp : `ULP ${rawUlp}`;
  const alamat = workOrder.alamat || workOrder['ALAMAT'] || enrichedData?.alamat || '-';
  const garduInduk = workOrder.gardu_induk || workOrder.garduInduk || workOrder['GARDU INDUK'] || workOrder.gi || workOrder['GI'] || workOrder.details?.lokasi?.['GARDU INDUK'] || enrichedData?.garduInduk || '-';
  const penyulang = workOrder.penyulang || workOrder['PENYULANG'] || workOrder.details?.lokasi?.['PENYULANG'] || enrichedData?.penyulang || '-';
  const jenisTiang = workOrder.jenisTiang || workOrder.jenis_tiang || workOrder['JENIS TIANG'] || enrichedData?.jenisTiang || 'BETON';
  const ukuranTiang = workOrder.ukuranTiang || workOrder.ukuran_tiang || workOrder['UKURAN TIANG'] || enrichedData?.ukuranTiang || '12';
  const jenisKonduktor = workOrder.jenisKonduktor || workOrder.jenis_konduktor || workOrder['JENIS KONDUKTOR'] || enrichedData?.jenisKonduktor || 'AAAC-S';
  const ukuranKonduktor = workOrder.ukuranKonduktor || workOrder.ukuran_konduktor || workOrder['UKURAN KONDUKTOR'] || enrichedData?.ukuranKonduktor || '150';
  const fotoTemuan = workOrder.temuan || workOrder['TEMUAN'] || workOrder.foto_temuan || enrichedData?.foto || '-';
  const fotoUrl = workOrder.foto || workOrder['FOTO TEMUAN'] || workOrder.foto_temuan || workOrder.FOTO || enrichedData?.foto || '';
  const koordinat = workOrder.koordinat || workOrder['TITIK KOORDINAT'] || workOrder.titik_koordinat || workOrder.titikKoordinat || enrichedData?.koordinat || '';
  const mapUrl = getStaticMapImageUrl(koordinat);

  // Trigger browser download from base64 string
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
  const handleExport = async (directDownloadOnly = false) => {
    setIsExporting(true);
    setExportResult(null);

    // Format nama file: "[NAMA BERKAS]-[NO. WO].pdf"
    const fileName = `WORK_ORDER-${inputNoWo || '001'}.pdf`;

    try {
      // 1. Simpan preferensi template ID
      if (templateDocId) {
        localStorage.setItem('pln_wo_template_doc_id', templateDocId.trim());
      }

      setExportProgress('Menghubungi Google Docs Template & me-replace placeholder...');

      const replacements: Record<string, string> = {
        'INPUT NO. WO': inputNoWo || '001',
        'BULAN': bulanRomawi,
        'TAHUN': tahunSaatIni,
        'TANGGAL_SURVEY': tanggalSurveyFormatted,
        'tanggal_survey': tanggalSurveyFormatted,
        'ulp': ulpFormatted,
        'instruksi_kerja': customInstruksi,
        'alamat': alamat,
        'INPUT NO. TIANG': inputNoTiang || '-',
        'gardu_induk': garduInduk,
        'penyulang': penyulang,
        'jenis_tiang': jenisTiang,
        'ukuran_tiang': ukuranTiang,
        'jenis_konduktor': jenisKonduktor,
        'ukuran_konduktor': ukuranKonduktor,
        'user_name.user_role=PREPARATOR': preparator,
        'user_name.user_role=ASMAN': asman,
        'koordinat': koordinat
      };

      const imageReplacements: Record<string, string> = {
        'foto_temuan': fotoUrl || '',
        'CAPTURE MAP': mapUrl || ''
      };

      // Panggil backend Google Apps Script dengan action exportFromGoogleDocTemplate
      const gDocRes: any = await gasService.post('exportFromGoogleDocTemplate', {
        templateDocId: templateDocId.trim() || DEFAULT_WO_TEMPLATE_DOC_ID,
        folderId: TARGET_DRIVE_FOLDER_ID,
        fileName,
        docType: 'WORK_ORDER',
        replacements,
        rawReplacements: {
          inputNoWo: inputNoWo || '001',
          bulan: bulanRomawi,
          tahun: tahunSaatIni,
          tanggalSurvey: tanggalSurveyFormatted,
          ulp: ulpFormatted,
          instruksiKerja: customInstruksi,
          alamat,
          inputNoTiang: inputNoTiang || '-',
          garduInduk,
          penyulang,
          jenisTiang,
          ukuranTiang,
          jenisKonduktor,
          ukuranKonduktor,
          preparator,
          asman,
          koordinat,
          fotoUrl,
          mapUrl
        },
        imageReplacements
      });

      if (gDocRes && gDocRes.success) {
        // Jika backend berhasil mengembalikan PDF
        if (gDocRes.pdfBase64) {
          downloadBase64Pdf(gDocRes.pdfBase64, fileName);
        }

        setExportResult({
          success: true,
          message: `Dokumen "${fileName}" berhasil digenerate dari Google Docs Template dan tersimpan di Google Drive.`,
          fileUrl: gDocRes.fileUrl || `https://drive.google.com/file/d/${gDocRes.fileId}/view`,
          downloadUrl: gDocRes.downloadUrl
        });
      } else {
        // Fallback: Jika Apps Script template error, generate PDF lokal sebagai backup aman
        console.warn('Google Doc export error, using local template fallback:', gDocRes?.error);
        setExportProgress('Menyusun PDF fallback lokal...');
        
        const pdfData: WorkOrderPdfData = {
          noWo: workOrder.noWo || workOrder.id,
          inputNoWo: inputNoWo || '001',
          inputNoTiang: inputNoTiang || '-',
          instruksiKerja: customInstruksi,
          ulp: ulpFormatted,
          alamat,
          garduInduk,
          penyulang,
          jenisTiang,
          ukuranTiang,
          jenisKonduktor,
          ukuranKonduktor,
          tanggalSurvey: tanggalSurveyRaw,
          koordinat,
          fotoTemuan,
          fotoUrl,
          mapUrl,
          preparatorName: preparator,
          asmanName: asman
        };

        const doc = await generateExactWorkOrderPdf(pdfData);
        doc.save(fileName);

        // Upload ke drive juga
        const pdfBase64 = doc.output('datauristring');
        await gasService.post('uploadFileToDrive', {
          fileName,
          fileBase64: pdfBase64,
          mimeType: 'application/pdf',
          folderId: TARGET_DRIVE_FOLDER_ID
        });

        setExportResult({
          success: true,
          message: `Dokumen "${fileName}" berhasil diunduh ke perangkat Anda.`
        });
      }

    } catch (err: any) {
      console.error('Export error:', err);
      // Fallback lokal jika ada error jaringan
      try {
        const doc = await generateExactWorkOrderPdf({
          noWo: workOrder.noWo || workOrder.id,
          inputNoWo: inputNoWo || '001',
          inputNoTiang: inputNoTiang || '-',
          instruksiKerja: customInstruksi,
          ulp: ulpFormatted,
          alamat,
          garduInduk,
          penyulang,
          jenisTiang,
          ukuranTiang,
          jenisKonduktor,
          ukuranKonduktor,
          tanggalSurvey: tanggalSurveyRaw,
          koordinat,
          fotoTemuan,
          fotoUrl,
          preparatorName: preparator,
          asmanName: asman
        });
        doc.save(fileName);
        setExportResult({
          success: true,
          message: `Dokumen "${fileName}" berhasil diunduh ke perangkat Anda.`
        });
      } catch (e2) {
        setExportResult({
          success: false,
          message: `Gagal export: ${err.message || 'Error tidak diketahui'}`
        });
      }
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
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                Export Work Order PDKB
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm flex-1 custom-scrollbar">
          
          {/* Status Alert */}
          {exportResult && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fadeIn ${
              exportResult.success 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{exportResult.message}</p>
                <div className="flex items-center gap-4 mt-2">
                  {exportResult.fileUrl && (
                    <a
                      href={exportResult.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary underline hover:text-primary-dark"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka File di Google Drive</span>
                    </a>
                  )}
                  {exportResult.downloadUrl && (
                    <a
                      href={exportResult.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 underline hover:text-emerald-300"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File Langsung</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Inputs */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Nilai Placeholder yang Di-Replace Otomatis
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  INPUT NO. WO SIMPDKB
                </label>
                <input
                  type="text"
                  value={inputNoWo}
                  onChange={(e) => setInputNoWo(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 1484"
                  className="w-full bg-black/40 border border-white/15 focus:border-primary rounded-lg px-3 py-2 text-white font-mono text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  INPUT NO. TIANG
                </label>
                <input
                  type="text"
                  value={inputNoTiang}
                  onChange={(e) => setInputNoTiang(e.target.value)}
                  placeholder="Contoh: T.12 / KP.03"
                  className="w-full bg-black/40 border border-white/15 focus:border-primary rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Jenis Pekerjaan
              </label>
              <input
                type="text"
                value={customInstruksi}
                onChange={(e) => setCustomInstruksi(e.target.value)}
                placeholder="PEMELIHARAAN JARINGAN DISTRIBUSI 20kV"
                className="w-full bg-black/40 border border-white/15 focus:border-primary rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors uppercase font-medium"
              />
            </div>
          </div>

          {/* Quick Preview Values Table */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-300 uppercase tracking-wider text-[11px]">
                DATA UNIT & JARINGAN
              </h4>
              <span className="text-[10px] text-gray-400 font-mono">
                {koordinat ? `GPS: ${koordinat}` : 'Koordinat Belum Ada'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-black/30 border border-white/5">
                <span className="text-gray-500 block text-[9px] uppercase font-bold">ULP</span>
                <span className="font-semibold text-white">{ulpFormatted}</span>
              </div>
              <div className="p-2.5 rounded bg-black/30 border border-white/5">
                <span className="text-gray-500 block text-[9px] uppercase font-bold">GI</span>
                <span className="font-semibold text-white">{garduInduk}</span>
              </div>
              <div className="p-2.5 rounded bg-black/30 border border-white/5">
                <span className="text-gray-500 block text-[9px] uppercase font-bold">PENYULANG</span>
                <span className="font-semibold text-white">{penyulang}</span>
              </div>
              <div className="p-2.5 rounded bg-black/30 border border-white/5">
                <span className="text-gray-500 block text-[9px] uppercase font-bold">JENIS & TINGGI TIANG</span>
                <span className="font-semibold text-white">
                  {jenisTiang} {ukuranTiang && ukuranTiang !== '-' ? `(${ukuranTiang}M)` : ''}
                </span>
              </div>
            </div>

            {/* Lampiran Visual Terdeteksi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px]">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-black/20 text-gray-300 border border-white/5">
                <span className="font-bold text-gray-400 uppercase">FOTO TEMUAN:</span>
                <span className={fotoUrl ? "text-emerald-400 font-semibold truncate" : "text-amber-400 font-medium"}>
                  {fotoUrl ? 'Tersedia & Terhubung' : 'Belum Ada Foto'}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-black/20 text-gray-300 border border-white/5">
                <span className="font-bold text-gray-400 uppercase">SCREENSHOT MAP:</span>
                <span className={mapUrl ? "text-emerald-400 font-semibold truncate" : "text-amber-400 font-medium"}>
                  {mapUrl ? 'Otomatis dari Titik GPS WO' : 'Belum Ada Titik Koordinat'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#090f13] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-400 font-mono">
            Nama File: <strong className="text-white">WORK_ORDER-{(inputNoWo || '001')}.pdf</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={() => handleExport(false)}
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
