import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';
import { assertAuthConfiguredForStartup } from './config/authConfig.js';
import { optionalAuth } from './middleware/authMiddleware.js';
import { requestContextMiddleware } from './middleware/requestContext.js';
import authRoutes from './routes/authRoutes.js';
import gymAdminRoutes from './routes/gymAdminRoutes.js';
import userManagementRoutes from './routes/userManagementRoutes.js';
import gymStaffPermissionRoutes from './routes/gymStaffPermissionRoutes.js';
import workoutBuilderRoutes from './routes/workoutBuilderRoutes.js';
import workoutVideoUploadRoutes from './routes/workoutVideoUploadRoutes.js';
import { toErrorResponse } from './utils/apiError.js';

assertAuthConfiguredForStartup();

const app = express();
const port = Number(process.env.PORT) || 3000;
const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim();

app.use(
  cors({
    origin: frontendOrigin ? frontendOrigin : true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-gym-id',
      'x-user-id',
      'x-user-role',
      'x-staff-permissions',
      'x-account-scope',
      'x-gym-code',
      'x-creator-id',
      'x-creator-code',
    ],
  }),
);
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'fightbox-api' });
});

app.use('/api/auth', authRoutes);

const protectedApi = [optionalAuth, requestContextMiddleware] as const;

app.use('/api/workout-videos/uploads', ...protectedApi, workoutVideoUploadRoutes);
app.use('/api/workout-builder', ...protectedApi, workoutBuilderRoutes);
app.use('/api/gym/staff-permissions', ...protectedApi, gymStaffPermissionRoutes);
app.use('/api/admin/gyms', ...protectedApi, gymAdminRoutes);
app.use('/api/admin/users', ...protectedApi, userManagementRoutes);

app.use((error: unknown, _req: Request, res: Response) => {
  const { status, body } = toErrorResponse(error);
  res.status(status).json(body);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`fightbox-api listening on ${port}`);
});
