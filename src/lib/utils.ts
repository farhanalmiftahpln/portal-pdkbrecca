import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateInput: any): string {
  if (!dateInput) return '-';
  
  // If it's already in DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD format
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'null') return '-';

    const partsSlash = trimmed.split('/');
    if (partsSlash.length === 3) {
      if (partsSlash[2].length === 4) return trimmed; // already DD/MM/YYYY
      if (partsSlash[0].length === 4) return `${partsSlash[2].padStart(2, '0')}/${partsSlash[1].padStart(2, '0')}/${partsSlash[0]}`; // YYYY/MM/DD
    }
    
    // Check YYYY-MM-DD (e.g. from Supabase or standard date string)
    const dateOnly = trimmed.includes('T') ? trimmed.split('T')[0] : (trimmed.includes(' ') ? trimmed.split(' ')[0] : trimmed);
    const partsDash = dateOnly.split('-');
    if (partsDash.length === 3) {
      if (partsDash[0].length === 4) {
        // YYYY-MM-DD -> DD/MM/YYYY (Direct string extraction, NO timezone offset bug)
        return `${partsDash[2].padStart(2, '0')}/${partsDash[1].padStart(2, '0')}/${partsDash[0]}`;
      }
      if (partsDash[2].length === 4) {
        // DD-MM-YYYY -> DD/MM/YYYY
        return `${partsDash[0].padStart(2, '0')}/${partsDash[1].padStart(2, '0')}/${partsDash[2]}`;
      }
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput : '-'; // fallback

  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(d).split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  } catch (e) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

export function formatDateTime(dateInput: any): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput : '-';
  
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function formatGoogleDriveUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }
  return url;
}

