import Papa from 'papaparse';
import { localDateKey } from '@/lib/currency';
import type { Session, SessionItem, Expense, Activity, MonthlyRate } from '@/types/database';

function download(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // revogar no mesmo tick pode cancelar o download em alguns navegadores
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportSessionsCsv(sessions: (Session & { activityName: string })[]) {
  const rows = sessions.map((s) => ({
    data: localDateKey(s.started_at),
    atividade: s.activityName,
    minutos: s.duration_min,
    profit_gold: s.profit_gold,
    service_tc: s.service_tc,
    notas: s.notes ?? '',
  }));
  // Excel pt-BR: separador ";" e BOM UTF-8, senão tudo cai numa coluna e os acentos quebram
  const csv = Papa.unparse(rows, { delimiter: ';' });
  download('sessions.csv', String.fromCharCode(0xfeff) + csv,'text/csv;charset=utf-8');
}

export async function exportFullXlsx(data: {
  sessions: Session[];
  items: SessionItem[];
  expenses: Expense[];
  activities: Activity[];
  rates: MonthlyRate[];
}) {
  const XLSX = await import('xlsx'); // ~400 kB, só baixa quando exporta
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.sessions), 'sessions');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.items), 'items');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.expenses), 'expenses');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.activities), 'activities');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.rates), 'monthly_rates');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  download(
    'tibia-tracker-export.xlsx',
    buf,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
}

export function exportBackupJson(data: unknown) {
  download('tibia-tracker-backup.json', JSON.stringify(data, null, 2), 'application/json');
}
