import React, { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, CalendarDays, Check, CircleAlert, Edit2, Plus, Target, Trash2 } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import { formatCurrency, formatDate, goalStatus, remainingMonthly, today } from '../utils/finance.js';

const blankGoal = () => ({ name: '', description: '', target: '', saved: 0, startDate: today(), deadline: '', category: 'Pribadi' });

export default function Goals({ data, totals, addGoal, updateGoal, deleteGoal, toast }) {
  const [modal, setModal] = useState('');
  const [editing, setEditing] = useState(null);
  const [goal, setGoal] = useState(blankGoal());
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openNew = () => { setEditing(null); setGoal(blankGoal()); setModal('goal'); };
  const openEdit = (item) => { setEditing(item); setGoal({ ...item }); setModal('goal'); };
  const saveGoal = (event) => {
    event.preventDefault();
    if (submitting) return;
    const target = Number(goal.target);
    if (!goal.name.trim() || !Number.isFinite(target) || target <= 0 || Number(goal.saved) < 0 || Number(goal.saved) > target) return toast('Isi nama dan nominal target yang valid.');
    setSubmitting(true);
    const normalized = { ...goal, name: goal.name.trim(), target, saved: Number(goal.saved) || 0 };
    editing ? updateGoal(normalized) : addGoal(normalized);
    toast(editing ? 'Target berhasil diperbarui.' : 'Target tabungan berhasil dibuat.');
    setModal(''); setSubmitting(false);
  };
  const changeSaved = (item, direction) => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return toast('Nominal harus lebih dari Rp0.');
    if (direction === 'add' && value > totals.available) return toast('Dana tersedia tidak mencukupi untuk alokasi ini.');
    if (direction === 'remove' && value > item.saved) return toast('Nominal melebihi dana yang terkumpul.');
    updateGoal({ ...item, saved: item.saved + (direction === 'add' ? value : -value) });
    toast(direction === 'add' ? 'Dana berhasil dialokasikan ke target.' : 'Dana berhasil dikembalikan ke saldo tersedia.');
    setModal(''); setAmount('');
  };
  const remove = (item) => {
    if (window.confirm(`Hapus target "${item.name}"? Dana alokasi akan kembali ke saldo tersedia.`)) {
      deleteGoal(item.id); toast('Target berhasil dihapus.');
    }
  };
  const completeCount = data.goals.filter((item) => item.saved >= item.target).length;
  const runningCount = data.goals.length - completeCount;

  return (
    <>
      <div className="goal-summary-row">
        <div className="goal-summary-card"><div className="goal-summary-icon blue"><Target size={19} /></div><div><span>Total target aktif</span><strong>{runningCount} <small>target</small></strong></div></div>
        <div className="goal-summary-card"><div className="goal-summary-icon green"><ArrowDownToLine size={19} /></div><div><span>Total dana terkumpul</span><strong>{formatCurrency(totals.allocated)}</strong></div></div>
        <div className="goal-summary-card"><div className="goal-summary-icon purple"><Check size={19} /></div><div><span>Target tercapai</span><strong>{completeCount} <small>target</small></strong></div></div>
        <button className="button button-primary goal-create-button" onClick={openNew}><Plus size={17} /> Buat target baru</button>
      </div>
      {data.goals.length ? <div className="goals-grid">{data.goals.map((item) => {
        const progress = Math.min(100, Math.round((item.saved / item.target) * 100));
        const status = goalStatus(item);
        const near = progress >= 80 && progress < 100;
        return <article className="goal-card" key={item.id}>
          <div className="goal-card-top"><div className="goal-card-icon"><Target size={20} /></div><div className="goal-card-actions"><button className="icon-button" title="Edit target" onClick={() => openEdit(item)}><Edit2 size={16} /></button><button className="icon-button danger-hover" title="Hapus target" onClick={() => remove(item)}><Trash2 size={16} /></button></div></div>
          <div className="goal-category">{item.category}</div><h2>{item.name}</h2><p className="goal-description">{item.description || 'Tetap konsisten menabung untuk mencapai target ini.'}</p>
          <div className="goal-progress-section"><div className="goal-progress-line"><span>Progress</span><strong>{progress}%</strong></div><div className="progress-track goal-track"><div className={`progress-fill ${progress >= 100 ? 'green-fill' : 'blue-fill'}`} style={{ width: `${progress}%` }} /></div><div className="goal-money-line"><strong>{formatCurrency(item.saved)}</strong><span>dari {formatCurrency(item.target)}</span></div></div>
          <div className="goal-card-meta"><span><CalendarDays size={14} /> Tenggat {item.deadline ? formatDate(item.deadline) : 'Belum ditentukan'}</span><span className={`status-pill ${status === 'Tercapai' ? 'status-done' : status === 'Terlambat' ? 'status-late' : ''}`}>{status}</span></div>
          {near && <div className="goal-alert"><CircleAlert size={15} /> Sedikit lagi! Tinggal {formatCurrency(item.target - item.saved)} menuju target.</div>}
          {status !== 'Tercapai' && <div className="goal-estimate">Estimasi tabungan / bulan <strong>{formatCurrency(remainingMonthly(item))}</strong></div>}
          <div className="goal-card-buttons"><button className="button button-secondary" onClick={() => { setEditing(item); setAmount(''); setModal('remove'); }} disabled={!item.saved}><ArrowUpFromLine size={16} /> Ambil dana</button><button className="button button-primary" onClick={() => { setEditing(item); setAmount(''); setModal('add'); }}><Plus size={16} /> Tambah dana</button></div>
        </article>;
      })}</div> : <div className="panel empty-state page-empty"><div className="empty-icon"><Target size={24} /></div><h2>Belum ada target tabungan</h2><p>Tentukan tujuan finansial pertamamu, lalu pantau progresnya di sini.</p><button className="button button-primary" onClick={openNew}><Plus size={17} /> Buat target pertama</button></div>}
      {modal === 'goal' && <Modal title={editing ? 'Edit target tabungan' : 'Buat target baru'} onClose={() => setModal('')}>
        <form className="form-grid" onSubmit={saveGoal}>
          <label className="field full-field">Nama target<input autoFocus value={goal.name} onChange={(e) => setGoal({ ...goal, name: e.target.value })} placeholder="Contoh: Laptop baru" required /></label>
          <label className="field full-field">Deskripsi<textarea rows="2" value={goal.description} onChange={(e) => setGoal({ ...goal, description: e.target.value })} placeholder="Ceritakan tujuan menabungmu" /></label>
          <label className="field">Nominal target<input type="number" min="1" value={goal.target} onChange={(e) => setGoal({ ...goal, target: e.target.value })} placeholder="10.000.000" required /></label>
          <label className="field">Dana terkumpul<input type="text" value={formatCurrency(goal.saved || 0)} readOnly /></label>
          <label className="field">Tanggal mulai<input type="date" value={goal.startDate} onChange={(e) => setGoal({ ...goal, startDate: e.target.value })} /></label>
          <label className="field">Deadline<input type="date" value={goal.deadline} onChange={(e) => setGoal({ ...goal, deadline: e.target.value })} /></label>
          <label className="field full-field">Kategori<input value={goal.category} onChange={(e) => setGoal({ ...goal, category: e.target.value })} placeholder="Pribadi, teknologi, ..." /></label>
          <div className="form-hint full-field">{editing ? 'Gunakan Tambah dana atau Ambil dana pada kartu target untuk mengubah alokasi.' : 'Target baru dimulai dari Rp0. Dana merupakan alokasi dari saldo tersedia, bukan transaksi baru.'}</div>
          <div className="form-actions full-field"><button type="button" className="button button-secondary" onClick={() => setModal('')}>Batal</button><button className="button button-primary" disabled={submitting}>{editing ? 'Simpan perubahan' : 'Buat target'}</button></div>
        </form>
      </Modal>}
      {(modal === 'add' || modal === 'remove') && <Modal title={modal === 'add' ? `Tambah dana • ${editing.name}` : `Ambil dana • ${editing.name}`} onClose={() => setModal('')}>
        <div className="allocation-info"><span>{modal === 'add' ? 'Saldo tersedia' : 'Dana terkumpul'}</span><strong>{formatCurrency(modal === 'add' ? totals.available : editing.saved)}</strong></div>
        <form onSubmit={(event) => { event.preventDefault(); changeSaved(editing, modal); }}><label className="field">Nominal dana<input autoFocus type="number" min="1" max={modal === 'add' ? totals.available : editing.saved} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Masukkan nominal" required /></label><div className="form-hint allocation-hint">{modal === 'add' ? 'Saldo total tidak berubah. Dana hanya dipindahkan ke alokasi target.' : 'Dana yang diambil akan kembali ke saldo tersedia.'}</div><div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setModal('')}>Batal</button><button className="button button-primary">{modal === 'add' ? 'Alokasikan dana' : 'Kembalikan ke saldo'}</button></div></form>
      </Modal>}
    </>
  );
}
