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
const express = require('express');
const axios = require('axios');
const app = express();

const VERIFY_TOKEN = 'lamanh_vinhomes_2025';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || 'EAAB...'; // Lấy token từ env hoặc tạm dán vào

app.use(express.json()); // parse JSON body

// Route gốc
app.get('/', (req, res) => {
  res.send('Hello, đây là trang chủ của Lâm Anh Chatbot. Truy cập /webhook để kết nối Messenger.');
});

// Xác minh webhook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

// Nhận tin nhắn từ Messenger
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(async (entry) => {
      // Sự kiện messaging
      const webhook_event = entry.messaging[0]; 
      const sender_psid = webhook_event.sender.id;

      // Kiểm tra nếu là tin nhắn văn bản
      if (webhook_event.message && webhook_event.message.text) {
        const userMessage = webhook_event.message.text;
        console.log('Khách gửi tin:', userMessage);
        
        // Gửi trả lời
        await sendTextMessage(sender_psid, `Chào bạn, bạn vừa nói: ${userMessage}`);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Hàm gửi tin nhắn
async function sendTextMessage(recipientId, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v12.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: recipientId },
        message: { text: text }
      }
    );
    console.log('Đã gửi tin nhắn đến PSID:', recipientId);
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn:', error.response ? error.response.data : error);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
