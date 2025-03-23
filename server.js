const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 初始化資料庫
const db = new sqlite3.Database('data.db');
db.run('CREATE TABLE IF NOT EXISTS sensor_data (temperature REAL, humidity REAL, timestamp TEXT)');

app.get('/data', (req, res) => {
  db.all('SELECT * FROM sensor_data', (err, rows) => {
    if (err) {
      res.status(500).json({ status: 'error', message: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post('/data', (req, res) => {
  const { temp, hum } = req.query;
  if (temp && hum) {
    const newData = { temperature: parseFloat(temp), humidity: parseFloat(hum), timestamp: new Date().toISOString() };
    db.run('INSERT INTO sensor_data (temperature, humidity, timestamp) VALUES (?, ?, ?)', 
      [newData.temperature, newData.humidity, newData.timestamp], (err) => {
        if (err) {
          res.status(500).json({ status: 'error', message: err.message });
        } else {
          console.log('收到數據:', newData);
          res.json({ status: 'success', data: newData });
        }
      });
  } else {
    res.status(400).json({ status: 'error', message: '缺少 temp 或 hum 參數' });
  }
});

app.listen(port, () => {
  console.log(`後台運行在 http://localhost:${port}`);
});