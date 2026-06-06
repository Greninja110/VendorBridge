require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app     = express();
const PORT    = process.env.PORT || 5000;

app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));
app.use(express.json());

app.use('/api/auth',           require('./routes/auth'));
app.use('/api/vendors',        require('./routes/vendors'));
app.use('/api/rfqs',           require('./routes/rfqs'));
app.use('/api/quotations',     require('./routes/quotations'));
app.use('/api/approvals',      require('./routes/approvals'));
app.use('/api/purchase-orders',require('./routes/purchase-orders'));
app.use('/api/invoices',       require('./routes/invoices'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/reports',        require('./routes/reports'));
app.use('/api/activity',       require('./routes/activity'));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
