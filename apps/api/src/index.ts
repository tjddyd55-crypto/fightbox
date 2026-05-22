import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';
import { requestContextMiddleware } from './middleware/requestContext.js';
import gymStaffPermissionRoutes from './routes/gymStaffPermissionRoutes.js';
import workoutBuilderRoutes from './routes/workoutBuilderRoutes.js';
import workoutVideoUploadRoutes from './routes/workoutVideoUploadRoutes.js';
import { toErrorResponse } from './utils/apiError.js';

const app = express();
const port = Number(process.env.PORT) || 3000;
const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim();

app.use(
  cors({
    origin: frontendOrigin ? frontendOrigin : true,
    allowedHeaders: [
      'Content-Type',
      'x-gym-id',
      'x-user-id',
      'x-user-role',
      'x-staff-permissions',
    ],
  }),
);
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'fightbox-api' });
});

app.use('/api/workout-videos/uploads', requestContextMiddleware, workoutVideoUploadRoutes);
app.use('/api/workout-builder', requestContextMiddleware, workoutBuilderRoutes);
app.use('/api/gym/staff-permissions', requestContextMiddleware, gymStaffPermissionRoutes);

app.use((error: unknown, _req: Request, res: Response) => {
  const { status, body } = toErrorResponse(error);
  res.status(status).json(body);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`fightbox-api listening on ${port}`);
});
