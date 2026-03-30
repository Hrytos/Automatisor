const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (CSS, JS, assets)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`WareIQ server running at http://localhost:${PORT}`);
});
