import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Download, Moon, RotateCcw, Sun, Upload, UserRound, Wallet } from 'lucide-react';
import { formatCurrency, makeId, today } from '../utils/finance.js';

export default function SettingsPage({ data, setData, totals, toast }) {
  const [profile, setProfile] = useState({ ...data.user });
  const [initialBalance, setInitialBalance] = useState(String(data.initialBalance));
  const fileInput = useRef(null);
  const photoInput = useRef(null);
  useEffect(() => setProfile({ ...data.user }), [data.user]);
  useEffect(() => setInitialBalance(String(data.initialBalance)), [data.initialBalance]);
  const saveProfile = (event) => {
    event.preventDefault();
    if (!profile.name.trim() || !profile.email.trim()) return toast('Nama dan email wajib diisi.');
    setData((current) => ({ ...current, user: { ...current.user, ...profile, name: profile.name.trim() } }));
    toast('Profil berhasil disimpan.');
  };
  const saveBalance = (event) => {
    event.preventDefault();
    const amount = Number(initialBalance);
    if (!Number.isFinite(amount) || amount < 0) return toast('Saldo awal harus berupa angka nol atau lebih.');
    setData((current) => ({ ...current, initialBalance: amount, balanceHistory: [{ id: makeId(), date: today(), amount, note: 'Penyesuaian saldo awal' }, ...(current.balanceHistory || [])] }));
    toast('Saldo awal berhasil diperbarui.');
  };
  const setTheme = (theme) => { setData((current) => ({ ...current, settings: { ...current.settings, theme } })); toast(`Tema ${theme === 'dark' ? 'gelap' : 'terang'} diterapkan.`); };
  const setNotifications = (notifications) => { setData((current) => ({ ...current, settings: { ...current.settings, notifications } })); toast(notifications ? 'Notifikasi diaktifkan.' : 'Notifikasi dinonaktifkan.'); };
  const backup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `mysavings-backup-${today()}.json`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const restore = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!imported || !Array.isArray(imported.transactions) || !Array.isArray(imported.goals) || !Array.isArray(imported.categories) || !Number.isFinite(Number(imported.initialBalance))) throw new Error('Struktur data tidak valid.');
      if (!window.confirm('Pulihkan backup? Data MySavings saat ini akan digantikan.')) return;
      setData({ ...imported, settings: { ...data.settings, ...imported.settings }, user: { ...data.user, ...imported.user } });
      setInitialBalance(String(imported.initialBalance));
      setProfile({ ...data.user, ...imported.user });
      toast('Backup berhasil dipulihkan.');
    } catch (error) {
      console.error('Gagal memulihkan backup:', error);
      toast(`Backup tidak dapat dipulihkan: ${error.message}`);
    } finally { event.target.value = ''; }
  };
  const uploadPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) { toast('Pilih gambar dengan ukuran maksimal 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const photo = String(reader.result);
      setData((current) => ({ ...current, user: { ...current.user, photo } }));
      toast('Foto profil diperbarui.');
    };
    reader.onerror = () => toast('Foto profil tidak dapat dibaca.');
    reader.onabort = () => toast('Unggah foto profil dibatalkan.');
    reader.readAsDataURL(file);
  };
  const removePhoto = () => {
    if (!window.confirm('Hapus foto profil saat ini?')) return;
    setData((current) => {
      const user = { ...current.user };
      delete user.photo;
      return { ...current, user };
    });
    toast('Foto profil dihapus.');
  };
  const clearAll = () => {
    if (window.confirm('Hapus semua data yang tersimpan di browser ini dan mulai dari kosong? Data yang dihapus tidak dapat dipulihkan.')) {
      localStorage.removeItem('mysavings-data-v1'); window.location.reload();
    }
  };
  return (
    <div className="settings-layout">
      <div className="settings-main">
        <section className="panel settings-panel"><div className="settings-section-head"><div className="settings-section-icon"><UserRound size={18} /></div><div><h2>Profil pengguna</h2><p>Edit nama dan email, lalu simpan perubahan.</p></div></div><div className="profile-picture-row"><div className="settings-avatar">{data.user.photo ? <img src={data.user.photo} alt="Foto profil" /> : (data.user.name || 'P').slice(0, 1).toUpperCase()}</div><div><strong>Foto profil</strong><span>{data.user.photo ? 'Foto tersimpan di perangkat ini.' : 'JPG atau PNG, maksimal 2 MB.'}</span></div><input ref={photoInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={uploadPhoto} /><button type="button" className="button button-secondary button-small" onClick={() => photoInput.current?.click()}><Upload size={15} /> {data.user.photo ? 'Ganti foto' : 'Unggah foto'}</button>{data.user.photo && <button type="button" className="button button-secondary button-small" onClick={removePhoto}>Hapus foto</button>}</div>
          <form className="form-grid settings-form" onSubmit={saveProfile}><label className="field">Nama lengkap<input value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></label><label className="field">Alamat email<input type="email" value={profile.email || ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required /></label><div className="form-actions full-field"><button className="button button-primary button-small"><Check size={15} /> Simpan profil</button></div></form></section>
        <section className="panel settings-panel"><div className="settings-section-head"><div className="settings-section-icon blue"><Wallet size={18} /></div><div><h2>Saldo dan mata uang</h2><p>Sesuaikan saldo awal untuk perhitungan keuangan.</p></div></div><form className="balance-settings-form" onSubmit={saveBalance}><label className="field">Saldo awal (Rp)<input type="number" min="0" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} required /></label><button className="button button-primary button-small"><Check size={15} /> Simpan saldo</button></form><div className="balance-info-strip"><span>Saldo saat ini</span><strong>{formatCurrency(totals.balance)}</strong><span className="currency-badge">IDR · Rupiah</span></div><div className="settings-note">Saldo tersedia {formatCurrency(totals.available)} setelah alokasi target {formatCurrency(totals.allocated)}.</div></section>
        <section className="panel settings-panel"><div className="settings-section-head"><div className="settings-section-icon purple"><Sun size={18} /></div><div><h2>Tampilan & notifikasi</h2><p>Atur tampilan aplikasi dan preferensi pengingat.</p></div></div><div className="setting-choice-row"><div className="choice-leading"><div className="choice-icon"><Sun size={17} /></div><div><strong>Tema aplikasi</strong><span>Pilih tampilan yang nyaman untukmu.</span></div></div><div className="theme-toggle"><button className={data.settings.theme !== 'dark' ? 'active' : ''} onClick={() => setTheme('light')}><Sun size={15} /> Terang</button><button className={data.settings.theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><Moon size={15} /> Gelap</button></div></div><div className="setting-choice-row"><div className="choice-leading"><div className="choice-icon"><AlertTriangle size={17} /></div><div><strong>Notifikasi & pengingat</strong><span>Pengingat target dan evaluasi keuangan.</span></div></div><button className={`switch ${data.settings.notifications ? 'on' : ''}`} role="switch" aria-checked={Boolean(data.settings.notifications)} onClick={() => setNotifications(!data.settings.notifications)}><i /></button></div><div className="settings-note">Notifikasi tampil di dalam aplikasi saat target mendekati tenggat atau hampir tercapai.</div></section>
        <section className="panel settings-panel"><div className="settings-section-head"><div className="settings-section-icon green"><RotateCcw size={18} /></div><div><h2>Backup & pemulihan data</h2><p>Amankan data keuanganmu atau pulihkan dari file cadangan.</p></div></div><div className="backup-actions"><button className="button button-secondary" onClick={backup}><Download size={16} /> Unduh backup</button><button className="button button-secondary" onClick={() => fileInput.current?.click()}><Upload size={16} /> Pulihkan backup</button><input ref={fileInput} hidden type="file" accept="application/json,.json" onChange={restore} /></div><div className="settings-note">Backup berisi profil, transaksi, target, kategori, dan pengaturan dalam format JSON.</div></section>
        <section className="panel settings-panel danger-zone"><div className="settings-section-head"><div className="settings-section-icon red"><AlertTriangle size={18} /></div><div><h2>Zona berbahaya</h2><p>Tindakan ini mengembalikan semua data ke contoh awal.</p></div></div><button className="button button-danger" onClick={clearAll}>Reset data aplikasi</button></section>
      </div>
      <aside className="settings-side"><div className="panel balance-preview"><div className="balance-preview-icon"><Wallet size={19} /></div><span>Saldo keseluruhan</span><strong>{formatCurrency(totals.balance)}</strong><div><span>Saldo tersedia</span><b>{formatCurrency(totals.available)}</b></div></div><section className="panel history-panel"><div className="panel-heading"><div><h2>Riwayat saldo awal</h2><p>Perubahan saldo yang dicatat</p></div></div>{(data.balanceHistory || []).slice(0, 6).map((item) => <div className="balance-history-row" key={item.id}><div><strong>{item.note}</strong><span>{new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${item.date}T00:00:00`))}</span></div><b>{formatCurrency(item.amount)}</b></div>)}{!(data.balanceHistory || []).length && <div className="settings-note">Belum ada perubahan saldo.</div>}</section></aside>
    </div>
  );
}
