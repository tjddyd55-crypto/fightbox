import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { WorkoutProgramBuilderPage } from './features/workout-program-builder/pages/WorkoutProgramBuilderPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/workout-program-builder" replace />} />
        <Route path="/workout-program-builder" element={<WorkoutProgramBuilderPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
