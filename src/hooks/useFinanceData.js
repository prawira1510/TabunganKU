import { useEffect, useMemo, useState } from 'react';
import { defaultData } from '../data/defaultData.js';
import { makeId } from '../utils/finance.js';

const STORAGE_KEY = 'mysavings-data-v1';

export function useFinanceData() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultData(), ...JSON.parse(saved) } : defaultData();
    } catch (error) {
      console.error('Gagal membaca data MySavings:', error);
      return defaultData();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Gagal menyimpan data MySavings:', error);
      window.dispatchEvent(new CustomEvent('mysavings-error', { detail: 'Penyimpanan lokal penuh atau tidak tersedia.' }));
    }
  }, [data]);

  const totals = useMemo(() => {
    const income = data.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
    const expense = data.transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
    const allocated = data.goals.reduce((sum, item) => sum + Number(item.saved), 0);
    return { income, expense, allocated, balance: Number(data.initialBalance) + income - expense, available: Number(data.initialBalance) + income - expense - allocated };
  }, [data]);

  const addTransaction = (transaction) => setData((current) => ({ ...current, transactions: [{ ...transaction, id: makeId() }, ...current.transactions] }));
  const updateTransaction = (transaction) => setData((current) => ({ ...current, transactions: current.transactions.map((item) => item.id === transaction.id ? transaction : item) }));
  const deleteTransaction = (id) => setData((current) => ({ ...current, transactions: current.transactions.filter((item) => item.id !== id) }));
  const addGoal = (goal) => setData((current) => ({ ...current, goals: [{ ...goal, id: makeId() }, ...current.goals] }));
  const updateGoal = (goal) => setData((current) => ({ ...current, goals: current.goals.map((item) => item.id === goal.id ? goal : item) }));
  const deleteGoal = (id) => setData((current) => ({ ...current, goals: current.goals.filter((item) => item.id !== id) }));
  const addCategory = (category) => setData((current) => ({ ...current, categories: [...current.categories, { ...category, id: makeId() }] }));
  const updateCategory = (category) => setData((current) => ({ ...current, categories: current.categories.map((item) => item.id === category.id ? category : item) }));
  const deleteCategory = (id) => setData((current) => ({ ...current, categories: current.categories.filter((item) => item.id !== id) }));

  return { data, setData, totals, addTransaction, updateTransaction, deleteTransaction, addGoal, updateGoal, deleteGoal, addCategory, updateCategory, deleteCategory };
}
