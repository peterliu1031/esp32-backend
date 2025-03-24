const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // 啟用 CORS

// 初始化資料庫
const db = new sqlite3.Database('data.db');
db.run('CREATE TABLE IF NOT EXISTS sensor_data (temperature REAL, humidity REAL, timestamp TEXT)');

app.get('/data', (req, res) => {
  const limit = parseInt(req.query.limit) || 10; // 預設返回 10 筆數據
  db.all('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT ?', [limit], (err, rows) => {
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
    const temperature = parseFloat(temp);
    const humidity = parseFloat(hum);
    if (isNaN(temperature) || isNaN(humidity)) {
      return res.status(400).json({ status: 'error', message: 'temp 或 hum 必須是有效的數字' });
    }
    const newData = { temperature, humidity, timestamp: new Date().toISOString() };
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

// 處理服務關閉時的資料庫清理
process.on('SIGINT', () => {
  console.log('關閉資料庫連線...');
  db.close((err) => {
    if (err) {
      console.error('關閉資料庫時發生錯誤:', err.message);
    } else {
      console.log('資料庫已關閉');
    }
    process.exit(0);
  });
});