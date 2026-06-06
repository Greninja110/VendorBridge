require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
