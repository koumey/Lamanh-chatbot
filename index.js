const express = require('express');
const axios = require('axios');
require('dotenv').config(); // Đọc biến môi trường từ file .env

const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'lamanh_vinhomes_2025';
const PAGE_ACCESS_TOKEN = 'EAAOWyvZAX72gBOz...'; // Token của trang

// Route test
app.get('/', (req, res) => {
  res.send('Lâm Anh Chatbot đã sẵn sàng! Truy cập /webhook để kết nối Messenger.');
});

// Facebook xác minh Webhook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK VERIFIED');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Xử lý tin nhắn từ Facebook
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(async (entry) => {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message && webhook_event.message.text) {
        const userMessage = webhook_event.message.text;
        console.log('Khách:', userMessage);

        const reply = await getGPTResponse(userMessage);
        await sendTextMessage(sender_psid, reply);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Gửi lại phản hồi cho khách
async function sendTextMessage(recipientId, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v12.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: recipientId },
        message: { text: text }
      }
    );
    console.log('Đã gửi tin nhắn đến:', recipientId);
  } catch (error) {
    console.error('Lỗi gửi tin:', error.response?.data || error.message);
  }
}

// Gọi OpenAI để sinh nội dung trả lời
async function getGPTResponse(userMessage) {
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Bạn là trợ lý bất động sản Lâm Anh, nói chuyện chuyên nghiệp, lịch sự và thân thiện.' },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return chatCompletion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Lỗi GPT:', error.response?.data || error.message);
    return "Xin lỗi, em đang gặp chút lỗi kỹ thuật. Anh thử lại giúp em nha.";
  }
}

// Server khởi chạy
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Lâm Anh Chatbot đang chạy tại cổng ${PORT}`);
});
