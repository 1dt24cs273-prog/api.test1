const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const CHECKS_FILE = path.join(__dirname, 'checks.json');

app.use(express.json());
app.use(express.static('public'));

app.post('/api/check', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  const start = performance.now();
  let status = 'DOWN';
  let statusCode = null;
  try {
    const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
    statusCode = response.status;
    if (response.ok) status = 'UP';
  } catch (err) {
    statusCode = err.name === 'TimeoutError' ? 'TIMEOUT' : 'ERROR';
  }
  const latency = Math.round(performance.now() - start);
  const newCheck = { url, status, statusCode, latency, timestamp: new Date().toISOString() };
  let checks = [];
  try { checks = JSON.parse(fs.readFileSync(CHECKS_FILE, 'utf8')); } catch(e) {}
  checks.unshift(newCheck); if (checks.length > 10) checks.length = 10;
  fs.writeFileSync(CHECKS_FILE, JSON.stringify(checks, null, 2));
  res.json({ current: newCheck, history: checks });
});

app.get('/api/history', (req, res) => {
  let checks = [];
  try { checks = JSON.parse(fs.readFileSync(CHECKS_FILE, 'utf8')); } catch(e) {}
  res.json(checks);
});

app.listen(PORT, () => console.log(`API Sentinel listening on port ${PORT}`));
