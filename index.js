const express = require('express');
const app = express();

const VERIFY_TOKEN = 'lamanh_vinhomes_2025';

app.get('/', (req, res) => {
  res.send('Hello, đây là trang chủ của Lâm Anh Chatbot. Truy cập /webhook để kết nối Messenger.');
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

app.post('/webhook', express.json(), (req, res) => {
  console.log('Nhận tin nhắn từ khách:', req.body);
  res.status(200).send('EVENT_RECEIVED');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
