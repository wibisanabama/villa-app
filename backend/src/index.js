import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// Test Supabase Connection Route
app.get('/api/test-db', async (req, res) => {
  try {
    // A simple query to check if we can connect and fetch time from the database
    // Usually auth.users or a simple select 1. We will try a simple select without needing a table.
    // However, Supabase JS client doesn't have a direct raw query method for unauthenticated anon users easily without a table.
    // Instead we'll just check if the client is initialized.
    
    if (supabase) {
      res.json({ status: 'ok', message: 'Supabase client initialized successfully.' });
    } else {
      res.status(500).json({ status: 'error', message: 'Supabase client failed to initialize.' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
