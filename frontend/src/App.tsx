import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { OverviewPage } from './pages/OverviewPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { InvestigationPage } from './pages/InvestigationPage';
import { AttackReplayPage } from './pages/AttackReplayPage';
import { AttackSimulatorPage } from './pages/AttackSimulatorPage';
import { SensorTrustPage } from './pages/SensorTrustPage';
import { BlindSpotsPage } from './pages/BlindSpotsPage';
import { DevicesPage } from './pages/DevicesPage';
import { EventsPage } from './pages/EventsPage';
import { ResponseCenterPage } from './pages/ResponseCenterPage';
import { ReportsPage } from './pages/ReportsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { LoginPage } from './pages/LoginPage';
import { AttackerPage } from './pages/AttackerPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Login */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Dedicated Red Team Adversary Portal */}
          <Route path="/attacker" element={<AttackerPage />} />

          {/* Authenticated Web SOC Dashboard */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<OverviewPage />} />
            <Route path="/live" element={<LiveMonitoringPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/incidents/:id" element={<InvestigationPage />} />
            <Route path="/replay" element={<AttackReplayPage />} />
            <Route path="/simulator" element={<AttackSimulatorPage />} />
            <Route path="/trust" element={<SensorTrustPage />} />
            <Route path="/blind-spots" element={<BlindSpotsPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/responses" element={<ResponseCenterPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:id" element={<ReportsPage />} />
            <Route path="/health" element={<SystemHealthPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
