let currentAIPetId = 1; // 固定为考拉

// 初始化AI数据
async function initAIData() {
    try {
        const pets = await healthAPI.getPets();
        if (pets && pets.length > 0) {
            currentAIPetId = pets[0].id;
        }
    } catch (error) {
        console.log('使用默认宠物ID');
    }
    loadAIData();
}

// 加载AI数据
function loadAIData() {
    if (currentAIPetId) {
        loadConversations();
        loadAlerts();
    }
}

// 发送聊天消息
async function sendChatMessage() {
    if (!currentAIPetId) {
        alert('请先登录');
        return;
    }
    
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 显示用户消息
    addChatMessage('user', message);
    input.value = '';
    
    try {
        const response = await aiAPI.chat(currentAIPetId, message);
        addChatMessage('ai', response.response || response.error || '抱歉，暂时无法回复');
    } catch (error) {
        addChatMessage('ai', '抱歉，发送消息失败: ' + error.message);
    }
}

// 处理回车键
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// 添加聊天消息
function addChatMessage(type, content) {
    const container = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    messageDiv.textContent = content;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// 获取健康建议
async function getHealthAdvice() {
    if (!currentAIPetId) {
        alert('请先登录');
        return;
    }
    
    try {
        const response = await aiAPI.getHealthAdvice(currentAIPetId);
        addChatMessage('ai', response.advice || response.error || '无法获取健康建议');
    } catch (error) {
        addChatMessage('ai', '获取健康建议失败: ' + error.message);
    }
}

// 获取训狗技巧
async function getTrainingTips() {
    if (!currentAIPetId) {
        alert('请先登录');
        return;
    }
    
    try {
        const response = await aiAPI.getTrainingTips(currentAIPetId);
        addChatMessage('ai', response.tips || response.error || '无法获取训狗技巧');
    } catch (error) {
        addChatMessage('ai', '获取训狗技巧失败: ' + error.message);
    }
}

// 检测异常
async function detectAnomalies() {
    if (!currentAIPetId) {
        alert('请先登录');
        return;
    }
    
    try {
        const response = await aiAPI.detectAnomalies(currentAIPetId);
        if (response.anomalies && response.anomalies.length > 0) {
            loadAlerts();
            addChatMessage('ai', `检测到 ${response.count} 个异常，请查看预警列表`);
        } else {
            addChatMessage('ai', '未检测到异常，考拉很健康！');
        }
    } catch (error) {
        addChatMessage('ai', '异常检测失败: ' + error.message);
    }
}

// 加载对话历史
async function loadConversations() {
    if (!currentAIPetId) return;
    
    try {
        const conversations = await aiAPI.getConversations(currentAIPetId);
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';
        
        conversations.reverse().forEach(conv => {
            if (conv.message_type === 'user') {
                addChatMessage('user', conv.message_content);
                if (conv.response_content) {
                    addChatMessage('ai', conv.response_content);
                }
            }
        });
    } catch (error) {
        console.error('加载对话历史失败:', error);
    }
}

// 加载预警列表
async function loadAlerts() {
    if (!currentAIPetId) return;
    
    try {
        const alerts = await aiAPI.getAlerts(currentAIPetId, false);
        const container = document.getElementById('alertsContent');
        const alertsContainer = document.getElementById('alertsList');
        
        if (alerts.length === 0) {
            alertsContainer.style.display = 'none';
            return;
        }
        
        alertsContainer.style.display = 'block';
        container.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.severity}">
                <h4>${alert.alert_type}</h4>
                <p>${alert.alert_message}</p>
                <p><small>${new Date(alert.created_at).toLocaleString()}</small></p>
                <button class="btn-secondary" onclick="resolveAlert(${alert.id})">标记为已解决</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载预警列表失败:', error);
    }
}

// 标记预警为已解决
async function resolveAlert(alertId) {
    try {
        await aiAPI.resolveAlert(alertId);
        loadAlerts();
    } catch (error) {
        alert('操作失败: ' + error.message);
    }
}
