/**
 * 智能体助手模块
 * 包含：健康咨询、训狗技巧推送、预警系统
 */

class AIAssistantModule {
    constructor() {
        this.supabase = getSupabaseClient();
        this.chatHistory = [];
        this.alerts = [];
        this.trainingTips = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadChatHistory();
        this.loadTrainingTips();
    }

    setupEventListeners() {
        // 发送消息
        const sendBtn = document.getElementById('send-message-btn');
        const chatInput = document.getElementById('chat-input');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message) return;

        // 添加用户消息到界面
        this.addMessageToChat('user', message);
        input.value = '';

        // 保存用户消息
        await this.saveChatMessage('user', message);

        // 显示加载状态
        const loadingId = this.addMessageToChat('bot', '正在思考...', true);

        try {
            // 获取AI回复
            const response = await this.getAIResponse(message);

            // 移除加载消息，添加实际回复
            this.removeMessage(loadingId);
            this.addMessageToChat('bot', response);

            // 保存AI回复
            await this.saveChatMessage('bot', response);
        } catch (error) {
            // 移除加载消息，显示错误
            this.removeMessage(loadingId);
            const errorMsg = '抱歉，我暂时无法回复。请稍后再试。';
            this.addMessageToChat('bot', errorMsg);
            await this.saveChatMessage('bot', errorMsg);
        }
    }

    async getAIResponse(userMessage) {
        // 优先尝试调用智能体API
        if (checkAIAssistantConfig()) {
            try {
                const apiResponse = await this.callAIAssistantAPI(userMessage);
                if (apiResponse) {
                    return apiResponse;
                }
            } catch (error) {
                console.error('智能体API调用失败，使用本地逻辑:', error);
                // API调用失败，降级到本地逻辑
            }
        }

        // 降级方案：使用本地逻辑
        // 分析用户消息意图
        const intent = this.analyzeIntent(userMessage);

        // 根据意图生成回复
        switch (intent) {
            case 'health':
                return await this.handleHealthQuery(userMessage);
            case 'training':
                return await this.handleTrainingQuery(userMessage);
            case 'diet':
                return await this.handleDietQuery(userMessage);
            case 'alert':
                return await this.handleAlertQuery();
            default:
                return await this.handleGeneralQuery(userMessage);
        }
    }

    /**
     * 调用智能体API
     * @param {string} userMessage - 用户消息
     * @returns {Promise<string>} - AI回复
     */
    async callAIAssistantAPI(userMessage) {
        if (!checkAIAssistantConfig()) {
            return null;
        }

        try {
            // 获取健康数据上下文（用于增强AI回复）
            const context = this.getHealthContext();

            // 构建消息历史（OpenAI格式）
            const messages = [];
            
            // 添加系统提示
            messages.push({
                role: 'system',
                content: `你是考拉的专属小助手。考拉是一只小狗。以下是考拉最近的健康数据：
最近饮食记录：${context.recent_diet.count}条，平均分量：${context.recent_diet.avg_amount.toFixed(0)}克
最近便便记录：${context.recent_poop.count}条，平均评分：${context.recent_poop.avg_score.toFixed(1)}/5
最近遛狗记录：${context.recent_walk.count}次，总距离：${context.recent_walk.total_distance.toFixed(1)}公里

请根据这些数据提供专业的建议。回复时请使用清晰的分段格式，不要使用星号标记，使用换行和缩进来组织内容。`
            });

            // 添加聊天历史（最近10条）
            this.chatHistory.slice(-10).forEach(msg => {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });

            // 添加当前用户消息
            messages.push({
                role: 'user',
                content: userMessage
            });

            // 构建请求体（OpenAI兼容格式）
            const requestBody = {
                model: AI_ASSISTANT_CONFIG.MODEL || 'glm-4', // 使用配置的模型名称
                messages: messages,
                temperature: 0.7,
            };

            // 创建AbortController用于超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), AI_ASSISTANT_CONFIG.TIMEOUT);

            // 发送API请求
            const response = await fetch(AI_ASSISTANT_CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AI_ASSISTANT_CONFIG.API_KEY}`,
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();

            // 处理OpenAI兼容格式的响应
            // 格式: { choices: [{ message: { content: "..." } }] }
            if (data.choices && data.choices.length > 0) {
                let content = data.choices[0].message?.content || data.choices[0].text;
                if (content) {
                    // 优化回复格式：去除星号，结构化分段
                    content = this.formatAIResponse(content);
                    return content;
                }
            }

            // 处理其他可能的格式
            let content = null;
            if (typeof data === 'string') {
                content = data;
            } else if (data.response) {
                content = data.response;
            } else if (data.message) {
                content = typeof data.message === 'string' ? data.message : data.message.content;
            } else if (data.content) {
                content = typeof data.content === 'string' ? data.content : data.content.text;
            } else if (data.text) {
                content = data.text;
            } else {
                // 如果API返回格式不同，请根据实际情况修改
                console.warn('API返回格式未知，尝试提取内容:', data);
                // 尝试从常见位置提取
                if (data.result) content = data.result;
                if (data.answer) content = data.answer;
                if (!content) return '抱歉，我无法理解API的返回格式。请检查API配置。';
            }
            
            // 优化回复格式
            return this.formatAIResponse(content);
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('API请求超时');
            }
            console.error('智能体API调用错误:', error);
            throw error;
        }
    }

    /**
     * 获取健康数据上下文，用于增强AI回复
     * @returns {Object} 健康数据上下文
     */
    getHealthContext() {
        const dietRecords = storage.get('diet_records', []);
        const poopRecords = storage.get('poop_records', []);
        const walkRecords = storage.get('walk_records', []);

        // 获取最近7天的数据
        const recentDiet = dietRecords.slice(0, 7);
        const recentPoop = poopRecords.slice(0, 7);
        const recentWalk = walkRecords.slice(0, 7);

        return {
            pet_name: '考拉',
            recent_diet: {
                count: recentDiet.length,
                total_amount: recentDiet.reduce((sum, r) => sum + (r.amount || 0), 0),
                avg_amount: recentDiet.length > 0 ? recentDiet.reduce((sum, r) => sum + (r.amount || 0), 0) / recentDiet.length : 0,
            },
            recent_poop: {
                count: recentPoop.length,
                avg_score: recentPoop.length > 0 ? recentPoop.reduce((sum, r) => sum + (r.score || 3), 0) / recentPoop.length : 0,
                low_score_days: recentPoop.filter(r => r.score <= 2).length,
            },
            recent_walk: {
                count: recentWalk.length,
                total_distance: recentWalk.reduce((sum, r) => sum + (r.distance || 0), 0),
                total_minutes: recentWalk.reduce((sum, r) => sum + (r.duration_minutes || 0), 0),
            },
        };
    }

    analyzeIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('健康') || lowerMessage.includes('生病') || lowerMessage.includes('症状')) {
            return 'health';
        }
        if (lowerMessage.includes('训练') || lowerMessage.includes('技巧') || lowerMessage.includes('教')) {
            return 'training';
        }
        if (lowerMessage.includes('饮食') || lowerMessage.includes('吃') || lowerMessage.includes('食物')) {
            return 'diet';
        }
        if (lowerMessage.includes('预警') || lowerMessage.includes('提醒') || lowerMessage.includes('异常')) {
            return 'alert';
        }
        return 'general';
    }

    async handleHealthQuery(message) {
        // 获取最近的健康记录
        const dietRecords = storage.get('diet_records', []);
        const poopRecords = storage.get('poop_records', []);
        const walkRecords = storage.get('walk_records', []);

        // 分析健康数据
        const analysis = this.analyzeHealthData(dietRecords, poopRecords, walkRecords);

        let response = '根据最近的记录，我为你分析一下：\n\n';
        
        if (analysis.dietConcern) {
            response += `⚠️ ${analysis.dietConcern}\n\n`;
        }
        if (analysis.poopConcern) {
            response += `⚠️ ${analysis.poopConcern}\n\n`;
        }
        if (analysis.exerciseConcern) {
            response += `⚠️ ${analysis.exerciseConcern}\n\n`;
        }

        if (!analysis.dietConcern && !analysis.poopConcern && !analysis.exerciseConcern) {
            response += '✅ 整体健康状况良好！继续保持。\n\n';
        }

        response += '建议：\n';
        response += '1. 保持规律的饮食和运动\n';
        response += '2. 注意观察便便健康情况\n';
        response += '3. 如有异常，及时咨询兽医';

        return response;
    }

    analyzeHealthData(dietRecords, poopRecords, walkRecords) {
        const analysis = {
            dietConcern: null,
            poopConcern: null,
            exerciseConcern: null
        };

        // 分析饮食
        if (dietRecords.length > 0) {
            const recentDiet = dietRecords.slice(0, 7);
            const avgAmount = recentDiet.reduce((sum, r) => sum + (r.amount || 0), 0) / recentDiet.length;
            if (avgAmount < 100) {
                analysis.dietConcern = '最近饮食量偏少，建议增加喂食量';
            }
        }

        // 分析便便
        const recentPoop = poopRecords.slice(0, 2);
        if (recentPoop.length === 2 && recentPoop.every(r => r.score <= 2)) {
            analysis.poopConcern = '连续2天便便健康评分较低，建议关注饮食和健康状况';
        }

        // 分析运动
        if (walkRecords.length > 0) {
            const recentWalks = walkRecords.slice(0, 7);
            const totalMinutes = recentWalks.reduce((sum, r) => sum + (r.duration_minutes || 0), 0);
            if (totalMinutes < 60) {
                analysis.exerciseConcern = '本周运动量偏少，建议增加遛狗频率';
            }
        }

        return analysis;
    }

    async handleTrainingQuery(message) {
        // 获取狗狗年龄（可以从用户设置或记录中获取）
        const dogAge = storage.get('dog_age', 12); // 默认12个月

        let response = '根据狗狗的年龄，我推荐以下训练：\n\n';

        if (dogAge < 6) {
            response += '🐶 幼犬期训练：\n';
            response += '1. 基础指令：坐下、趴下、等待\n';
            response += '2. 如厕训练：固定地点排便\n';
            response += '3. 社交训练：多接触不同的人和狗\n\n';
        } else if (dogAge < 18) {
            response += '🐕 成长期训练：\n';
            response += '1. 进阶指令：握手、转圈、装死\n';
            response += '2. 行为纠正：不乱叫、不咬东西\n';
            response += '3. 运动训练：接球、飞盘\n\n';
        } else {
            response += '🐕 成年期训练：\n';
            response += '1. 保持性训练：复习已学指令\n';
            response += '2. 新技能学习：根据兴趣选择\n';
            response += '3. 智力游戏：益智玩具、寻物游戏\n\n';
        }

        response += '💡 训练技巧：\n';
        response += '- 每次训练10-15分钟\n';
        response += '- 使用正向强化（奖励）\n';
        response += '- 保持耐心和一致性';

        return response;
    }

    async handleDietQuery(message) {
        const dietRecords = storage.get('diet_records', []);
        
        let response = '饮食建议：\n\n';

        if (dietRecords.length === 0) {
            response += '还没有饮食记录，建议开始记录以便更好地管理健康。\n\n';
        } else {
            const recent = dietRecords.slice(0, 7);
            const avgAmount = recent.reduce((sum, r) => sum + (r.amount || 0), 0) / recent.length;
            
            response += `最近平均每日摄入：${avgAmount.toFixed(0)}克\n\n`;
            response += '建议：\n';
            response += '1. 保持定时定量喂食\n';
            response += '2. 选择优质狗粮\n';
            response += '3. 适量添加新鲜蔬果\n';
            response += '4. 确保充足饮水\n';
        }

        return response;
    }

    async handleAlertQuery() {
        return '✅ 目前一切正常！';
    }

    async handleGeneralQuery(message) {
        // 通用回复
        const responses = [
            '我理解你的问题。作为智能助手，我可以帮助你管理宠物的健康、训练和成长记录。',
            '你可以问我关于健康、训练、饮食等方面的问题，我会根据记录数据给出建议。',
            '如果需要更专业的建议，建议咨询兽医。我可以帮你分析日常记录数据。'
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    addMessageToChat(role, content, isLoading = false) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return null;

        const messageId = generateId();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.id = `message-${messageId}`;
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${role === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-content">
                ${content}
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        return messageId;
    }

    removeMessage(messageId) {
        const message = document.getElementById(`message-${messageId}`);
        if (message) {
            message.remove();
        }
    }

    async saveChatMessage(role, content) {
        const message = {
            id: generateId(),
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        };

        this.chatHistory.push(message);
        storage.set('chat_history', this.chatHistory.slice(-100)); // 只保留最近100条

        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('chat_messages')
                    .insert([message]);
                if (error) throw error;
            } catch (error) {
                // 静默失败，因为已经有LocalStorage备份
                // console.error('保存聊天记录失败:', error);
            }
        }
    }

    async loadChatHistory() {
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('chat_messages')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(20);
                if (error) {
                    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                        this.chatHistory = storage.get('chat_history', []);
                    } else {
                        throw error;
                    }
                } else {
                    this.chatHistory = (data || []).reverse();
                }
            } catch (error) {
                this.chatHistory = storage.get('chat_history', []);
            }
        } else {
            this.chatHistory = storage.get('chat_history', []);
        }
    }


    loadTrainingTips() {
        const dogAge = storage.get('dog_age', 12);
        
        this.trainingTips = [
            {
                title: '基础指令训练',
                description: '适合所有年龄的狗狗',
                ageRange: 'all'
            },
            {
                title: '如厕训练',
                description: '适合幼犬（<6个月）',
                ageRange: 'puppy'
            },
            {
                title: '社交训练',
                description: '适合成长期（6-18个月）',
                ageRange: 'young'
            }
        ];

        this.renderTrainingTips();
    }

    renderTrainingTips() {
        const container = document.getElementById('training-tips');
        if (!container) return;

        if (this.trainingTips.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">暂无推荐</p>';
            return;
        }

        container.innerHTML = this.trainingTips.map((tip, index) => `
            <div class="tip-item clickable-tip" onclick="aiAssistantModule.sendTrainingQuestion('${tip.title}')">
                <strong>${tip.title}</strong>
                <p>${tip.description}</p>
            </div>
        `).join('');
    }

    sendTrainingQuestion(trainingTitle) {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.value = `我想了解${trainingTitle}的相关内容`;
            this.sendMessage();
        }
    }

    /**
     * 格式化AI回复：去除星号，结构化分段
     */
    formatAIResponse(text) {
        if (!text) return text;
        
        // 去除各种星号标记
        text = text.replace(/\*\*/g, ''); // 去除 **粗体**
        text = text.replace(/\*/g, ''); // 去除 *斜体* 或列表标记
        text = text.replace(/^[-•]\s+/gm, ''); // 去除列表标记
        
        // 将多个换行符合并为两个（段落分隔）
        text = text.replace(/\n{3,}/g, '\n\n');
        
        // 保持原有的换行和段落结构
        return text.trim();
    }
}

// 全局实例（将在app.js中初始化）
// let aiAssistantModule = null;
