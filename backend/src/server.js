require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initializeFirebaseAdmin } = require('./config/firebase');
const { testConnection } = require('./db/pool');

const complaintsRouter = require('./routes/complaints');
const usersRouter = require('./routes/users');
const attachmentsRouter = require('./routes/attachments');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase Admin
initializeFirebaseAdmin();

// Routes
app.use('/api/complaints', complaintsRouter);
app.use('/api/users', usersRouter);
app.use('/api/attachments', attachmentsRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start server
async function start() {
  await testConnection();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch(console.error);

module.exports = app;
