import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  getRomanMonth, 
  formatDateDDMMYYYY, 
  calculateHMinus1, 
  loadImageAsBase64,
  getStaticMapImageUrl
} from './exportTemplateUtils';

/**
 * Draws crisp vector PLN Logo matching official identity
 */
export function drawPlnLogo(doc: jsPDF, x: number, y: number, width = 16, height = 18) {
  // Yellow background badge
  doc.setFillColor(255, 222, 0); // PLN Yellow
  doc.setDrawColor(220, 30, 30); // Red border
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, width, height, 1, 1, 'FD');

  // 3 blue wavy horizontal lines
  doc.setDrawColor(0, 154, 218); // PLN Cyan / Blue
  doc.setLineWidth(0.6);
  const waveY1 = y + height * 0.35;
  const waveY2 = y + height * 0.50;
  const waveY3 = y + height * 0.65;
  const wLeft = x + 2.5;
  const wRight = x + width - 2.5;

  doc.line(wLeft, waveY1, wRight, waveY1);
  doc.line(wLeft, waveY2, wRight, waveY2);
  doc.line(wLeft, waveY3, wRight, waveY3);

  // Red diagonal lightning bolt
  doc.setFillColor(227, 30, 36);
  doc.setDrawColor(227, 30, 36);
  const cx = x + width / 2;
  const cy = y + height / 2;
  
  // Lightning bolt polygon points
  doc.triangle(
    cx + 2.5, y + 2,
    cx - 3.5, cy + 1,
    cx + 1, cy + 1,
    'FD'
  );
  doc.triangle(
    cx + 1, cy - 1,
    cx - 3, y + height - 2,
    cx + 3, cy - 1,
    'FD'
  );

  // PLN text underneath
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 102, 179);
  doc.text('PLN', x + width / 2, y + height + 3.5, { align: 'center' });
}

/**
 * Draws crisp vector PDKB Logo
 */
export function drawPdkbLogo(doc: jsPDF, x: number, y: number, size = 16) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2 - 0.5;

  // Blue circle
  doc.setFillColor(0, 80, 160);
  doc.circle(cx, cy, r, 'F');

  // Inner white/cyan ring
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.circle(cx, cy, r - 1.2, 'S');

  // Red wing/swoosh
  doc.setFillColor(220, 30, 30);
  doc.triangle(
    cx - 4, cy + 3,
    cx + 4, cy - 3,
    cx + 1, cy + 4,
    'F'
  );

  // Spark / Lightning
  doc.setFillColor(255, 230, 0);
  doc.circle(cx, cy, 1.2, 'F');

  // PDKB text underneath
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 20, 20);
  doc.text('PDKB', cx, y + size + 3.5, { align: 'center' });
}

export interface WorkOrderPdfData {
  noWo: string;
  inputNoWo?: string;
  inputNoTiang?: string;
  instruksiKerja?: string;
  ulp?: string;
  alamat?: string;
  garduInduk?: string;
  penyulang?: string;
  jenisTiang?: string;
  ukuranTiang?: string;
  jenisKonduktor?: string;
  ukuranKonduktor?: string;
  tanggalSurvey?: any;
  koordinat?: string;
  fotoTemuan?: string;
  fotoUrl?: string;
  mapUrl?: string;
  preparatorName?: string;
  asmanName?: string;
}

/**
 * Generate 1-page WORK ORDER PDF exactly matching the user's template
 */
export async function generateExactWorkOrderPdf(data: WorkOrderPdfData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2; // 190 mm
  const contentBottom = pageHeight - margin;   // 287 mm

  // Variables
  const bulanRomawi = getRomanMonth();
  const tahunSaatIni = new Date().getFullYear().toString();
  const inputNoWo = (data.inputNoWo || data.noWo || '001').padStart(3, '0');
  const inputNoTiang = data.inputNoTiang || '-';
  const tanggalSurveyFormatted = formatDateDDMMYYYY(data.tanggalSurvey || new Date());
  const rawUlp = data.ulp || 'WATAMPONE';
  const ulpFormatted = rawUlp.toUpperCase().startsWith('ULP') ? rawUlp : `ULP ${rawUlp}`;
  const instruksiKerja = (data.instruksiKerja || 'PEMELIHARAAN JARINGAN DISTRIBUSI 20kV').toUpperCase();
  const alamat = data.alamat || '-';
  const garduInduk = data.garduInduk || '-';
  const penyulang = data.penyulang || '-';
  const jenisTiang = data.jenisTiang || 'BETON';
  const ukuranTiang = data.ukuranTiang || '12';
  const jenisKonduktor = data.jenisKonduktor || 'AAAC-S';
  const ukuranKonduktor = data.ukuranKonduktor || '150';
  const preparatorName = data.preparatorName || 'AKMAL FADIL';
  const asmanName = data.asmanName || 'BAKHTIAR';

  // 1. Outer full page border
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.6);
  doc.rect(margin, margin, contentWidth, contentBottom - margin);

  // 2. Header Box Table (Height: 25 mm)
  const headerHeight = 25;
  const col1W = 55; // Left: PLN logo & unit
  const col2W = 75; // Middle: Title
  const col3W = contentWidth - col1W - col2W; // 60 mm (Right: No WO & Tanggal)

  doc.setLineWidth(0.4);
  doc.rect(margin, margin, contentWidth, headerHeight);
  doc.line(margin + col1W, margin, margin + col1W, margin + headerHeight);
  doc.line(margin + col1W + col2W, margin, margin + col1W + col2W, margin + headerHeight);

  // Header Col 1: Logo + Unit
  drawPlnLogo(doc, margin + 3, margin + 2.5, 11, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text('UIW SULSELRABAR', margin + 17, margin + 8);
  doc.setFontSize(7.5);
  doc.text('UP3 WATAMPONE', margin + 17, margin + 13);

  // Header Col 2: Title "PENGAJUAN WORK ORDER PDKB"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(10, 10, 10);
  doc.text('PENGAJUAN WORK ORDER PDKB', margin + col1W + col2W / 2, margin + 14, { align: 'center' });

  // Header Col 3: Nomor & Tanggal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 30, 30);
  doc.text(`NO : [INPUT NO. WO]//WO/UP3`, margin + col1W + col2W + 3, margin + 6);
  doc.text(`WATAMPONE.PREP/${bulanRomawi}/${tahunSaatIni} (`, margin + col1W + col2W + 3, margin + 10.5);
  doc.text(`[TANGGAL_SURVEY] )`, margin + col1W + col2W + 3, margin + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`( ${tanggalSurveyFormatted} )`, margin + col1W + col2W + 3, margin + 20);

  // 3. Subheader Bar "FORM WORK ORDER PDKB"
  const barY = margin + headerHeight;
  const barH = 7;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, barY, contentWidth, barH, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text('FORM WORK ORDER PDKB', margin + 3, barY + 5);

  // 4. Main Table: DATA LOKASI vs HASIL PENELITIAN
  const tableStartY = barY + barH;
  const colAWidth = 65;
  const colBWidth = contentWidth - colAWidth; // 125 mm

  autoTable(doc, {
    startY: tableStartY,
    theme: 'grid',
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    styles: {
      fontSize: 7.5,
      textColor: [20, 20, 20],
      cellPadding: 2,
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    columnStyles: {
      0: { cellWidth: colAWidth, fontStyle: 'bold' },
      1: { cellWidth: colBWidth }
    },
    head: [['DATA LOKASI', 'HASIL PENELITIAN']],
    body: [
      ['1.No Work Order', `${inputNoWo}/WO/UP3 WATAMPONE.PREP/${bulanRomawi}/${tahunSaatIni}`],
      ['2.Unit', ulpFormatted],
      ['3.Jenis Pekerjaan', instruksiKerja],
      ['4.Lokasi Pekerjaan', alamat],
      ['5.Nomor Tiang', inputNoTiang],
      ['6.Gardu Induk | Penyulang', `GI 20KV ${garduInduk} | ${penyulang}`],
      ['7.Jenis Tiang | Tinggi Tiang', `${jenisTiang} | ${ukuranTiang} Meter`],
      ['8.Jenis Penghantar | Diameter Penghantar', `${jenisKonduktor} | ${ukuranKonduktor} sqmm`],
      ['9.Pegawai Yang Mengajukan', preparatorName]
    ]
  });

  // 5. Approval Box (MENYETUJUI, ASMAN JAR DAN KONS)
  const approvalY = (doc as any).lastAutoTable.finalY + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  const signRightX = margin + contentWidth - 45;
  doc.text('MENYETUJUI,', signRightX, approvalY, { align: 'center' });
  doc.text('ASMAN JAR DAN KONS', signRightX, approvalY + 4.5, { align: 'center' });

  // Signature line / name
  doc.text(`( ${asmanName} )`, signRightX, approvalY + 24, { align: 'center' });

  // 6. Visual Boxes: GAMBAR LOKASI & PETA LOKASI
  const boxTopY = approvalY + 28;
  const boxHeight = contentBottom - boxTopY - 3; // fills remaining space to bottom border
  const boxW = (contentWidth - 6) / 2; // 92 mm each

  // Box 1: GAMBAR LOKASI (Left)
  const box1X = margin + 2;
  doc.setLineWidth(0.4);
  doc.setDrawColor(40, 40, 40);
  doc.rect(box1X, boxTopY, boxW, boxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('GAMBAR LOKASI', box1X + boxW / 2, boxTopY - 2, { align: 'center' });

  // Box 2: PETA LOKASI (Right)
  const box2X = margin + 4 + boxW;
  doc.rect(box2X, boxTopY, boxW, boxHeight);
  doc.text('PETA LOKASI', box2X + boxW / 2, boxTopY - 2, { align: 'center' });

  // Place photo if available
  if (data.fotoUrl) {
    try {
      const base64Img = await loadImageAsBase64(data.fotoUrl);
      if (base64Img) {
        doc.addImage(base64Img, 'JPEG', box1X + 2, boxTopY + 2, boxW - 4, boxHeight - 4);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text('[foto_temuan]', box1X + boxW / 2, boxTopY + boxHeight / 2, { align: 'center' });
      }
    } catch (e) {
      doc.text('[foto_temuan]', box1X + boxW / 2, boxTopY + boxHeight / 2, { align: 'center' });
    }
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text('[foto_temuan]', box1X + boxW / 2, boxTopY + boxHeight / 2, { align: 'center' });
  }

  // Place Screenshot Map / coordinate placeholder
  const mapUrl = data.mapUrl || (data.koordinat ? getStaticMapImageUrl(data.koordinat) : '');
  let mapDrawn = false;
  if (mapUrl) {
    try {
      const mapBase64 = await loadImageAsBase64(mapUrl);
      if (mapBase64) {
        doc.addImage(mapBase64, 'PNG', box2X + 2, boxTopY + 2, boxW - 4, boxHeight - 12);
        mapDrawn = true;
      }
    } catch (e) {
      console.warn('Gagal menempelkan map screenshot:', e);
    }
  }

  if (!mapDrawn) {
    doc.setFillColor(250, 252, 255);
    doc.rect(box2X + 2, boxTopY + 2, boxW - 4, boxHeight - 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('[CAPTURE MAP]', box2X + boxW / 2, boxTopY + boxHeight / 2 - 2, { align: 'center' });
  }

  // Koordinat badge di bagian bawah kotak PETA LOKASI
  doc.setFillColor(240, 245, 252);
  doc.rect(box2X + 2, boxTopY + boxHeight - 10, boxW - 4, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(20, 60, 110);
  doc.text(`TITIK KOORDINAT: ${data.koordinat || '-'}`, box2X + boxW / 2, boxTopY + boxHeight - 4.5, { align: 'center' });

  return doc;
}

export interface AssignedPersonRow {
  nama: string;
  nip: string;
  noSerkomLv2?: string;
  noSerkomLv3?: string;
  tugas?: string;
}

export interface Sp2bSp3bPdfData {
  inputNoSp2b?: string;
  inputNoWo?: string;
  inputNoTiang?: string;
  instruksiKerja?: string;
  jenisPekerjaan?: string;
  tanggalDirencanakan?: any;
  tanggalHMinus1?: any;
  ulp?: string;
  alamat?: string;
  garduInduk?: string;
  penyulang?: string;
  jenisTiang?: string;
  ukuranTiang?: string;
  jenisKonduktor?: string;
  ukuranKonduktor?: string;
  koordinat?: string;
  fotoUrl?: string;
  // Environment / Review
  kondisiTanah?: string;
  jarakJalanRaya?: string;
  personilReady?: number;
  durasiPekerjaan?: string; // in hours or minutes
  tingkatKesulitan?: string;
  opsiBangunan?: string;
  opsiPohon?: string;
  opsiSiap?: string;
  opsiJalan?: string;
  // Officials
  preparatorName?: string;
  asmanName?: string;
  asmanBidang?: string;
  namaPP?: string;
  noLv3PP?: string;
  namaPK3?: string;
  noLv3PK3?: string;
  // Personnel list (up to 10)
  personnelList?: AssignedPersonRow[];
  docType?: 'BUNDLE' | 'SP2B' | 'SP3B';
}

/**
 * Generate 6-Page SP2B & SP3B Document exactly matching the user's template
 */
export async function generateExactSp2bSp3bPdf(data: Sp2bSp3bPdfData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2; // 190 mm
  const contentBottom = pageHeight - margin;   // 287 mm

  const bulanRomawi = getRomanMonth();
  const tahunSaatIni = new Date().getFullYear().toString();
  const inputNoSp2b = (data.inputNoSp2b || '001').padStart(3, '0');
  const inputNoWo = (data.inputNoWo || '001').padStart(3, '0');
  const inputNoTiang = data.inputNoTiang || '-';
  const tanggalDirencanakan = formatDateDDMMYYYY(data.tanggalDirencanakan || new Date());
  const tanggalHMinus1 = data.tanggalHMinus1 || calculateHMinus1(data.tanggalDirencanakan || new Date());
  const rawUlp = data.ulp || 'WATAMPONE';
  const ulpFormatted = rawUlp.toUpperCase().startsWith('ULP') ? rawUlp : `ULP ${rawUlp}`;
  const instruksiKerja = (data.instruksiKerja || 'PEMELIHARAAN JARINGAN DISTRIBUSI 20kV').toUpperCase();
  const jenisPekerjaan = data.jenisPekerjaan || instruksiKerja;
  const alamat = data.alamat || '-';
  const garduInduk = data.garduInduk || '-';
  const penyulang = data.penyulang || '-';
  const jenisTiang = data.jenisTiang || 'BETON';
  const ukuranTiang = data.ukuranTiang || '12';
  const jenisKonduktor = data.jenisKonduktor || 'AAAC-S';
  const ukuranKonduktor = data.ukuranKonduktor || '150';
  const preparatorName = data.preparatorName || 'AKMAL FADIL';
  const asmanName = data.asmanName || 'BAKHTIAR';
  const asmanBidang = data.asmanBidang || 'ASMAN JARINGAN DAN KONSTRUKSI';
  const namaPP = data.namaPP || 'PENGAWAS PEKERJAAN';
  const noLv3PP = data.noLv3PP || '12345678-L3';
  const namaPK3 = data.namaPK3 || 'PENGAWAS K3';
  const noLv3PK3 = data.noLv3PK3 || '87654321-L3';
  const personilReady = data.personilReady ?? 8;
  const durasiPekerjaan = data.durasiPekerjaan || '3'; // hours
  const tingkatKesulitan = data.tingkatKesulitan || 'SEDANG';
  const kondisiTanah = data.kondisiTanah || 'Kering';
  const jarakJalanRaya = data.jarakJalanRaya || '5 Meter';
  const opsiBangunan = data.opsiBangunan || 'Tidak Ada';
  const opsiPohon = data.opsiPohon || 'Ada (Perlu Blanket / Isolasi)';
  const opsiSiap = data.opsiSiap || 'MAMPU';
  const opsiJalan = data.opsiJalan || 'Perlu Rambu K3 & Traffic Cone';

  const defaultPersonel: AssignedPersonRow[] = Array.from({ length: 10 }).map((_, idx) => {
    const p = data.personnelList?.[idx];
    if (p) return p;
    return {
      nama: `Personil PDKB ${idx + 1}`,
      nip: `1990010${idx + 1}`,
      noSerkomLv2: `SERKOM-LV2-${idx + 1}`,
      noSerkomLv3: `SERKOM-LV3-${idx + 1}`,
      tugas: idx === 0 ? 'PENGAWAS PEKERJAAN' : (idx === 1 ? 'PENGAWAS K3' : (idx < 6 ? 'LINEMAN' : 'GROUNDMAN'))
    };
  });

  const photoBase64 = data.fotoUrl ? await loadImageAsBase64(data.fotoUrl) : null;

  // Helper for drawing full-page border
  const drawPageBorder = () => {
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.6);
    doc.rect(margin, margin, contentWidth, contentBottom - margin);
  };

  // ==========================================
  // PAGE 1: COVER DOKUMEN PELAKSANAAN PEKERJAAN
  // ==========================================
  drawPageBorder();

  // Top Header Box (Logo PLN, Title, Logo PDKB)
  const coverHeaderH = 26;
  doc.setLineWidth(0.4);
  doc.rect(margin, margin, contentWidth, coverHeaderH);
  doc.line(margin + 32, margin, margin + 32, margin + coverHeaderH);
  doc.line(margin + contentWidth - 32, margin, margin + contentWidth - 32, margin + coverHeaderH);

  // PLN Logo (Left)
  drawPlnLogo(doc, margin + 8, margin + 2.5, 12, 15);

  // Center Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  doc.text('UNIT INDUK WILAYAH SULSELRABAR', margin + contentWidth / 2, margin + 10, { align: 'center' });
  doc.setFontSize(9.5);
  doc.text('UNIT PELAKSANA PELAYANAN PELANGGAN WATAMPONE', margin + contentWidth / 2, margin + 16, { align: 'center' });

  // PDKB Logo (Right)
  drawPdkbLogo(doc, margin + contentWidth - 25, margin + 3.5, 16);

  // Center Big Title
  const titleY = margin + 68;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(10, 10, 10);
  doc.text('DOKUMEN PELAKSANAAN PEKERJAAN DALAM KEADAAN BERTEGANGAN', margin + contentWidth / 2, titleY, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`[ ${instruksiKerja} ]`, margin + contentWidth / 2, titleY + 7, { align: 'center' });
  doc.text('PDKB TM', margin + contentWidth / 2, titleY + 14, { align: 'center' });

  // Middle Metadata Block
  const metaY = titleY + 35;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);

  // SP2B NO & Tanggal
  doc.text(`SP2B NO  :  ${inputNoSp2b} /UP3 WATAMPONE/PDKB-TM/${bulanRomawi}/${tahunSaatIni}`, margin + 16, metaY);
  doc.text(`TANGGAL  :  ${tanggalDirencanakan}`, margin + 120, metaY);

  // SP3B NO & Tanggal
  doc.text(`SP3B NO  :  ${inputNoSp2b} /UP3 WATAMPONE/PDKB-TM/${bulanRomawi}/${tahunSaatIni}`, margin + 16, metaY + 18);
  doc.text(`TANGGAL  :  ${tanggalDirencanakan}`, margin + 120, metaY + 18);

  // Details List
  const listY = metaY + 50;
  const listRows = [
    ['JENIS PEKERJAAN', `: ${jenisPekerjaan}`],
    ['NO WORK ORDER', `: ${inputNoWo}/WO/UP3 WATAMPONE.PREP/${bulanRomawi}/${tahunSaatIni}`],
    ['LOKASI', `: ${alamat}`],
    ['NO. TIANG', `: ${inputNoTiang}`],
    ['PENYULANG', `: ${penyulang}`],
    ['GARDU INDUK', `: ${garduInduk}`],
    ['ULP', `: ${ulpFormatted}`]
  ];

  let curListY = listY;
  listRows.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(lbl, margin + 16, curListY);
    doc.setFont('helvetica', 'normal');
    doc.text(val, margin + 55, curListY);
    curListY += 7.5;
  });

  // ==========================================
  // PAGE 2: SOP PDKB-TM NO 01 (KOMISI PDKB)
  // ==========================================
  doc.addPage();
  drawPageBorder();

  // Top 3-Col Header Table
  const p2HeaderH = 22;
  doc.setLineWidth(0.4);
  doc.rect(margin, margin, contentWidth, p2HeaderH);
  doc.line(margin + 55, margin, margin + 55, margin + p2HeaderH);
  doc.line(margin + contentWidth - 70, margin, margin + contentWidth - 70, margin + p2HeaderH);

  drawPlnLogo(doc, margin + 3, margin + 2, 9, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('UIW SULSELRABAR', margin + 15, margin + 7);
  doc.text('UP3 WATAMPONE', margin + 15, margin + 12);

  doc.setFontSize(9.5);
  doc.text('Hasil Survey Lokasi Pekerjaan', margin + 55 + (contentWidth - 125) / 2, margin + 12, { align: 'center' });

  doc.setFontSize(7);
  doc.text(`NO. ${inputNoSp2b} /UP3 WATAMPONE/PDKB-TM/${bulanRomawi}/${tahunSaatIni}`, margin + contentWidth - 67, margin + 8);
  doc.text(`TANGGAL : ${tanggalDirencanakan}`, margin + contentWidth - 67, margin + 14);

  // Metadata Subheader
  let p2SubY = margin + p2HeaderH + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SOP PDKB-TM NO 01 (KOMISI PDKB)', margin + 3, p2SubY);

  const sopMetaRows = [
    ['Jenis Pekerjaan', `: ${instruksiKerja}`],
    ['No Work Order', `: ${inputNoWo}/WO/UP3 WATAMPONE.PREP/${bulanRomawi}/${tahunSaatIni}`],
    ['Lokasi', `: ${alamat}`],
    ['UP3', ': UP3 WATAMPONE'],
    ['ULP', `: ${ulpFormatted}`],
    ['No Tiang/Penyulang', `: ${inputNoTiang}/ ${penyulang}`],
    ['Gardu Induk', `: GI 20KV ${garduInduk}`]
  ];

  p2SubY += 4;
  sopMetaRows.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(lbl, margin + 3, p2SubY);
    doc.text(val, margin + 35, p2SubY);
    p2SubY += 4;
  });

  // Table DATA LOKASI vs HASIL PENELITIAN
  autoTable(doc, {
    startY: p2SubY + 1,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    styles: {
      fontSize: 6.5,
      textColor: [20, 20, 20],
      cellPadding: 1.5,
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    columnStyles: {
      0: { cellWidth: 90, fontStyle: 'bold' },
      1: { cellWidth: contentWidth - 90 }
    },
    head: [['DATA LOKASI', 'HASIL PENELITIAN']],
    body: [
      ['1. Identifikasi Struktur Tanah', kondisiTanah],
      ['2. Jarak Lokasi Pekerjaan Ke Jalan', jarakJalanRaya],
      ['3. Dikerjakan / Orang', `${personilReady} Orang / Regu`],
      ['4. Lama Waktu Pengerjaan', `${durasiPekerjaan} Jam`],
      ['5. Tingkat Kesulitan', tingkatKesulitan],
      ['6. Dekat Dengan Bangunan', opsiBangunan],
      ['7. Banyak Pohon', opsiPohon],
      ['8. Jenis Tiang', `${jenisTiang} ${ukuranTiang} Meter`],
      ['9. Penampang', `${jenisKonduktor} ${ukuranKonduktor} sqmm`],
      ['10. DiKerjakan dengan PDKB-TM', opsiSiap],
      ['11. Lain - Lain', '-']
    ]
  });

  // Table Surveyor & Disposisi
  const dispStartY = (doc as any).lastAutoTable.finalY + 2;
  autoTable(doc, {
    startY: dispStartY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      fontSize: 6.5,
      halign: 'center',
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    styles: {
      fontSize: 6,
      textColor: [20, 20, 20],
      cellPadding: 1.5,
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: contentWidth - 85 }
    },
    head: [['PREPARATOR / SURVEYOR', 'PARAF', 'MATERIAL YANG DIGUNAKAN']],
    body: [
      [
        `Nama : ${preparatorName}\nDiperiksa Tanggal : ${tanggalHMinus1}\nDikerjakan Tanggal : ${tanggalDirencanakan}`,
        '[paraf]',
        '-'
      ]
    ]
  });

  const disp2StartY = (doc as any).lastAutoTable.finalY;
  autoTable(doc, {
    startY: disp2StartY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      fontSize: 6.5,
      halign: 'center',
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    styles: {
      fontSize: 6,
      textColor: [20, 20, 20],
      cellPadding: 1.5,
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: contentWidth - 120 }
    },
    head: [['DISPOSISI', 'TANGGAL', 'PARAF', 'KETERANGAN']],
    body: [
      ['ASMAN JARINGAN / Kepala Operasi Mengetahui', tanggalHMinus1, '[paraf]', '-'],
      ['TEAM LEADER PDKB Setuju / Tidak Setuju', tanggalHMinus1, '[paraf]', '-']
    ]
  });

  // GAMBAR LOKASI & PETA LOKASI
  const p2BoxTopY = (doc as any).lastAutoTable.finalY + 4;
  const p2BoxH = contentBottom - p2BoxTopY - 2;
  const p2BoxW = (contentWidth - 6) / 2;

  // Box Left: GAMBAR LOKASI
  doc.rect(margin + 2, p2BoxTopY, p2BoxW, p2BoxH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('GAMBAR LOKASI', margin + 2 + p2BoxW / 2, p2BoxTopY - 1.5, { align: 'center' });

  // Box Right: PETA LOKASI
  doc.rect(margin + 4 + p2BoxW, p2BoxTopY, p2BoxW, p2BoxH);
  doc.text('PETA LOKASI', margin + 4 + p2BoxW + p2BoxW / 2, p2BoxTopY - 1.5, { align: 'center' });

  if (photoBase64) {
    try {
      doc.addImage(photoBase64, 'JPEG', margin + 3, p2BoxTopY + 1, p2BoxW - 2, p2BoxH - 2);
    } catch (e) {}
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('[foto_temuan]', margin + 2 + p2BoxW / 2, p2BoxTopY + p2BoxH / 2, { align: 'center' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('[CAPTURE MAP]', margin + 4 + p2BoxW + p2BoxW / 2, p2BoxTopY + p2BoxH / 2, { align: 'center' });

  // ==========================================
  // PAGE 3: SOP PDKB-TM NO 04.1 (KOMISI PDKB) - SP2B
  // ==========================================
  doc.addPage();
  drawPageBorder();

  // Top header logo & unit
  drawPlnLogo(doc, margin + 4, margin + 3, 10, 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text('UIW SULSELRABAR', margin + 17, margin + 8);
  doc.text('UP3 WATAMPONE', margin + 17, margin + 13);

  let p3Y = margin + 28;
  doc.setFontSize(8.5);
  doc.text('SOP PDKB-TM NO 04.1 (KOMISI PDKB)', margin + 8, p3Y);

  p3Y += 9;
  doc.setFontSize(10.5);
  doc.text('SURAT PERINTAH MELAKSANAKAN PEKERJAAN BERTEGANGAN (SP2B)', margin + contentWidth / 2, p3Y, { align: 'center' });

  p3Y += 8;
  doc.setFontSize(8.5);
  doc.text(`NO. ${inputNoSp2b} /UP3 WATAMPONE/PDKB TM/${bulanRomawi}/${tahunSaatIni}`, margin + contentWidth / 2, p3Y, { align: 'center' });

  p3Y += 5;
  doc.text(`TANGGAL : ${tanggalDirencanakan}`, margin + contentWidth / 2, p3Y, { align: 'center' });

  // Body text
  p3Y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const p3Text1 = `Kepala Operasi atau wakilnya ${asmanName} dengan ini memerintahkan kepada pelaksana PDKB (Nama dan No Sertifikat Kewenangan terlampir) untuk melaksanakan pekerjaan.`;
  doc.text(doc.splitTextToSize(p3Text1, contentWidth - 16), margin + 8, p3Y);

  p3Y += 15;
  doc.text(`- Pada instalasi berikut ini`, margin + 8, p3Y);
  doc.text(`Tiang HL / Penyulang`, margin + 50, p3Y);
  doc.text(`: [ ${inputNoTiang} ] / [ ${penyulang} ]`, margin + 88, p3Y);

  p3Y += 6;
  doc.text(`Gardu Induk`, margin + 50, p3Y);
  doc.text(`: GI 20KV ${garduInduk}`, margin + 88, p3Y);

  p3Y += 10;
  doc.text(`- Pekerjaan dalam keadaan bertegangan berikut ini :`, margin + 8, p3Y);

  p3Y += 7;
  doc.text(`Pekerjaan`, margin + 14, p3Y);
  doc.text(`: ${instruksiKerja}`, margin + 60, p3Y);

  p3Y += 7;
  doc.text(`Menggunakan Metode`, margin + 14, p3Y);
  doc.setFont('helvetica', 'bold');
  doc.text(`: METODE BERJARAK`, margin + 60, p3Y);

  p3Y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Pembatas yang bersifat setempat.`, margin + 14, p3Y);

  // Sign-off
  const p3SignY = margin + 180;
  const p3SignX = margin + contentWidth - 45;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`WATAMPONE, ${tanggalDirencanakan}`, p3SignX, p3SignY, { align: 'center' });
  doc.text('Mengetahui,', p3SignX, p3SignY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('KEPALA OPERASI', p3SignX, p3SignY + 10, { align: 'center' });

  doc.text(asmanName, p3SignX, p3SignY + 36, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(asmanBidang, p3SignX, p3SignY + 40, { align: 'center' });

  // ==========================================
  // PAGE 4: SOP PDKB-TM NO 04.2 (KOMISI PDKB) - DAFTAR PERSONIL
  // ==========================================
  doc.addPage();
  drawPageBorder();

  drawPlnLogo(doc, margin + 4, margin + 3, 10, 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text('UIW SULSELRABAR', margin + 17, margin + 8);
  doc.text('UP3 WATAMPONE', margin + 17, margin + 13);

  let p4Y = margin + 28;
  doc.setFontSize(8.5);
  doc.text('SOP PDKB-TM NO 04.2 (KOMISI PDKB)', margin + 8, p4Y);

  p4Y += 9;
  doc.setFontSize(10.5);
  doc.text('SURAT PERINTAH MELAKSANAKAN PEKERJAAN BERTEGANGAN (SP2B)', margin + contentWidth / 2, p4Y, { align: 'center' });

  p4Y += 7;
  doc.setFontSize(8.5);
  doc.text(`NO. ${inputNoSp2b} /UP3 WATAMPONE/PDKB TM/${bulanRomawi}/${tahunSaatIni}`, margin + contentWidth / 2, p4Y, { align: 'center' });
  p4Y += 5;
  doc.text(`TANGGAL : ${tanggalDirencanakan}`, margin + contentWidth / 2, p4Y, { align: 'center' });

  // Table Personil 10 Baris
  const p4TableBody = defaultPersonel.map((p, idx) => {
    let cert = p.noSerkomLv2 || '-';
    if (p.tugas === 'PENGAWAS PEKERJAAN' || p.tugas === 'PENGAWAS K3') {
      cert = p.noSerkomLv3 || p.noSerkomLv2 || '-';
    }
    const profilStr = `${p.nama}-${p.nip}\n(No Sertifikat : ${cert})`;
    return [String(idx + 1), profilStr, p.tugas || 'LINEMAN', ''];
  });

  autoTable(doc, {
    startY: p4Y + 6,
    margin: { left: margin + 6, right: margin + 6 },
    tableWidth: contentWidth - 12,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    styles: {
      fontSize: 7,
      textColor: [20, 20, 20],
      cellPadding: 2,
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 55, halign: 'center' },
      3: { cellWidth: 33, halign: 'center' }
    },
    head: [['NO', 'PEGAWAI', 'TUGAS DAN TANGGUNG JAWAB', 'TANDA TANGAN']],
    body: p4TableBody
  });

  // Footnote Statement A, B, C
  const p4FootY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text('A Menerangkan telah menerima surat perintah untuk melaksanakan pekerjaan bertegangan', margin + 8, p4FootY);
  doc.setFont('helvetica', 'bold');
  doc.text(`   [ ${inputNoSp2b} /UP3 WATAMPONE/PDKB TM/${bulanRomawi}/${tahunSaatIni} ]`, margin + 8, p4FootY + 4);

  doc.setFont('helvetica', 'normal');
  doc.text('B Menerangkan telah memperhatikan dan mengerti', margin + 8, p4FootY + 10);
  doc.text('   - Pekerjaan yang oleh surat perintah ini diberikan kewenangan kepadanya untuk dilaksanakan atau telah melaksanakan dalam', margin + 8, p4FootY + 14);
  doc.text('     keadaan bertegangan', margin + 8, p4FootY + 18);
  doc.text('   - Metode yang diizinkan untuk digunakan : METODE BERJARAK', margin + 8, p4FootY + 22);
  doc.text('   - Pembatasan bersifat setempat yang dikenakan kepadanya', margin + 8, p4FootY + 26);

  doc.text('C Tidak menyerahkan pekerjaan ini, kecuali pada operator yang memiliki kewenangan yang sesuai', margin + 8, p4FootY + 32);

  // ==========================================
  // PAGE 5: SOP PDKB-TM NO 05 (KOMISI PDKB) - SP3B
  // ==========================================
  doc.addPage();
  drawPageBorder();

  drawPlnLogo(doc, margin + 4, margin + 3, 10, 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text('UIW SULSELRABAR', margin + 17, margin + 8);
  doc.text('UP3 WATAMPONE', margin + 17, margin + 13);

  let p5Y = margin + 28;
  doc.setFontSize(8.5);
  doc.text('SOP PDKB-TM NO 05 (KOMISI PDKB)', margin + 8, p5Y);

  p5Y += 9;
  doc.setFontSize(10.5);
  doc.text('SURAT PERINTAH PENGAWASAN PEKERJAAN BERTEGANGAN (SP3B)', margin + contentWidth / 2, p5Y, { align: 'center' });

  p5Y += 7;
  doc.setFontSize(8.5);
  doc.text(`NO. ${inputNoSp2b} /UP3 WATAMPONE/PDKB TM/${bulanRomawi}/${tahunSaatIni}`, margin + contentWidth / 2, p5Y, { align: 'center' });
  p5Y += 5;
  doc.text(`TANGGAL : ${tanggalDirencanakan}`, margin + contentWidth / 2, p5Y, { align: 'center' });

  // Body
  p5Y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Kepala Operasi atau wakilnya,  ${asmanName}`, margin + 8, p5Y);

  p5Y += 8;
  doc.text(`- Memberikan kewenangan kepada pengawas pekerjaan`, margin + 8, p5Y);
  doc.text(`: ${namaPP}`, margin + 90, p5Y);

  p5Y += 6;
  doc.text(`- Pemegang sertifikat kewenangan no`, margin + 8, p5Y);
  doc.text(`: ${noLv3PP}`, margin + 90, p5Y);

  p5Y += 6;
  doc.text(`- Memberikan kewenangan kepada pengawas K3`, margin + 8, p5Y);
  doc.text(`: ${namaPK3}`, margin + 90, p5Y);

  p5Y += 6;
  doc.text(`  Pemegang sertifikat kewenangan no`, margin + 8, p5Y);
  doc.text(`: ${noLv3PK3}`, margin + 90, p5Y);

  p5Y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Untuk Melaksanakan Pengawasan PDKB Pada Instalasi Berikut Ini :', margin + 8, p5Y);

  p5Y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('Jenis Pekerjaan yang Dilakukan', margin + 8, p5Y);
  doc.text(`: ${instruksiKerja}`, margin + 85, p5Y);

  p5Y += 6;
  doc.text('Cara Operasi yang Dipilih Oleh Pengawas Pekerjaan', margin + 8, p5Y);
  doc.text(': METODE BERJARAK', margin + 85, p5Y);

  p5Y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Syarat Operasi Khusus ( Kategori Kedua dan Ketiga )', margin + 8, p5Y);

  p5Y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Hubungan Komunikasi dengan Lokasi', margin + 8, p5Y);
  doc.text(': HANDIE TALKIE', margin + 85, p5Y);

  p5Y += 6;
  doc.text('Keterangan tambahan', margin + 8, p5Y);
  doc.text(':', margin + 85, p5Y);

  p5Y += 6;
  doc.text('Kewenangan Berlaku Selama', margin + 8, p5Y);
  doc.text(': 1 Hari', margin + 85, p5Y);

  // Signatures 4 parties
  const p5SignY = margin + 175;
  // Left: ASMAN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MENGETAHUI,', margin + 35, p5SignY, { align: 'center' });
  doc.text('ASMAN RING DAN KONS DIST', margin + 35, p5SignY + 4.5, { align: 'center' });
  doc.text(asmanName, margin + 35, p5SignY + 36, { align: 'center' });

  // Right: TEAM LEADER PDKB & PENGAWAS
  const p5RightX = margin + contentWidth - 45;
  doc.setFont('helvetica', 'normal');
  doc.text(`WATAMPONE, ${tanggalDirencanakan}`, p5RightX, p5SignY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('TEAM LEADER PDKB', p5RightX, p5SignY + 4.5, { align: 'center' });
  doc.text(asmanName, p5RightX, p5SignY + 36, { align: 'center' });

  doc.text('PENGAWAS PEKERJAAN', p5RightX, p5SignY + 48, { align: 'center' });
  doc.text(namaPP, p5RightX, p5SignY + 70, { align: 'center' });

  doc.text('PENGAWAS K3', p5RightX, p5SignY + 82, { align: 'center' });
  doc.text(namaPK3, p5RightX, p5SignY + 104, { align: 'center' });

  // ==========================================
  // PAGE 6: SOP PDKB-TM NO 06 (KOMISI PDKB) - TAILGATE
  // ==========================================
  doc.addPage();
  drawPageBorder();

  drawPlnLogo(doc, margin + 4, margin + 3, 10, 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text('UIW SULSELRABAR', margin + 17, margin + 8);
  doc.text('UP3 WATAMPONE', margin + 17, margin + 13);

  let p6Y = margin + 28;
  doc.setFontSize(8.5);
  doc.text('SOP PDKB-TM NO 06 (KOMISI PDKB)', margin + 8, p6Y);

  p6Y += 8;
  doc.setFontSize(10);
  doc.text('ANALISA PEKERJAAN DAN PEMBAGIAN TUGAS (TAILGATE SESSION)', margin + contentWidth / 2, p6Y, { align: 'center' });

  // Top Info Box (Table)
  p6Y += 4;
  autoTable(doc, {
    startY: p6Y,
    margin: { left: margin + 6, right: margin + 6 },
    tableWidth: contentWidth - 12,
    theme: 'grid',
    styles: {
      fontSize: 7,
      textColor: [20, 20, 20],
      cellPadding: 1.5,
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: contentWidth - 62 }
    },
    body: [
      ['Pengawas Pekerjaan', `: ${namaPP}`],
      ['Pengawas K3', `: ${namaPK3}`],
      ['Jenis Pekerjaan', `: ${instruksiKerja}`],
      ['Instruksi Kerja Nomor', ': -'],
      ['Penyulang', `: ${penyulang}`],
      ['Penanggung Jawab', ': MANAGER BAGIAN JARINGAN']
    ]
  });

  // Table Personil 10 Baris
  const p6PersonelTableY = (doc as any).lastAutoTable.finalY + 2;
  autoTable(doc, {
    startY: p6PersonelTableY,
    margin: { left: margin + 6, right: margin + 6 },
    tableWidth: contentWidth - 12,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    styles: {
      fontSize: 6.5,
      textColor: [20, 20, 20],
      cellPadding: 1.5,
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 55, halign: 'center' },
      3: { cellWidth: 33, halign: 'center' }
    },
    head: [['NO', 'PEGAWAI', 'TUGAS DAN TANGGUNG JAWAB', 'TANDA TANGAN']],
    body: p4TableBody
  });

  // Identifikasi Hazard Table
  const p6HazardY = (doc as any).lastAutoTable.finalY + 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Identifikasi Hazard', margin + 6, p6HazardY);

  autoTable(doc, {
    startY: p6HazardY + 1.5,
    margin: { left: margin + 6, right: margin + 6 },
    tableWidth: contentWidth - 12,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      fontSize: 6.5,
      halign: 'center',
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    styles: {
      fontSize: 6.5,
      textColor: [20, 20, 20],
      cellPadding: 1.5,
      lineColor: [30, 30, 30],
      lineWidth: 0.35
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: contentWidth - 62 }
    },
    head: [['HAZARD', 'CARA MENGATASI (ELIMINATE, ISOLATE & MINIMISE)']],
    body: [
      ['Bangunan', opsiBangunan],
      ['Pohon', opsiPohon],
      ['Jalan Lalu Lintas', opsiJalan],
      ['Jaringan Listrik', 'YA'],
      ['Lain - Lain', '-']
    ]
  });

  return doc;
}
