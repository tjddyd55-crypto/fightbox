import cors from 'cors';
import express from 'express';
import workoutVideoUploadRoutes from './routes/workoutVideoUploadRoutes.js';

const app = express();
const port = Number(process.env.PORT) || 3000;
const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim();

app.use(
  cors({
    origin: frontendOrigin ? frontendOrigin : true,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'fightbox-api' });
});

app.use('/api/workout-videos/uploads', workoutVideoUploadRoutes);

app.listen(port, '0.0.0.0', () => {
  console.log(`fightbox-api listening on ${port}`);
});
