const express = require('express');
const axios = require('axios');
require('dotenv').config(); // Đọc biến môi trường từ file .env

const app = express();

const VERIFY_TOKEN = 'lamanh_vinhomes_2025';
const PAGE_ACCESS_TOKEN = 'EAAOWyvZAX72gBOzC8UR4TULvHTNDGu1NWQ8RF9nzn4GFKcnGZAI0jn4TYXlki8TiRko1nEPSQKULlHq8QmkmgpdINsEl6Y4P0mUEZCQLiOKC0ERMwv4IIc4F5JxM0xt3Jg7C0rZAJj3zUxYMnp48VwEwDSBp6ZAYe375k8Jzd8KLolwl9pEbtgrZBZCW6oVe8a0UgZDZD';

const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(express.json());

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
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(async (entry) => {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message && webhook_event.message.text) {
        const userMessage = webhook_event.message.text;
        console.log('Khách gửi tin:', userMessage);

        const reply = await getGPTResponse(userMessage);
        await sendTextMessage(sender_psid, reply);
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

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
    console.error('Lỗi khi gửi tin nhắn:', error.response ? error.response.data : error.message);
  }
}

async function getGPTResponse(userMessage) {
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Bạn là trợ lý bất động sản Lâm Anh, trả lời một cách chuyên nghiệp, lịch sự và thân thiện.' },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Lỗi khi gọi OpenAI API:', error.response ? error.response.data : error.message);
    return "Xin lỗi, em đang gặp trục trặc kỹ thuật. Anh vui lòng thử lại sau nhé.";
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
