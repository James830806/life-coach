const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API路由
app.post('/api/chat', async (req, res) => {
    try {
        // 添加连接测试日志
        console.log('=== 收到新的聊天请求 ===');
        console.log('请求时间:', new Date().toLocaleString());
        console.log('请求内容:', JSON.stringify(req.body, null, 2));
        // 检查环境变量和请求格式
        if (!process.env.ARK_API_KEY) {
            throw new Error('API Key 未配置');
        }

        if (!req.body.messages || !Array.isArray(req.body.messages)) {
            throw new Error('无效的请求格式: messages 必须是数组');
        }

        const requestData = {
            model: "deepseek-r1-250120",
            messages: [
                {
                    role: "system",
                    content: "你是一位专业的Life Coach，擅长倾听、共情和提供建设性的建议。"
                },
                ...req.body.messages
            ],
            temperature: 0.7,
            stream: false,
            max_tokens: 2000
        };
        
        // 添加请求前的调试日志
        console.log('发送请求配置:', {
            url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ****' // 隐藏实际 key
            },
            data: requestData
        });
        
        const response = await axios({
            method: 'post',
            url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.ARK_API_KEY}`,
                'X-Api-Source': 'portal',
                'Accept': 'application/json'
            },
            data: requestData,
            timeout: 60000
        });
        
        // 添加更详细的响应日志
        console.log('完整响应信息:', {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
        });
        console.log('API 原始响应:', response.data);
        
        if (response.data && response.data.choices && response.data.choices[0]) {
            const aiResponse = response.data.choices[0].message?.content || response.data.choices[0].text;
            console.log('AI 回复:', aiResponse);
            
            res.json({
                choices: [{
                    message: {
                        content: aiResponse,
                        role: 'assistant'
                    }
                }]
            });
        } else {
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        console.error('API 错误:', {
            status: error.response?.status,
            message: error.response?.data?.error?.message || error.message,
            details: error.response?.data
        });
        
        if (error.response?.status === 401) {
            res.status(500).json({ error: 'API 认证失败，请检查 API Key' });
        } else {
            res.status(500).json({ error: '抱歉，服务暂时出现问题，请稍后重试' });
        }
    }
});

const PORT = 3003;  // 改用新端口
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在端口 ${PORT}，API Key: ${process.env.ARK_API_KEY ? '已配置' : '未配置'}`);
});