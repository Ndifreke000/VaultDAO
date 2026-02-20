/**
 * Export analytics data as CSV and charts as images.
 */
import type { AggregatedAnalytics } from '../types/analytics';

// Define internal interfaces to match the analytics data structure
interface LocalProposalTrend {
  date: string;
  created: number;
  approved: number;
  executed: number;
}

interface LocalSpendingByToken {
  name: string;
  value: number;
  count?: number;
}

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportAnalyticsToCsv(analytics: AggregatedAnalytics, filename = 'vault-analytics.csv'): void {
  const rows: string[][] = [];

  rows.push(['Proposal trends', '']);
  rows.push(['Date', 'Created', 'Approved', 'Executed']);
  
  // Cast via unknown to local interface to satisfy linter and ensure type safety
  (analytics.proposalTrends as unknown as LocalProposalTrend[]).forEach((p) => {
    rows.push([p.date, String(p.created), String(p.approved), String(p.executed)]);
  });
  rows.push([]);

  rows.push(['Spending by token', '']);
  rows.push(['Token', 'Value', 'Count']);
  
  (analytics.spendingByToken as unknown as LocalSpendingByToken[]).forEach((s) => {
    rows.push([s.name, String(s.value), String(s.count ?? 0)]);
  });
  rows.push([]);

  rows.push(['Stats', '']);
  rows.push(['Approval rate (%)', String(analytics.approvalRate)]);
  rows.push(['Average approval time (hours)', String(analytics.averageApprovalTimeHours)]);
  rows.push(['Most active signer', analytics.mostActiveSigner]);
  rows.push(['Top recipient', analytics.topRecipient]);
  rows.push(['Total volume', String(analytics.totalVolume)]);
  rows.push(['Pending proposals', String(analytics.pendingCount)]);

  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export a chart container element as PNG.
 */
export function exportChartAsImage(containerEl: HTMLElement | null, filename = 'chart.png'): void {
  if (!containerEl) return;
  import('html2canvas').then(({ default: html2canvas }) => {
    html2canvas(containerEl, { useCORS: true, scale: 2 }).then((canvas: HTMLCanvasElement) => {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    });
  }).catch(() => {
    console.warn('html2canvas not available; install it to export charts as images.');
  });
}