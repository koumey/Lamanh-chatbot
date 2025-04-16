const express = require('express');
const axios = require('axios');
const app = express();

const VERIFY_TOKEN = 'lamanh_vinhomes_2025';
const PAGE_ACCESS_TOKEN = 'EAAOWyvZAX72gBOzC8UR4TULvHTNDGu1NWQ8RF9nzn4GFKcnGZAI0jn4TYXlki8TiRko1nEPSQKULlHq8QmkmgpdINsEl6Y4P0mUEZCQLiOKC0ERMwv4IIc4F5JxM0xt3Jg7C0rZAJj3zUxYMnp48VwEwDSBp6ZAYe375k8Jzd8KLolwl9pEbtgrZBZCW6oVe8a0UgZDZD'; // dán token thật của anh tại đây

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
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  // Lấy API key từ biến môi trường hoặc dán trực tiếp cho test (nhưng nhớ bảo mật cho production)
  apiKey: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE',
});
const openai = new OpenAIApi(configuration);

// Sau đó anh có thể gọi API, ví dụ:
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
    console.error('Lỗi khi gọi OpenAI API:', error.response ? error.response.data : error);
    return "Xin lỗi, em gặp trục trặc tư vấn. Anh vui lòng chờ giây lát.";
  }
}
