import React from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronRight, CircleDollarSign, MoreHorizontal, Plus, Target, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency, formatDate, goalStatus, monthRange, toLocalDate, totalsFor } from '../utils/finance.js';

const colors = { income: '#16a875', expense: '#ef5b5b' };

export default function Dashboard({ data, totals }) {
  const range = monthRange();
  const monthTotals = totalsFor(data.transactions, range.start, range.end);
  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - index));
    const key = toLocalDate(date);
    const day = totalsFor(data.transactions, key, key);
    return { label: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date), income: day.income, expense: day.expense };
  });
  const savingRate = totals.income ? Math.round((totals.allocated / totals.income) * 100) : 0;
  const cards = [
    { label: 'Total saldo', value: totals.balance, icon: Wallet, tone: 'navy', note: 'Saldo awal + arus kas' },
    { label: 'Total pemasukan', value: totals.income, icon: ArrowDownLeft, tone: 'green', note: 'Semua pemasukan tercatat' },
    { label: 'Total pengeluaran', value: totals.expense, icon: ArrowUpRight, tone: 'red', note: 'Semua pengeluaran tercatat' },
    { label: 'Dana tersedia', value: totals.available, icon: CircleDollarSign, tone: 'blue', note: `${formatCurrency(totals.allocated)} dialokasikan` },
  ];
  return (
    <div className="dashboard-grid">
      <section className="summary-grid">
        {cards.map(({ label, value, icon: Icon, tone, note }) => <article className="summary-card" key={label}><div className="summary-top"><div className={`summary-icon ${tone}`}><Icon size={19} /></div><button className="icon-button subtle-button" aria-label="Info"><MoreHorizontal size={19} /></button></div><div className="summary-label">{label}</div><div className="summary-value">{formatCurrency(value)}</div><div className="summary-note"><span className={`note-dot ${tone}`} />{note}</div></article>)}
      </section>
      <section className="panel chart-panel">
        <div className="panel-heading"><div><h2>Arus kas</h2><p>Perbandingan pemasukan dan pengeluaran • 7 hari terakhir</p></div><button className="select-chip"><CalendarDays size={14} /> 7 hari terakhir</button></div>
        <div className="chart-legend"><span><i className="legend-dot income-dot" /> Pemasukan</span><span><i className="legend-dot expense-dot" /> Pengeluaran</span></div>
        <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#18a874" stopOpacity={0.17} /><stop offset="100%" stopColor="#18a874" stopOpacity={0} /></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef5b5b" stopOpacity={0.13} /><stop offset="100%" stopColor="#ef5b5b" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#edf0f4" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8b95a5', fontSize: 12 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b95a5', fontSize: 11 }} tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`} width={42} /><Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ border: '1px solid #e8ebf0', borderRadius: 12, fontSize: 12 }} /><Area type="monotone" dataKey="income" name="Pemasukan" stroke={colors.income} strokeWidth={2.5} fill="url(#incomeFill)" /><Area type="monotone" dataKey="expense" name="Pengeluaran" stroke={colors.expense} strokeWidth={2.5} fill="url(#expenseFill)" /></AreaChart></ResponsiveContainer></div>
      </section>
      <section className="panel month-panel"><div className="panel-heading"><div><h2>Ringkasan bulan ini</h2><p>Performa keuangan bulan berjalan</p></div><span className="month-badge">Bulan ini</span></div><div className="month-cashflow"><div className="cashflow-line"><span>Arus kas bersih</span><strong className={monthTotals.income - monthTotals.expense >= 0 ? 'text-green' : 'text-red'}>{formatCurrency(monthTotals.income - monthTotals.expense)}</strong></div><div className="cashflow-progress"><div className="progress-label"><span>Uang berhasil disimpan</span><strong>{savingRate}%</strong></div><div className="progress-track"><div className="progress-fill green-fill" style={{ width: `${Math.min(100, savingRate)}%` }} /></div><small>Dana yang dialokasikan ke target dari total pemasukan.</small></div><div className="month-stats"><div><span>Pemasukan</span><strong className="text-green">{formatCurrency(monthTotals.income)}</strong></div><div><span>Pengeluaran</span><strong className="text-red">{formatCurrency(monthTotals.expense)}</strong></div></div></div><Link className="panel-footer-link" to="/reports">Lihat laporan lengkap <ChevronRight size={16} /></Link></section>
      <section className="panel transactions-panel"><div className="panel-heading"><div><h2>Transaksi terbaru</h2><p>Aktivitas keuangan terakhir</p></div><Link className="text-link" to="/transactions">Lihat semua <ChevronRight size={16} /></Link></div>{data.transactions.length ? <div className="transaction-list">{[...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((transaction) => <div className="transaction-row" key={transaction.id}><div className={`transaction-icon ${transaction.type}`}><span>{transaction.type === 'income' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span></div><div className="transaction-description"><strong>{transaction.description || transaction.category}</strong><span>{transaction.category} <i>•</i> {formatDate(transaction.date)}</span></div><strong className={`transaction-amount ${transaction.type}`}>{transaction.type === 'income' ? '+' : '−'}{formatCurrency(transaction.amount)}</strong></div>)}</div> : <div className="empty-state compact-empty"><div className="empty-icon"><Wallet size={21} /></div><strong>Belum ada transaksi</strong><p>Mulai catat pemasukan atau pengeluaranmu.</p><Link className="button button-secondary" to="/income"><Plus size={16} /> Tambah transaksi</Link></div>}</section>
      <section className="panel goals-panel"><div className="panel-heading"><div><h2>Target tabungan</h2><p>Terus bergerak menuju impianmu</p></div><Link className="icon-button add-icon-button" to="/goals" aria-label="Lihat target"><ChevronRight size={18} /></Link></div>{data.goals.length ? <div className="goal-preview-list">{data.goals.slice(0, 3).map((goal) => { const progress = Math.min(100, Math.round((goal.saved / goal.target) * 100)); return <div className="goal-preview" key={goal.id}><div className="goal-preview-head"><div className="goal-mini-icon"><Target size={16} /></div><div className="goal-preview-name"><strong>{goal.name}</strong><span>{goalStatus(goal)}</span></div><strong className="goal-percentage">{progress}%</strong></div><div className="progress-track"><div className="progress-fill blue-fill" style={{ width: `${progress}%` }} /></div><div className="goal-preview-values"><span>{formatCurrency(goal.saved, true)} terkumpul</span><span>{formatCurrency(goal.target, true)}</span></div></div>; })}</div> : <div className="empty-state compact-empty"><p>Belum ada target tabungan.</p><Link to="/goals" className="text-link">Buat target <ChevronRight size={15} /></Link></div>}<Link className="panel-footer-link" to="/goals">Kelola semua target <ChevronRight size={16} /></Link></section>
    </div>
  );
}
