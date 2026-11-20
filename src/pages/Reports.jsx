import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Coins, FileSpreadsheet, FileText, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { jsPDF } from 'jspdf';
import { strToU8, zipSync } from 'fflate';
import { formatCurrency, formatDate, monthRange, today, toLocalDate, totalsFor } from '../utils/finance.js';

const COLORS = ['#18a874', '#4685ed', '#f59e0b', '#ef5b5b', '#8b5cf6', '#14b8a6', '#ec4899', '#8793a7'];
const currentMonth = today().slice(0, 7);
const periodFor = (period, selected) => {
  const date = new Date(`${selected}-01T00:00:00`);
  if (period === 'daily') return { start: selected, end: selected };
  if (period === 'weekly') {
    const now = new Date(`${selected}T00:00:00`);
    const weekday = (now.getDay() + 6) % 7;
    const monday = new Date(now); monday.setDate(now.getDate() - weekday);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    return { start: toLocalDate(monday), end: toLocalDate(sunday) };
  }
  if (period === 'yearly') return { start: `${selected}-01-01`, end: `${selected}-12-31` };
  const range = monthRange(date);
  return range;
};

export default function Reports({ data, totals, toast }) {
  const [period, setPeriod] = useState('monthly');
  const [selected, setSelected] = useState(currentMonth);
  const selection = selected;
  const range = useMemo(() => periodFor(period, selection), [period, selection]);
  const summary = totalsFor(data.transactions, range.start, range.end);
  const net = summary.income - summary.expense;
  const savingsRate = summary.income ? Math.round((totals.allocated / summary.income) * 100) : 0;
  const inRange = data.transactions.filter((item) => item.date >= range.start && item.date <= range.end);
  const categorySums = (type) => Object.entries(inRange.filter((item) => item.type === type).reduce((acc, item) => { acc[item.category] = (acc[item.category] || 0) + Number(item.amount); return acc; }, {})).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  const expenseCategories = categorySums('expense');
  const incomeCategories = categorySums('income');
  const downloadReport = (blob, filename, format) => {
    let url;
    try {
      url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = filename; link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(`Unduhan ${format} laporan dimulai.`);
    } catch (error) {
      if (url) URL.revokeObjectURL(url);
      console.error(`Gagal mengekspor laporan ${format}:`, error);
      toast(`Gagal mengekspor laporan ${format}: ${error.message}`);
    }
  };
  const trend = useMemo(() => {
    const count = period === 'yearly' ? 12 : period === 'weekly' ? 7 : period === 'monthly' ? 6 : 1;
    return Array.from({ length: count }, (_, index) => {
      let start;
      if (period === 'yearly') start = new Date(Number(selection), index, 1);
      else if (period === 'weekly') { start = new Date(`${range.start}T00:00:00`); start.setDate(start.getDate() + index); }
      else if (period === 'monthly') { const monthBase = new Date(`${selection}-01T00:00:00`); start = new Date(monthBase.getFullYear(), monthBase.getMonth() - (count - 1 - index), 1); }
      else start = new Date(`${range.start}T00:00:00`);
      const startString = toLocalDate(start);
      let end;
      if (period === 'yearly') end = toLocalDate(new Date(start.getFullYear(), start.getMonth() + 1, 0));
      else if (period === 'weekly') end = startString;
      else if (period === 'monthly') end = toLocalDate(new Date(start.getFullYear(), start.getMonth() + 1, 0));
      else end = startString;
      const amount = totalsFor(data.transactions, startString, end);
      return { label: period === 'yearly' ? new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(start) : period === 'weekly' ? new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(start) : period === 'monthly' ? new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(start) : 'Hari ini', ...amount, net: amount.income - amount.expense };
    });
  }, [data.transactions, period, selection, range.start]);
  const exportExcel = () => {
    const rows = inRange.map((item) => ({ Tanggal: item.date, Jenis: item.type === 'income' ? 'Pemasukan' : 'Pengeluaran', Kategori: item.category, Deskripsi: item.description || '', Nominal: Number(item.amount) }));
    const escapeXml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
    const columnName = (column) => {
      let name = '';
      for (let value = column + 1; value > 0; value = Math.floor((value - 1) / 26)) name = String.fromCharCode(65 + ((value - 1) % 26)) + name;
      return name;
    };
    const makeWorksheet = (tableRows, numericColumns) => {
      const sheetRows = tableRows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => {
        const address = `${columnName(columnIndex)}${rowIndex + 1}`;
        if (rowIndex > 0 && numericColumns.includes(columnIndex)) return `<c r="${address}"><v>${Number(value) || 0}</v></c>`;
        return `<c r="${address}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
      }).join('')}</row>`).join('');
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`;
    };
    const summaryRows = [['Ringkasan', 'Nilai'], ['Pemasukan', summary.income], ['Pengeluaran', summary.expense], ['Arus kas bersih', net], ['Saldo tabungan dialokasikan', totals.allocated], ['Persentase tabungan', savingsRate], ['Periode mulai', range.start], ['Periode akhir', range.end]];
    const transactionRows = [['Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Nominal'], ...rows.map((row) => [row.Tanggal, row.Jenis, row.Kategori, row.Deskripsi, row.Nominal])];
    const workbookXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Ringkasan" sheetId="1" r:id="rId1"/><sheet name="Transaksi" sheetId="2" r:id="rId2"/></sheets></workbook>';
    const files = {
      '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
      '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
      'xl/workbook.xml': strToU8(workbookXml),
      'xl/_rels/workbook.xml.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>'),
      'xl/worksheets/sheet1.xml': strToU8(makeWorksheet(summaryRows, [1])),
      'xl/worksheets/sheet2.xml': strToU8(makeWorksheet(transactionRows, [4])),
    };
    const workbook = zipSync(files, { level: 6 });
    downloadReport(new Blob([workbook], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `laporan-mysavings-${range.start}.xlsx`, 'Excel');
  };
  const exportPdf = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const left = 14;
    const right = pageWidth - 14;
    const columns = { date: 14, type: 43, category: 66, description: 101, amount: right };
    const drawHeader = (continued = false) => {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15);
      pdf.text(continued ? 'Laporan Keuangan MySavings (lanjutan)' : 'Laporan Keuangan MySavings', left, 17);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
      pdf.text(`Periode: ${formatDate(range.start)} - ${formatDate(range.end)}`, left, 24);
      if (!continued) {
        pdf.text(`Pemasukan: ${formatCurrency(summary.income)}     Pengeluaran: ${formatCurrency(summary.expense)}     Arus kas bersih: ${formatCurrency(net)}`, left, 31);
        pdf.text(`Tabungan dialokasikan: ${formatCurrency(totals.allocated)}     Tingkat tabungan: ${savingsRate}%`, left, 37);
      }
      const headerY = continued ? 29 : 46;
      pdf.setFillColor(239, 244, 250); pdf.rect(left, headerY - 5, right - left, 8, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
      pdf.text('Tanggal', columns.date, headerY);
      pdf.text('Jenis', columns.type, headerY);
      pdf.text('Kategori', columns.category, headerY);
      pdf.text('Deskripsi', columns.description, headerY);
      pdf.text('Nominal (Rp)', right, headerY, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      return headerY + 7;
    };
    let y = drawHeader();
    inRange.forEach((item) => {
      const categoryLines = pdf.splitTextToSize(item.category || '—', 31);
      const descriptionLines = pdf.splitTextToSize(item.description || '—', 67);
      const lineCount = Math.max(categoryLines.length, descriptionLines.length, 1);
      const rowHeight = lineCount * 4 + 3;
      if (y + rowHeight > pageHeight - 14) {
        pdf.addPage();
        y = drawHeader(true);
      }
      pdf.setFontSize(7.5);
      pdf.text(formatDate(item.date), columns.date, y);
      pdf.text(item.type === 'income' ? 'Masuk' : 'Keluar', columns.type, y);
      pdf.text(categoryLines, columns.category, y);
      pdf.text(descriptionLines, columns.description, y);
      pdf.text(formatCurrency(item.amount).replace(/^Rp\s?/, ''), right, y, { align: 'right' });
      pdf.setDrawColor(235, 239, 243); pdf.line(left, y + rowHeight - 2, right, y + rowHeight - 2);
      y += rowHeight;
    });
    if (!inRange.length) {
      pdf.setFontSize(9); pdf.text('Tidak ada transaksi pada periode ini.', left, y + 2);
    }
    downloadReport(pdf.output('blob'), `laporan-mysavings-${range.start}.pdf`, 'PDF');
  };
  const setPeriodValue = (nextPeriod) => { setPeriod(nextPeriod); setSelected(nextPeriod === 'yearly' ? new Date().getFullYear().toString() : nextPeriod === 'daily' || nextPeriod === 'weekly' ? today() : currentMonth); };
  const selectorType = period === 'yearly' ? 'number' : period === 'daily' || period === 'weekly' ? 'date' : 'month';

  return (
    <>
      <section className="panel report-filter-panel"><div className="report-period-tabs">{[['daily', 'Harian'], ['weekly', 'Mingguan'], ['monthly', 'Bulanan'], ['yearly', 'Tahunan']].map(([value, label]) => <button key={value} className={period === value ? 'active' : ''} onClick={() => setPeriodValue(value)}>{label}</button>)}</div>      <div className="report-filter-right"><label className="field-inline">Periode<input aria-label="Pilih periode" type={selectorType} value={selected} onChange={(e) => setSelected(e.target.value)} min={period === 'yearly' ? '2000' : undefined} max={period === 'yearly' ? '2100' : undefined} /></label><button className="button button-secondary export-button" onClick={exportExcel}><FileSpreadsheet size={16} /> Ekspor Excel</button><button className="button button-secondary export-button" onClick={exportPdf}><FileText size={16} /> Ekspor PDF</button></div></section>
      <section className="summary-grid report-summary">
        <article className="summary-card"><div className="summary-top"><div className="summary-icon green"><ArrowDownLeft size={19} /></div><span className="report-mini-label">PEMASUKAN</span></div><div className="summary-value">{formatCurrency(summary.income)}</div><div className="summary-note">Total uang masuk pada periode ini</div></article>
        <article className="summary-card"><div className="summary-top"><div className="summary-icon red"><ArrowUpRight size={19} /></div><span className="report-mini-label">PENGELUARAN</span></div><div className="summary-value">{formatCurrency(summary.expense)}</div><div className="summary-note">Total uang keluar pada periode ini</div></article>
        <article className="summary-card"><div className="summary-top"><div className={`summary-icon ${net >= 0 ? 'blue' : 'red'}`}><TrendingUp size={19} /></div><span className="report-mini-label">ARUS KAS BERSIH</span></div><div className={`summary-value ${net >= 0 ? 'text-green' : 'text-red'}`}>{formatCurrency(net)}</div><div className="summary-note">Pemasukan dikurangi pengeluaran</div></article>
        <article className="summary-card"><div className="summary-top"><div className="summary-icon green"><Coins size={19} /></div><span className="report-mini-label">TOTAL TABUNGAN</span></div><div className="summary-value">{formatCurrency(totals.allocated)}</div><div className="summary-note">Akumulasi alokasi ke target</div></article>
        <article className="summary-card"><div className="summary-top"><div className="summary-icon purple"><FileText size={19} /></div><span className="report-mini-label">TINGKAT TABUNGAN</span></div><div className="summary-value">{savingsRate}%</div><div className="summary-note">Tabungan saat ini dibanding pemasukan periode</div></article>
      </section>
      <div className="reports-grid">
        <section className="panel report-chart-panel"><div className="panel-heading"><div><h2>Tren keuangan</h2><p>Perbandingan uang masuk dan keluar</p></div></div><div className="report-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={trend} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}><CartesianGrid stroke="#edf0f4" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8b95a5', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b95a5', fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} width={42} /><Tooltip formatter={(v) => formatCurrency(v)} /><Legend /><Bar dataKey="income" name="Pemasukan" fill="#18a874" radius={[4, 4, 0, 0]} maxBarSize={24} /><Bar dataKey="expense" name="Pengeluaran" fill="#ef5b5b" radius={[4, 4, 0, 0]} maxBarSize={24} /><Line type="monotone" dataKey="net" name="Arus kas bersih" stroke="#4685ed" strokeWidth={2} dot={false} /></ComposedChart></ResponsiveContainer></div></section>
        <section className="panel report-chart-panel category-report"><div className="panel-heading"><div><h2>Komposisi pengeluaran</h2><p>Kategori pengeluaran terbesar</p></div></div>{expenseCategories.length ? <><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={expenseCategories} dataKey="amount" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3}>{expenseCategories.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(value)} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{formatCurrency(summary.expense, true)}</strong><span>total keluar</span></div></div><div className="category-legend">{expenseCategories.slice(0, 4).map((item, index) => <div key={item.name}><span><i style={{ background: COLORS[index % COLORS.length] }} />{item.name}</span><strong>{formatCurrency(item.amount, true)}</strong></div>)}</div></> : <div className="empty-chart">Belum ada data pengeluaran pada periode ini.</div>}</section>
        <section className="panel report-chart-panel annual-trend"><div className="panel-heading"><div><h2>Perkembangan arus kas</h2><p>Tren saldo bersih selama periode yang dipilih</p></div></div><div className="report-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}><CartesianGrid stroke="#edf0f4" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8b95a5', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b95a5', fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} width={42} /><Tooltip formatter={(v) => formatCurrency(v)} /><Line type="monotone" dataKey="net" name="Arus kas bersih" stroke="#4685ed" strokeWidth={3} dot={{ r: 3, fill: '#4685ed' }} /></LineChart></ResponsiveContainer></div></section>
        <section className="panel report-insights"><div className="panel-heading"><div><h2>Analisis keuangan</h2><p>Ringkasan dari transaksi di periode ini</p></div></div><div className="insight-row"><div className="insight-icon red"><ArrowUpRight size={17} /></div><div><span>Kategori pengeluaran terbesar</span><strong>{expenseCategories[0]?.name || 'Belum ada data'}</strong></div><b>{expenseCategories[0] ? formatCurrency(expenseCategories[0].amount) : '—'}</b></div><div className="insight-row"><div className="insight-icon green"><ArrowDownLeft size={17} /></div><div><span>Kategori pemasukan terbesar</span><strong>{incomeCategories[0]?.name || 'Belum ada data'}</strong></div><b>{incomeCategories[0] ? formatCurrency(incomeCategories[0].amount) : '—'}</b></div><div className="insight-row"><div className="insight-icon blue"><TrendingUp size={17} /></div><div><span>Pengeluaran dari pemasukan</span><strong>{summary.income ? Math.round((summary.expense / summary.income) * 100) : 0}%</strong></div><b>{summary.income ? 'Dari pemasukan' : 'Belum ada pemasukan'}</b></div><div className="insight-callout"><TrendingUp size={18} /><span>{net >= 0 ? 'Bagus! Arus kas periode ini positif.' : 'Pengeluaran lebih besar dari pemasukan. Evaluasi kembali anggaranmu.'}</span></div></section>
      </div>
    </>
  );
}
