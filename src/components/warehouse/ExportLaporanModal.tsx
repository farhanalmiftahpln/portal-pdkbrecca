import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Search, 
  CheckSquare, 
  Square, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  FolderCheck,
  QrCode as QrCodeIcon,
  Image as ImageIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { gasService } from '../../services/gasService';

interface ExportLaporanModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: 'PERALATAN KERJA' | 'PERALATAN K2/K3';
  items: any[];
  userName?: string;
}

const GDRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1U_qfbDAqLyttt7rflyi1XIpflktcPDhC?usp=drive_link';
const GDRIVE_FOLDER_ID = '1U_qfbDAqLyttt7rflyi1XIpflktcPDhC';

// Helper to safely load an image URL into a base64 string
const loadImageAsBase64 = (rawUrl: string): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!rawUrl || typeof rawUrl !== 'string') return resolve(null);
    const trimmed = rawUrl.trim();
    if (!trimmed) return resolve(null);

    // If already base64 data URI
    if (trimmed.startsWith('data:image/')) {
      return resolve(trimmed);
    }

    // Convert Google Drive view URL to direct content URL
    let safeUrl = trimmed;
    if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
      const match = trimmed.match(/id=([a-zA-Z0-9_-]+)/) || trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        safeUrl = `https://lh3.googleusercontent.com/d/${match[1]}=s300`;
      }
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 300;
        let w = img.naturalWidth || 100;
        let h = img.naturalHeight || 100;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
          return;
        }
      } catch (e) {
        // Canvas tainted or CORS issue
      }
      resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = safeUrl;

    // Timeout safety
    setTimeout(() => resolve(null), 2500);
  });
};

export default function ExportLaporanModal({
  isOpen,
  onClose,
  menu,
  items,
  userName = 'Petugas PDKB'
}: ExportLaporanModalProps) {
  // Form state
  const [keterangan, setKeterangan] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterKondisi, setFilterKondisi] = useState<string>('ALL');
  
  // Selection state
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Export process state
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    message: string;
    fileName?: string;
    driveFolderUrl?: string;
  } | null>(null);

  // Initialize selected keys with all items when modal opens
  useEffect(() => {
    if (isOpen) {
      const allKeys = new Set(items.map(item => String(item.id || item.KODE || item.kode || Math.random())));
      setSelectedKeys(allKeys);
      setKeterangan('');
      setSearchTerm('');
      setFilterStatus('ALL');
      setFilterKondisi('ALL');
      setExportResult(null);
      setExporting(false);
    }
  }, [isOpen, items]);

  // Filtered items based on search, status, and kondisi
  const filteredModalItems = useMemo(() => {
    return items.filter(item => {
      const q = searchTerm.toLowerCase();
      const kode = String(item.KODE || item.kode || '').toLowerCase();
      const nama = String(item['NAMA PERALATAN'] || item['NAMA - JENIS'] || item['NAMA BARANG'] || item.nama || '').toLowerCase();
      const merk = String(item['MERK / TIPE'] || item.MERK || item.merk || '').toLowerCase();

      const matchSearch = !searchTerm || kode.includes(q) || nama.includes(q) || merk.includes(q);

      const itemKondisi = String(item.KONDISI || item.kondisi || '').toUpperCase();
      const matchKondisi = filterKondisi === 'ALL' ||
        (filterKondisi === 'BAIK' && itemKondisi.includes('BAIK')) ||
        (filterKondisi === 'RUSAK' && itemKondisi.includes('RUSAK'));

      const itemStatus = String(item.STATUS || item.status || '').toUpperCase();
      const matchStatus = filterStatus === 'ALL' || itemStatus === filterStatus;

      return matchSearch && matchKondisi && matchStatus;
    });
  }, [items, searchTerm, filterStatus, filterKondisi]);

  const getItemKey = (item: any) => String(item.id || item.KODE || item.kode);

  // Checkbox helpers
  const handleToggleItem = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isAllFilteredSelected = useMemo(() => {
    if (filteredModalItems.length === 0) return false;
    return filteredModalItems.every(item => selectedKeys.has(getItemKey(item)));
  }, [filteredModalItems, selectedKeys]);

  const handleToggleSelectAll = () => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (isAllFilteredSelected) {
        // Deselect all filtered items
        filteredModalItems.forEach(item => next.delete(getItemKey(item)));
      } else {
        // Select all filtered items
        filteredModalItems.forEach(item => next.add(getItemKey(item)));
      }
      return next;
    });
  };

  // Target filename preview
  const previewFileName = useMemo(() => {
    const cleanKet = (keterangan || 'KETERANGAN').trim().replace(/[/\\?%*:|"<>]/g, '-');
    return `DATA ${menu} - ${cleanKet}.pdf`;
  }, [menu, keterangan]);

  // Generate & Export PDF handler
  const handleExecuteExport = async () => {
    const trimmedKet = keterangan.trim();
    if (!trimmedKet) {
      alert('Harap isi KETERANGAN laporan terlebih dahulu.');
      return;
    }

    const itemsToExport = items.filter(item => selectedKeys.has(getItemKey(item)));
    if (itemsToExport.length === 0) {
      alert('Pilih minimal 1 item untuk diexport ke PDF.');
      return;
    }

    setExporting(true);
    setExportResult(null);

    try {
      setExportProgress('Membuat QR Code untuk setiap item...');
      // 1. Generate QR Code for each item
      const qrMap: Record<number, string> = {};
      for (let i = 0; i < itemsToExport.length; i++) {
        const it = itemsToExport[i];
        const kodeStr = String(it.KODE || it.kode || it.id || '-');
        try {
          const qrData = await QRCode.toDataURL(kodeStr, { margin: 1, width: 90 });
          qrMap[i] = qrData;
        } catch (e) {
          console.warn('Gagal generate QR Code untuk item', kodeStr, e);
        }
      }

      setExportProgress('Memuat gambar peralatan...');
      // 2. Load images for each item
      const imageMap: Record<number, string | null> = {};
      for (let i = 0; i < itemsToExport.length; i++) {
        const it = itemsToExport[i];
        const rawImg = it['LINK GAMBAR'] || it.link_gambar || it.GAMBAR || it.gambar || '';
        if (rawImg) {
          const b64 = await loadImageAsBase64(rawImg);
          imageMap[i] = b64;
        } else {
          imageMap[i] = null;
        }
      }

      setExportProgress('Menyusun dokumen PDF...');
      // 3. Initialize jsPDF (Portrait, mm, A4)
      const doc = new jsPDF('p', 'mm', 'a4');
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Title: DATA [MENU]
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(10, 25, 35);
      doc.text(`DATA ${menu}`, 105, 14, { align: 'center' });

      // Subtitle: [KETERANGAN]
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(11);
      doc.setTextColor(50, 70, 85);
      doc.text(trimmedKet, 105, 20, { align: 'center' });

      // Metadata Info Line
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(110, 120, 130);
      doc.text(
        `Unit: PT PLN (Persero) UP3 Watampone | PDKB Recca  |  Tanggal: ${dateStr} ${timeStr}  |  Total: ${itemsToExport.length} Item`,
        105,
        25,
        { align: 'center' }
      );

      // 4. Build Table Body
      const tableBody = itemsToExport.map((item, idx) => {
        const nama = String(item['NAMA PERALATAN'] || item['NAMA - JENIS'] || item['NAMA BARANG'] || item.nama || '-');
        const merkTipe = String(item['MERK / TIPE'] || item.MERK || item.merk || '-');
        const kode = String(item.KODE || item.kode || '-');

        return [
          String(idx + 1),
          '', // Gambar (drawn in didDrawCell)
          '', // QR Code (drawn in didDrawCell)
          nama,
          merkTipe,
          kode
        ];
      });

      // 5. Draw autoTable
      autoTable(doc, {
        startY: 29,
        margin: { left: 10, right: 10 },
        head: [['No', 'Gambar', 'QR Code', 'Nama', 'Merk / Tipe', 'Kode']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [10, 20, 26],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8.5,
          cellPadding: 2
        },
        bodyStyles: {
          minCellHeight: 24,
          valign: 'middle',
          fontSize: 8,
          textColor: [30, 30, 30]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 48 },
          4: { cellWidth: 48 },
          5: { cellWidth: 34, halign: 'center', fontStyle: 'bold' }
        },
        didDrawCell: (data) => {
          if (data.section === 'body') {
            const rowIndex = data.row.index;

            // Column 1: Gambar
            if (data.column.index === 1) {
              const imgData = imageMap[rowIndex];
              if (imgData) {
                try {
                  doc.addImage(imgData, 'JPEG', data.cell.x + 2.5, data.cell.y + 2, 20, 20);
                } catch (err) {
                  // Draw placeholder if render fails
                  doc.setDrawColor(210, 215, 220);
                  doc.setFillColor(245, 247, 250);
                  doc.roundedRect(data.cell.x + 2.5, data.cell.y + 2, 20, 20, 1, 1, 'FD');
                  doc.setFontSize(6);
                  doc.setTextColor(150, 155, 160);
                  doc.text('Foto Error', data.cell.x + 12.5, data.cell.y + 12.5, { align: 'center' });
                }
              } else {
                // Placeholder rectangle
                doc.setDrawColor(220, 225, 230);
                doc.setFillColor(248, 250, 252);
                doc.roundedRect(data.cell.x + 2.5, data.cell.y + 2, 20, 20, 1, 1, 'FD');
                doc.setFontSize(6.5);
                doc.setTextColor(160, 165, 170);
                doc.text('Tidak Ada', data.cell.x + 12.5, data.cell.y + 11, { align: 'center' });
                doc.text('Foto', data.cell.x + 12.5, data.cell.y + 14.5, { align: 'center' });
              }
            }

            // Column 2: QR Code
            if (data.column.index === 2) {
              const qrData = qrMap[rowIndex];
              if (qrData) {
                try {
                  doc.addImage(qrData, 'PNG', data.cell.x + 3.5, data.cell.y + 2.5, 18, 18);
                } catch (err) {}
              }
            }
          }
        }
      });

      // 6. Add Footer Page Numbering on all pages
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(7.5);
        doc.setTextColor(140, 145, 150);
        doc.text(
          `Halaman ${p} dari ${totalPages}  |  PT PLN (Persero) UP3 Watampone | PDKB Recca  |  Petugas: ${userName}`,
          105,
          291,
          { align: 'center' }
        );
      }

      const fileName = previewFileName;

      setExportProgress('Mengunduh file PDF...');
      // 7. Save file locally in browser
      doc.save(fileName);

      setExportProgress('Menyimpan ke Google Drive...');
      // 8. Upload to Backend & Google Drive folder
      const pdfBase64 = doc.output('dataurlstring').split(',')[1];

      const uploadPayload = {
        fileName,
        fileBase64: pdfBase64,
        folderId: GDRIVE_FOLDER_ID,
        menu,
        keterangan: trimmedKet,
        totalItems: itemsToExport.length
      };

      const res: any = await gasService.post('exportWarehousePdf', uploadPayload);

      const isDriveSaved = res?.driveUploadSuccess;
      setExportResult({
        success: true,
        message: isDriveSaved
          ? 'Laporan PDF berhasil dibuat, diunduh ke perangkat, dan otomatis tersimpan di Google Drive!'
          : 'Laporan PDF berhasil dibuat & diunduh ke perangkat! (Status Google Drive: ' + (res?.message || 'Menunggu penambahan fungsi di Apps Script') + ')',
        fileName,
        driveFolderUrl: GDRIVE_FOLDER_URL
      });
    } catch (err: any) {
      console.error('Error saat export PDF:', err);
      setExportResult({
        success: false,
        message: 'Gagal mengekspor laporan: ' + (err.message || 'Terjadi kesalahan sistem')
      });
    } finally {
      setExporting(false);
      setExportProgress('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0a1318] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Export Laporan PDF
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  DATA {menu}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Pilih item, filter data, dan tentukan keterangan laporan sebelum diexport.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={exporting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* SUCCESS BANNER */}
          {exportResult && exportResult.success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-emerald-300 text-sm">Export Berhasil!</h4>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    {exportResult.message}
                  </p>
                  <p className="text-[11px] font-mono text-gray-300 mt-1">
                    Nama File: <span className="text-white font-bold">{exportResult.fileName}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 border-t border-emerald-500/20">
                <a
                  href={GDRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  <FolderCheck className="w-4 h-4" />
                  Buka Folder di Google Drive
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                </a>
              </div>
            </div>
          )}

          {/* ERROR BANNER */}
          {exportResult && !exportResult.success && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <div>
                <p className="font-bold">Terjadi Kesalahan</p>
                <p className="text-rose-200/80 mt-0.5">{exportResult.message}</p>
              </div>
            </div>
          )}

          {/* 1. INPUT KETERANGAN (TITLE / SUBTITLE & FILENAME) */}
          <div className="bg-[#0e1820] border border-white/10 rounded-xl p-4 space-y-3">
            <label className="block text-xs font-bold font-mono uppercase tracking-wider text-gray-300">
              1. Keterangan Laporan <span className="text-rose-400">* (Wajib Diisi)</span>
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Pemeriksaan Berkala dan Uji Kelayakan Q1 2025"
                disabled={exporting}
                className="w-full bg-black/40 border border-white/15 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition"
              />
              <div className="p-3 bg-black/20 rounded-lg border border-white/5 space-y-1 text-[11px] font-mono">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-gray-500 w-24">Title Dokumen:</span>
                  <span className="text-white font-bold">DATA {menu}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-gray-500 w-24">Subtitle:</span>
                  <span className="text-primary font-bold">{keterangan.trim() || '[KETERANGAN AKAN MUNCUL DI SINI]'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-gray-500 w-24">Nama File:</span>
                  <span className="text-rose-300 font-bold">{previewFileName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. FILTER & CHECKLIST ITEM */}
          <div className="bg-[#0e1820] border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold font-mono uppercase tracking-wider text-gray-300">
                2. Filter & Pilih Item ({selectedKeys.size} dari {items.length} item dipilih)
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedKeys(new Set(items.map(it => getItemKey(it))))}
                  disabled={exporting}
                  className="text-primary hover:underline text-[11px]"
                >
                  Pilih Semua ({items.length})
                </button>
                <span className="text-gray-600">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedKeys(new Set())}
                  disabled={exporting}
                  className="text-gray-400 hover:text-white text-[11px]"
                >
                  Hapus Semua Pilihan
                </button>
              </div>
            </div>

            {/* Filter controls inside modal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, merk, kode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={exporting}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                disabled={exporting}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-primary"
              >
                <option value="ALL">Status: Semua</option>
                <option value="MASUK GUDANG/TERSEDIA">MASUK GUDANG/TERSEDIA</option>
                <option value="DIGUNAKAN">DIGUNAKAN</option>
                <option value="KELUAR GUDANG">KELUAR GUDANG</option>
              </select>

              <select
                value={filterKondisi}
                onChange={(e) => setFilterKondisi(e.target.value)}
                disabled={exporting}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-primary"
              >
                <option value="ALL">Kondisi: Semua</option>
                <option value="BAIK">Kondisi: BAIK</option>
                <option value="RUSAK">Kondisi: RUSAK</option>
              </select>
            </div>

            {/* Select All Checkbox for Filtered Items */}
            <div className="flex items-center justify-between py-1.5 px-3 bg-white/5 rounded-lg border border-white/5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono select-none">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  onChange={handleToggleSelectAll}
                  disabled={exporting || filteredModalItems.length === 0}
                  className="rounded border-gray-600 text-primary focus:ring-primary h-4 w-4 bg-black/50"
                />
                <span className="text-gray-300 font-bold">
                  {isAllFilteredSelected ? 'Batalkan Pilih Semua (Filter Ini)' : 'Pilih Semua (Filter Ini)'}
                </span>
              </label>
              <span className="text-[11px] font-mono text-gray-400">
                Menampilkan {filteredModalItems.length} item
              </span>
            </div>

            {/* Items Table Checklist */}
            <div className="border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              {filteredModalItems.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-black/60 sticky top-0 z-10 border-b border-white/10 text-[10px] uppercase font-mono text-gray-400">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">Pilih</th>
                      <th className="py-2 px-3 w-12 text-center">Foto</th>
                      <th className="py-2 px-3 w-12 text-center">QR</th>
                      <th className="py-2 px-3">Nama Peralatan</th>
                      <th className="py-2 px-3">Merk / Tipe</th>
                      <th className="py-2 px-3 font-mono">Kode</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredModalItems.map((item, idx) => {
                      const key = getItemKey(item);
                      const isSelected = selectedKeys.has(key);
                      const nama = String(item['NAMA PERALATAN'] || item['NAMA - JENIS'] || item['NAMA BARANG'] || item.nama || '-');
                      const merkTipe = String(item['MERK / TIPE'] || item.MERK || item.merk || '-');
                      const kode = String(item.KODE || item.kode || '-');
                      const status = String(item.STATUS || item.status || 'MASUK GUDANG/TERSEDIA');
                      const kondisi = String(item.KONDISI || item.kondisi || 'BAIK');
                      const foto = item['LINK GAMBAR'] || item.link_gambar || item.GAMBAR || item.gambar;

                      return (
                        <tr
                          key={key || idx}
                          onClick={() => !exporting && handleToggleItem(key)}
                          className={`cursor-pointer transition select-none ${
                            isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-white/5 opacity-60'
                          }`}
                        >
                          <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleItem(key)}
                              disabled={exporting}
                              className="rounded border-gray-600 text-primary focus:ring-primary h-4 w-4 bg-black/50"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            {foto ? (
                              <img
                                src={foto}
                                alt="thumb"
                                className="w-8 h-8 object-cover rounded-lg border border-white/10 mx-auto"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="w-7 h-7 rounded bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-primary/80">
                              <QrCodeIcon className="w-4 h-4" />
                            </div>
                          </td>
                          <td className="py-2 px-3 font-medium text-white">
                            {nama}
                          </td>
                          <td className="py-2 px-3 text-gray-300">
                            {merkTipe}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-primary">
                            {kode}
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-mono text-gray-300">
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  Tidak ada peralatan yang sesuai dengan filter pencarian.
                </div>
              )}
            </div>
          </div>

          {/* 3. DESTINASI GOOGLE DRIVE INFO */}
          <div className="bg-[#0e1820] border border-white/10 rounded-xl p-3.5 flex items-start gap-3 text-xs text-gray-300">
            <FolderCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-bold text-white">Destinasi Penyimpanan Laporan:</p>
              <p className="text-gray-400 text-[11px]">
                File PDF akan otomatis diunduh ke komputer Anda dan disimpan secara permanen di folder Google Drive PDKB:
              </p>
              <a
                href={GDRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px]"
              >
                Folder: https://drive.google.com/drive/folders/{GDRIVE_FOLDER_ID}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-400 font-mono">
            {exporting ? (
              <span className="flex items-center gap-2 text-primary font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                {exportProgress || 'Memproses export PDF...'}
              </span>
            ) : (
              <span>
                Item siap diexport: <strong className="text-white">{selectedKeys.size}</strong> dari {items.length} item
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={exporting}
              className="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 text-xs font-bold transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteExport}
              disabled={exporting || selectedKeys.size === 0 || !keterangan.trim()}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengekspor...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export PDF & Simpan ke Drive</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
