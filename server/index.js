const express = require('express');
const cors = require('cors');
const weatherRoutes = require('./src/routes/weatherRoutes');
const app = express();
const PORT = 4000;
app.use(cors());
app.use(express.json());
app.use('/api/weather', weatherRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});