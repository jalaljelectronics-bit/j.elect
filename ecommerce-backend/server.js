const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/test');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const addressRoutes = require('./routes/addresses');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const blogRoutes = require('./routes/blog');
const projectRoutes = require('./routes/projects');
const queryRoutes = require('./routes/queries');
const statsRoutes = require('./routes/stats');

const app = express();

app.use(express.json());

// ---------------------------------------------------------------------
// CORS
// Add your deployed frontend URLs here. Vercel gives you a *.vercel.app
// domain for each project; add both, plus any custom domains you point
// at them later.
// ---------------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',

  // TODO: replace these with your real Vercel URLs after deploying
  'https://jelectronics-admin.vercel.app',
  'https://jelectronics-store.vercel.app',

  // Custom domains (keep if you point them at Vercel)
  'https://jelectronics.store',
  'https://www.jelectronics.store',
  'https://admin.jelectronics.store',
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', reviewRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/stats', statsRoutes);

// Health check — Render pings this, and it's handy for confirming the
// service is alive without hitting the database.
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API running' });
});

// ---------------------------------------------------------------------
// Render provides PORT via the environment. Do not hardcode it.
// ---------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
