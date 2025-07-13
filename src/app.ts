import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import commentRoutes from './routes/commentRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/comments', commentRoutes);

/* // Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
}); */

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

