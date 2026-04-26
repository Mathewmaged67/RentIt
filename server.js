const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const errorHandler = require('./middlewares/error.handler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routers/auth.routes'));
app.use('/api/products', require('./routers/product.routes'));
app.use('/api/orders', require('./routers/order.routes'));
app.use('/api/wishlist', require('./routers/wishlist.routes'));
app.use('/api/messages', require('./routers/message.routes'));
app.use('/api/admin', require('./routers/admin.routes'));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing in .env');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });
