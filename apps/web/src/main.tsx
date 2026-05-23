import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { BillingPage } from './features/billing/pages/BillingPage';
import { ProgramSchedulePage } from './features/program-schedule/pages/ProgramSchedulePage';
import { WorkoutProgramBuilderPage } from './features/workout-program-builder/pages/WorkoutProgramBuilderPage';
import { PublicProgramPage } from './features/program-share/PublicProgramPage';
import { ProgramPlayerDemoRoute } from './features/program-player/components/ProgramPlayerDemoRoute';
import { ProgramTemplatePlayerPage } from './features/program-player/pages/ProgramTemplatePlayerPage';
import './index.css';

function RootRedirect() {
  return <Navigate to="/dashboard" replace />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/share/programs/:shareToken" element={<PublicProgramPage />} />
          <Route path="/program-player-demo" element={<ProgramPlayerDemoRoute />} />
          <Route
            path="/programs/:templateId/play"
            element={
              <ProtectedRoute>
                <ProgramTemplatePlayerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/program-schedule"
            element={
              <ProtectedRoute>
                <ProgramSchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing"
            element={
              <ProtectedRoute>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workout-program-builder"
            element={
              <ProtectedRoute>
                <WorkoutProgramBuilderPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
