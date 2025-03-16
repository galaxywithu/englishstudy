const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Allow requests from frontend
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 打印环境变量
console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
console.log('API Key first few chars:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 5) + '...' : 'undefined');

// API路由
app.post('/api/explain-word', async (req, res) => {
    try {
        const { word } = req.body;
        
        if (!word) {
            return res.status(400).json({ error: 'Please provide a word' });
        }
        
        console.log('Received word query:', word);
        
        const prompt = `
For the English word "${word}":
1. explain all the meanings of this word to a baby in a simple, friendly way
2. list all the meanings in LONG, SIMPLE sentences as if you're talking to a baby (use very basic vocabulary, friendly tone, and concrete examples that a baby would understand)
3. make 5 phrase about this word
4. list 3 related word

IMPORTANT: Please respond in ENGLISH only, not in Chinese or any other language.
For the "meaningsList" section, make sure each meaning is explained in a complete, child-friendly sentence that a baby would understand. Use simple words, concrete examples, and a warm, friendly tone. Avoid abstract concepts.

Please respond in the following JSON format:
{
  "babyExplanation": "A simple, friendly explanation for babies...",
  "meaningsList": ["Long, simple sentence explaining meaning 1 with baby-friendly examples...", "Long, simple sentence explaining meaning 2 with baby-friendly examples...", "Long, simple sentence explaining meaning 3 with baby-friendly examples..."],
  "phrases": ["Phrase 1", "Phrase 2", "Phrase 3", "Phrase 4", "Phrase 5"],
  "relatedWords": ["Related word 1", "Related word 2", "Related word 3"]
}
`;
        
        console.log('Sending API request...');
        
        // 使用axios直接调用API
        const response = await axios.post('https://yunwu.ai/v1/chat/completions', {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an English language assistant. Always respond in English only, not in Chinese or any other language."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        
        console.log('Received API response, status:', response.status);
        
        let responseText = '';
        if (response.data && response.data.choices && response.data.choices.length > 0) {
            responseText = response.data.choices[0].message.content.trim();
            console.log('API response content:', responseText.substring(0, 100) + '...');
        } else {
            console.log('API response format incorrect:', response.data);
        }
        
        // 尝试解析JSON响应
        try {
            // 找到JSON开始的位置
            const jsonStartIndex = responseText.indexOf('{');
            if (jsonStartIndex !== -1) {
                responseText = responseText.substring(jsonStartIndex);
                console.log('Extracted JSON part:', responseText.substring(0, 100) + '...');
            } else {
                console.log('JSON start marker not found');
            }
            
            const parsedResponse = JSON.parse(responseText);
            console.log('Successfully parsed JSON response');
            res.json(parsedResponse);
        } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            console.log('Original response:', responseText);
            
            // 如果解析失败，返回模拟数据
            console.log('Using mock data');
            res.json({
                babyExplanation: `"${word}" is a fun word! Imagine if you see a puppy, you can say "${word}" to describe it. This word is like magic, it helps us express our thoughts and feelings.`,
                meaningsList: [
                    `${word} can be a noun, referring to an object or concept`,
                    `${word} can also be a verb, meaning to do something`,
                    `Sometimes ${word} can be an adjective, describing qualities of things`
                ],
                phrases: [
                    `${word} out - indicating completion or ending`,
                    `${word} up - indicating increase or improvement`,
                    `${word} in - indicating participation or inclusion`,
                    `${word} on - indicating continuation or persistence`,
                    `${word} off - indicating departure or cancellation`
                ],
                relatedWords: [
                    `${word}er - usually refers to a person who does this action`,
                    `${word}ing - the present participle of this word`,
                    `${word}ed - the past tense of this word`
                ]
            });
        }
    } catch (error) {
        console.error('API call error:', error.message);
        if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
        }
        res.status(500).json({ error: 'Server error, please try again later' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 