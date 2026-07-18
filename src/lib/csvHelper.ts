import { BloodPressureLog, WeightLog } from '../types';

const escapeCSV = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export function exportBPToCSV(logs: BloodPressureLog[]): void {
  const headers = ['Tanggal', 'Sistolik (SYS) mmHg', 'Diastolik (DIA) mmHg', 'Detak Nadi (Pulse) bpm', 'Catatan', 'ISO_Timestamp'];
  const rows = logs.map(log => [
    new Date(log.logged_at).toLocaleString('id-ID'),
    log.systolic,
    log.diastolic,
    log.pulse,
    log.notes || '',
    log.logged_at
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(escapeCSV).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `riwayat_tensi_${dateStr}.csv`);
  link.click();
}

export function exportWeightToCSV(logs: WeightLog[]): void {
  const headers = ['Tanggal', 'Berat Badan (kg)', 'Catatan', 'ISO_Timestamp'];
  const rows = logs.map(log => [
    new Date(log.logged_at).toLocaleString('id-ID'),
    log.weight,
    log.notes || '',
    log.logged_at
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(escapeCSV).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `riwayat_berat_badan_${dateStr}.csv`);
  link.click();
}

// Custom CSV simple line parser that handles quotes correctly
function parseCSVRows(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentValue = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++; // skip next double quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentValue);
      currentValue = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      row.push(currentValue);
      lines.push(row);
      row = [];
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  if (currentValue || row.length > 0) {
    row.push(currentValue);
    lines.push(row);
  }

  // Filter out completely empty lines
  return lines.filter(r => r.length > 0 && r.some(val => val.trim() !== ''));
}

export interface ParsedCSVResult {
  bp: Array<{ systolic: number; diastolic: number; pulse: number; logged_at: string; notes: string }>;
  weight: Array<{ weight: number; logged_at: string; notes: string }>;
  error?: string;
}

export function parseCSV(text: string): ParsedCSVResult {
  const parsedRows = parseCSVRows(text);
  if (parsedRows.length < 2) {
    return { bp: [], weight: [], error: 'File CSV kosong atau tidak memiliki baris data.' };
  }

  const headers = parsedRows[0].map(h => h.trim().toLowerCase());
  
  // Find column indexes based on flexible headers
  let sysIdx = -1;
  let diaIdx = -1;
  let pulseIdx = -1;
  let weightIdx = -1;
  let dateIdx = -1;
  let isoIdx = -1;
  let notesIdx = -1;

  headers.forEach((header, index) => {
    // Exact mapping check
    if (header.includes('iso_timestamp') || header.includes('isotimestamp')) {
      isoIdx = index;
    } else if (header.includes('sistolik') || header.includes('systolic') || header.includes('sys')) {
      sysIdx = index;
    } else if (header.includes('diastolik') || header.includes('diastolic') || header.includes('dia')) {
      diaIdx = index;
    } else if (header.includes('pulse') || header.includes('nadi') || header.includes('detak') || header.includes('bpm')) {
      pulseIdx = index;
    } else if (header.includes('berat') || header.includes('weight') || header.includes('bb')) {
      weightIdx = index;
    } else if (header.includes('tanggal') || header.includes('date') || header.includes('waktu') || header.includes('time') || header === 'logged_at') {
      dateIdx = index;
    } else if (header.includes('catatan') || header.includes('notes') || header.includes('memo') || header.includes('keterangan')) {
      notesIdx = index;
    }
  });

  // If no columns are mapped, return error
  if (sysIdx === -1 && diaIdx === -1 && weightIdx === -1) {
    return {
      bp: [],
      weight: [],
      error: 'Format kolom tidak dikenali. Pastikan file CSV memiliki kolom header seperti "Tanggal", "Sistolik", "Diastolik", "Nadi" untuk Tensi, ATAU "Tanggal", "Berat Badan" untuk Berat Badan.'
    };
  }

  const bpLogs: ParsedCSVResult['bp'] = [];
  const weightLogs: ParsedCSVResult['weight'] = [];

  for (let i = 1; i < parsedRows.length; i++) {
    const row = parsedRows[i];
    
    // Extract date
    let loggedAt = new Date().toISOString();
    if (isoIdx !== -1 && row[isoIdx]) {
      const parsedDate = new Date(row[isoIdx]);
      if (!isNaN(parsedDate.getTime())) {
        loggedAt = parsedDate.toISOString();
      }
    } else if (dateIdx !== -1 && row[dateIdx]) {
      // Try to parse standard string date
      let rawDateStr = row[dateIdx].trim();
      
      // Clean up common Indonesian formatting parts if standard parsing fails (e.g., "." instead of "/")
      rawDateStr = rawDateStr.replace(/\./g, '-');
      
      const parsedDate = new Date(rawDateStr);
      if (!isNaN(parsedDate.getTime())) {
        loggedAt = parsedDate.toISOString();
      } else {
        // Fallback or attempt localized ID parse if possible, else current time
        const fallbackDate = new Date();
        loggedAt = fallbackDate.toISOString();
      }
    }

    // Extract notes
    const notes = notesIdx !== -1 && row[notesIdx] ? row[notesIdx].trim() : '';

    // If looks like BP log
    if (sysIdx !== -1 && diaIdx !== -1 && row[sysIdx] && row[diaIdx]) {
      const systolic = parseInt(row[sysIdx], 10);
      const diastolic = parseInt(row[diaIdx], 10);
      const pulse = pulseIdx !== -1 && row[pulseIdx] ? parseInt(row[pulseIdx], 10) : 80;

      if (!isNaN(systolic) && !isNaN(diastolic)) {
        bpLogs.push({
          systolic,
          diastolic,
          pulse: isNaN(pulse) ? 80 : pulse,
          logged_at: loggedAt,
          notes
        });
      }
    }

    // If looks like Weight log
    if (weightIdx !== -1 && row[weightIdx]) {
      // Replace comma with dot for Indonesian floating numbers (e.g. "72,5" -> "72.5")
      const rawWeightStr = row[weightIdx].replace(/,/g, '.');
      const weight = parseFloat(rawWeightStr);

      if (!isNaN(weight) && weight > 0) {
        weightLogs.push({
          weight,
          logged_at: loggedAt,
          notes
        });
      }
    }
  }

  return {
    bp: bpLogs,
    weight: weightLogs
  };
}
