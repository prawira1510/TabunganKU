import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useFinanceData } from './hooks/useFinanceData.js';
import Layout from './components/Layout.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Goals = lazy(() => import('./pages/Goals.jsx'));
const Transactions = lazy(() => import('./pages/Transactions.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const Calendar = lazy(() => import('./pages/Calendar.jsx'));
const Categories = lazy(() => import('./pages/Categories.jsx'));
const SettingsPage = lazy(() => import('./pages/Settings.jsx'));

function PageLoading() {
  return <div className="page-loading" role="status">Memuat halaman...</div>;
}

export default function App() {
  const finance = useFinanceData();
  const [toast, setToast] = useState('');
  useEffect(() => {
    const handleError = (event) => { setToast(event.detail); window.setTimeout(() => setToast(''), 3500); };
    window.addEventListener('mysavings-error', handleError);
    return () => window.removeEventListener('mysavings-error', handleError);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = finance.data.settings.theme || 'light';
  }, [finance.data.settings.theme]);
  const totals = { ...finance.totals, goalCount: finance.data.goals.filter((goal) => goal.saved < goal.target).length };
  const props = { ...finance, totals, toast: setToast };
  return (
    <>
      <Routes>
        <Route element={<Layout totals={totals} user={finance.data.user} data={finance.data} setData={finance.setData} />}>
          <Route index element={<Suspense fallback={<PageLoading />}><Dashboard {...props} /></Suspense>} />
          <Route path="goals" element={<Suspense fallback={<PageLoading />}><Goals {...props} /></Suspense>} />
          <Route path="income" element={<Suspense fallback={<PageLoading />}><Transactions {...props} forcedType="income" /></Suspense>} />
          <Route path="expense" element={<Suspense fallback={<PageLoading />}><Transactions {...props} forcedType="expense" /></Suspense>} />
          <Route path="transactions" element={<Suspense fallback={<PageLoading />}><Transactions {...props} /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<PageLoading />}><Reports {...props} /></Suspense>} />
          <Route path="calendar" element={<Suspense fallback={<PageLoading />}><Calendar {...props} /></Suspense>} />
          <Route path="categories" element={<Suspense fallback={<PageLoading />}><Categories {...props} /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoading />}><SettingsPage {...props} /></Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      {toast && <div className="toast-message">{toast}</div>}
    </>
  );
}
