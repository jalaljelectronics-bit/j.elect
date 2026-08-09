const express = require('express');
const cors = require('cors');
const path = require('path');
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
const uploadRoutes = require('./routes/upload');
const sitemapRoutes = require('./routes/sitemap.js'); // FIXED: was `import`

const app = express();

app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:4173', // vite preview — used to test production builds locally
  'http://127.0.0.1:8000', // @prerenderer/prerenderer's local static server during `npm run build`
  

  'j-elect.vercel.app',
  'https://jelectronics-admin.vercel.app',
  'https://jelectronics-store.vercel.app',
  'https://jelectronics.store',
  'https://www.jelectronics.store',
  'https://admin.jelectronics.store',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
app.use('/api/upload', uploadRoutes);
app.use('/', sitemapRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});