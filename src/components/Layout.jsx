import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleHelp, LayoutDashboard, Menu, Moon, Plus, Search, Settings, Sun, Tags, Target, Wallet, X, ArrowDownLeft, ArrowUpRight, History, CircleAlert } from 'lucide-react';
import React, { useState } from 'react';
import { formatCurrency, toLocalDate } from '../utils/finance.js';
import Modal from './Modal.jsx';

const navigation = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Target tabungan', path: '/goals', icon: Target },
  { label: 'Tabungan masuk', path: '/income', icon: ArrowDownLeft },
  { label: 'Tabungan keluar', path: '/expense', icon: ArrowUpRight },
  { label: 'Riwayat transaksi', path: '/transactions', icon: History },
  { label: 'Laporan keuangan', path: '/reports', icon: ChartNoAxesCombined },
  { label: 'Kalender keuangan', path: '/calendar', icon: CalendarDays },
  { label: 'Kategori', path: '/categories', icon: Tags },
  { label: 'Pengaturan', path: '/settings', icon: Settings },
];

const headings = {
  '/': ['Dashboard', 'Pantau dan kelola keuangan pribadimu dengan lebih baik.'],
  '/goals': ['Target tabungan', 'Wujudkan rencana finansialmu satu per satu.'],
  '/income': ['Tabungan masuk', 'Catat semua pemasukanmu di sini.'],
  '/expense': ['Tabungan keluar', 'Pantau pengeluaran agar tetap terkendali.'],
  '/transactions': ['Riwayat transaksi', 'Semua aktivitas keuanganmu, tersusun rapi.'],
  '/reports': ['Laporan keuangan', 'Kenali pola keuangan dan ambil keputusan lebih baik.'],
  '/calendar': ['Kalender keuangan', 'Lihat aktivitas finansial berdasarkan tanggal.'],
  '/categories': ['Kategori', 'Atur kategori agar pencatatan lebih terorganisir.'],
  '/settings': ['Pengaturan', 'Sesuaikan MySavings dengan kebutuhanmu.'],
};

export default function Layout({ totals, user, data, setData }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const location = useLocation();
  const [title, subtitle] = headings[location.pathname] || headings['/'];
  const isDark = data.settings.theme === 'dark';
  const toggleTheme = () => setData((current) => ({
    ...current,
    settings: { ...current.settings, theme: current.settings.theme === 'dark' ? 'light' : 'dark' },
  }));
  const notifications = [];
  if (data.settings.notifications) {
    data.goals.forEach((goal) => {
      const progress = goal.target ? (goal.saved / goal.target) * 100 : 0;
      const daysLeft = goal.deadline ? Math.ceil((new Date(`${goal.deadline}T00:00:00`) - new Date()) / 86400000) : null;
      if (progress >= 100) notifications.push({ id: `done-${goal.id}`, title: 'Target tabungan tercapai', text: `Selamat! Target "${goal.name}" sebesar ${formatCurrency(goal.target)} berhasil tercapai.`, href: '/goals' });
      else if (progress >= 80) notifications.push({ id: `progress-${goal.id}`, title: 'Target hampir tercapai', text: `Target "${goal.name}" sudah terkumpul ${Math.floor(progress)}%. Sisa ${formatCurrency(goal.target - goal.saved)} lagi.`, href: '/goals' });
      if (daysLeft !== null && daysLeft < 0 && progress < 100) notifications.push({ id: `late-${goal.id}`, title: 'Deadline target terlewati', text: `Tenggat target "${goal.name}" sudah terlewati. Perbarui rencana target di halaman tabungan.`, href: '/goals' });
      else if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && progress < 100) notifications.push({ id: `deadline-${goal.id}`, title: 'Deadline target mendekat', text: `Target "${goal.name}" memiliki tenggat ${goal.deadline}, tinggal ${daysLeft} hari lagi.`, href: '/goals' });
    });
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTransactions = data.transactions.filter((item) => item.date >= toLocalDate(start));
    const monthlyExpense = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
    const monthlyIncome = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
    if (monthlyExpense > monthlyIncome) notifications.push({ id: 'overspending', title: 'Pengeluaran melebihi pemasukan', text: `Total pengeluaran bulan ini ${formatCurrency(monthlyExpense)}, lebih besar daripada pemasukan ${formatCurrency(monthlyIncome)}.`, href: '/reports' });
    if (data.goals.some((goal) => goal.saved < goal.target)) notifications.push({ id: 'saving-reminder', title: 'Pengingat menabung', text: 'Jangan lupa sisihkan dana untuk target tabunganmu dan periksa progres target yang sedang berjalan.', href: '/goals' });
    (data.reminders || []).filter((reminder) => {
      const daysLeft = Math.ceil((new Date(`${reminder.date}T00:00:00`) - new Date()) / 86400000);
      return daysLeft >= 0 && daysLeft <= 7;
    }).forEach((reminder) => notifications.push({ id: reminder.id, title: 'Pengingat menabung', text: `${reminder.title} — jadwal ${reminder.date}.`, href: '/calendar' }));
    if (now.getDate() >= new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - 2) notifications.push({ id: 'monthly-review', title: 'Evaluasi keuangan bulanan', text: 'Luangkan waktu untuk meninjau pemasukan, pengeluaran, dan progres target tabungan bulan ini.', href: '/reports' });
  }
  const readNotificationIds = data.settings.readNotifications || [];
  const unreadCount = notifications.filter((notification) => !readNotificationIds.includes(notification.id)).length;
  const openNotification = (notification) => {
    setSelectedNotification(notification);
    setNotificationOpen(false);
    if (!readNotificationIds.includes(notification.id)) {
      setData((current) => ({
        ...current,
        settings: {
          ...current.settings,
          readNotifications: [...new Set([...(current.settings.readNotifications || []), notification.id])],
        },
      }));
    }
  };
  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Tutup navigasi" />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Wallet size={22} /></div><div><strong>MySavings</strong><small>PERSONAL FINANCE</small></div><button className="mobile-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Tutup menu"><X size={18} /></button></div>
        <div className="workspace-label">MENU UTAMA</div>
        <nav className="nav-list">
          {navigation.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}><Icon size={19} strokeWidth={1.8} /><span>{label}</span>{path === '/goals' && <span className="nav-count">{Math.min(9, totals.goalCount || 0)}</span>}</NavLink>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><CircleHelp size={17} /></div><div><strong>Butuh bantuan?</strong><span>Kelola keuangan lebih cerdas.</span></div><ChevronDown size={16} /></div>
          <div className="profile"><div className="avatar">{user.photo ? <img src={user.photo} alt="Foto profil" /> : (user.name || 'P').slice(0, 1).toUpperCase()}</div><div className="profile-text"><strong>{user.name || 'Pengguna'}</strong><span>{user.email || 'akun pribadi'}</span></div><NavLink className="icon-button" to="/settings" aria-label="Pengaturan akun"><MoreIcon /></NavLink></div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="Buka navigasi"><Menu size={21} /></button>
          <div className="breadcrumb"><span>MySavings</span><span className="crumb-slash">/</span><strong>{title}</strong></div>
          <div className="topbar-actions"><div className="search-pill"><Search size={16} /><span>Cari apa saja...</span></div><button className="icon-button theme-quick-toggle" onClick={toggleTheme} aria-label={`Aktifkan tema ${isDark ? 'terang' : 'gelap'}`} title={`Tema ${isDark ? 'gelap' : 'terang'} aktif · klik untuk mengganti`}><span className="theme-toggle-icon">{isDark ? <Moon size={18} /> : <Sun size={18} />}</span></button><div className="notification-wrap"><button className="icon-button notification-button" aria-label="Notifikasi" aria-expanded={notificationOpen} onClick={() => setNotificationOpen(!notificationOpen)}><Bell size={19} />{unreadCount > 0 && <i />}</button>{notificationOpen && <div className="notification-popover"><strong>Notifikasi <span className="notification-count">{unreadCount} belum dibaca</span></strong>{notifications.length ? notifications.map((notification) => { const isRead = readNotificationIds.includes(notification.id); return <button className={`notification-item ${isRead ? 'read' : ''}`} key={notification.id} onClick={() => openNotification(notification)}><CircleAlert size={15} /><span><b>{notification.title}</b><small>{notification.text}</small></span><i className={isRead ? 'read-indicator' : 'unread-indicator'}>{isRead ? 'Dibaca' : 'Baru'}</i></button>; }) : <div className="notification-empty">Tidak ada pengingat saat ini.</div>}</div>}</div><div className="top-avatar">{user.photo ? <img src={user.photo} alt="Foto profil" /> : (user.name || 'P').slice(0, 1).toUpperCase()}</div></div>
        </header>
        <main className="page-content">
          <div className="page-heading"><div><div className="eyebrow">{new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</div><h1>{title}</h1><p>{subtitle}</p></div><div className="page-heading-actions">{location.pathname === '/' && <NavLink to="/income" className="button button-primary"><Plus size={17} /> Catat transaksi</NavLink>}</div></div>
          <Outlet />
        </main>
        <footer className="footer">© {new Date().getFullYear()} MySavings <span>•</span> Keuangan yang lebih terencana, hidup yang lebih tenang.</footer>
      </div>
      {selectedNotification && <Modal title={selectedNotification.title} onClose={() => setSelectedNotification(null)}>
        <p className="notification-detail-message">{selectedNotification.text}</p>
        <div className="notification-detail-actions"><button className="button button-secondary" onClick={() => setSelectedNotification(null)}>Tutup</button><NavLink className="button button-primary" to={selectedNotification.href} onClick={() => setSelectedNotification(null)}>Lihat detail</NavLink></div>
      </Modal>}
    </div>
  );
}

function MoreIcon() {
  return <ChevronDown size={16} />;
}
