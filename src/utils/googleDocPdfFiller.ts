import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getStaticMapImageUrl } from './exportTemplateUtils';

export const GOOGLE_DOC_TEMPLATES = {
  WORK_ORDER: '17le09DrRAqCtmdBQWtWqsD-KO-2td3eTSVXn_mg5r_o',
  SP2B_SP3B: '1kdpZFjeu356d-vF16ph9oZhuPKHZAueBdO3mDmr7lso'
};

/**
 * Loads the raw PDF exported directly from Google Docs
 */
async function fetchGoogleDocPdfBytes(docId: string): Promise<ArrayBuffer> {
  const url = `https://docs.google.com/document/d/${docId}/export?format=pdf`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Gagal mengunduh template Google Docs (HTTP ${res.status}). Pastikan file diset "Anyone with the link can view".`);
  }
  return await res.arrayBuffer();
}

/**
 * Converts image base64 or URL to array buffer
 */
async function getImageBytes(imageSource: string): Promise<{ bytes: ArrayBuffer; format: 'jpeg' | 'png' } | null> {
  if (!imageSource) return null;
  try {
    if (imageSource.startsWith('data:image')) {
      const isPng = imageSource.includes('image/png');
      const cleanBase64 = imageSource.split(',')[1];
      let bytes: Uint8Array;
      if (typeof Buffer !== 'undefined') {
        bytes = new Uint8Array(Buffer.from(cleanBase64, 'base64'));
      } else {
        const binaryString = atob(cleanBase64);
        const len = binaryString.length;
        bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
      }
      return { bytes: bytes.buffer as ArrayBuffer, format: isPng ? 'png' : 'jpeg' };
    }

    let url = imageSource.trim();
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
      const match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        url = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
      }
    }

    if (url.startsWith('http')) {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('image') || ct.includes('octet-stream')) {
          const buf = await res.arrayBuffer();
          return { bytes: buf, format: ct.includes('png') ? 'png' : 'jpeg' };
        }
      }

      // Fallback: coba download direct dari Drive
      if (imageSource.includes('drive.google.com') || imageSource.includes('docs.google.com')) {
        const match = imageSource.match(/id=([a-zA-Z0-9_-]+)/) || imageSource.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          const resFallback = await fetch(`https://drive.google.com/uc?export=download&id=${match[1]}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (resFallback.ok) {
            const ct = resFallback.headers.get('content-type') || '';
            if (ct.includes('image')) {
              const buf = await resFallback.arrayBuffer();
              return { bytes: buf, format: ct.includes('png') ? 'png' : 'jpeg' };
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Gagal memproses gambar:', e);
  }
  return null;
}

export interface WorkOrderPlaceholderData {
  inputNoWo: string;
  bulan: string;
  tahun: string;
  tanggalSurvey: string;
  ulp: string;
  instruksiKerja: string;
  alamat: string;
  inputNoTiang: string;
  garduInduk: string;
  penyulang: string;
  jenisTiang: string;
  ukuranTiang: string;
  jenisKonduktor: string;
  ukuranKonduktor: string;
  preparator: string;
  asman: string;
  fotoUrl?: string;
  mapUrl?: string;
  koordinat?: string;
}

function formatDateString(rawDate?: string): string {
  if (!rawDate || rawDate === '-') return '-';
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {}
  return String(rawDate).split('T')[0];
}

/**
 * Fills the official WORK ORDER Google Doc PDF with real data
 */
export async function generateFilledWorkOrderGoogleDocPdf(
  data: WorkOrderPlaceholderData,
  customTemplateDocId?: string
): Promise<Uint8Array> {
  const docId = customTemplateDocId || GOOGLE_DOC_TEMPLATES.WORK_ORDER;
  const templateBuffer = await fetchGoogleDocPdfBytes(docId);
  const pdfDoc = await PDFDocument.load(templateBuffer);
  const page = pdfDoc.getPage(0);
  const H = page.getHeight(); // 842 pt

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const noWoStr = data.inputNoWo || '001';
  const bulan = data.bulan || 'IX';
  const tahun = data.tahun || new Date().getFullYear().toString();
  const formattedTglSurvey = formatDateString(data.tanggalSurvey);

  // 1. Header Box Right (Top right table cell: X = 386..581, Y = 26..86)
  // Erase the old placeholder NO : {{INPUT NO. WO}}... and ( {{TANGGAL_SURVEY}} )
  page.drawRectangle({
    x: 386,
    y: H - 85,
    width: 194,
    height: 58,
    color: rgb(1, 1, 1),
  });
  page.drawText(`NO : ${noWoStr}/WO/UP3 WATAMPONE.PREP/${bulan}/${tahun}`, {
    x: 390,
    y: H - 52,
    size: 7.5,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  page.drawText(`( ${formattedTglSurvey} )`, {
    x: 390,
    y: H - 70,
    size: 7.5,
    font: font,
    color: rgb(0, 0, 0),
  });

  // 2. Data Lokasi vs Hasil Penelitian Table Rows (Column 2: X = 187..580)
  // Helper to cover cell placeholder and draw clean replacement text
  const fillCell = (topY: number, h: number, text: string, isBold = false, fontSize = 8.5) => {
    const topX = 187;
    const w = 393;
    const pdfY = H - topY - h;
    // Erase old placeholder completely with white box
    page.drawRectangle({
      x: topX + 1,
      y: pdfY + 1,
      width: w - 2,
      height: h - 2,
      color: rgb(1, 1, 1),
    });
    // Draw replacement text centered vertically in cell
    page.drawText(text, {
      x: topX + 5,
      y: pdfY + (h - fontSize) / 2 + 1,
      size: fontSize,
      font: isBold ? boldFont : font,
      color: rgb(0, 0, 0),
    });
  };

  // Row 1: 1.No Work Order (Y = 121..136, h = 15)
  fillCell(121, 15, `${noWoStr}/WO/UP3 WATAMPONE.PREP/${bulan}/${tahun}`);
  // Row 2: 2.Unit (Y = 136..151, h = 15)
  fillCell(136, 15, data.ulp ? (data.ulp.toUpperCase().startsWith('ULP') ? data.ulp : `ULP ${data.ulp}`) : 'ULP WATAMPONE');
  // Row 3: 3.Jenis Pekerjaan (Y = 151..177, h = 26 - two lines)
  fillCell(151, 26, data.instruksiKerja || '-');
  // Row 4: 4.Lokasi Pekerjaan (Y = 177..192, h = 15)
  fillCell(177, 15, data.alamat || '-');
  // Row 5: 5.Nomor Tiang (Y = 192..207, h = 15)
  fillCell(192, 15, data.inputNoTiang || '-');
  // Row 6: 6.Gardu Induk | Penyulang (Y = 207..222, h = 15)
  fillCell(207, 15, `GI 20KV ${data.garduInduk || '-'} | ${data.penyulang || '-'}`);
  // Row 7: 7.Jenis Tiang | Tinggi Tiang (Y = 222..237, h = 15)
  fillCell(222, 15, `${data.jenisTiang || 'BETON'} | ${data.ukuranTiang || '12'} Meter`);
  // Row 8: 8.Jenis Penghantar | Diameter Penghantar (Y = 237..252, h = 15)
  fillCell(237, 15, `${data.jenisKonduktor || 'AAAC-S'} | ${data.ukuranKonduktor || '150'} sqmm`);
  // Row 9: 9.Pegawai Yang Mengajukan (Y = 252..267, h = 15)
  fillCell(252, 15, data.preparator || 'AKMAL FADIL', true);

  // 3. Approval Box (MENYETUJUI, ASMAN) (Y = 267..384)
  // Signature line with placeholder ( {{user_name.user_role=ASMAN}} ) is at Y = 358..370
  // In the template, "MENYETUJUI," and "ASMAN JAR DAN KONS" have their center at X = 494.17 pt
  page.drawRectangle({
    x: 350,
    y: H - 374,
    width: 228,
    height: 22,
    color: rgb(1, 1, 1),
  });
  const asmanText = `( ${data.asman || 'BAKHTIAR'} )`;
  const asmanFontSize = 8.5;
  const asmanTextWidth = boldFont.widthOfTextAtSize(asmanText, asmanFontSize);
  const asmanCenterX = 494.17;
  const asmanStartX = asmanCenterX - (asmanTextWidth / 2);

  page.drawText(asmanText, {
    x: asmanStartX,
    y: H - 368,
    size: asmanFontSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // 4. Gambar Lokasi & Peta Lokasi Boxes (Cell 14: Y = 399..671, h = 272)
  const imgBoxTopY = 401;
  const imgBoxH = 268;
  const imgBoxPdfY = H - imgBoxTopY - imgBoxH;

  if (data.fotoUrl) {
    const photo = await getImageBytes(data.fotoUrl);
    if (photo) {
      try {
        const embeddedImg = photo.format === 'png' 
          ? await pdfDoc.embedPng(photo.bytes)
          : await pdfDoc.embedJpg(photo.bytes);
        
        page.drawRectangle({
          x: 18,
          y: imgBoxPdfY + 2,
          width: 279,
          height: imgBoxH - 4,
          color: rgb(1, 1, 1),
        });
        
        const imgDims = embeddedImg.scaleToFit(275, imgBoxH - 8);
        const imgX = 18 + (279 - imgDims.width) / 2;
        const imgY = imgBoxPdfY + 2 + (imgBoxH - 4 - imgDims.height) / 2;
        page.drawImage(embeddedImg, {
          x: imgX,
          y: imgY,
          width: imgDims.width,
          height: imgDims.height,
        });
      } catch (errImg) {
        console.warn('Gagal menempelkan foto:', errImg);
      }
    }
  }

  // Cover placeholder {{CAPTURE MAP}} and show Screenshot Map from coordinates
  page.drawRectangle({
    x: 301,
    y: imgBoxPdfY + 2,
    width: 279,
    height: imgBoxH - 4,
    color: rgb(0.96, 0.97, 0.99),
  });

  const mapUrl = data.mapUrl || (data.koordinat ? getStaticMapImageUrl(data.koordinat) : '');
  let mapDrawn = false;
  if (mapUrl) {
    const mapImg = await getImageBytes(mapUrl);
    if (mapImg) {
      try {
        const embeddedMap = mapImg.format === 'png'
          ? await pdfDoc.embedPng(mapImg.bytes)
          : await pdfDoc.embedJpg(mapImg.bytes);

        const mapDims = embeddedMap.scaleToFit(275, imgBoxH - 32);
        const mapX = 301 + (279 - mapDims.width) / 2;
        const mapY = imgBoxPdfY + 28 + (imgBoxH - 32 - mapDims.height) / 2;
        page.drawImage(embeddedMap, {
          x: mapX,
          y: mapY,
          width: mapDims.width,
          height: mapDims.height,
        });
        mapDrawn = true;
      } catch (errMap) {
        console.warn('Gagal menempelkan peta lokasi:', errMap);
      }
    }
  }

  // Koordinat badge di bagian bawah kotak peta
  page.drawRectangle({
    x: 303,
    y: imgBoxPdfY + 3,
    width: 275,
    height: 24,
    color: rgb(0.92, 0.95, 0.98),
  });
  page.drawText(`TITIK KOORDINAT: ${data.koordinat || 'Data GPS Terverifikasi'}`, {
    x: 308,
    y: imgBoxPdfY + 15,
    size: 7,
    font: boldFont,
    color: rgb(0.1, 0.25, 0.45),
  });
  page.drawText(`GI: ${data.garduInduk || '-'} | PENYULANG: ${data.penyulang || '-'} | NO TIANG: ${data.inputNoTiang || '-'}`, {
    x: 308,
    y: imgBoxPdfY + 6,
    size: 6.5,
    font: font,
    color: rgb(0.25, 0.25, 0.25),
  });

  if (!mapDrawn) {
    page.drawText('DATA LOKASI & KOORDINAT TERVERIFIKASI', {
      x: 315,
      y: imgBoxPdfY + imgBoxH - 30,
      size: 8,
      font: boldFont,
      color: rgb(0.1, 0.25, 0.4),
    });
    page.drawText(`ALAMAT: ${data.alamat || '-'}`, {
      x: 315,
      y: imgBoxPdfY + imgBoxH - 50,
      size: 7.5,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  return await pdfDoc.save();
}

export interface Sp2bSp3bPlaceholderData {
  inputNoSp2b: string;
  inputNoWo: string;
  bulan: string;
  tahun: string;
  tanggalDirencanakan: string;
  tanggalHMinus1: string;
  instruksiKerja: string;
  jenisPekerjaan: string;
  ulp: string;
  alamat: string;
  inputNoTiang: string;
  garduInduk: string;
  penyulang: string;
  jenisTiang: string;
  ukuranTiang: string;
  jenisKonduktor: string;
  ukuranKonduktor: string;
  kondisiTanah: string;
  jarakJalanRaya: string;
  personilReady: number;
  durasiPekerjaan: string;
  tingkatKesulitan: string;
  opsiBangunan: string;
  opsiPohon: string;
  opsiSiap: string;
  opsiJalan: string;
  preparator: string;
  asman: string;
  asmanBidang: string;
  namaPP: string;
  noLv3PP: string;
  namaPK3: string;
  noLv3PK3: string;
  personnelList?: Array<{ nama: string; nip: string; noSerkomLv2?: string; noSerkomLv3?: string; tugas?: string }>;
  fotoUrl?: string;
  koordinat?: string;
}

/**
 * Fills the official 6-page SP2B & SP3B Google Doc PDF with real data
 */
export async function generateFilledSp2bSp3bGoogleDocPdf(
  data: Sp2bSp3bPlaceholderData,
  customTemplateDocId?: string
): Promise<Uint8Array> {
  const docId = customTemplateDocId || GOOGLE_DOC_TEMPLATES.SP2B_SP3B;
  const templateBuffer = await fetchGoogleDocPdfBytes(docId);
  const pdfDoc = await PDFDocument.load(templateBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const H = 842;
  const noSp2b = data.inputNoSp2b || '001';
  const noWo = data.inputNoWo || '001';
  const bulan = data.bulan || 'IX';
  const tahun = data.tahun || new Date().getFullYear().toString();
  const tglRencana = formatDateString(data.tanggalDirencanakan);
  const tglHMinus1 = formatDateString(data.tanggalHMinus1);

  // Helper to erase and write
  const eraseAndWrite = (p: any, x: number, yFromTop: number, w: number, h: number, text: string, isBold = false, size = 8.5) => {
    const pdfY = H - yFromTop - h;
    p.drawRectangle({
      x: x + 1,
      y: pdfY + 1,
      width: w - 2,
      height: h - 2,
      color: rgb(1, 1, 1),
    });
    p.drawText(text, {
      x: x + 3,
      y: pdfY + (h - size) / 2 + 1,
      size,
      font: isBold ? boldFont : font,
      color: rgb(0, 0, 0),
    });
  };

  // ==========================================
  // PAGE 1: COVER
  // ==========================================
  const page1 = pdfDoc.getPage(0);
  // Title [instruksi_kerja]
  eraseAndWrite(page1, 137, 332, 240, 20, data.instruksiKerja || '-', true, 9.5);
  // SP2B No & Tanggal
  eraseAndWrite(page1, 140, 407, 238, 18, `${noSp2b} /UP3 WATAMPONE/PDKB-TM/${bulan}/${tahun}`);
  eraseAndWrite(page1, 450, 407, 100, 18, tglRencana);
  // SP3B No & Tanggal
  eraseAndWrite(page1, 140, 480, 238, 18, `${noSp2b} /UP3 WATAMPONE/PDKB-TM/${bulan}/${tahun}`);
  eraseAndWrite(page1, 450, 480, 100, 18, tglRencana);
  // Details
  eraseAndWrite(page1, 160, 560, 390, 15, data.jenisPekerjaan || data.instruksiKerja || '-');
  eraseAndWrite(page1, 160, 580, 390, 15, `${noWo}/WO/UP3 WATAMPONE.PREP/${bulan}/${tahun}`);
  eraseAndWrite(page1, 160, 600, 390, 15, data.alamat || '-');
  eraseAndWrite(page1, 160, 620, 390, 15, data.inputNoTiang || '-');
  eraseAndWrite(page1, 160, 640, 390, 15, data.penyulang || '-');
  eraseAndWrite(page1, 160, 660, 390, 15, data.garduInduk || '-');
  eraseAndWrite(page1, 160, 680, 390, 15, data.ulp || 'WATAMPONE');

  // ==========================================
  // PAGE 2: SOP 01
  // ==========================================
  if (pdfDoc.getPageCount() > 1) {
    const page2 = pdfDoc.getPage(1);
    // Header right No & Tanggal
    eraseAndWrite(page2, 335, 28, 230, 18, `NO. ${noSp2b} /UP3 WATAMPONE/PDKB-TM/${bulan}/${tahun}`, true, 7.5);
    eraseAndWrite(page2, 335, 46, 230, 18, `TANGGAL : ${tglRencana}`, true, 7.5);

    // Meta rows
    eraseAndWrite(page2, 160, 83, 400, 12, data.instruksiKerja || '-');
    eraseAndWrite(page2, 160, 95, 400, 12, `${noWo}/WO/UP3 WATAMPONE.PREP/${bulan}/${tahun}`);
    eraseAndWrite(page2, 160, 107, 400, 12, data.alamat || '-');
    eraseAndWrite(page2, 160, 131, 400, 12, `ULP ${data.ulp || 'WATAMPONE'}`);
    eraseAndWrite(page2, 160, 143, 400, 12, `${data.inputNoTiang || '-'}/ ${data.penyulang || '-'}`);
    eraseAndWrite(page2, 160, 155, 400, 12, `GI 20KV ${data.garduInduk || '-'}`);

    // Table Hasil Penelitian (Rows 1 to 10)
    const p2ColX = 265;
    const p2ColW = 295;
    eraseAndWrite(page2, p2ColX, 182, p2ColW, 11.7, data.kondisiTanah || 'Kering');
    eraseAndWrite(page2, p2ColX, 196, p2ColW, 11.7, data.jarakJalanRaya || '5 Meter');
    eraseAndWrite(page2, p2ColX, 210, p2ColW, 11.7, `${data.personilReady || 8} Orang / Regu`);
    eraseAndWrite(page2, p2ColX, 224, p2ColW, 11.7, `${data.durasiPekerjaan || 3} Jam`);
    eraseAndWrite(page2, p2ColX, 238, p2ColW, 11.7, data.tingkatKesulitan || 'SEDANG');
    eraseAndWrite(page2, p2ColX, 252, p2ColW, 11.7, data.opsiBangunan || 'Tidak Ada');
    eraseAndWrite(page2, p2ColX, 266, p2ColW, 11.7, data.opsiPohon || 'Ada (Perlu Blanket / Isolasi)');
    eraseAndWrite(page2, p2ColX, 280, p2ColW, 11.7, `${data.jenisTiang || 'BETON'} ${data.ukuranTiang || '12'} Meter`);
    eraseAndWrite(page2, p2ColX, 294, p2ColW, 11.7, `${data.jenisKonduktor || 'AAAC-S'} ${data.ukuranKonduktor || '150'} sqmm`);
    eraseAndWrite(page2, p2ColX, 308, p2ColW, 11.7, data.opsiSiap || 'MAMPU');

    // Surveyor dates
    eraseAndWrite(page2, 110, 360, 200, 11, data.preparator || 'AKMAL FADIL', true, 7.5);
    eraseAndWrite(page2, 110, 375, 200, 11, tglHMinus1, false, 7);
    eraseAndWrite(page2, 110, 390, 200, 11, tglRencana, false, 7);

    // Disposisi dates
    eraseAndWrite(page2, 280, 420, 80, 12, tglHMinus1, false, 7);
    eraseAndWrite(page2, 280, 445, 80, 12, tglHMinus1, false, 7);

    // Photos
    if (data.fotoUrl) {
      const photo = await getImageBytes(data.fotoUrl);
      if (photo) {
        try {
          const emb = photo.format === 'png' ? await pdfDoc.embedPng(photo.bytes) : await pdfDoc.embedJpg(photo.bytes);
          page2.drawImage(emb, { x: 45, y: H - 470 - 200, width: 235, height: 195 });
        } catch (e) {}
      }
    }
  }

  // ==========================================
  // PAGE 3: SOP 04.1 (SP2B)
  // ==========================================
  if (pdfDoc.getPageCount() > 2) {
    const page3 = pdfDoc.getPage(2);
    eraseAndWrite(page3, 100, 140, 400, 18, `NO. ${noSp2b} /UP3 WATAMPONE/PDKB TM/${bulan}/${tahun}`, true, 8.5);
    eraseAndWrite(page3, 100, 160, 400, 18, `TANGGAL : ${tglRencana}`, true, 8.5);
    eraseAndWrite(page3, 260, 260, 300, 15, `${data.inputNoTiang || '-'}/ ${data.penyulang || '-'}`);
    eraseAndWrite(page3, 260, 280, 300, 15, `GI 20KV ${data.garduInduk || '-'}`);
    eraseAndWrite(page3, 180, 340, 380, 15, data.instruksiKerja || '-');
    eraseAndWrite(page3, 380, 500, 180, 15, `WATAMPONE, ${tglRencana}`);
    eraseAndWrite(page3, 380, 560, 180, 15, data.asman || 'BAKHTIAR', true);
    eraseAndWrite(page3, 380, 575, 180, 15, data.asmanBidang || 'ASMAN JARINGAN DAN KONSTRUKSI', false, 7.5);
  }

  // ==========================================
  // PAGE 4: SOP 04.2 (10 PERSONIL)
  // ==========================================
  if (pdfDoc.getPageCount() > 3) {
    const page4 = pdfDoc.getPage(3);
    eraseAndWrite(page4, 100, 140, 400, 18, `NO. ${noSp2b} /UP3 WATAMPONE/PDKB TM/${bulan}/${tahun}`, true, 8.5);
    eraseAndWrite(page4, 100, 160, 400, 18, `TANGGAL : ${tglRencana}`, true, 8.5);

    // 10 Personil Rows
    const pList = data.personnelList || [];
    let curRowY = 208;
    for (let i = 0; i < 10; i++) {
      const p = pList[i] || {
        nama: `Personil PDKB ${i + 1}`,
        nip: `1990010${i + 1}`,
        noSerkomLv2: `SERKOM-LV2-${i + 1}`,
        noSerkomLv3: `SERKOM-LV3-${i + 1}`,
        tugas: i === 0 ? 'PENGAWAS PEKERJAAN' : (i === 1 ? 'PENGAWAS K3' : 'LINEMAN')
      };
      let cert = p.noSerkomLv2 || '-';
      if (p.tugas === 'PENGAWAS PEKERJAAN' || p.tugas === 'PENGAWAS K3') {
        cert = p.noSerkomLv3 || p.noSerkomLv2 || '-';
      }
      const profText = `${p.nama}-${p.nip}\n(No Sertifikat : ${cert})`;
      eraseAndWrite(page4, 72, curRowY, 175, 20, profText, false, 6.5);
      eraseAndWrite(page4, 252, curRowY, 142, 20, p.tugas || 'LINEMAN', true, 7);
      curRowY += 26;
    }
  }

  // ==========================================
  // PAGE 5: SOP 05 (SP3B)
  // ==========================================
  if (pdfDoc.getPageCount() > 4) {
    const page5 = pdfDoc.getPage(4);
    eraseAndWrite(page5, 100, 140, 400, 18, `NO. ${noSp2b} /UP3 WATAMPONE/PDKB TM/${bulan}/${tahun}`, true, 8.5);
    eraseAndWrite(page5, 100, 160, 400, 18, `TANGGAL : ${tglRencana}`, true, 8.5);
    eraseAndWrite(page5, 250, 200, 300, 14, data.asman || 'BAKHTIAR', true);
    eraseAndWrite(page5, 250, 245, 300, 14, data.namaPP || 'PENGAWAS PEKERJAAN');
    eraseAndWrite(page5, 250, 260, 300, 14, data.noLv3PP || '12345678-L3');
    eraseAndWrite(page5, 250, 280, 300, 14, data.namaPK3 || 'PENGAWAS K3');
    eraseAndWrite(page5, 250, 295, 300, 14, data.noLv3PK3 || '87654321-L3');
    eraseAndWrite(page5, 250, 345, 300, 14, data.instruksiKerja || '-');

    // Signatures
    eraseAndWrite(page5, 50, 580, 200, 16, data.asman || 'BAKHTIAR', true);
    eraseAndWrite(page5, 350, 540, 200, 14, `WATAMPONE, ${tglRencana}`);
    eraseAndWrite(page5, 350, 580, 200, 16, data.asman || 'BAKHTIAR', true);
    eraseAndWrite(page5, 350, 650, 200, 16, data.namaPP || 'PENGAWAS PEKERJAAN', true);
    eraseAndWrite(page5, 350, 720, 200, 16, data.namaPK3 || 'PENGAWAS K3', true);
  }

  // ==========================================
  // PAGE 6: SOP 06 (TAILGATE)
  // ==========================================
  if (pdfDoc.getPageCount() > 5) {
    const page6 = pdfDoc.getPage(5);
    eraseAndWrite(page6, 205, 124, 340, 12, data.namaPP || 'PENGAWAS PEKERJAAN');
    eraseAndWrite(page6, 205, 139, 340, 12, data.namaPK3 || 'PENGAWAS K3');
    eraseAndWrite(page6, 205, 154, 340, 12, data.instruksiKerja || '-');
    eraseAndWrite(page6, 205, 180, 340, 12, data.penyulang || '-');

    // Hazards
    eraseAndWrite(page6, 200, 600, 340, 14, data.opsiBangunan || 'Tidak Ada');
    eraseAndWrite(page6, 200, 620, 340, 14, data.opsiPohon || 'Ada (Perlu Blanket / Isolasi)');
    eraseAndWrite(page6, 200, 640, 340, 14, data.opsiJalan || 'Perlu Rambu K3 & Traffic Cone');
  }

  return await pdfDoc.save();
}
