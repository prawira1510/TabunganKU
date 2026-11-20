import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, Bell, CalendarDays, Circle, Plus, Target, Trash2 } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import { formatCurrency, formatDate, makeId } from '../utils/finance.js';

const monthName = (date) => new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function Calendar({ data, setData, toast }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(dateKey(new Date()));
  const [reminderModal, setReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState(dateKey(new Date()));
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; });
  }, [month]);
  const selectedTransactions = data.transactions.filter((item) => item.date === selected);
  const selectedGoals = data.goals.filter((goal) => goal.deadline === selected);
  const reminders = data.reminders || [];
  const selectedReminders = reminders.filter((reminder) => reminder.date === selected);
  const eventDates = new Set([...data.transactions.map((item) => item.date), ...data.goals.map((goal) => goal.deadline).filter(Boolean), ...reminders.map((item) => item.date)]);
  const changeMonth = (delta) => { const next = new Date(month.getFullYear(), month.getMonth() + delta, 1); setMonth(next); setSelected(dateKey(next)); };
  const monthTransactions = data.transactions.filter((item) => item.date.slice(0, 7) === dateKey(month).slice(0, 7));
  const monthIncome = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const monthExpense = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  const saveReminder = (event) => {
    event.preventDefault();
    if (!reminderTitle.trim() || !reminderDate) return toast('Isi pesan dan tanggal pengingat.');
    const reminder = { id: makeId(), title: reminderTitle.trim(), date: reminderDate };
    setData((current) => ({ ...current, reminders: [...(current.reminders || []), reminder] }));
    setSelected(reminderDate);
    setMonth(new Date(`${reminderDate}T00:00:00`));
    setReminderTitle(''); setReminderModal(false); toast('Pengingat berhasil ditambahkan.');
  };
  const deleteReminder = (reminder) => {
    if (window.confirm(`Hapus pengingat "${reminder.title}"?`)) {
      setData((current) => ({ ...current, reminders: (current.reminders || []).filter((item) => item.id !== reminder.id) }));
      toast('Pengingat dihapus.');
    }
  };
  return (
    <div className="calendar-layout">
      <section className="panel calendar-panel">
        <div className="calendar-heading"><div><h2>{monthName(month)}</h2><p>Aktivitas keuangan berdasarkan tanggal</p></div><div className="calendar-nav"><button className="button button-secondary reminder-add-button" onClick={() => { setReminderDate(selected); setReminderModal(true); }}><Plus size={14} /> Pengingat</button><button className="icon-button" onClick={() => changeMonth(-1)} aria-label="Bulan sebelumnya"><ArrowLeft size={17} /></button><button className="calendar-today" onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelected(dateKey(now)); }}>Hari ini</button><button className="icon-button" onClick={() => changeMonth(1)} aria-label="Bulan berikutnya"><ArrowRight size={17} /></button></div></div>
        <div className="calendar-weekdays">{['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="calendar-days">{days.map((day) => { const key = dateKey(day); const inMonth = day.getMonth() === month.getMonth(); return <button key={key} className={`calendar-day ${inMonth ? '' : 'outside-month'} ${selected === key ? 'selected-day' : ''} ${key === dateKey(new Date()) ? 'today-day' : ''}`} onClick={() => setSelected(key)}><span>{day.getDate()}</span>{eventDates.has(key) && <i className={data.transactions.some((item) => item.date === key && item.type === 'income') ? 'day-event-income' : reminders.some((item) => item.date === key) ? 'day-event-reminder' : 'day-event-expense'} />}</button>; })}</div>
        <div className="calendar-legend"><span><i className="day-event-income" /> Pemasukan</span><span><i className="day-event-expense" /> Pengeluaran / target</span><span><i className="day-event-reminder" /> Pengingat</span></div>
      </section>
      <aside className="calendar-side">
        <section className="panel day-detail-panel"><div className="panel-heading"><div><div className="eyebrow">DETAIL TANGGAL</div><h2>{formatDate(selected)}</h2></div><div className="selected-date-icon"><CalendarDays size={18} /></div></div>
          {selectedTransactions.length || selectedGoals.length || selectedReminders.length ? <div className="day-activity-list">{selectedTransactions.map((item) => <div className="day-activity" key={item.id}><div className={`activity-mini-icon ${item.type}`}>{item.type === 'income' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}</div><div className="day-activity-main"><strong>{item.description || item.category}</strong><span>{item.category}</span></div><b className={item.type}>{item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}</b></div>)}{selectedGoals.map((goal) => <div className="day-activity" key={goal.id}><div className="activity-mini-icon goal"><Target size={15} /></div><div className="day-activity-main"><strong>Target: {goal.name}</strong><span>Deadline tabungan</span></div></div>)}{selectedReminders.map((reminder) => <div className="day-activity" key={reminder.id}><div className="activity-mini-icon reminder"><Bell size={15} /></div><div className="day-activity-main"><strong>{reminder.title}</strong><span>Pengingat menabung</span></div><button className="icon-button danger-hover" aria-label="Hapus pengingat" onClick={() => deleteReminder(reminder)}><Trash2 size={14} /></button></div>)}</div> : <div className="empty-state day-empty"><div className="empty-icon"><Circle size={20} /></div><strong>Tidak ada aktivitas</strong><p>Belum ada transaksi atau target pada tanggal ini.</p></div>}
        </section>
        <section className="panel month-overview"><div className="panel-heading"><div><h2>Ringkasan bulan</h2><p>{monthName(month)}</p></div></div><div className="month-overview-row"><span><i className="legend-dot income-dot" /> Total pemasukan</span><strong className="text-green">{formatCurrency(monthIncome)}</strong></div><div className="month-overview-row"><span><i className="legend-dot expense-dot" /> Total pengeluaran</span><strong className="text-red">{formatCurrency(monthExpense)}</strong></div><div className="calendar-net"><span>Arus kas bersih</span><strong className={monthIncome - monthExpense >= 0 ? 'text-green' : 'text-red'}>{formatCurrency(monthIncome - monthExpense)}</strong></div></section>
      </aside>
      {reminderModal && <Modal title="Tambah pengingat menabung" onClose={() => setReminderModal(false)}><form className="form-grid" onSubmit={saveReminder}><label className="field full-field">Pesan pengingat<input autoFocus value={reminderTitle} onChange={(event) => setReminderTitle(event.target.value)} placeholder="Contoh: Sisihkan dana untuk tabungan" required /></label><label className="field full-field">Tanggal pengingat<input type="date" value={reminderDate} onChange={(event) => setReminderDate(event.target.value)} required /></label><div className="form-actions full-field"><button type="button" className="button button-secondary" onClick={() => setReminderModal(false)}>Batal</button><button className="button button-primary"><Bell size={15} /> Simpan pengingat</button></div></form></Modal>}
    </div>
  );
}
