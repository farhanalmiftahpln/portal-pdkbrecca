/**
 * Utility functions for exporting WORK ORDER, SP2B, and SP3B documents.
 * Handles Roman numerals, date formatting (DD-MM-YYYY, H-1), placeholder replacements,
 * and high-fidelity PDF document generation.
 */

// Roman numeral lookup for months (1-12)
export function getRomanMonth(monthIndex?: number): string {
  const romanMap = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const month = typeof monthIndex === 'number' ? monthIndex : new Date().getMonth() + 1;
  const idx = Math.max(1, Math.min(12, month)) - 1;
  return romanMap[idx] || 'IX';
}

// Convert any date input into DD-MM-YYYY string
export function formatDateDDMMYYYY(val: any): string {
  if (!val) {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '-';
    const dd = String(val.getDate()).padStart(2, '0');
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const yyyy = val.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  const s = String(val).trim();
  if (!s || s === '-' || s === 'null' || s === 'undefined') return '-';

  // Check if already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;

  // Check if DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/');
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
  }

  // Check if YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
    const parts = s.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
    }
  }

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  return s;
}

// Calculate H-1 (1 calendar day before) formatted as DD-MM-YYYY
export function calculateHMinus1(val: any): string {
  let dateObj: Date | null = null;

  if (val instanceof Date) {
    dateObj = new Date(val);
  } else if (val) {
    const s = String(val).trim();
    // Parse DD-MM-YYYY or DD/MM/YYYY
    if (/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(s)) {
      const parts = s.split(/[-\/]/);
      dateObj = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    } else {
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  // Subtract 1 day
  const prevDate = new Date(dateObj.getTime());
  prevDate.setDate(prevDate.getDate() - 1);
  return formatDateDDMMYYYY(prevDate);
}

// Format WO number for SIMPDKB (e.g. 1 -> "001", 12 -> "012", 1484 -> "1484")
export function formatThreeDigitWo(rawWo: any): string {
  if (!rawWo) return '001';
  const clean = String(rawWo).replace(/^WO-/i, '').trim();
  const digits = clean.replace(/\D/g, '');
  if (!digits) return clean || '001';
  if (digits.length <= 3) return digits.padStart(3, '0');
  return digits;
}

// Safely convert image URL (Drive, HTTP) to Base64
export function loadImageAsBase64(rawUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!rawUrl || typeof rawUrl !== 'string') return resolve(null);
    const trimmed = rawUrl.trim();
    if (!trimmed) return resolve(null);

    if (trimmed.startsWith('data:image/')) {
      return resolve(trimmed);
    }

    let safeUrl = trimmed;
    if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
      const match = trimmed.match(/id=([a-zA-Z0-9_-]+)/) || trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        safeUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
      }
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.naturalWidth || 400;
        let h = img.naturalHeight || 300;
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        } else {
          resolve(null);
        }
      } catch (err) {
        console.warn('Canvas export error:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      // Fallback: try lh3 if thumbnail fails
      if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
        const match = trimmed.match(/id=([a-zA-Z0-9_-]+)/) || trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1] && safeUrl.includes('thumbnail')) {
          const img2 = new Image();
          img2.crossOrigin = 'Anonymous';
          img2.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img2.naturalWidth || 400;
              canvas.height = img2.naturalHeight || 300;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img2, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
                return;
              }
            } catch (e) {}
            resolve(null);
          };
          img2.onerror = () => resolve(null);
          img2.src = `https://lh3.googleusercontent.com/d/${match[1]}=s800`;
          return;
        }
      }
      resolve(null);
    };
    img.src = safeUrl;
  });
}

/**
 * Parses GPS coordinates string into lat and lng
 */
export function parseCoordinates(coordStr?: string): { lat: number; lng: number } | null {
  if (!coordStr) return null;
  const s = String(coordStr).trim();
  if (!s || s === '-' || s === 'null' || s === 'undefined') return null;

  // URL matching: q=lat,lng or @lat,lng
  const qMatch = s.match(/q=([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)/i);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }
  const atMatch = s.match(/@([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)/i);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  // Decimal degrees: e.g. -4.53812, 120.32981
  const decMatch = s.match(/([+-]?\d+\.\d+)[,\s]+([+-]?\d+\.\d+)/);
  if (decMatch) {
    return { lat: parseFloat(decMatch[1]), lng: parseFloat(decMatch[2]) };
  }

  // General coordinates
  const generalMatch = s.match(/([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)/);
  if (generalMatch) {
    const lat = parseFloat(generalMatch[1]);
    const lng = parseFloat(generalMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  return null;
}

/**
 * Generates a crisp static map image URL with marker from coordinates
 */
export function getStaticMapImageUrl(coords?: string): string {
  if (!coords) return '';
  const parsed = parseCoordinates(coords);
  if (!parsed) return '';
  const { lat, lng } = parsed;
  return `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=16&l=map&size=600,450&pt=${lng},${lat},pm2rdm`;
}
