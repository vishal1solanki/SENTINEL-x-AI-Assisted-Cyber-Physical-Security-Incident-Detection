import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { ToastNotification } from '../components/common/ToastNotification';
import { useWebSocket } from '../hooks/useWebSocket';

export const DashboardLayout: React.FC = () => {
  const { toastMessage, clearToast } = useWebSocket();

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {toastMessage && (
        <ToastNotification
          title={toastMessage.title}
          message={toastMessage.message}
          severity={toastMessage.severity}
          onClose={clearToast}
        />
      )}
    </div>
  );
};
