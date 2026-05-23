import { Navigate } from 'react-router-dom';
import { isProgramPlayerDemoEnabled } from '../../workout-program-builder/services/workoutBuilderFeatureFlags';
import { ProgramPlayerDemoPage } from '../pages/ProgramPlayerDemoPage';

export function ProgramPlayerDemoRoute() {
  if (!isProgramPlayerDemoEnabled()) {
    return <Navigate to="/workout-program-builder" replace />;
  }

  return <ProgramPlayerDemoPage />;
}
