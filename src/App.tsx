import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PlanProvider, usePlan } from './context/PlanContext';
import { NavBar } from './components/NavBar';
import { BackupBanner } from './components/BackupBanner';
import { HomePage } from './pages/HomePage';
import { DietPage } from './pages/DietPage';
import { ExercisePage } from './pages/ExercisePage';
import { DestressPage } from './pages/DestressPage';
import { ReportPage } from './pages/ReportPage';
import { MantrasPage } from './pages/MantrasPage';
import { SettingsPage } from './pages/SettingsPage';
import { OnboardingPage } from './pages/OnboardingPage';
import './App.css';

function AppRoutes() {
  const { plan, loading } = usePlan();

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner" />
        <p>Loading your plan…</p>
      </div>
    );
  }

  if (!plan?.meta.onboarded) {
    return (
      <Routes>
        <Route path="*" element={<OnboardingPage />} />
      </Routes>
    );
  }

  return (
    <>
      <div className="app-body">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/diet" element={<DietPage />} />
          <Route path="/exercise" element={<ExercisePage />} />
          <Route path="/destress" element={<DestressPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/mantras" element={<MantrasPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BackupBanner />
      <NavBar />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PlanProvider>
        <div className="app-shell">
          <AppRoutes />
        </div>
      </PlanProvider>
    </BrowserRouter>
  );
}
