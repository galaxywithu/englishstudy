const axios = require('axios');
require('dotenv').config();

async function testAPI() {
    try {
        console.log('API密钥是否存在:', !!process.env.OPENAI_API_KEY);
        console.log('API密钥前几个字符:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 5) + '...' : 'undefined');
        
        const response = await axios.post('https://yunwu.ai/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: "请用一句话解释单词'hello'的含义"
                }
            ],
            temperature: 0.7
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        
        console.log('API响应状态:', response.status);
        console.log('API响应数据:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('API调用错误:', error.message);
        if (error.response) {
            console.error('错误响应数据:', error.response.data);
            console.error('错误响应状态:', error.response.status);
        }
    }
}

testAPI(); 