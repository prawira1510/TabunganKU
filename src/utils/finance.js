export const formatCurrency = (amount, compact = false) => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
};

export const toLocalDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const today = () => toLocalDate(new Date());
export const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const totalsFor = (transactions, start, end) => transactions.reduce((totals, transaction) => {
  if (transaction.date < start || transaction.date > end) return totals;
  totals[transaction.type] += Number(transaction.amount) || 0;
  return totals;
}, { income: 0, expense: 0 });

export const monthRange = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  return {
    start: toLocalDate(new Date(year, month, 1)),
    end: toLocalDate(new Date(year, month + 1, 0)),
  };
};

export const goalStatus = (goal) => {
  const progress = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
  if (progress >= 100) return 'Tercapai';
  if (goal.startDate > today()) return 'Belum Dimulai';
  if (goal.deadline && goal.deadline < today()) return 'Terlambat';
  return 'Sedang Berjalan';
};

export const remainingMonthly = (goal) => {
  const remaining = Math.max(0, Number(goal.target) - Number(goal.saved));
  if (!goal.deadline || remaining === 0) return 0;
  const months = Math.max(1, (new Date(`${goal.deadline}T00:00:00`) - new Date()) / (1000 * 60 * 60 * 24 * 30.44));
  return Math.ceil(remaining / months);
};
