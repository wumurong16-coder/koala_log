/**
 * Supabase 配置
 * 请在此处配置你的 Supabase Publishable Key 和 Project URL
 */

// Supabase 配置对象
const SUPABASE_CONFIG = {
    // 请替换为你的 Supabase Publishable Key
    SUPABASE_URL: 'https://nvapgvtcdfaleplryrsz.supabase.co', // 例如: 'https://your-project.supabase.co'
    SUPABASE_ANON_KEY: 'sb_publishable_HMecx-RdK1zUUH0zzvpXCA_IwxiiUtB', // 例如: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};

/**
 * 智能体API配置
 * 请在此处配置你的智能体API URL和密钥
 */
const AI_ASSISTANT_CONFIG = {
    // 请替换为你的智能体API URL
    API_URL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', // 例如: 'https://api.example.com/v1/chat'
    // 请替换为你的API密钥
    API_KEY: '9c339b5642d14feaa6b34bcf5278589f.kkYVc8qDTpyLDGtw', // 例如: 'sk-xxxxxxxxxxxxx'
    // 模型名称（根据你的API提供商调整）
    MODEL: 'glm-4', // 智谱AI使用 'glm-4'，OpenAI使用 'gpt-3.5-turbo' 等
    // API请求超时时间（毫秒）
    TIMEOUT: 30000, // 30秒
};

// 检查配置是否已设置
function checkSupabaseConfig() {
    if (!SUPABASE_CONFIG.SUPABASE_URL || !SUPABASE_CONFIG.SUPABASE_ANON_KEY) {
        console.warn('⚠️ Supabase 配置未完成，请前往 js/config.js 配置 SUPABASE_URL 和 SUPABASE_ANON_KEY');
        return false;
    }
    return true;
}

// 初始化 Supabase 客户端
let supabaseClient = null;

async function initSupabase() {
    if (!checkSupabaseConfig()) {
        return null;
    }

    try {
        // 动态加载 Supabase JS 客户端库
        if (typeof supabase === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.async = true;
            document.head.appendChild(script);
            
            // 等待脚本加载完成
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                setTimeout(reject, 10000); // 10秒超时
            });
        }

        // 创建 Supabase 客户端实例
        supabaseClient = supabase.createClient(
            SUPABASE_CONFIG.SUPABASE_URL,
            SUPABASE_CONFIG.SUPABASE_ANON_KEY
        );

        console.log('✅ Supabase 客户端初始化成功');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Supabase 初始化失败:', error);
        return null;
    }
}

// 获取 Supabase 客户端（如果已初始化）
function getSupabaseClient() {
    if (!supabaseClient) {
        console.warn('Supabase 客户端未初始化，请先调用 initSupabase()');
    }
    return supabaseClient;
}

// 检查智能体API配置是否已设置
function checkAIAssistantConfig() {
    if (!AI_ASSISTANT_CONFIG.API_URL || !AI_ASSISTANT_CONFIG.API_KEY) {
        console.warn('⚠️ 智能体API配置未完成，请前往 js/config.js 配置 API_URL 和 API_KEY');
        return false;
    }
    return true;
}

// 导出配置（用于其他模块）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_CONFIG,
        AI_ASSISTANT_CONFIG,
        initSupabase,
        getSupabaseClient,
        checkSupabaseConfig,
        checkAIAssistantConfig
    };
}
