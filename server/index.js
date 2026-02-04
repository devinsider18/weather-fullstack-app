require('dotenv').config();
const express = require('express');
const cors = require('cors');
const weatherRoutes = require('./src/routes/weatherRoutes');
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET']
}));
app.use(express.json());
app.use('/api/weather', weatherRoutes);
app.get('/', (req, res) => {
  res.send('Weather Server is running! 🚀');
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});