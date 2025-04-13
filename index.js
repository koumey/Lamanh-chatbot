const express = require('express');
const axios = require('axios');
const app = express();

const VERIFY_TOKEN = 'lamanh_vinhomes_2025';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || 'EAAB...'; // Thay 'EAAB...' bằng token thực tế nếu cần

app.use(express.json()); // Dùng để parse body JSON

// Route gốc để kiểm tra server đang chạy
app.get('/', (req, res) => {
  res.send('Hello, đây là trang chủ của Lâm Anh Chatbot. Truy cập /webhook để kết nối Messenger.');
});

// Route GET để Facebook xác minh webhook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK VERIFIED');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

// Route POST để nhận tin nhắn từ Messenger
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(async (entry) => {
      // Lấy sự kiện tin nhắn đầu tiên
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;

      // Nếu là tin nhắn văn bản, gửi phản hồi
      if (webhook_event.message && webhook_event.message.text) {
        const userMessage = webhook_event.message.text;
        console.log('Khách gửi tin:', userMessage);

        // Gửi tin nhắn trả lời đến khách
        await sendTextMessage(sender_psid, `Chào bạn, bạn vừa nói: ${userMessage}`);
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Hàm gửi tin nhắn sử dụng Facebook Send API
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
  console.log(`Server is running on port ${PORT}`);
});
