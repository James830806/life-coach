document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chatContainer');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');

    let chatHistory = [
        // 移除系统消息，让后端统一处理
    ];

    function addMessage(content, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        messageDiv.textContent = content;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // 禁用输入和按钮，防止重复发送
        userInput.disabled = true;
        sendButton.disabled = true;

        // 添加用户消息
        addMessage(message, true);
        chatHistory.push({ role: "user", content: message });
        userInput.value = '';

        try {
            const response = await fetch('http://localhost:3003/api/chat', {  // 修改端口号为 3003
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: chatHistory })
            });

            if (!response.ok) {
                throw new Error('网络请求失败');
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            // 添加AI回复
            addMessage(aiResponse, false);
            chatHistory.push({ role: "assistant", content: aiResponse });

        } catch (error) {
            console.error('Error:', error);
            addMessage('抱歉，发生了错误，请稍后重试。', false);
        } finally {
            // 恢复输入和按钮
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});