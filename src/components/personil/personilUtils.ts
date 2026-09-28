// Utility functions for Personil certifications, dates, and health metrics

export type CertStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'NONE';

export interface CertDetail {
  hasCert: boolean;
  status: CertStatus;
  label: string;
  serkom: string;
  regist: string;
  issueDate: string;
  expDateStr: string;
  daysLeft: number | null;
  monthsLeft: number | null;
}

export function parseDate(str: any): Date | null {
  if (!str) return null;
  const s = String(str).trim();
  if (!s || s === '-' || s === '#N/A' || s === '#NUM!' || s.toUpperCase() === 'TIDAK ADA') return null;

  // Handles DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
  const parts = s.split(/[\/\-.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function getCertDetail(person: any, level: 2 | 3 | 4): CertDetail {
  const serkom = String(
    person[`No. Serkom Lv. ${level}`] ||
    person[`No. Serkom Lv.${level}`] ||
    person[`Lv. ${level}`] ||
    person[`Lv.${level}`] ||
    ''
  ).trim();

  const regist = String(
    person[`No. Regist Serkom Lv. ${level}`] ||
    person[`No. Regist Serkom Lv.${level}`] ||
    ''
  ).trim();

  const issueDate = String(
    person[`Date of Issuance Lv. ${level}`] ||
    person[`Date of Issuance Lv.${level}`] ||
    ''
  ).trim();

  const expDateStr = String(
    person[`Expire Date Lv. ${level}`] ||
    person[`Expire Date Lv.${level}`] ||
    ''
  ).trim();

  const hasCert = !!(
    (serkom && serkom !== '-' && !serkom.toUpperCase().includes('TIDAK ADA')) ||
    (expDateStr && expDateStr !== '-' && !expDateStr.toUpperCase().includes('TIDAK ADA'))
  );

  if (!hasCert && !expDateStr) {
    return {
      hasCert: false,
      status: 'NONE',
      label: 'Belum Memiliki',
      serkom: '',
      regist: '',
      issueDate: '',
      expDateStr: '',
      daysLeft: null,
      monthsLeft: null
    };
  }

  const expDate = parseDate(expDateStr);
  if (!expDate) {
    return {
      hasCert: true,
      status: 'ACTIVE',
      label: 'AKTIF',
      serkom,
      regist,
      issueDate,
      expDateStr,
      daysLeft: null,
      monthsLeft: null
    };
  }

  const now = new Date();
  const diffTime = expDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const monthsLeft = parseFloat((daysLeft / 30.4375).toFixed(1));

  if (daysLeft < 0) {
    return {
      hasCert: true,
      status: 'EXPIRED',
      label: 'EXPIRE',
      serkom,
      regist,
      issueDate,
      expDateStr,
      daysLeft,
      monthsLeft
    };
  } else if (monthsLeft <= 5) {
    return {
      hasCert: true,
      status: 'EXPIRING_SOON',
      label: 'AKAN BERAKHIR',
      serkom,
      regist,
      issueDate,
      expDateStr,
      daysLeft,
      monthsLeft
    };
  } else {
    return {
      hasCert: true,
      status: 'ACTIVE',
      label: 'AKTIF',
      serkom,
      regist,
      issueDate,
      expDateStr,
      daysLeft,
      monthsLeft
    };
  }
}

export function getStatusPdkb(person: any): 'AKTIF' | 'MUTASI' | 'TIDAK AKTIF' {
  const val = String(
    person['STATUS PDKB'] ||
    person['Status PDKB'] ||
    person['status_pdkb'] ||
    person['Status'] ||
    'AKTIF'
  ).toUpperCase().trim();

  if (val.includes('MUTASI')) return 'MUTASI';
  if (val.includes('TIDAK') || val.includes('NON') || val.includes('PASIF')) return 'TIDAK AKTIF';
  return 'AKTIF';
}

export function extractLevels(person: any): string[] {
  const foundLevels: string[] = [];

  [2, 3, 4].forEach(lvl => {
    const info = getCertDetail(person, lvl as 2 | 3 | 4);
    if (info.hasCert && info.status !== 'EXPIRED') {
      foundLevels.push(`LV.${lvl}`);
    }
  });

  if (foundLevels.length === 0) {
    // Check old columns if any
    Object.entries(person).forEach(([key, val]) => {
      const k = key.toLowerCase();
      if (typeof val === 'string') {
        const v = val.toLowerCase();
        if (k === 'level' || k === 'level kompetensi') {
          if (/lv\.?\s*2/i.test(v)) foundLevels.push('LV.2');
          if (/lv\.?\s*3/i.test(v)) foundLevels.push('LV.3');
          if (/lv\.?\s*4/i.test(v)) foundLevels.push('LV.4');
        }
      }
    });
  }

  return Array.from(new Set(foundLevels)).sort();
}

export function computeHealthOverview(personilList: any[]) {
  // Hanya personil PDKB berstatus AKTIF yang dihitung dalam overview kesehatan
  const activeList = personilList.filter(p => getStatusPdkb(p) === 'AKTIF');

  const overview = {
    fisik: { SEHAT: 0, KURANG_SEHAT: 0, TIDAK_SEHAT: 0 },
    mental: { SEHAT: 0, KURANG_SEHAT: 0, TIDAK_SEHAT: 0 },
    total: activeList.length
  };

  activeList.forEach(p => {
    const f = String(p['Kesehatan Fisik'] || p['kesehatan_fisik'] || p['Status Fisik'] || 'SEHAT').toUpperCase();
    const m = String(p['Kesehatan Mental'] || p['kesehatan_mental'] || p['Status Mental'] || 'SEHAT').toUpperCase();

    if (f.includes('KURANG')) overview.fisik.KURANG_SEHAT++;
    else if (f.includes('TIDAK') || f.includes('SAKIT')) overview.fisik.TIDAK_SEHAT++;
    else overview.fisik.SEHAT++;

    if (m.includes('KURANG') || m.includes('STRES')) overview.mental.KURANG_SEHAT++;
    else if (m.includes('TIDAK') || m.includes('DEPRESI')) overview.mental.TIDAK_SEHAT++;
    else overview.mental.SEHAT++;
  });

  return overview;
}
