import React, { useMemo, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Edit2, Eye, FileText, Plus, Search, Trash2, Wallet } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import { formatCurrency, formatDate, today } from '../utils/finance.js';

const blankTransaction = (type) => ({ type, amount: '', date: today(), category: '', description: '', source: '', payment: '', note: '' });

export default function Transactions({ data, addTransaction, updateTransaction, deleteTransaction, forcedType, toast }) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(blankTransaction(forcedType || 'income'));
  const [typeFilter, setTypeFilter] = useState(forcedType || 'all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('newest');
  const [submitting, setSubmitting] = useState(false);
  const lastSubmission = useRef(null);
  const isDedicated = Boolean(forcedType);

  const rows = useMemo(() => data.transactions.filter((item) => (!forcedType || item.type === forcedType) && (typeFilter === 'all' || item.type === typeFilter) && (!categoryFilter || item.category === categoryFilter) && (!from || item.date >= from) && (!to || item.date <= to) && (!search || `${item.description} ${item.category} ${item.source || ''}`.toLowerCase().includes(search.toLowerCase()))).sort((a, b) => sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)), [data.transactions, forcedType, typeFilter, categoryFilter, from, to, search, sort]);
  const openForm = (item = null) => { setEditing(item); setForm(item ? { ...item } : blankTransaction(forcedType || 'income')); setModal(true); };
  const submit = (event) => {
    event.preventDefault();
    if (submitting) return;
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return toast('Nominal transaksi harus lebih dari Rp0.');
    if (!form.category) return toast('Pilih kategori transaksi.');
    const signature = JSON.stringify([form.type, amount, form.date, form.category, form.description.trim(), form.source, form.payment]);
    if (!editing && lastSubmission.current?.signature === signature && Date.now() - lastSubmission.current.time < 1500) return toast('Transaksi ini baru saja disimpan.');
    lastSubmission.current = { signature, time: Date.now() };
    setSubmitting(true);
    const normalized = { ...form, amount, description: form.description.trim() };
    editing ? updateTransaction(normalized) : addTransaction(normalized);
    toast(editing ? 'Transaksi berhasil diperbarui.' : 'Transaksi berhasil dicatat.');
    setModal(false); setSubmitting(false);
  };
  const remove = (item) => {
    if (window.confirm(`Hapus transaksi "${item.description || item.category}" sebesar ${formatCurrency(item.amount)}?`)) {
      deleteTransaction(item.id); toast('Transaksi berhasil dihapus.');
    }
  };
  const categories = data.categories.filter((item) => !forcedType || item.type === forcedType);
  const filteredCategories = categories.filter((item) => item.type === form.type);
  const pageType = forcedType === 'income' ? 'Pemasukan' : forcedType === 'expense' ? 'Pengeluaran' : 'Transaksi';
  return (
    <>
      <section className="panel transactions-page-panel">
        <div className="transaction-toolbar">
          <div className="transaction-title"><div className={`transaction-title-icon ${forcedType || 'all'}`}>{forcedType === 'expense' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}</div><div><strong>{pageType}</strong><span>{rows.length} transaksi ditemukan</span></div></div>
          <button className="button button-primary" onClick={() => openForm()}><Plus size={17} /> Catat {forcedType === 'expense' ? 'pengeluaran' : forcedType === 'income' ? 'pemasukan' : 'transaksi'}</button>
        </div>
        <div className="filters-row">
          {!isDedicated && <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="all">Semua jenis</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select>}
          <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">Semua kategori</option>{categories.map((item) => <option key={item.id}>{item.name}</option>)}</select>
          <label className="date-filter"><CalendarDays size={15} /><input type="date" aria-label="Tanggal mulai" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="date-filter"><span>s/d</span><input type="date" aria-label="Tanggal akhir" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <div className="filter-search"><Search size={16} /><input placeholder="Cari transaksi..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select className="filter-select sort-select" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Terbaru</option><option value="oldest">Terlama</option></select>
        </div>
        <div className="transactions-table-wrap">
          <table className="transactions-table"><thead><tr><th>Transaksi</th><th>Kategori</th><th>Tanggal</th><th>Jenis</th><th className="align-right">Nominal</th><th></th></tr></thead><tbody>
            {rows.map((item) => <tr key={item.id}><td><div className="table-transaction"><div className={`table-transaction-icon ${item.type}`}>{item.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</div><div><strong>{item.description || item.category}</strong><span>{item.source || item.payment || '—'}</span></div></div></td><td><span className="category-chip"><i style={{ background: data.categories.find((category) => category.name === item.category)?.color || '#8390a3' }} />{item.category}</span></td><td className="table-date">{formatDate(item.date)}</td><td><span className={`type-label ${item.type}`}>{item.type === 'income' ? 'Masuk' : 'Keluar'}</span></td><td className={`align-right table-amount ${item.type}`}>{item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}</td><td><div className="row-actions"><button className="icon-button" title="Detail transaksi" aria-label="Detail transaksi" onClick={() => setDetail(item)}><Eye size={15} /></button><button className="icon-button" title="Edit transaksi" aria-label="Edit transaksi" onClick={() => openForm(item)}><Edit2 size={15} /></button><button className="icon-button danger-hover" title="Hapus transaksi" aria-label="Hapus transaksi" onClick={() => remove(item)}><Trash2 size={15} /></button></div></td></tr>)}
          </tbody></table>
          {!rows.length && <div className="empty-state table-empty"><div className="empty-icon"><FileText size={23} /></div><strong>{data.transactions.length ? 'Transaksi tidak ditemukan' : 'Belum ada transaksi'}</strong><p>{data.transactions.length ? 'Coba ubah filter atau kata kunci pencarian.' : 'Transaksi yang kamu catat akan muncul di sini.'}</p>{!data.transactions.length && <button className="button button-primary" onClick={() => openForm()}><Plus size={16} /> Catat transaksi</button>}</div>}
        </div>
      </section>
      <div className="inline-note"><Wallet size={16} /> Saldo dan laporan akan diperbarui otomatis setelah transaksi disimpan.</div>
      {modal && <Modal title={editing ? 'Edit transaksi' : `Catat ${form.type === 'income' ? 'pemasukan' : 'pengeluaran'}`} onClose={() => setModal(false)}>
        <form className="form-grid" onSubmit={submit}>
          {!forcedType && <label className="field full-field">Jenis transaksi<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: '' })}><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></label>}
          <label className="field full-field">Nominal (Rp)<input autoFocus type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" required /></label>
          <label className="field">Tanggal<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
          <label className="field">Kategori<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required><option value="">Pilih kategori</option>{filteredCategories.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
          <label className="field full-field">Deskripsi<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Contoh: Gaji bulanan" /></label>
          <label className="field full-field">{form.type === 'income' ? 'Sumber pemasukan' : 'Metode pembayaran'}<input value={form.type === 'income' ? form.source : form.payment} onChange={(e) => setForm({ ...form, [form.type === 'income' ? 'source' : 'payment']: e.target.value })} placeholder={form.type === 'income' ? 'Contoh: Kantor' : 'Contoh: Transfer, tunai'} /></label>
          {form.type === 'expense' && <label className="field full-field">Catatan tambahan<textarea rows="2" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>}
          <div className="form-hint full-field">Transaksi yang sama tidak digandakan saat tombol simpan diklik berulang.</div>
          <div className="form-actions full-field"><button type="button" className="button button-secondary" onClick={() => setModal(false)}>Batal</button><button className="button button-primary" disabled={submitting}>{editing ? 'Simpan perubahan' : 'Simpan transaksi'}</button></div>
        </form>
      </Modal>}
      {detail && <Modal title="Detail transaksi" onClose={() => setDetail(null)}>
        <div className="transaction-detail-top"><div className={`table-transaction-icon ${detail.type}`}>{detail.type === 'income' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</div><div><span className={`type-label ${detail.type}`}>{detail.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span><strong className={`detail-amount ${detail.type}`}>{detail.type === 'income' ? '+' : '−'}{formatCurrency(detail.amount)}</strong></div></div>
        <div className="detail-grid"><div><span>Tanggal</span><strong>{formatDate(detail.date)}</strong></div><div><span>Kategori</span><strong>{detail.category}</strong></div><div><span>Deskripsi</span><strong>{detail.description || '—'}</strong></div><div><span>{detail.type === 'income' ? 'Sumber pemasukan' : 'Metode pembayaran'}</span><strong>{detail.type === 'income' ? detail.source || '—' : detail.payment || '—'}</strong></div>{detail.type === 'expense' && <div className="detail-full"><span>Catatan tambahan</span><strong>{detail.note || '—'}</strong></div>}</div>
        <div className="form-actions"><button className="button button-secondary" onClick={() => setDetail(null)}>Tutup</button><button className="button button-primary" onClick={() => { setDetail(null); openForm(detail); }}><Edit2 size={15} /> Edit transaksi</button></div>
      </Modal>}
    </>
  );
}
