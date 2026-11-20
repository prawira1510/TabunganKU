import { makeId, today, toLocalDate } from '../utils/finance.js';

const dateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toLocalDate(date);
};

export const defaultData = () => ({
  initialBalance: 1000000,
  user: { name: 'Pengguna MySavings', email: 'demo@mysavings.id' },
  settings: { theme: 'light', notifications: true },
  categories: [
    { id: 'salary', name: 'Gaji', type: 'income', color: '#18a874', icon: 'briefcase' },
    { id: 'business', name: 'Bisnis', type: 'income', color: '#4685ed', icon: 'store' },
    { id: 'freelance', name: 'Freelance', type: 'income', color: '#8b5cf6', icon: 'laptop' },
    { id: 'food', name: 'Makanan & minuman', type: 'expense', color: '#f59e0b', icon: 'utensils' },
    { id: 'transport', name: 'Transportasi', type: 'expense', color: '#4685ed', icon: 'car' },
    { id: 'shopping', name: 'Belanja', type: 'expense', color: '#ec4899', icon: 'shopping-bag' },
    { id: 'bills', name: 'Tagihan', type: 'expense', color: '#ef5b5b', icon: 'receipt' },
    { id: 'health', name: 'Kesehatan', type: 'expense', color: '#14b8a6', icon: 'heart' },
    { id: 'other', name: 'Lainnya', type: 'expense', color: '#8793a7', icon: 'circle' },
  ],
  transactions: [
    { id: makeId(), type: 'income', amount: 2000000, date: dateOffset(3), category: 'Gaji', description: 'Gaji bulanan', source: 'Kantor' },
    { id: makeId(), type: 'expense', amount: 500000, date: dateOffset(2), category: 'Belanja', description: 'Belanja kebutuhan rumah', payment: 'Debit' },
  ],
  goals: [
    { id: makeId(), name: 'Laptop baru', description: 'Upgrade perangkat kerja', target: 10000000, saved: 2500000, startDate: dateOffset(50), deadline: dateOffset(-150), category: 'Teknologi' },
    { id: makeId(), name: 'Dana darurat', description: 'Jaga-jaga untuk kebutuhan mendesak', target: 15000000, saved: 0, startDate: dateOffset(100), deadline: dateOffset(-300), category: 'Keamanan' },
  ],
  reminders: [],
  balanceHistory: [{ id: makeId(), date: today(), amount: 1000000, note: 'Saldo awal' }],
});
