import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import medicationRoutes from './routes/medications';
import relationshipRoutes from './routes/relationships';
import confirmationRoutes from './routes/confirmations';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/confirmations', confirmationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});