import cors from 'cors';
import express from 'express';
import { assertAuthConfiguredForStartup } from './config/authConfig.js';
import { optionalAuth } from './middleware/authMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestContextMiddleware } from './middleware/requestContext.js';
import authRoutes from './routes/authRoutes.js';
import authAuditRoutes from './routes/authAuditRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import adminBillingRoutes from './routes/adminBillingRoutes.js';
import gymAdminRoutes from './routes/gymAdminRoutes.js';
import userManagementRoutes from './routes/userManagementRoutes.js';
import gymStaffPermissionRoutes from './routes/gymStaffPermissionRoutes.js';
import workoutBuilderRoutes from './routes/workoutBuilderRoutes.js';
import programShareRoutes from './routes/programShareRoutes.js';
import workoutVideoUploadRoutes from './routes/workoutVideoUploadRoutes.js';

assertAuthConfiguredForStartup();

const app = express();
const port = Number(process.env.PORT) || 3000;
const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim();

app.set('trust proxy', 1);
app.disable('x-powered-by');

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
app.use('/api/public/programs', programShareRoutes);

const protectedApi = [optionalAuth, requestContextMiddleware] as const;

app.use('/api/workout-videos/uploads', ...protectedApi, workoutVideoUploadRoutes);
app.use('/api/workout-builder', ...protectedApi, workoutBuilderRoutes);
app.use('/api/gym/staff-permissions', ...protectedApi, gymStaffPermissionRoutes);
app.use('/api/admin/gyms', ...protectedApi, gymAdminRoutes);
app.use('/api/admin/users', ...protectedApi, userManagementRoutes);
app.use('/api/admin/auth-audit-logs', ...protectedApi, authAuditRoutes);
app.use('/api/billing', ...protectedApi, billingRoutes);
app.use('/api/admin/billing', ...protectedApi, adminBillingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
  console.log(`fightbox-api listening on ${port}`);
});
