require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const pollRoutes = require('./routes/poll.routes');
const { errorHandler } = require('@aveon/shared');

const app = express();
const PORT = process.env.POLL_PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/polls', pollRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'poll-service' }));
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[Poll Service] Running on port ${PORT}`));
});
