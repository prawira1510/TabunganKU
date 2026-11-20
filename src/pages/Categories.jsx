import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, Edit2, HeartPulse, House, Plus, ShoppingBag, Tags, Trash2, Utensils, CarFront } from 'lucide-react';
import Modal from '../components/Modal.jsx';

const blankCategory = (type) => ({ name: '', type, color: type === 'income' ? '#18a874' : '#4685ed', icon: 'circle' });
const icons = { circle: Tags, briefcase: BriefcaseBusiness, food: Utensils, transport: CarFront, home: House, health: HeartPulse, shopping: ShoppingBag };

export default function Categories({ data, addCategory, updateCategory, deleteCategory, toast }) {
  const [type, setType] = useState('expense');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankCategory(type));
  const [submitting, setSubmitting] = useState(false);
  const categoryList = data.categories.filter((item) => item.type === type);
  const openForm = (item) => { setEditing(item || null); setForm(item ? { ...item } : blankCategory(type)); setModal(true); };
  const submit = (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!form.name.trim()) return toast('Nama kategori wajib diisi.');
    const duplicate = data.categories.some((item) => item.type === form.type && item.name.toLowerCase() === form.name.trim().toLowerCase() && item.id !== editing?.id);
    if (duplicate) return toast('Kategori dengan nama tersebut sudah ada.');
    setSubmitting(true);
    const normalized = { ...form, name: form.name.trim() };
    editing ? updateCategory(normalized) : addCategory(normalized);
    setModal(false); setSubmitting(false); toast(editing ? 'Kategori berhasil diperbarui.' : 'Kategori berhasil ditambahkan.');
  };
  const remove = (item) => {
    const usage = data.transactions.filter((transaction) => transaction.category === item.name).length;
    if (usage) return toast(`Kategori ini digunakan oleh ${usage} transaksi. Ubah transaksi terkait sebelum menghapus kategori.`);
    if (window.confirm(`Hapus kategori "${item.name}"?`)) { deleteCategory(item.id); toast('Kategori berhasil dihapus.'); }
  };
  const switchType = (next) => { setType(next); setForm(blankCategory(next)); };
  return (
    <>
      <section className="panel categories-panel">
        <div className="categories-heading"><div><div className="eyebrow">PENGELOLAAN KATEGORI</div><h2>Atur kategori transaksi</h2><p>Gunakan kategori untuk memahami ke mana uangmu pergi.</p></div><button className="button button-primary" onClick={() => openForm()}><Plus size={17} /> Tambah kategori</button></div>
        <div className="category-tabs"><button className={type === 'expense' ? 'active' : ''} onClick={() => switchType('expense')}><ArrowUpRight size={16} /> Pengeluaran <span>{data.categories.filter((item) => item.type === 'expense').length}</span></button><button className={type === 'income' ? 'active' : ''} onClick={() => switchType('income')}><ArrowDownLeft size={16} /> Pemasukan <span>{data.categories.filter((item) => item.type === 'income').length}</span></button></div>
        <div className="category-grid">{categoryList.map((item) => { const Icon = icons[item.icon] || Tags; return <article className="category-card" key={item.id}><div className="category-symbol" style={{ color: item.color, background: `${item.color}16` }}><Icon size={18} /></div><div className="category-card-text"><strong>{item.name}</strong><span>{item.type === 'income' ? 'Kategori pemasukan' : 'Kategori pengeluaran'}</span></div><span className="category-color-dot" style={{ background: item.color }} /><div className="category-actions"><button className="icon-button" title="Edit kategori" onClick={() => openForm(item)}><Edit2 size={15} /></button><button className="icon-button danger-hover" title="Hapus kategori" onClick={() => remove(item)}><Trash2 size={15} /></button></div></article>; })}</div>
        {!categoryList.length && <div className="empty-state table-empty"><div className="empty-icon"><Tags size={22} /></div><strong>Belum ada kategori</strong><p>Tambahkan kategori untuk pencatatan yang lebih rapi.</p></div>}
        <div className="category-footnote">Kategori yang masih digunakan oleh transaksi tidak dapat dihapus. Ikon dan warna kategori membantu membedakan aktivitas dengan cepat.</div>
      </section>
      {modal && <Modal title={editing ? 'Edit kategori' : 'Tambah kategori'} onClose={() => setModal(false)}><form className="form-grid" onSubmit={submit}>
        <label className="field full-field">Nama kategori<input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Transportasi" required /></label>
        <label className="field">Jenis kategori<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></label>
        <label className="field">Warna kategori<div className="color-field"><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /><span>{form.color}</span></div></label>
        <label className="field full-field">Ikon<select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}><option value="circle">Umum</option><option value="briefcase">Pekerjaan</option><option value="food">Makanan</option><option value="transport">Transportasi</option><option value="home">Rumah</option><option value="health">Kesehatan</option><option value="shopping">Belanja</option></select></label>
        <div className="form-actions full-field"><button type="button" className="button button-secondary" onClick={() => setModal(false)}>Batal</button><button className="button button-primary" disabled={submitting}>{editing ? 'Simpan perubahan' : 'Tambah kategori'}</button></div>
      </form></Modal>}
    </>
  );
}
