const express = require('express');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
app.use(express.json());

// Token xác minh và gửi tin nhắn Facebook (dán trực tiếp)
const VERIFY_TOKEN = 'lamanh_vinhomes_2025';
const PAGE_ACCESS_TOKEN = 'EAAOWyvZAX72gBOzC8UR4TULvHTNDGu1NWQ8RF9nzn4GFKcnGZAI0jn4TYXlki8TiRko1nEPSQKULlHq8QmkmgpdINsEl6Y4P0mUEZCQLiOKC0ERMwv4IIc4F5JxM0xt3Jg7C0rZAJj3zUxYMnp48VwEwDSBp6ZAYe375k8Jzd8KLolwl9pEbtgrZBZCW6oVe8a0UgZDZD';
const OPENAI_API_KEY = 'sk-abc123...'; // Dán key OpenAI thật vào đây

// Cấu hình OpenAI
const configuration = new Configuration({
  apiKey: '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',
});
const openai = new OpenAIApi(configuration);

// Kiểm tra kết nối server
app.get('/', (req, res) => {
  res.send('Hello, đây là Lâm Anh Chatbot! Truy cập /webhook để kết nối với Messenger.');
});

// Xác minh webhook từ Facebook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook xác minh thành công!');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

// Nhận tin nhắn từ người dùng
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(async (entry) => {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message && webhook_event.message.text) {
        const userMessage = webhook_event.message.text;
        console.log('Khách nói:', userMessage);

        const reply = await getGPTResponse(userMessage);
        await sendTextMessage(sender_psid, reply);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Gửi tin nhắn về cho khách hàng
async function sendTextMessage(recipientId, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v12.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: recipientId },
        message: { text: text }
      }
    );
    console.log('Đã gửi:', text);
  } catch (error) {
    console.error('Lỗi gửi tin nhắn:', error.response?.data || error.message);
  }
}

// Gọi GPT để tạo phản hồi
async function getGPTResponse(userMessage) {
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Bạn là trợ lý bất động sản tên Lâm Anh. Hãy trả lời khách hàng một cách chuyên nghiệp, thân thiện, ngắn gọn và đúng trọng tâm.'
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Lỗi gọi OpenAI:', error.response?.data || error.message);
    return 'Xin lỗi anh, em đang gặp chút trục trặc kỹ thuật. Anh chờ em một xíu nhé!';
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
